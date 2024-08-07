import { makeACupOfCoffee } from "./coffee.js";
import { startTimer, clearTimer } from "../services/websocket.js";
import { readCurrentFont, readCurrentTheme } from "./vscode.js";
import { setReminder } from "./reminder.js";
import { hasPermission } from "./utils/hasPermission.js";
import { type PrivateMessage } from "ts-twitch-irc";
import { alias } from "./alias.js";
import { randomInt } from "node:crypto";
import type { Dispatch } from "../services/Dispatch.js";
import type { Helix } from "ts-twitch-helix";
import { shoutout } from "./shoutout.js";
import { uptime } from "./uptime.js";
import { followage } from "./followage.js";
import { vanish } from "./vanish.js";

export type Commands = Record<string, CommandDeclaration>;

export interface CommandDeclaration {
  readonly cooldown?: {
    scope: "user" | "global";
    periodSeconds: number; // seconds
  };
  readonly permission?: "user" | "mod" | "vip" | "streamer";
  readonly help: string;
  readonly action: (
    dispatcher: Dispatch,
    content: PrivateMessage,
    helix: Helix,
  ) => void | Promise<void>;
}

export function findNames(
  messageContent: PrivateMessage,
): string[] | undefined {
  // Try to match display names as well as Chinese, Japanese and Korean localized ones
  const matches = messageContent.message.match(
    /(?<= *@?)[\w]+|[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\u3131-\uD79D]+/g,
  );

  if (matches) {
    return matches;
  }
}

export function getName(messageContent: PrivateMessage): string {
  return messageContent.tags?.display_name || messageContent.username;
}

export function getAttributes({ message }: PrivateMessage): string {
  const index = message.indexOf(" ");
  return index !== -1 ? message.slice(index + 1) : "";
}

