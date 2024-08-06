import "dotenv/config";
import { WebSocket } from "ws";
import { subscribeToEvents } from "./subscriber.js";
import { NotificationMessage } from "./events/types/notificationMessage.js";
import { EventSubListener } from "./listener.js";

type EventSubMessage =
  | NotificationMessage
  | ReconnectMessage
  | RevocationMessage
  | WelcomeMessage;

function isMessageType<Message extends EventSubMessage>(
  message: EventSubMessage,
  messageType: EventSubMessage["metadata"]["message_type"]
): message is Message {
  return message.metadata.message_type === messageType;
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

interface ReconnectMessage {
  metadata: {
    message_id: string;
    message_type: "session_reconnect";
    message_timestamp: string;
  };
  payload: {
    session: {
      id: string;
      status: string;
      keepalive_timeout_seconds: null;
      reconnect_url: string;
      connected_at: string;
    };
  };
}

interface RevocationMessage {
  metadata: {
    message_id: string;
    message_type: "revocation";
    message_timestamp: string;
    subscription_type: string;
    subscription_version: string;
  };
  payload: {
    subscription: {
      id: string;
      status: "authorization_revoked" | "user_removed" | "version_removed";
      type: string;
      version: string;
      cost: string;
      condition: Record<string, unknown>;
      transport: {
        method: string;
        session_id: string;
      };
      created_at: string;
    };
  };
}

export function connectEventSubWebSocket(
  callback: EventSubListener,
  reconnectUrl?: string
) {
  const ws = new WebSocket(reconnectUrl || process.env.TWITCH_EVENTSUB);

  ws.on("message", (stream) => {
    const message: EventSubMessage = JSON.parse(stream.toString());

    // Check if it's the welcome message
    if (isMessageType<NotificationMessage>(message, "notification")) {
      // At this point, we now we got some kind of an event, but not for what
      callback(message.payload);
    } else if (isMessageType<ReconnectMessage>(message, "session_reconnect")) {
      connectEventSubWebSocket(callback, message.payload.session.reconnect_url);
    } else if (isMessageType<RevocationMessage>(message, "revocation")) {
      console.error(
        "Got a revocation message for",
        message.payload.subscription.type,
        message.payload.subscription.status
      );
    } else if (isMessageType<WelcomeMessage>(message, "session_welcome")) {
      // If it's a welcome message, then we can get the session ID!
      console.log(
        "Got the session ID from the welcome message!",
        message.payload.session.id
      );
      const sessionID = message.payload.session.id;

      if (!reconnectUrl) {
        void subscribeToEvents(sessionID);
      }
    }
  });

  ws.on("close", (code) =>
    console.error(`Connection closed with code: ${code}`)
  );
}
