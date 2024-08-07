import type { PrivateMessage } from "ts-twitch-irc";
import type { Dispatch } from "../services/Dispatch.js";
import type { Helix } from "ts-twitch-helix";

export async function vanish(
  _: Dispatch,
  content: PrivateMessage,
  helix: Helix,
): Promise<void> {
  try {
    await helix.moderation.bans.post(
      { broadcasterId: process.env.BROADCASTER_ID },
      { userId: content.tags.user_id, duration: 1, reason: "Vanished" },
    );
  } catch (error) {
    console.error("vanish:", error);
  }
}
