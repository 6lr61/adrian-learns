import { WebSocket } from "ws";
import { type ChangeMap, handleDispatchEvent } from "./dispatch";

type WebSocketMessage =
  | GeneralMessage
  | DispatchMessage
  | EndOfStreamMessage
  | HelloMessage
  | HeartbeatMessage;

interface GeneralMessage {
  /** Message operation code */
  op: Exclude<
    OpCode,
    OpCode.DISPATCH | OpCode.END_OF_STREAM | OpCode.HELLO | OpCode.HEARTBEAT
  >;
  /** Timestamp in "Unix millis" */
  t?: number;
  /** Data payload */
  d: SubscribeData | ResumeData | unknown;
}

export interface DispatchMessage {
  op: OpCode.DISPATCH;
  /** Unix time in milliseconds */
  t: number;
  d: {
    type: EventType;
    body: ChangeMap;
    /** not documented, found in source */
    matches?: number[];
  };
}

interface EndOfStreamMessage {
  op: OpCode.END_OF_STREAM;
  t: number;
  d: {
    code:
      | 4000
      | 4001
      | 4002
      | 4003
      | 4004
      | 4005
      | 4006
      | 4007
      | 4008
      | 4009
      | 4010
      | 4011
      | 4012;
    reason: string;
  };
}

interface HelloMessage {
  op: OpCode.HELLO;
  t: number;
  d: {
    /** interval in milliseconds between each heartbeat */
    heartbeat_interval: number;
    /** unique token for this session, used for resuming and mutating the session */
    session_id: string;
    /** the maximum amount of subscriptions this connection can initiate */
    subscription_limit: number;
  };
}

interface HeartbeatMessage {
  op: OpCode.HEARTBEAT;
  t: number;
  d: {
    count: number;
  };
}

interface SubscribeData {
  type: "emote_set.update";
  condition: Record<string, unknown>;
}

type EventType = "emote_set.update";

interface ResumeData {
  /** ID of the previous session */
  session_id: string;
}

enum OpCode {
  /** A standard event message, sent when a subscribed event is emitted */
  DISPATCH = 0,
  /** Received upon connecting, presents info about the session */
  HELLO = 1,
  /** Ensures the connection is still alive */
  HEARTBEAT = 2,
  /** Server wants the client to reconnect */
  RECONNECT = 4,
  /** Server acknowledges an action by the client */
  ACK = 5,
  /** An error occured, you should log this */
  ERROR = 6,
  /** The server will send no further data and imminently end the connection */
  END_OF_STREAM = 7,
  /** Authenticate with an account */
  IDENTIFY = 33,
  /** Try to resume a previous session */
  RESUME = 34,
  /** Watch for changes on specific objects or sources */
  SUBSCRIBE = 35,
  /** Stop listening for changes */
  UNSUBSCRIBE = 36,
  /** Missing a description? */
  SIGNAL = 37,
}

export async function connect(emoteSetId: string | null): Promise<void> {
  if (emoteSetId === null) {
    console.error(
      "7TV: Failed to acquire an emote set ID, can't subscribe to updates",
    );
    return;
  }

  let ws: WebSocket;

  reconnect();

  function reconnect() {
    let heartbetInterval: number;
    let heartbetTimer: NodeJS.Timeout;
    ws = new WebSocket("wss://events.7tv.io/v3");

    // We should probably use the resume op-code when reconnecting?
    ws.on("open", () => {
      const subscribe: WebSocketMessage = {
        op: OpCode.SUBSCRIBE,
        d: {
          type: "emote_set.update",
          condition: {
            object_id: emoteSetId,
          },
        } satisfies SubscribeData,
      };
      ws.send(JSON.stringify(subscribe));
    });

    ws.on("close", (code: number, reason: Buffer) => {
      console.error(
        "7TV: WebSocket: Connection closed with code:",
        code,
        "and reason:",
        reason.toString(),
      );
      // Might need to use RESUME sometimes?
      clearTimeout(heartbetTimer);
      setTimeout(() => reconnectIf(code, reason.toString()), 5000);
    });

    ws.on("message", (message) => {
      try {
        console.debug("7TV WebSocket:", message.toString());

        const webSocketMessage = JSON.parse(
          message.toString(),
        ) as WebSocketMessage;

        switch (webSocketMessage.op) {
          case OpCode.HELLO: {
            heartbetInterval = webSocketMessage.d.heartbeat_interval;
            heartbetTimer = setTimeout(() => {
              ws.close();
              reconnect();
            }, heartbetInterval * 3);
            break;
          }
          case OpCode.DISPATCH: {
            void handleDispatchEvent(webSocketMessage);
            break;
          }
          case OpCode.HEARTBEAT: {
            clearTimeout(heartbetTimer);
            heartbetTimer = setTimeout(() => {
              ws.close();
              reconnect();
            }, heartbetInterval * 3);
            break;
          }
          case OpCode.RECONNECT: {
            clearTimeout(heartbetTimer);
            ws.close();
            reconnect();
            break;
          }
          case OpCode.END_OF_STREAM: {
            clearTimeout(heartbetTimer);
            ws.close();
            reconnectIf(webSocketMessage.d.code, webSocketMessage.d.reason);
            break;
          }
          default: {
            return;
          }
        }
      } catch (error) {
        console.error(
          "7TV WebSocket: Failed to handle websocket message:",
          error,
        );
      }
    });
  }

  function reconnectIf(code: number, reason: string): void {
    switch (code) {
      case 1006: // Abnormal Closure
      case 4000: // Server Error
      case 4006: // Restart
      case 4008: // Timeout
      case 4012: {
        // Reconnect
        console.log("SevenTV WebSocket: Reconnecting, got code:", code, reason);
        reconnect();
        break;
      }
      case 4007: {
        // Maintenance
        console.log(
          "SevenTV WebSocket: Reconnecting in 5 minutes, got code:",
          code,
          reason,
        );
        setTimeout(() => reconnect(), 5 * 60_000);
        break;
      }
      default: {
        console.error(
          "SevenTV WebSocket: Disconnecting, got code:",
          code,
          reason,
        );
      }
    }
  }
}
