import type { Dispatch } from "../bot.js";
import { botStorage } from "../botStorage.js";
import type { PrivateMessage } from "ts-twitch-irc";
import { getAttributes } from "./commands.js";

export function getAlias(alias: string): string | undefined {
  alias = alias.trim();

  if (!alias.startsWith("!")) {
    alias = "!" + alias;
  }

  const aliases = botStorage.get("aliases", {});
  return aliases?.[alias];
}

function removeAlias(alias: string): void {
  const aliases = botStorage.get("aliases", {});
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete aliases[alias];
  botStorage.set("aliases", aliases);
}

function setAlias(alias: string, command: string): void {
  const aliases = botStorage.get("aliases", {});
  aliases[alias] = command;
  botStorage.set("aliases", aliases);
}

export function alias(dispatcher: Dispatch, content: PrivateMessage): void {
  const args = getAttributes(content).split(" ").filter(Boolean);

  switch (args[0]) {
    case "get":
      {
        if (!args[1]) {
          dispatcher.error("Usage: !alias get <!alias>", {
            messageId: content.tags.id,
          });
          return;
        }

        const alias = getAlias(args[1]);

        if (!alias) {
          dispatcher.error(
            `The command ${args[1]} is not an alias to anything.`,
            { messageId: content.tags.id }
          );
          return;
        }

        dispatcher.reply(
          content.tags.id,
          `The command ${args[1]} is an alias for ${getAlias(args[1])}`
        );
      }
      break;
    case "remove":
      {
        if (!args[1]) {
          dispatcher.error("Usage: !alias remove <!alias>", {
            messageId: content.tags.id,
          });
          return;
        }

        const command = getAlias(args[1]);

        if (!command) {
          dispatcher.error(
            `The command ${args[1]} is not an alias to anything.`,
            { messageId: content.tags.id }
          );
          return;
        }

        // TODO: Refactor this to return a boolean?
        removeAlias(args[1]);

        dispatcher.reply(content.tags.id, `Remove the alias ${args[1]}`);
      }
      break;
    case "set":
      {
        if (!args || args.length !== 3 || !args[1] || !args[2]) {
          dispatcher.error("Usage: !alias set <!alias> <!command>", {
            messageId: content.tags.id,
          });
          return;
        }

        setAlias(args[1], args[2]);

        dispatcher.reply(
          content.tags.id,
          `${args[1]} is now an alias for ${args[2]}`
        );
      }
      break;
    default: {
      dispatcher.error("Usage: !alias <get|remove|set> <!alias> [!command]", {
        messageId: content.tags.id,
      });
    }
  }
}
