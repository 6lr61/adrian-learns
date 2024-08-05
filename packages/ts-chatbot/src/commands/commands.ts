import {
  getFollowAge,
  getUptime,
  sendShoutout,
  timeoutUser,
} from "../helix.js";
import { botStorage } from "../botStorage.js";
import { makeACupOfCoffee } from "./coffee.js";
import { startTimer, clearTimer } from "../services/websocket.js";
import { startVoting, stopVoting } from "./vote.js";
import { readCurrentFont, readCurrentTheme } from "./vscode.js";
import { setReminder } from "./reminder.js";
import {
  getChattersWithMostGifts,
  getGiftCount,
  getGiftDescription,
  getRandomGift,
  giftPrompt,
  giveGift,
  listAttributes,
  listItems,
  listUserInventory,
  respinGiftAttribute,
  takeGift,
} from "./gift.js";
import { userHasPermissions, type BotResponse } from "../runBotCommand.js";
import { type PrivateMessage } from "ts-twitch-irc";
import {
  getCpuInfo,
  getDebianVersion,
  getKernelVersion,
  getMemoryUsage,
} from "./machine.js";
import { alias } from "./alias.js";
import { randomInt } from "node:crypto";
import { getQuote, setQuote } from "./quotes.js";

export type CommandResponse = BotResponse | undefined;
export type Commands = Record<string, CommandDeclaration>;

export interface CommandDeclaration {
  readonly cooldown?: {
    scope: "user" | "global";
    periodSeconds: number; // seconds
  };
  readonly permission?: "user" | "mod" | "vip" | "streamer";
  readonly help: string;
  readonly action: (
    name: string,
    attributes: string,
    content: PrivateMessage
  ) => CommandResponse | Promise<CommandResponse>; // TODO: Solve this in a better way!
}

export function findNames(input: string): string[] | undefined {
  const matches = input
    // Try to match display names as well as Chinese, Japanese and Korean localized ones
    .match(
      /(?<= *@?)[\w]+|[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\u3131-\uD79D]+/g
    );

  if (matches) {
    return matches;
  }
}

