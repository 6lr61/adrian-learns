import { borrowToken, getToken } from "./auth.js";
import { type PrivateMessage } from "ts-twitch-irc";
import { findNames, getAttributes } from "./commands/commands.js";
import type { Dispatch } from "./bot.js";

const TWITCH_HELIX_API = "https://api.twitch.tv/helix";

const WHISPER_CHARACTER_LIMIT = 500;
// const WHISPER_MAX_PER_SECOND = 2; // This is incorrect in the docs?
const WHISPER_MAX_PER_MINUTE = 100; // This might also be wrong?

// Chat Announcement Request Body
interface ChatAnnouncement {
  message: string;
  color: HighlightColor;
}

type HighlightColor = "blue" | "green" | "orange" | "purple" | "primary" | "";

// Ban User
interface BanRequest {
  data: {
    user_id: string;
    duration?: number;
    reason?: string;
  };
}

interface BanResponse {
  data: {
    broadcaster_id: string;
    moderator_id: string;
    user_id: string;
    created_at: string; // RFC3339 timestamp for the ban or timeout
    end_time: string; // RC3339 timestamp for the ban or timeout ends
  }[];
}

// Get Channel Followers: https://dev.twitch.tv/docs/api/reference/#get-channel-followers
interface ValidFollowersResponse {
  total: number;
  data: FollowerData[] | []; // the response can be empty
  pagination: { cursor?: string };
}

interface FollowerData {
  user_id: string;
  user_name: string;
  user_login: string;
  followed_at: string; // date string: 2022-05-24T22:22:08Z
}

// Get Users: https://dev.twitch.tv/docs/api/reference/#get-users
interface ValidUsersResponse {
  data: [] | UserData[];
}

interface UserData {
  id: string;
  login: string;
  display_name: string;
  type: "admin" | "global_mod" | "staff" | ""; // normal user
  broadcaster_type: "affiliate" | "partner" | ""; // normal broadcaster
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email?: string; // requires user:read:email scope
  created_at: string; // UTC date in RFC3339 format
}

interface GetStreamsResponse {
  data: StreamListing[];
  pagination: {
    cursor: string;
  };
}

