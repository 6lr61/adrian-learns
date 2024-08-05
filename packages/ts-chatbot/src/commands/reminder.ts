import { sendChatAnnouncement } from "../helix.js";

const DEFAULT_TIME = 5; // minutes
const DEFAULT_REMINDER_MESSAGE = "Default Timer";

export function setReminder(attributes: string): string {
  // [time in minutes] then a reminder message
  const things = attributes.match(
    /(?<time>[0-9]+)? ?(?<message>[\w ]*)/
  )?.groups;

  if (!things) {
    return "I don't understand the input?";
  }

  if (!things.time) {
    // We should use a default time
    things.time = DEFAULT_TIME.toString();
  }

  if (parseInt(things.time) > 120 || things.time === "0") {
    return "Please keep the time to under 2 hours and greater than 0 minutes.";
  }

  if (attributes.startsWith("-")) {
    return "Please stay positive!"; // Kisamius 2023
  }

  const timeMillis = parseInt(things.time) * 60_000;

  setTimeout(
    () =>
      sendChatAnnouncement(
        `The timer for "${
          things.message || DEFAULT_REMINDER_MESSAGE
        }" ran out!`,
        "green"
      ),
    timeMillis
  );

  return `Setting a reminder for "${things.message}" in ${things.time} minutes!`;
}
