import { WebSocket } from "ws";
import { sendChatAnnouncement } from "./helix.js";
import { getToken } from "./auth.js";
import type { Dispatch } from "./services/dispatch.js";

const TWITCH_EVENTSUB = "wss://eventsub.wss.twitch.tv/ws";
const TWITCH_SUBSCRIBE_API =
  "https://api.twitch.tv/helix/eventsub/subscriptions";

// CONNECT
// When we first connect to the websocket,
// we get an ID that we HAVE to use it!
// We then have to subscribe to events using ANOTHER API
// this API require that we sent it POST requests

// RECONNECT
// We might get a reconnect message, tellin us to connect
// to another host, specified in the message itself.

// A subscription might be revoked if the version we're
// using is no longer supported

// The number of events we're subscribed to are limited
// to a cost of 10 in total for all subscriptions

// KEEPALIVE
// We will get a KeepAlive message from EventSub
// once every `keepalive_timeout_seconds` then
// we have to assume the connection is lost,
// and reconnect again

type EventSubMessage = WelcomeMessage | NotificationMessage;

function isWelcomeMessage(message: EventSubMessage): message is WelcomeMessage {
  return message.metadata.message_type === "session_welcome";
}

function isNotificationMessage(
  message: EventSubMessage,
): message is NotificationMessage {
  return message.metadata.message_type === "notification";
}

interface WelcomeMessage {
  metadata: {
    message_id: string;
    message_type: "session_welcome";
    message_timestamp: string; // UTC date and time
  };
  payload: {
    session: {
      id: string;
      status: string;
      connected_at: string; // UTC date and time
      keepalive_timeout_seconds: number;
      reconnect_url: string | null;
    };
  };
}

interface NotificationMessage {
  metadata: {
    message_id: string;
    message_type: "notification";
    message_timestamp: string; // UTC date for when message sent
    subscription_type: string;
    subscription_version: string;
  };
  payload: {
    subscription: {
      id: string;
      status: string;
      type: string;
      version: string;
      cost: string;
      condition: Record<string, unknown>; // this is some object, depends on subscription type
      transport: {
        method: string;
        session_id: string;
      };
      created_at: string; // UTC date for when subscription created
    };
    event:
      | ChannelFollowEvent
      | ChannelSubscribeEvent
      | ChannelPointsRedemptionEvent
      | ChannelSubscriptionGiftEvent;
  };
}

interface ChannelEvent {
  user_id: string | null;
  user_login: string;
  user_name: string | null;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
}

interface ChannelFollowEvent extends ChannelEvent {
  followed_at: string; // RFC3339 timestamp for the event
}

interface ChannelSubscribeEvent extends ChannelEvent {
  tier: "1000" | "2000" | "3000";
  is_gift: boolean;
}

interface ChannelSubscriptionGiftEvent extends ChannelEvent {
  total: number;
  tier: "1000" | "2000" | "3000";
  cumulative_total: number | null; //null if anonymous or not shared by the user
  is_anonymous: boolean;
}

interface ChannelPointsRedemptionEvent extends ChannelEvent {
  id: string;
  user_input: string;
  status: "unknown" | "unfulfilled" | "fulfilled" | "canceled";
  reward: {
    id: string;
    title: string;
    cost: number;
    prompt: string;
  };
  redeemed_at: string; // RFC3339 timestap for the redeem
}

// It seems like we only connect and get a session ID
// meaning there's no authentication yet

// At this point, we have 10 seconds to subscribe to one or
// more events!

export function wsEventsubConnect(dispatcher: Dispatch) {
  const ws = new WebSocket(TWITCH_EVENTSUB);

  let sessionID: string;

  ws.on("message", (stream) => {
    const message: EventSubMessage = JSON.parse(stream.toString());

    // Check if it's the welcome message
    if (isWelcomeMessage(message)) {
      // If it's a welcome message, then we can get the session ID!
      console.log("Got the session ID from the welcome message!");
      sessionID = message.payload.session.id;

      void subscribeToEvent("channel.follow", "2", sessionID, {
        broadcaster_user_id: process.env.BROADCASTER_ID,
        moderator_user_id: process.env.USER_ID,
      });
    } else if (isNotificationMessage(message)) {
      switch (message.payload.subscription.type) {
        case "channel.follow":
          dispatcher.say(
            `Hello, ${message.payload.event.user_name}!` +
              " Thank you for the follow! How's it going?",
          );
          break;
        case "channel.subscribe":
          if (
            "is_gift" in message.payload.event &&
            message.payload.event.is_gift
          ) {
            void sendChatAnnouncement(
              `Welcome as a subscriber ${message.payload.event.user_name}! GlitchCat`,
              "purple",
            );
          } else {
            void sendChatAnnouncement(
              `Thank you so much for subscribing ${message.payload.event.user_name}! I love you! VirtualHug`,
              "blue",
            );
          }
          break;
        case "channel.subscription.gift":
          if ("cumulative_total" in message.payload.event) {
            const gifter = message.payload.event.is_anonymous
              ? "Anonymous"
              : message.payload.event.user_name;
            const subGifts =
              message.payload.event.total > 1
                ? `${message.payload.event.total} gifted subscriptions`
                : "gifted subscription";
            const totalGifted =
              message.payload.event.is_anonymous ||
              !message.payload.event.cumulative_total ||
              message.payload.event.cumulative_total <=
                message.payload.event.total
                ? ""
                : `You've kindly given away ${message.payload.event.total} subscriptions in total to the community! Thank you so much!`;

            void sendChatAnnouncement(
              `Thank you ${gifter} for the ${subGifts}! Thank you, thank you! VirtualHug ${totalGifted}`,
              "blue",
            );
          }
          break;
        case "channel.channel_points_custom_reward_redemption.add":
          if ("reward" in message.payload.event) {
            console.log(
              `User ${message.payload.event.user_name} just redeemed ${message.payload.event.reward.title}!`,
            );
          }
          break;
        default:
          console.log(
            `Recieved a notificatio of type: ${message.payload.subscription.type}`,
          );
      }
    }
  });

  ws.on("close", (code) =>
    console.error(`Connection closed with code: ${code}`),
  );
}

async function subscribeToEvent(
  type: string,
  version: string,
  sessionID: string,
  condition: Record<string, string>,
) {
  const data = {
    type: type,
    version: version,
    condition: condition,
    transport: {
      method: "websocket",
      session_id: sessionID,
    },
  };

  const response = await fetch(TWITCH_SUBSCRIBE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${(await getToken()).token}`,
      "Client-Id": `${process.env.CLIENT_ID}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });

  console.debug(
    "EventSub:",
    type,
    "Got the response:",
    response.status,
    response.statusText,
  );

  return response.status === 202;
}