interface StreamListing {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  tags: string[];
  viewer_count: number;
  /** UTC date in RFC3339 format */
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

interface ChannelInformationResponse {
  data: {
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    broadcaster_language: string;
    game_id: string;
    game_name: string;
    title: string;
    delay: number;
    tags: string[];
    content_classification_labels: string[];
    is_branded_content: boolean;
  }[];
}

async function fetchWithRetry(
  url: string | URL,
  content: RequestInit,
  timeout = 30_000,
  attemptsLeft = 5
): Promise<Response | null> {
  try {
    if (attemptsLeft === 0) {
      return null;
    }

    return await fetch(url, content);
  } catch (error) {
    console.error("validateToken:", error);
    return await fetchWithRetry(
      url,
      content,
      timeout + 30_000,
      attemptsLeft - 1
    );
  }
}

export async function sendChatAnnouncement(
  message: string,
  color: HighlightColor
) {
  const url = new URL(`${TWITCH_HELIX_API}/chat/announcements`);
  url.searchParams.set("broadcaster_id", process.env.BROADCASTER_ID);
  url.searchParams.set("moderator_id", process.env.USER_ID);

  const data: ChatAnnouncement = {
    message: message,
    color: color,
  };

  await fetchWithRetry(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${(await getToken()).token}`,
      "Client-Id": process.env.CLIENT_ID,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function timeoutUser(
  userId: string,
  time?: number,
  reason?: string
) {
  const url = new URL(`${TWITCH_HELIX_API}/moderation/bans`);
  url.searchParams.set("broadcaster_id", process.env.BROADCASTER_ID);
  url.searchParams.set("moderator_id", process.env.USER_ID);

  const request: BanRequest = {
    data: {
      user_id: userId,
      duration: time || 1, // number
    },
  };

  if (reason) {
    request.data.reason = reason;
  }

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${(await getToken()).token}`,
      "Client-Id": process.env.CLIENT_ID,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response || !response.ok) {
    console.error("Ban User: Request failed");
    return;
  }

  const data = (await response.json()) as BanResponse;

  console.log(
    `Timed out user with ID: ${userId} until: ${data.data[0]?.end_time}`
  );
}

export async function getUserID(
  username: string
): Promise<{ display_name: string; login_name: string; id: string } | null> {
  const url = new URL(`${TWITCH_HELIX_API}/users`);
  url.searchParams.set("login", username);

  const response = await fetchWithRetry(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${(await getToken()).token}`,
      "Client-Id": process.env.CLIENT_ID,
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response || !response.ok) {
    return null;
  }

  const data = (await response.json()) as ValidUsersResponse;

  if (!data.data[0]?.id) {
    return null;
  }

  return {
    display_name: data.data[0].display_name,
    login_name: data.data[0].login,
    id: data.data[0].id,
  };
}

export async function getFollowAge(
  dispatcher: Dispatch,
  content: PrivateMessage
): Promise<void> {
  const username =
    // Twitch usernames are limited to 25 characters
    getAttributes(content)
      .match(/^@?([\w]{1,25})/)?.[1]
      ?.toLowerCase() || content.username;

  let user: { display_name: string; id: string } | null = {
    display_name: username,
    id: content.tags?.user_id,
  };

  if (username !== content.username) {
    user = await getUserID(username);
  }

  if (!user) {
    console.error("Follower age: Bad response");
    dispatcher.error(`Couldn't find user: ${username}`, {
      messageId: content.tags.id,
    });
    return;
  }

  // Follow age look-up
  const url = new URL(`${TWITCH_HELIX_API}/channels/followers`);
  url.searchParams.set("broadcaster_id", process.env.BROADCASTER_ID);
  url.searchParams.set("user_id", user.id);

  const response = await fetchWithRetry(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${(await getToken()).token}`,
      "Client-Id": process.env.CLIENT_ID,
    },
  });

  if (!response || !response.ok) {
    return;
  }

  const data = (await response.json()) as ValidFollowersResponse;

  // Then we have to parse the response and get the follow age
  // or deal with a response saying they're following
  if (data.data.length > 0) {
    // We should format the date into something that's more useful

    const timestampFollowed = new Date(
      data.data[0]?.followed_at || 0
    ).valueOf();
    const daysFollowed = Math.floor(
      (Date.now() - timestampFollowed) / 1000 / 60 / 60 / 24
    );

    dispatcher.reply(
      content.tags.id,
      username === content.username
        ? `You've been following for ${daysFollowed} days!`
        : `${user.display_name} has been following for ${daysFollowed} days.`
    );
  } else {
    dispatcher.reply(
      content.tags.id,
      username === content.username
        ? "You're not following Adrian?"
        : `${username} is not following Adrian.`
    );
  }
}

