import type {
  AnnouncementNotice,
  RaidNotice,
  RitualNotice,
  SubscriptionNotice,
  UserNotice,
  UserNoticeTags,
} from "../types/userNotice.js";
import type {
  ClearChatCommand,
  ClearChatTags,
  ClearMessageCommand,
  ClearMessageTags,
} from "../types/clearCommands.js";
import type { TwitchChannelName, TwitchUserName } from "../types/twitchTags.js";
import type {
  PrivateMessage,
  PrivateMessageTags,
} from "../types/privateMessage.js";

export type ParsedMessage =
  | ClearChatCommand
  | ClearMessageCommand
  | Membership
  | PrivateMessage
  | SystemMessage
  | UserNotice
  | Whisper
  | null
  | undefined;

interface Membership {
  type: "membership";
  membership_type: "join" | "part";
  login_name: string;
  channel: string;
}

export type SystemMessage =
  | CapabilitiesMessage
  | ReconnectMessage
  | PingMessage;

interface CapabilitiesMessage {
  type: "system";
  system_type: "capabilities";
  reply: "ack" | "nak";
  capabilities: string[];
}

interface ReconnectMessage {
  type: "system";
  system_type: "reconnect";
}

interface PingMessage {
  type: "system";
  system_type: "ping";
  message: string;
}

interface Whisper {
  type: "whisper";
  username: TwitchUserName;
  identity: TwitchUserName;
  hostname: TwitchUserName;
  recipient: TwitchUserName;
  message: string;
}

function parseTags<T extends object>(rawMessage: string): T {
  // some-thing=tag;other-thing=tag -> {some_thing: "tag", other_thing: "tag"}
  // @tag-one=foo;tag-two=bar;tag-three=baz :user.name@domain COMMAND arguments :text message
  const tagsAndValues = rawMessage
    .slice(1)
    .split(";")
    .map((entry) => {
      const [tag, value] = entry.split("=");
      return [tag?.replace(/-/g, "_"), value];
    });

  return Object.fromEntries(tagsAndValues);
}

