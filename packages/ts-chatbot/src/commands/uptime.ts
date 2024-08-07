import type { PrivateMessage } from "ts-twitch-irc";
import type { Dispatch } from "../services/Dispatch.js";
import type { Helix } from "ts-twitch-helix";

// FIXME: Make it possible to set, or infer it from something
const name = "Adrian";

export async function uptime(
  dispatcher: Dispatch,
  content: PrivateMessage,
  helix: Helix,
): Promise<void> {
  const streamData = (
    await helix.streams.get({ userId: process.env.BROADCASTER_ID })
  ).data.at(0);

  if (!streamData) {
    dispatcher.reply(content.tags.id, `${name} is currently not live?`);
    return;
  }

  const passedTime = new Date(
    Date.now() - new Date(streamData.started_at).getTime(),
  );
  const hours = passedTime.getHours();
  const minutes = passedTime.getMinutes();
  const hoursString = `${hours} hour` + (hours === 1 ? "" : "s");
  const minutesString = `${minutes} minute` + (minutes === 1 ? "" : "s");

  dispatcher.reply(
    content.tags.id,
    `${name} has been live for ` +
      (hours > 0 ? hoursString + " and " : "") +
      minutesString,
  );
  return;
}
