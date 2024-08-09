import type { AnnouncementNotice } from "ts-twitch-irc/dist/types/userNotice.js";
import * as BetterTTV from "./betterttv";
import { makeTwitchEmoteList } from "./twitch/emotes.js";
import type { ChatEmote } from "./types.js";
import type { PrivateMessage } from "ts-twitch-irc";
import * as SevenTV from "./seventv";

export function makeEmoteList(
  message: PrivateMessage | AnnouncementNotice,
): ChatEmote[] {
  if (message.message === undefined) {
    return [];
  }

  const twitchEmotes: Record<string, ChatEmote> = makeTwitchEmoteList(message);
  const betterTTVEmotes: Record<string, ChatEmote> =
    BetterTTV.Emotes.instance.makeEmoteList(message.message);
  const sevenTVEmotes: Record<string, ChatEmote> =
    SevenTV.Emotes.instance.makeEmoteList(message.message);

  const uniqueEmotes = {
    ...twitchEmotes,
    ...betterTTVEmotes,
    ...sevenTVEmotes,
  };

  const emotes = Object.values(uniqueEmotes).sort((a, b) => a.start - b.start);

  return emotes;
}
