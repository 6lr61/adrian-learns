import { onCooldownUntil, setCooldown } from "./cooldown.js";
import { commands, type CommandDeclaration } from "./commands/commands.js";
import { type PrivateMessage } from "ts-twitch-irc";
import { getAlias } from "./commands/alias.js";

export type BotResponse =
  | BotChatMessage
  | BotReplyMessage
  | BotWhisper
  | BotError;

interface BotChatMessage {
  type: "chat";
  message: string;
}

interface BotReplyMessage {
  type: "reply";
  messageId: string;
  message: string;
}

interface BotWhisper {
  type: "whisper";
  userId: string;
  message: string;
}

interface BotError {
  type: "error";
  userId?: string;
  messageId?: string;
  message: string;
}

export async function runBotCommand(
  messageContent: PrivateMessage,
): Promise<BotResponse | undefined> {
  const message = messageContent.message.trim();
  const commandName = message.split(" ")[0]?.toLocaleLowerCase();
  const spaceIndex = message.indexOf(" ");
  const attributes =
    spaceIndex !== -1 ? message.slice(message.indexOf(" ") + 1) : "";

  const name = messageContent.tags?.display_name || messageContent.username;

  if (!commandName) {
    return;
  }

  // Check if it's an alias
  const alias = getAlias(commandName);
  let command: CommandDeclaration | undefined;

  if (alias) {
    command = commands[alias];
  } else {
    command = commands[commandName];
  }

  if (command) {
    if (command.cooldown) {
      const cooldownMessage = onCooldownUntil(
        messageContent.username,
        commandName,
        command.cooldown.scope,
      );

      if (cooldownMessage) {
        return {
          type: "whisper",
          message:
            `The ${commandName} command is currently on cooldown for another ${cooldownMessage}` +
            ", please try again later.",
          userId: messageContent.tags.user_id,
        };
      }
    }

    // Check so that the user has permissions to use the command
    if (
      !userHasPermissions(
        commandName,
        messageContent,
        commands[commandName]?.permission,
      )
    ) {
      return {
        type: "error",
        message: `You don't have permission to use the ${commandName} command.`,
        userId: messageContent.tags.user_id,
      };
    }

    const botResponse = await command.action(name, attributes, messageContent);

    if (botResponse?.type !== "error" && command.cooldown) {
      setCooldown(
        messageContent.username,
        commandName,
        command.cooldown.scope,
        command.cooldown.periodSeconds,
      );
    }

    if (botResponse) {
      return botResponse;
    }
  }

  return;
}

export function userHasPermissions(
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
