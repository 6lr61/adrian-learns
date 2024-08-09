import type { WebviewPanel } from "vscode";
import type {
  ClearCommand,
  DeleteCommand,
  WebViewMessage,
  WebViewRaidNotice,
} from "../types.js";
import { twitchBadges } from "./user-badges.js";
import type {
  ClearChatCommand,
  ClearMessageCommand,
} from "ts-twitch-irc/dist/types/clearCommands.js";
import { makeEmoteList } from "../emotes.js";
import type { PrivateMessage, UserNotice } from "ts-twitch-irc";
import type { AnnouncementNotice } from "ts-twitch-irc/dist/types/userNotice.js";
import * as BetterTTV from "../betterttv/index.js";
import { Pronouns } from "../pronouns.js";
import { getProfilePicture } from "./profile-pictures.js";
import type { Token } from "../auth/token.js";

export async function forwardCommand(
  panel: WebviewPanel,
  command: ClearChatCommand | ClearMessageCommand,
) {
  console.debug("Foward command:", command);

  if (command.clear_type === "chat") {
    const clearCommand: ClearCommand = {
      type: "command",
      command: "clear",
      userId: command.tags.target_user_id,
    };

    await panel.webview.postMessage(clearCommand);
  } else if (command.clear_type === "message") {
    const deleteCommand: DeleteCommand = {
      type: "command",
      command: "delete",
      messageId: command.tags.target_msg_id,
    };

    await panel.webview.postMessage(deleteCommand);
  }
}

function unEscape(match: string): string {
  switch (match) {
    case "\\\\":
      return "\\";
    case "\\s":
      return " ";
    case "\\:":
      return ";";
    case "\\":
      return "";
    default:
      return "";
  }
}

export async function forwardMessage(
  panel: WebviewPanel,
  clientId: string,
  token: Token,
  message: PrivateMessage | AnnouncementNotice,
) {
  if (message.message === undefined) {
    return;
  }

  // eslint-disable-next-line no-control-regex
  const makeCursive = /^\u0001ACTION/.test(message.message);

  const badges = message.tags?.badges
    ?.split(",")
    .map((badgeName) => twitchBadges[badgeName])
    .filter((badgeLink) => badgeLink !== undefined) as string[];

  const username =
    "notice_type" in message ? message.tags.login : message.username;

  const pronoun = await Pronouns.instance.lookup(username);

  const bttvBadgeUrl = BetterTTV.UserBadges.instance.get(username);

  if (bttvBadgeUrl !== undefined) {
    badges.push(bttvBadgeUrl);
  }

  const profilePictureUrl = await getProfilePicture(username, clientId, token);
  const parentMessage = {
    ...("reply_parent_msg_body" in message.tags && {
      replyingToDisplayname: message.tags.reply_parent_display_name,
      replyingToUsername: message.tags.reply_parent_user_login,
      replyingToMessage: message.tags.reply_parent_msg_body?.replace(
        /\\\\|\\:|\\s|\\/g,
        unEscape,
      ),
    }),
  };

  const webviewMessage: WebViewMessage = {
    badges,
    pronoun,
    username,
    displayName: message.tags.display_name as string,
    userId: message.tags.user_id,
    type: "message",
    color: message.tags.color,
    emotes: makeEmoteList(message),
    profilePicture: profilePictureUrl,
    message: makeCursive
      ? // eslint-disable-next-line no-control-regex
        message.message?.replace(/\u0001ACTION |\u0001/g, "")
      : message.message,
    messageId: message.tags.id as string,
    cursive: makeCursive,
    firstMessage:
      message.type === "privateMessage" && message.tags.first_msg === "1",
    highlighted:
      message.type === "userNotice" ||
      message.tags.msg_id === "highlighted-message",
    hightlightColor:
      message.type === "userNotice" ? message.tags.msg_param_color : "PRIMARY",
    ...parentMessage,
  };

  console.log(webviewMessage);

  await panel.webview.postMessage(webviewMessage);
}

export async function forwardNotice(
  panel: WebviewPanel,
  clientId: string,
  token: Token,
  notice: UserNotice,
) {
  switch (notice.notice_type) {
    case "raid": {
      const raidNotice: WebViewRaidNotice = {
        type: "notice",
        notice_type: "raid",
        raiderName: notice.tags.msg_param_displayName,
        raiderPicture: notice.tags.msg_param_profileImageURL?.replace(
          "%s",
          "600x600",
        ),
        numberOfRaiders: Number(notice.tags.msg_param_viewerCount),
      };

      await panel.webview.postMessage(raidNotice);
      break;
    }
    case "announcement": {
      await forwardMessage(panel, clientId, token, notice);
      break;
    }
  }
}
