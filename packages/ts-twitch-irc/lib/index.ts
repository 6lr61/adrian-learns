import { WebSocket } from "ws";
import type { PrivateMessage } from "./types/privateMessage.js";
import {
  ClearChatCommand,
  ClearMessageCommand,
} from "./types/clearCommands.js";
import { parseMessage } from "./twitch/parser.js";
import { TwitchUserName } from "./types/twitchTags.js";
import { log, startNewLog } from "./utils/log.js";
import type { UserNotice } from "./types/userNotice.js";

const TWITCH_IRC_SERVER = "wss://irc-ws.chat.twitch.tv:443"; // I don't know if this will just work?

// Rate limit variables
const TWITCH_MESSAGE_WINDOW = 30_00;
const TWITCH_MESSAGE_RATE_LIMIT = 100;
const TWITCH_MESSAGE_CHARACTER_LIMIT = 450;
const rateLimit = {
  window_end_time: 0,
  message_count: 0,
};

export type { PrivateMessage, UserNotice };

export interface Whisper {
  username: TwitchUserName;
  identity: TwitchUserName;
  hostname: TwitchUserName;
  recipient: TwitchUserName;
  message: string;
}

type ParserEvent = "clearCommand" | "privateMessage" | "userNotice";

type CallbackFunction =
  | PrivateMessageCallback
  | UserNoticeCallback
  | ClearCommandCallback;

type PrivateMessageCallback = (content: PrivateMessage) => void;
type UserNoticeCallback = (content: UserNotice) => void;
type ClearCommandCallback = (
  content: ClearChatCommand | ClearMessageCommand
) => void;

export interface Token {
  login: string;
  user_id: string;
  client_id: string;
  scopes: string[];
  /** Unix timestamp in milliseconds */
  expires: number;
  token: string;
}

export class Chat {
  private webSocket: WebSocket;
  private privateMessageCallback: PrivateMessageCallback = () => {
    /* do nothing */
  };
  private userNoticeCallback: UserNoticeCallback = () => {
    /* do nothing */
  };
  private clearCommandCallback: ClearCommandCallback = () => {
    /* do nothing */
  };
  private channelName: string;
  private borrowToken: () => Token;
  private webSocketUrl: string;

  constructor(
    token: Token,
    borrowToken: () => Token,
    channelName?: string,
    websocketUrl: string = TWITCH_IRC_SERVER
  ) {
    this.channelName = channelName || token.login;
    this.borrowToken = borrowToken;
    this.webSocketUrl = websocketUrl;
    this.webSocket = this.connectToIRC(token);

    startNewLog();
  }

  private connectToIRC(token?: Token): WebSocket {
    if (!token) {
      token = this.borrowToken();
    }

    const webSocket = new WebSocket(this.webSocketUrl);

    webSocket.on("open", () => {
      console.debug("Chat: Opened a WebSocket to IRC");
      webSocket.send(`PASS oauth:${token?.token}`);
      webSocket.send(`NICK ${token?.login}`);
      webSocket.send(
        "CAP REQ :twitch.tv/commands twitch.tv/tags twitch.tv/membership"
      );
      console.debug("Chat: Joining", `#${this.channelName}`);
      webSocket.send(`JOIN #${this.channelName}`);
    });

    const parser = this.parseChatMessage;
    webSocket.on("message", function (ircMessage) {
      const rawIrcMessage: string = ircMessage.toString().trimEnd();
      log(`${Date.now()}: ${rawIrcMessage}`);
      const messages = rawIrcMessage.split("\r\n");

      messages.forEach((message) => parser(message));
    });

    return webSocket;
  }

  reconnect(): void {
    this.webSocket = this.connectToIRC();
  }

  private parseChatMessage = (message: string): void => {
    const parsedMessage = parseMessage(message);

    if (!parsedMessage) {
      return;
    }

    switch (parsedMessage.type) {
      case "clearCommand":
        this.clearCommandCallback(parsedMessage);
        break;
      case "userNotice":
        this.userNoticeCallback(parsedMessage);
        break;
      case "whisper":
        console.debug(
          "whisper:",
          parsedMessage.username,
          parsedMessage.message
        );
        break;
      case "system":
        if (parsedMessage.system_type === "ping") {
          this.sendRaw(parsedMessage.message as string);
        } else {
          // TODO: Deal with other system messages?
          console.debug("system message:", parsedMessage);
          // this.reconnect();
        }
        break;
      case "membership":
        // TODO: Do something with the JOIN and PART
        break;
      case "privateMessage":
        this.privateMessageCallback(parsedMessage);
        break;
    }
  };

  on(event: "privateMessage", callback: PrivateMessageCallback): void;
  on(event: "userNotice", callback: UserNoticeCallback): void;
  on(event: "clearCommand", callback: ClearCommandCallback): void;
  on(event: ParserEvent, callback: CallbackFunction): void {
    switch (event) {
      case "clearCommand":
        this.clearCommandCallback = callback as ClearCommandCallback;
        break;
      case "privateMessage":
        this.privateMessageCallback = callback as PrivateMessageCallback;
        break;
      case "userNotice":
        this.userNoticeCallback = callback as UserNoticeCallback;
        break;
    }
  }

  send(message: string) {
    // If we've started a new 30 second window
    // then keep a tally on the number of messages sent
    if (rateLimit.window_end_time < Date.now()) {
      // Then the window has expired, and we have to start a new one
      rateLimit.message_count = 1;
      rateLimit.window_end_time = Date.now() + TWITCH_MESSAGE_WINDOW;
    } else if (rateLimit.message_count >= TWITCH_MESSAGE_RATE_LIMIT) {
      // TODO: We should probably que the messages?
      // The rate limit has been exceeded, just drop it!
      console.error(`Rate limit exceeded, dropped message: ${message}`);
      return;
    }

    if (message.length > TWITCH_MESSAGE_CHARACTER_LIMIT) {
      rateLimit.message_count++;

      this.webSocket.send(
        `PRIVMSG #${this.channelName} :${message.slice(
          0,
          TWITCH_MESSAGE_CHARACTER_LIMIT
        )}`
      );

      void this.send(message.slice(TWITCH_MESSAGE_CHARACTER_LIMIT));
      return;
    }

    this.webSocket.send(`PRIVMSG #${this.channelName} :${message}`);
  }

  sendRaw(message: string) {
    this.webSocket.send(message);
  }

  sendReply(message_id: string, message: string) {
    const reply = (message: string) => {
      return `@reply-parent-msg-id=${message_id} PRIVMSG #${this.channelName} :${message}`;
    };

    // If we've started a new 30 second window
    // then keep a tally on the number of messages sent
    if (rateLimit.window_end_time < Date.now()) {
      // Then the window has expired, and we have to start a new one
      rateLimit.message_count = 0;
      rateLimit.window_end_time = Date.now() + 30_000;
    } else if (rateLimit.message_count >= TWITCH_MESSAGE_RATE_LIMIT) {
      // TODO: We should probably que the messages?
      // The rate limit has been exceeded, just drop it!
      console.error(`Rate limit exceeded, dropped message: ${message}`);
      return;
    }

    if (message.length > TWITCH_MESSAGE_CHARACTER_LIMIT) {
      rateLimit.message_count++;

      this.webSocket.send(
        reply(message.slice(0, TWITCH_MESSAGE_CHARACTER_LIMIT))
      );

      void this.sendReply(
        message_id,
        message.slice(TWITCH_MESSAGE_CHARACTER_LIMIT)
      );
      return;
    }

    this.webSocket.send(reply(message));
  }
}
