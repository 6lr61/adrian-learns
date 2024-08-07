import type { Helix } from "ts-twitch-helix";
import type { PrivateMessage } from "ts-twitch-irc";
import type { Dispatch } from "../services/Dispatch.js";
import { getAttributes } from "./commands.js";

const DEFAULT_TIME = 5; // minutes
const DEFAULT_REMINDER_MESSAGE = "Default Timer";

export async function reminder(
  dispatcher: Dispatch,
  content: PrivateMessage,
  helix: Helix,
): Promise<void> {
  // [time in minutes] then a reminder message
  const things = getAttributes(content).match(
    /(?<time>[0-9]+)? ?(?<message>[\w ]*)/,
  )?.groups;

  if (!things) {
    dispatcher.error("I don't understand the input?", {
      messageId: content.tags.id,
    });
    return;
  }

  if (!things.time) {
    things.time = DEFAULT_TIME.toString();
  }

  if (parseInt(things.time) > 120 || things.time === "0") {
    dispatcher.error(
      "Please keep the time to under 2 hours and longer than 0 minutes.",
      {
        messageId: content.tags.id,
      },
    );
    return;
  }

  if (getAttributes(content).startsWith("-")) {
    dispatcher.error("Please stay positive!", {
      messageId: content.tags.id,
    }); // Kisamius 2023
    return;
  }

  const timeMillis = parseInt(things.time) * 60_000;

  setTimeout(
    () =>
      dispatcher.announce(
        `The timer for "${
          things.message || DEFAULT_REMINDER_MESSAGE
        }" ran out!`,
        "green",
      ),
    timeMillis,
  );

  dispatcher.say(
    `Setting a reminder for "${things.message}" in ${things.time} minutes!`,
  );
  return;
}
