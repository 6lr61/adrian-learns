import type { PrivateMessage } from "ts-twitch-irc";
import { runCommand } from "./runCommand.js";
import type { Dispatch } from "../../services/Dispatch.js";
import type { Helix } from "ts-twitch-helix";

export function parseCommand(
  dispatcher: Dispatch,
  helix: Helix,
  messageContent: PrivateMessage,
) {
  // TODO: Move the logging out of this function
  console.log(`${messageContent.username}: ${messageContent.message}`);

  if (messageContent.message.startsWith("!")) {
    void runCommand(dispatcher, helix, messageContent);
  }
}