export const commands: Commands = {
  "!alias": {
    help: "Usage: !alias <get|remove|set> <!alias> [!command]",
    action: (_name, attr, content) => alias(attr, content),
    permission: "mod",
  },
  "!aot": {
    help: "Shares a link to Advent of TypeScript",
    action: () => ({
      type: "chat",
      message:
        "The Advent of TypeScript Type puzzles are available here: https://typehero.dev/aot-2023",
    }),
  },
  "!commands": {
    help: "Prints the commands available to the chatter",
    action: (_param1, _param2, content) => ({
      type: "whisper",
      userId: content.tags.user_id,
      message: listCommands(commands, content),
    }),
    cooldown: { scope: "user", periodSeconds: 30 },
  },
  "!discord": {
    help: "Gives you an invite to Adrian Dot Server",
    action: () => ({
      type: "chat",
      message:
        "Adrian does actually have a Discord now! => https://discord.gg/zmc6vMkd",
    }),
  },
  "!theme": {
    help: "The current VSCode Theme",
    action: async () => ({
      type: "chat",
      message: `Adrian is currently using the ${await readCurrentTheme()} theme in VSCode!`,
    }),
    cooldown: { scope: "global", periodSeconds: 5 },
  },
  "!font": {
    help: "The current font used in VSCode",
    action: async () => ({
      type: "chat",
      message: `Adrian is currently using the ${await readCurrentFont()} font in VSCode!`,
    }),
    cooldown: { scope: "global", periodSeconds: 5 },
  },
  "!coffee": {
    help: "Makes you a random cup of coffee",
    action: async (name, _attr, content) => ({
      type: "reply",
      messageId: content.tags.id,
      message: await makeACupOfCoffee(name),
    }),
    cooldown: { scope: "user", periodSeconds: 30 },
  },
  "!crashes": {
    help: "Number of times Adrian's computer has crashed on stream",
    action: () => ({
      type: "chat",
      message: `Adrian's computer has crashed ${botStorage.get(
        "crashes",
        -1
      )} times on stream, so far NotLikeThis`,
    }),
  },
  "!crashes++": {
    help: "Increments the counter of how many times Adrian's computer has crashed",
    action: (_name, _attr, content) => ({
      type: "reply",
      message: `The number of crashes is now: ${botStorage.set(
        "crashes",
        botStorage.get("crashes", 0) + 1
      )}`,
      messageId: content.tags.id,
    }),
    cooldown: { scope: "global", periodSeconds: 15 },
    permission: "mod",
  },
  "!crashes--": {
    help: "Decrements the counter of how many times Adrian's computer has crashed",
    action: (_name, _attr, content) => ({
      type: "reply",
      message: `The number of crashes is now: ${botStorage.set(
        "crashes",
        botStorage.get("crashes", 0) - 1
      )}`,
      messageId: content.tags.id,
    }),
    cooldown: { scope: "global", periodSeconds: 15 },
    permission: "mod",
  },
  "!gift": {
    help: "Gives the chatter a random gift",
    action: getRandomGift,
    cooldown: { scope: "user", periodSeconds: 15 * 60 },
  },
  "!gift:": {
    help:
      "Gift prompt for modifying the !gift command data. " +
      "Usage: !gift: <add> <attr[ibute]|item> <description>",
    action: giftPrompt,
    permission: "streamer",
  },
  "!items": {
    help: "Lists the items in your inventory",
    action: (_name, _attr, content) => listUserInventory(content),
    cooldown: { scope: "user", periodSeconds: 30 },
  },
  "!give": {
    help: "Give someone a random gift from your own collection. Usage: !give username",
    action: giveGift,
    cooldown: { scope: "user", periodSeconds: 5 },
  },
  "!take": {
    help: "Try to take a random gift from someone. Usage: !take username",
    action: takeGift,
    cooldown: { scope: "user", periodSeconds: 5 * 60 },
  },
  "!what": {
    help: "Looks up what a gift is and who owns it. Usage: !what giftId (number)",
    action: getGiftDescription,
  },
  "!respin": {
    help: "Respins the attribute of a gift. Usage: !respin giftId (number)",
    action: respinGiftAttribute,
    cooldown: { scope: "user", periodSeconds: 15 * 60 },
  },
  "!count": {
    help: "Looks up how many gifts you have. Usage: !count [user]",
    action: (_param, attr, content) => {
      const names = findNames(attr);
      return getGiftCount(names?.[0], content);
    },
    cooldown: { scope: "user", periodSeconds: 5 },
  },
  "!top": {
    help: "Get a top 10 list of the chatters with the most gifts. Usage: !top",
    action: getChattersWithMostGifts,
    cooldown: { scope: "global", periodSeconds: 60 },
  },
  "!reminder": {
    help: "Sets a reminder. Usage: !reminder [time in minutes] A thing to be reminded about",
    action: (_param, attributes, content) => ({
      type: "reply",
      message: setReminder(attributes),
      messageId: content.tags.id,
    }),
    permission: "mod",
  },
  "!setup": {
    help: "The specifications for Adrian's computer",
    action: (name, _attr, content) => ({
      type: "reply",
      message: `It's a potato, ${name} mericCat`,
      messageId: content.tags.id,
    }),
  },
  "!gifts": {
    help: "Prints a list of the available items that !gift picks from",
    action: listItems,
    cooldown: { scope: "global", periodSeconds: 5 * 60 },
  },
  "!traits": {
    help: "Prints a list of the possible traits a !gift can have",
    action: listAttributes,
    cooldown: { scope: "global", periodSeconds: 5 * 60 },
  },
  "!cursed": {
    help: "Gives a percentage for how cursed the chatter themself are",
    action: (name) => ({
      type: "chat",
      message: `${name} is ${randomInt(100 + 1)}% cursed! confusedCat`,
    }),
    cooldown: { scope: "user", periodSeconds: 15 },
  },
  "!athano": {
    help: "An advanced AI model of Athano that gives a suitable reply in every context",
    action: () => ({
      type: "chat",
      message: "The answer is of course: It's nuanced and contextual CatNerd",
    }),
  },
  "!tkap": {
    help: "An advanced AI model of Tkap1 that gives a suitable reply in every context",
    action: () => ({
      type: "chat",
      message: "That's a problem!",
    }),
  },
  "!followage": {
    help: "Responds with the number of days someone has been following. Usage: !followage [username]",
    action: getFollowAge,
  },
  "!hello": {
    help: "Replies to a greeting",
    action: (name, _attr, content) => ({
      type: "reply",
      message: `Hello, ${name}! catKISS`,
      messageId: content.tags.id,
    }),
  },
  "!morning": {
    help: "Replies to your good morning greeting",
    action: (name, _attr, content) => ({
      type: "reply",
      message: `Good morning, ${name} catYawn`,
      messageId: content.tags.id,
    }),
  },
  "!night": {
    help: "Replies to your good night wishes",
    action: (name, _attr, content) => ({
      type: "reply",
      message: `Good night and sleep tight, ${name}! catTuck`,
      messageId: content.tags.id,
    }),
  },
  "!lurk": {
    help: "Replies to your lurk",
    action: (name, _attr, content) => ({
      type: "reply",
      message: `Thank you for lurking, ${name}! catLurk`,
      messageId: content.tags.id,
    }),
  },
  "!unlurk": {
    help: "Replies to your unlurk",
    action: (name, _attr, content) => ({
      type: "reply",
      message: `Welcome back ${name}! catArrive`,
      messageId: content.tags.id,
    }),
  },
  "!right": {
    help: "Acknowledges that you're right",
    action: (name) => ({
      type: "chat",
      message: `${name} is right, you know! CatOk`,
    }),
    permission: "vip",
  },
  "!left": {
    help: "Agrees that the conversation is over",
    action: (name) => ({
      type: "chat",
      message: `I agree @${name}, there's not much left to say baseg`,
    }),
    permission: "mod",
  },
  "!help": {
    help: "Prints out a help message for a given command. Usage: !help command",
    action: (_name, attributes, content) => ({
      type: "reply",
      message: helpCommand(attributes),
      messageId: content.tags.id,
    }),
  },
  "!hug": {
    help: "Gives chat a hug or let's you hug someone else. Usage: !hug [username]",
    action: (name, attr) => {
      const person = findNames(attr)?.[0];

      if (person) {
        return {
          type: "chat",
          message: `${name} gives ${person} a hug! CatAHomie`,
        };
      } else {
        return {
          type: "chat",
          message: `${name} gives chat a hug! catKISS`,
        };
      }
    },
  },
  "!cry": {
    help: "Tells you it's going to be Okay",
    action: (name, _param, content) => ({
      type: "reply",
      message: `It's going to be Okay, ${name}! CatAHomie`,
      messageId: content.tags.id,
    }),
  },
  "!brb": {
    help: "Sets and starts and on-screen timer. Usage: !brb [time-minutes] [a brb reason]",
    action: (_names, attributes) => {
      const args = attributes.match(/(?<time>[0-9]+)? ?(?<message>.*)/)?.groups;
      return startTimer(
        parseInt(args?.time || "5") * 60,
        args?.message || "Be right back!"
      );
    },
    permission: "streamer",
  },
  "!back": {
    help: "Clears the current on-screen timer",
    action: clearTimer,
    permission: "streamer",
  },
  "!vanish": {
    help: "Timeouts the user for 1 second to clear their chat history",
    action: (_name, _attr, content) => void timeoutUser(content),
    cooldown: { scope: "user", periodSeconds: 30 },
  },
  "!vote": {
    help: "Start a new vote for yes or no",
    action: (_name, reason) => void startVoting(reason, "yesno"),
    permission: "mod",
  },
  "!rate": {
    help: "Start a new vote to rate something",
    action: (_name, reason) => void startVoting(reason, "tier"),
    permission: "mod",
  },
  "!stop": {
    help: "Stop the current vote for yes or no",
    action: () => void stopVoting,
    permission: "mod",
  },
  "!uptime": {
    help: "Stream uptime",
    action: (_name, _attr, content) => getUptime(content),
  },
  "!os": {
    help: "Operating system information",
    action: (_name, _attr, content) => getDebianVersion(content),
  },
  "!cpu": {
    help: "CPU information",
    action: (_name, _attr, content) => getCpuInfo(content),
  },
  "!kernel": {
    help: "Linux kernel version and platform information",
    action: (_name, _attr, content) => getKernelVersion(content),
  },
  "!meminfo": {
    help: "Current memory usage of the Node instance",
    action: (_name, _attr, content) => getMemoryUsage(content),
  },
  "!shoutout": {
    help: "Shoutout a Twitch user. Usage: !shoutout <username>",
    action: sendShoutout,
    permission: "mod",
  },
  "!quote": {
    help: "Returns a specific quote or a random one. Usage: !quote [number]",
    cooldown: { scope: "global", periodSeconds: 15 },
    action: (_name, attr) => getQuote(attr),
  },
  "!quote:": {
    help: "Adds a new quote. Usage: !quote: <quote>",
    action: (_name, attr) => setQuote(attr),
    permission: "mod",
  },
};

function listCommands(commands: Commands, content: PrivateMessage) {
  const commandNames = Object.keys(commands).filter((commandName) =>
    userHasPermissions(commandName, content, commands[commandName]?.permission)
  );
  return "The commands available to you are: " + commandNames.join(", ");
}

function helpCommand(attributes: string): string {
  const commandName = attributes
    .toLocaleLowerCase()
    .match(/^!?([-+a-z]+)/)?.[1];
  const command = commands["!" + commandName];

  if (!commandName) {
    return "Usage: !help <command name>, example: !help coffee";
  }

  if (!command) {
    return `Couldn't find the command: ${"!" + commandName}`;
  }

  return command.help;
}
