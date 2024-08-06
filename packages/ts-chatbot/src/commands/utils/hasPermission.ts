import type { PrivateMessage } from "ts-twitch-irc";

export function hasPermission(
  commandName: string,
  messageContent: PrivateMessage,
  permission: string | undefined,
): boolean {
  // To check the user permission, we have to look inside the tags
  const isMod = messageContent.tags?.mod === "1";
  const isVip = /vip/.test(messageContent.tags?.badges || "");

  // If it's a mod or vip, then they are allowed to run user commands
  switch (permission) {
    case "streamer":
      return messageContent.username === process.env.BROADCASTER_LOGIN;
    case "mod":
      return isMod || messageContent.username === process.env.BROADCASTER_LOGIN;
    case "vip":
      return isVip || messageContent.username === process.env.BROADCASTER_LOGIN;
    default:
      return true;
  }
}