export const commands: Commands = {
  "!alias": {
    help: "Usage: !alias <get|remove|set> <!alias> [!command]",
    action: alias,
    permission: "mod",
  },
  "!commands": {
    help: "Prints the commands available to the chatter",
    action: (dispatcher, content) =>
      dispatcher.whisper(content.tags.user_id, listCommands(commands, content)),
    cooldown: { scope: "user", periodSeconds: 30 },
  },
  "!theme": {
    help: "The current VSCode Theme",
    action: async (dispatcher) =>
      dispatcher.say(
        `Adrian is currently using the ${await readCurrentTheme()} theme in VSCode!`,
      ),
    cooldown: { scope: "global", periodSeconds: 5 },
  },
  "!font": {
    help: "The current font used in VSCode",
    action: async (dispatcher) =>
      dispatcher.say(
        `Adrian is currently using the ${await readCurrentFont()} font in VSCode!`,
      ),
    cooldown: { scope: "global", periodSeconds: 5 },
  },
  "!coffee": {
    help: "Makes you a random cup of coffee",
    action: makeACupOfCoffee,
    cooldown: { scope: "user", periodSeconds: 30 },
  },
  "!reminder": {
    help: "Sets a reminder. Usage: !reminder [time in minutes] A thing to be reminded about",
    action: (dispatcher, content) =>
      dispatcher.reply(content.tags.id, setReminder(getAttributes(content))),
    permission: "mod",
  },
  "!setup": {
    help: "The specifications for Adrian's computer",
    action: (dispatcher, content) =>
      dispatcher.reply(
        content.tags.id,
        `It's a potato, ${getName(content)} mericCat`,
      ),
  },
  "!cursed": {
    help: "Gives a percentage for how cursed the chatter themself are",
    action: (dispatcher, content) =>
      dispatcher.say(
        `${getName(content)} is ${randomInt(100 + 1)}% cursed! confusedCat`,
      ),
    cooldown: { scope: "user", periodSeconds: 15 },
  },
  "!athano": {
    help: "An advanced AI model of Athano that gives a suitable reply in every context",
    action: (dispatcher) =>
      dispatcher.say(
        "The answer is of course: It's nuanced and contextual CatNerd",
      ),
  },
  "!tkap": {
    help: "An advanced AI model of Tkap1 that gives a suitable reply in every context",
    action: (dispatcher) => dispatcher.say("That's a problem!"),
  },
  "!followage": {
    help: "Responds with the number of days someone has been following. Usage: !followage [username]",
    action: followage,
  },
  "!hello": {
    help: "Replies to a greeting",
    action: (dispatcher, content) =>
      dispatcher.reply(content.tags.id, `Hello, ${getName(content)}! catKISS`),
  },
  "!morning": {
    help: "Replies to your good morning greeting",
    action: (dispatcher, content) =>
      dispatcher.reply(
        content.tags.id,
        `Good morning, ${getName(content)} catYawn`,
      ),
  },
  "!night": {
    help: "Replies to your good night wishes",
    action: (dispatcher, content) =>
      dispatcher.reply(
        content.tags.id,
        `Good night and sleep tight, ${name}! catTuck`,
      ),
  },
  "!lurk": {
    help: "Replies to your lurk",
    action: (dispatcher, content) =>
      dispatcher.reply(
        content.tags.id,
        `Thank you for lurking, ${getName(content)}! catLurk`,
      ),
  },
  "!unlurk": {
    help: "Replies to your unlurk",
    action: (dispatcher, content) =>
      dispatcher.reply(
        content.tags.id,
        `Welcome back ${getName(content)}! catArrive`,
      ),
  },
  "!right": {
    help: "Acknowledges that you're right",
    action: (dispatcher, content) =>
      dispatcher.say(`${getName(content)} is right, you know! CatOk`),
    permission: "vip",
  },
  "!left": {
    help: "Agrees that the conversation is over",
    action: (dispatcher, content) =>
      dispatcher.say(
        `I agree @${getName(content)}, there's not much left to say baseg`,
      ),
    permission: "mod",
  },
  "!help": {
    help: "Prints out a help message for a given command. Usage: !help command",
    action: helpCommand,
  },
  "!hug": {
    help: "Gives chat a hug or let's you hug someone else. Usage: !hug [username]",
    action: (dispatcher, content) => {
      const person = findNames(content)?.at(0);
      const name = getName(content);

      dispatcher.say(
        person
          ? `${name} gives ${person} a hug! CatAHomie`
          : `${name} gives chat a hug! catKISS`,
      );
    },
  },
  "!brb": {
    help: "Sets and starts and on-screen timer. Usage: !brb [time-minutes] [a brb reason]",
    action: (_, content) => {
      const args = getAttributes(content).match(
        /(?<time>[0-9]+)? ?(?<message>.*)/,
      )?.groups;
      return startTimer(
        parseInt(args?.time || "5") * 60,
        args?.message || "Be right back!",
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
    action: vanish,
    cooldown: { scope: "user", periodSeconds: 30 },
  },
  "!uptime": {
    help: "Stream uptime",
    action: uptime,
  },
  "!shoutout": {
    help: "Shoutout a Twitch user. Usage: !shoutout <username>",
    action: shoutout,
    permission: "mod",
  },
  "!announce": {
    help: "Make an announcement in chat. Usage: !announce <message>",
    action: (dispatcher, content) =>
      dispatcher.announce(getAttributes(content)),
    permission: "mod",
  },
};

function listCommands(commands: Commands, content: PrivateMessage) {
  const commandNames = Object.keys(commands).filter((commandName) =>
    hasPermission(commandName, content, commands[commandName]?.permission),
  );
  return "The commands available to you are: " + commandNames.join(", ");
}

function helpCommand(dispatcher: Dispatch, content: PrivateMessage): void {
  const commandName = getAttributes(content)
    .toLocaleLowerCase()
    .match(/^!?([-+a-z]+)/)?.[1];
  const command = commands["!" + commandName];

  if (!commandName) {
    dispatcher.error("Usage: !help <command name>, example: !help coffee");
    return;
  }

  if (!command) {
    dispatcher.error(`Couldn't find the command: ${"!" + commandName}`);
    return;
  }

  dispatcher.say(command.help);
}