export async function getUptime(
  dispatcher: Dispatch,
  content: PrivateMessage
): Promise<void> {
  const url = new URL(`${TWITCH_HELIX_API}/streams`);
  url.searchParams.set("user_id", process.env.BROADCASTER_ID);

  const response = await fetchWithRetry(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${(await getToken()).token}`,
      "Client-Id": process.env.CLIENT_ID,
    },
  });

  if (!response || !response.ok) {
    console.error("getUptime: Couldn't look up streams information");
    return;
  }

  const data = (await response.json()) as GetStreamsResponse;

  if (data.data.length === 0) {
    dispatcher.reply(content.tags.id, "Adrian is currently not live");
    return;
  }

  if (typeof data.data[0]?.started_at === "string") {
    const timeLiveMinutes =
      (Date.now() - new Date(data.data[0]?.started_at).getTime()) / 1000 / 60;
    const hours = Math.floor(timeLiveMinutes / 60);
    const minutes = Math.floor(timeLiveMinutes % 60);
    const hoursString =
      hours > 0 ? `${hours} hour` + (hours === 1 ? "" : "s") + " and " : "";
    const minutesString = `${minutes} minute` + (minutes === 1 ? "" : "s");

    dispatcher.reply(
      content.tags.id,
      "Adrian has been live for " + hoursString + minutesString
    );
    return;
  }

  dispatcher.error("Something went from when trying to get stream information");
}

interface Whisper {
  userID: string;
  message: string;
}

class MessageQueue {
  private queue: Whisper[];
  private intervalID: NodeJS.Timeout;
  private windowEndTime: number;
  private messagesSentLastMinute: number;

  constructor(delayMillis: number) {
    this.queue = [];
    this.intervalID = setInterval(() => this.dequeueMessage(), delayMillis);
    this.windowEndTime = Date.now() + 60_000;
    this.messagesSentLastMinute = 0;
  }

  queueMessage(recipientUserID: string, message: string) {
    this.queue.push({
      userID: recipientUserID,
      message: message.slice(0, WHISPER_CHARACTER_LIMIT),
    });

    if (message.slice(WHISPER_CHARACTER_LIMIT)) {
      this.queueMessage(
        recipientUserID,
        message.slice(WHISPER_CHARACTER_LIMIT)
      );
    }
  }

  private dequeueMessage(): void {
    if (typeof this.intervalID !== "undefined") {
      const nextMessage = this.queue.shift();

      if (nextMessage) {
        void this.sendWhisper(nextMessage);
      }
    }
  }

  private async sendWhisper(whisper: Whisper) {
    const url = new URL(`${TWITCH_HELIX_API}/whispers`);
    url.searchParams.set("from_user_id", process.env.USER_ID);
    url.searchParams.set("to_user_id", whisper.userID);

    if (this.windowEndTime > Date.now()) {
      if (this.messagesSentLastMinute >= WHISPER_MAX_PER_MINUTE) {
        console.error("dequeueMessage: Messages per minute limit exceeded!");
        return;
      }
      this.messagesSentLastMinute += 1;
    } else {
      this.windowEndTime = Date.now() + 60_000;
      this.messagesSentLastMinute = 1;
    }

    const response = await fetchWithRetry(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${borrowToken().token}`,
        "Client-Id": process.env.CLIENT_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: whisper.message.slice(0, WHISPER_CHARACTER_LIMIT),
      }),
    });

    if (!response) {
      console.error("sendWhisper: fetchWithRetry failed?");
      return;
    }

    if (!response.ok) {
      console.error(
        "sendWhisper: Bad HTTP response:",
        response.status,
        response.statusText
      );
      return;
    }
  }
}

const queue = new MessageQueue(500);

// FIXME: THIS IS DISGUSTING!
export function sendWhisper(toUserID: string, message: string): void {
  queue.queueMessage(toUserID, message);
}

export async function sendShoutout(
  dispatcher: Dispatch,
  content: PrivateMessage
): Promise<void> {
  const username = findNames(getAttributes(content))?.[0];

  if (!username) {
    dispatcher.error(
      "Couldn't find a valid username in the command attributes",
      { messageId: content.tags.id }
    );
    return;
  }

  const userData = await getUserID(username);

  if (!userData) {
    dispatcher.error(`Couldn't find user: ${username}`, {
      messageId: content.tags.id,
    });
    return;
  }

  const url = new URL(`${TWITCH_HELIX_API}/chat/shoutouts`);
  url.searchParams.set("from_broadcaster_id", process.env.BROADCASTER_ID);
  url.searchParams.set("moderator_id", process.env.USER_ID);
  url.searchParams.set("to_broadcaster_id", userData.id);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${(await getToken()).token}`,
        "Client-Id": process.env.CLIENT_ID,
      },
    });

    if (!response.ok) {
      throw new Error(
        "Bad HTTP response: " + `${response.status}: ${response.statusText}`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("sendShoutout:", error.message);
    }
  }

  try {
    const url = new URL(`${TWITCH_HELIX_API}/channels`);
    url.searchParams.set("broadcaster_id", userData.id);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${(await getToken()).token}`,
        "Client-Id": process.env.CLIENT_ID,
      },
    });

    if (!response.ok) {
      throw new Error(
        "Bad HTTP response: " + `${response.status}: ${response.statusText}`
      );
    }

    const data: ChannelInformationResponse = await response.json();
    const channel = data.data[0];

    if (!channel) {
      dispatcher.error("No entry in channel information?", {
        messageId: content.tags.id,
      });
      return;
    }

    const message = `🚨 Checkout ${channel.broadcaster_name} 🚨, they were last streaming ${channel.game_name} 🤯 and their stream title was 👉 ${channel.title}`;

    void sendChatAnnouncement(message, "primary");
  } catch (error) {
    if (error instanceof Error) {
      console.error("sendShoutout:", error.message);
    }
  }
}