export function parseMessage(rawMessage: string): ParsedMessage {
  const { tags, message } = separateTags();
  const command = message.match(/(?<=tmi.twitch.tv )[0-9A-Z]+|PING(?= )/)?.[0];

  function separateTags() {
    if (rawMessage.startsWith("@")) {
      const divider = rawMessage.indexOf(" ");
      return {
        tags: rawMessage.slice(0, divider),
        message: rawMessage.slice(divider + 1),
      };
    }

    return { tags: undefined, message: rawMessage };
  }

  /*
   * IRC reference RFC 2812
   * https://www.rfc-editor.org/rfc/rfc2812
   *
   * Additional IRCv3 tags
   * https://ircv3.net/specs/extensions/message-tags.html
   */

  switch (command) {
    case "001":
    case "002":
    case "003":
    case "004":
    case "375":
    case "372":
    case "376":
      // :tmi.twitch.tv 001 adrianbotjs :Welcome, GLHF!
      // :tmi.twitch.tv 002 adrianbotjs :Your host is tmi.twitch.tv
      // :tmi.twitch.tv 003 adrianbotjs :This server is rather new
      // :tmi.twitch.tv 004 adrianbotjs :-
      // :tmi.twitch.tv 375 adrianbotjs :-
      // :tmi.twitch.tv 372 adrianbotjs :You are in a maze of twisty passages, all alike.
      // :tmi.twitch.tv 376 adrianbotjs :>
      //console.debug(rawMessage);
      break;
    case "353":
      // RPL_NAMREPLY
      // "( "=" / "*" / "@" ) <channel> :[ "@" / "+" ] <nick> *( " " [ "@" / "+" ] <nick> )
      break;
    case "366":
      // RPL_ENDOFNAMES
      // "<client> <channel> :End of /NAMES list"
      break;
    case "421":
      // :tmi.twitch.tv 421 <user> WHO :Unknown command
      console.error("Twitch IRC responded with unknown command:", rawMessage);
      break;
    case "CAP":
      return {
        type: "system",
        system_type: "capabilities",
        reply: /ACK/.test(message) ? "ack" : "nak",
        capabilities: message
          .slice(message.indexOf(" :") + " :".length)
          .split(" "),
      } satisfies CapabilitiesMessage;
    case "CLEARCHAT": {
      interface Match {
        groups: { channel: TwitchChannelName; user: TwitchUserName };
      }
      const pattern = /(?<=CLEARCHAT )(?<channel>#[a-z_]+)(?: :)?(?<user>.*)?/;
      const match = message.match(pattern) as Match | null;

      if (!match) {
        console.error("Parser: CLEARMSG regex didn't match", message);
        return null;
      }

      if (!tags) {
        console.error("Parser: No tags data found?", rawMessage);
        return null;
      }

      return {
        type: "clearCommand",
        clear_type: "chat",
        channel: match.groups.channel,
        user: match.groups.user,
        tags: parseTags<ClearChatTags>(tags),
      } satisfies ClearChatCommand;
    }
    case "CLEARMSG": {
      const pattern =
        /(?<=CLEARMSG )(?<channel>#[a-z_]+)(?: :)?(?<message>.*)?/;
      const match = message.match(pattern) as null | {
        groups: { channel: string; message: string };
      };

      if (!match) {
        console.error("Parser: CLEARMSG regex didn't match", message);
        return null;
      }

      if (!tags) {
        console.error("Parser: No tags data found?", rawMessage);
        return null;
      }

      return {
        type: "clearCommand",
        clear_type: "message",
        channel: match.groups.channel,
        message: match.groups.message,
        tags: parseTags<ClearMessageTags>(tags),
      } satisfies ClearMessageCommand;
    }
    case "GLOBALUSERSTATE":
      // Sent after the bot successfully authenticates with the server.
      // NOTE: There's no such entry in the logs?
      break;
    case "JOIN":
    case "PART": {
      interface Match {
        login_name: string;
        channel: string;
      }
      const match = message.match(/:(?<login_name>[\w]+).*?#(?<channel>[\w]+)/)
        ?.groups as Match | undefined;

      if (!match) {
        console.error("Parser: Failed to match:", message);
        return null;
      }

      return {
        type: "membership",
        membership_type: /JOIN/.test(message) ? "join" : "part",
        ...match,
      } satisfies Membership;
    }
    case "NOTICE":
      // The Twitch IRC server sends this message to indicate the outcome of the action
      // TODO: report errors like msg_banned, invalid_user
      // and also specific information as to why the bot isn't allowed to talk in chat
      console.debug("Notice", rawMessage);
      break;
    // :<user>!<user>@<user>.tmi.twitch.tv PART #<channel>
    case "PING": {
      console.debug("Ping", rawMessage);
      const domain = rawMessage.split(":")[1];

      return {
        type: "system",
        system_type: "ping",
        message: `PONG :${domain}`,
      } satisfies PingMessage;
    }
    case "PRIVMSG": {
      const pattern =
        /:(?:(?<username>\w*)!(?<identity>\w*)@)?(?<hostname>[\w.]*) (?<command>[A-Z]*) (?<channel>#\w*) :(?<message>.*)/;

      const content = message.match(pattern)?.groups as
        | Omit<PrivateMessage, "type" | "tags">
        | undefined;

      if (!content) {
        console.error("Parse: Failed to parse:", message);
        return null;
      }

      if (!tags) {
        console.error("Parse: Missing tags:", rawMessage);
        return null;
      }

      return {
        ...content,
        type: "privateMessage",
        tags: parseTags<PrivateMessageTags>(tags),
      } satisfies PrivateMessage;
    }
    case "RECONNECT":
      return {
        type: "system",
        system_type: "reconnect",
      } satisfies ReconnectMessage;
    case "ROOMSTATE":
      break;
    case "USERNOTICE": {
      const pattern =
        /(?<=USERNOTICE )(?<channel>#[a-z_]+)(?: :)?(?<message>.*)?/;
      const match = message.match(pattern) as null | {
        groups: { channel: string; message: string | undefined };
      };

      if (!match) {
        console.error("Parser: Usernotice regex didn't match", message);
        return null;
      }

      if (!tags) {
        console.error("Parser: No tags in message:", rawMessage);
        return null;
      }

      const userNoticeTags = parseTags<UserNoticeTags>(tags);
      const userNoticeType = userNoticeTags.msg_id;

      switch (userNoticeType) {
        case "announcement":
          return {
            type: "userNotice",
            notice_type: "announcement",
            channel: match.groups.channel,
            message: match.groups?.message,
            tags: userNoticeTags,
          } satisfies AnnouncementNotice;
        case "raid":
          return {
            type: "userNotice",
            notice_type: "raid",
            channel: match.groups.channel,
            message: match.groups?.message,
            tags: userNoticeTags,
          } satisfies RaidNotice;
        case "sub":
        case "resub":
        case "subgift":
        case "submysterygift":
        case "giftpaidupgrade":
          return {
            type: "userNotice",
            notice_type: "subscription",
            channel: match.groups?.channel,
            message: match.groups?.message,
            tags: userNoticeTags,
          } satisfies SubscriptionNotice;
        case "ritual":
          return {
            type: "userNotice",
            notice_type: "ritual",
            channel: match.groups?.channel,
            message: match.groups?.message,
            tags: userNoticeTags,
          } satisfies RitualNotice;
        default:
          console.error(
            "Parser usernotice: Got unexpected message id:",
            userNoticeTags.msg_id,
            "In the message:",
            rawMessage
          );
          return null;
      }
    }
    case "USERSTATE":
      break;
    case "WHISPER": {
      const pattern =
        /:(?<username>[\w]+)!(?<identity>[\w]+)@(?<hostname>[\w]+).*? WHISPER (?<recipient>[\w]+) :(?<message>.*)/;
      const matches = rawMessage.match(pattern)?.groups as
        | Omit<Whisper, "type">
        | undefined;

      if (!matches) {
        console.error("Parser: Failed to parse:", rawMessage);
        return null;
      }

      return { ...matches, type: "whisper" } satisfies Whisper;
    }
    default:
      console.error("Unknown command:", command);
  }

  return;
}
