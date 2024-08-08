import type { PrivateMessage } from "ts-twitch-irc";
import type { ChatEmote } from "../types";
import type { AnnouncementNotice } from "ts-twitch-irc/dist/types/userNotice";

export function makeTwitchEmoteList(
  message: PrivateMessage | AnnouncementNotice
): Record<string, ChatEmote> {
  const twitchEmotes: Record<string, ChatEmote> = {}; // Emote array

  if (!message.tags.emotes || !message.message) {
    return {};
  }

  const emotesTags = message.tags.emotes.split("/");
  // <emote ID>:<start position>-<end position>
  // actually, it's like this: 1902:12-16/354:0-4,18-22/25:6-10
  for (const entry of emotesTags) {
    const [id, positions] = entry.split(":");

    if (!positions) {
      continue;
    }

    for (const position of positions?.split(",") || []) {
      const [start, stop] = position.split("-");

      if (!start || !stop) {
        continue;
      }

      const emoteName = message.message.slice(Number(start), Number(stop) + 1);
      twitchEmotes[emoteName + start + "_" + stop] = {
        urlSmall: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`,
        urlBig: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/3.0`,
        start: Number.parseInt(start),
        stop: Number.parseInt(stop),
        modifier: "",
      };
    }
  }

  return twitchEmotes;
}
