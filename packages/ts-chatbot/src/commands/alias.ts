import { botStorage } from "../botStorage.js";
import type { CommandResponse } from "./commands.js";
import type { PrivateMessage } from "ts-twitch-irc";

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

export function alias(input: string, content: PrivateMessage): CommandResponse {
  const args = input.split(" ").filter(Boolean);

  switch (args[0]) {
    case "get": {
      if (!args[1]) {
        return {
          type: "error",
          message: "Usage: !alias get <!alias>",
          messageId: content.tags.id,
        };
      }

      const alias = getAlias(args[1]);

      if (!alias) {
        return {
          type: "error",
          message: `The command ${args[1]} is not an alias to anything.`,
          messageId: content.tags.id,
        };
      }

      return {
        type: "reply",
        message: `The command ${args[1]} is an alias for ${getAlias(args[1])}`,
        messageId: content.tags.id,
      };
    }
    case "remove": {
      if (!args[1]) {
        return {
          type: "error",
          message: "Usage: !alias remove <!alias>",
          messageId: content.tags.id,
        };
      }

      const command = getAlias(args[1]);

      if (!command) {
        return {
          type: "error",
          message: `The command ${args[1]} is not an alias to anything.`,
          messageId: content.tags.id,
        };
      }

      removeAlias(args[1]);

      return {
        type: "reply",
        message: `Remove the alias ${args[1]}`,
        messageId: content.tags.id,
      };
    }
    case "set": {
      if (!args || args.length !== 3 || !args[1] || !args[2]) {
        return {
          type: "error",
          message: "Usage: !alias set <!alias> <!command>",
          messageId: content.tags.id,
        };
      }

      setAlias(args[1], args[2]);

      return {
        type: "error",
        message: `${args[1]} is now an alias for ${args[2]}`,
        messageId: content.tags.id,
      };
    }
    default: {
      return {
        type: "error",
        message: "Usage: !alias <get|remove|set> <!alias> [!command]",
        messageId: content.tags.id,
      };
    }
  }
}
