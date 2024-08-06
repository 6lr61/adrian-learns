import { coolingDownUntil, setCooldown } from "./cooldown.js";
import { commands, type CommandDeclaration } from "../commands.js";
import { type PrivateMessage } from "ts-twitch-irc";
import { getAlias } from "../alias.js";
import type { Dispatch } from "../../services/dispatch.js";
import { hasPermission } from "./hasPermission.js";

function formatTimeUntil(endingTime: Date) {
  const timeLeft = new Date(endingTime.valueOf() - Date.now());
  const minutesLeft = timeLeft.getMinutes();
  const secondsLeft = timeLeft.getSeconds();
  const minutes = `${minutesLeft} minute` + (minutesLeft !== 1 ? "s" : "");
  const seconds = `${secondsLeft} second` + (secondsLeft !== 1 ? "s" : "");

  return (minutesLeft > 0 ? `${minutes} and ` : "") + seconds;
}

export function runCommand(
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
