import type { Helix } from "ts-twitch-helix";
import type { PrivateMessage } from "ts-twitch-irc";
import type { Dispatch } from "../services/Dispatch.js";
import { getAttributes } from "./commands.js";

export async function followage(
  dispatcher: Dispatch,
  content: PrivateMessage,
  helix: Helix,
): Promise<void> {
  try {
    const username =
      // Twitch usernames are limited to 25 characters
      getAttributes(content)
        .match(/^@?([\w]{1,25})/)?.[1]
        ?.toLowerCase() || content.username;

    let userId = content.tags.user_id;
    let displayName = content.tags.display_name;

    if (username !== content.username) {
      const userData = (await helix.users.get({ login: username })).at(0);

      if (!userData) {
        dispatcher.error(`I couldn't find the user ${username}?`, {
          messageId: content.tags.id,
        });
        return;
      }

      userId = userData.id;
      displayName = userData.display_name;
    }

    const followerData = (
      await helix.channels.followers.get({
        userId,
        broadcasterId: process.env.BROADCASTER_ID,
      })
    ).data.at(0);

    if (!followerData) {
      dispatcher.reply(
        content.tags.id,
        username === content.username
          ? "You're not following Adrian?"
          : `${username} is not following Adrian.`,
      );
      return;
    }

    const timestampFollowed = new Date(followerData.followed_at || 0).valueOf();
    const daysFollowed = Math.floor(
      (Date.now() - timestampFollowed) / 1000 / 60 / 60 / 24,
    );

    dispatcher.reply(
      content.tags.id,
      username === content.username
        ? `You've been following for ${daysFollowed} days!`
        : `${displayName} has been following for ${daysFollowed} days.`,
    );
  } catch (error) {
    console.error("followage:", error);
  }
}
