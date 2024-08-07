import type { Helix } from "ts-twitch-helix";
import type { PrivateMessage } from "ts-twitch-irc";
import type { Dispatch } from "../services/Dispatch.js";
import { getAttributes } from "./commands.js";

export async function shoutout(
  dispatcher: Dispatch,
  content: PrivateMessage,
  helix: Helix,
): Promise<void> {
  try {
    const name = getAttributes(content).trim().split(" ").at(0);

    if (!name) {
      dispatcher.error("Couldn't find a username?", {
        messageId: content.tags.id,
      });
      return;
    }

    const userData = (await helix.users.get({ login: name })).at(0);

    if (!userData) {
      dispatcher.error("Couldn't look-up the user.", {
        messageId: content.tags.id,
      });
      return;
    }

    const channelData = (
      await helix.channels.get({
        broadcasterId: userData.id,
      })
    ).at(0);

    if (!channelData) {
      dispatcher.error("Couldn't look-up the channel.", {
        messageId: content.tags.id,
      });
      return;
    }

    dispatcher.announce(
      `🚨 Checkout ${channelData.broadcaster_name} 🚨, they were last streaming ${channelData.game_name} 🤯 and their stream title was 👉 ${channelData.title}`,
    );

    helix.chat.shoutouts.post({
      fromBroadcasterId: process.env.BROADCASTER_ID,
      toBroadcasterId: userData.id,
    });
  } catch (error) {
    console.error(error);
  }
}
