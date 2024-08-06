import { coolingDownUntil, formatTimeUntil, setCooldown } from "./cooldown.js";
import { commands, type CommandDeclaration } from "./commands/commands.js";
import { type PrivateMessage } from "ts-twitch-irc";
import { getAlias } from "./commands/alias.js";
import type { Dispatch } from "./services/dispatch.js";

export function runBotCommand(
  dispatcher: Dispatch,
  messageContent: PrivateMessage,
): void {
  const message = messageContent.message.trim();
  const commandName = message.split(" ")[0]?.toLocaleLowerCase();

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
    if (
      !hasPermission(
        commandName,
        messageContent,
        commands[commandName]?.permission,
      )
    ) {
      dispatcher.error(
        `You don't have permission to use the ${commandName} command.`,
        { userId: messageContent.tags.user_id },
      );
      return;
    }

    if (command.cooldown) {
      const endingDate = coolingDownUntil(
        messageContent.username,
        commandName,
        command.cooldown.scope,
      );

      if (endingDate.valueOf() > Date.now()) {
        dispatcher.whisper(
          messageContent.tags.user_id,
          `The ${commandName} command is currently on cooldown for another ${formatTimeUntil(
            endingDate,
          )}` + ", please try again later.",
        );
        return;
      }
    }

    void command.action(dispatcher, messageContent);

    if (command.cooldown) {
      setCooldown(
        messageContent.username,
        commandName,
        command.cooldown.scope,
        command.cooldown.periodSeconds,
      );
    }
  }

  return;
}

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
