import path from "node:path";
import type { Emote } from "./types";
import type { ChatEmote } from "../types";

const BTTV_MODIFIER = new Set(["h!", "v!", "w!", "r!", "l!", "z!", "c!"]);

interface BTTVUserResponse {
  id: string;
  bots: string[];
  avatar: string;
  channelEmotes: Emote[];
  sharedEmotes: Emote[];
}

interface EmoteEntry {
  id: string;
  urlSmall: string;
  urlBig: string;
}

export class Emotes {
  private emotes: Map<string, EmoteEntry>;
  private static _instance: Emotes | undefined;

  private constructor() {
    this.emotes = new Map<string, EmoteEntry>();
  }

  static get instance(): Emotes {
    if (!Emotes._instance) {
      Emotes._instance = new Emotes();
    }

    return Emotes._instance;
  }

  add(emote: Emote) {
    this.emotes.set(emote.code, {
      id: emote.id,
      urlSmall: `https://cdn.betterttv.net/emote/${emote.id}/1x.${emote.imageType}`,
      urlBig: `https://cdn.betterttv.net/emote/${emote.id}/3x.${emote.imageType}`,
    });
  }

  remove(id: string) {
    for (const [code, emote] of this.emotes.entries()) {
      if (emote.id === id) {
        this.emotes.delete(code);
        break;
      }
    }
  }

  rename(id: string, code: string) {
    for (const [emoteCode, emote] of this.emotes.entries()) {
      if (emote.id !== id) {
        continue;
      }

      if (emoteCode === code) {
        console.debug("Emotes.rename: No need to update emote entry");
        break;
      }

      const fileEnding = path.extname(emote.urlSmall); // .png .gif etc

      this.emotes.set(code, {
        id: id,
        urlSmall: `https://cdn.betterttv.net/emote/${id}/1x${fileEnding}`,
        urlBig: `https://cdn.betterttv.net/emote/${id}/3x${fileEnding}`,
      });

      this.emotes.delete(emoteCode);
      break;
    }
  }

  async init(userId: string): Promise<string[] | undefined> {
    async function getFrom<T>(endPoint: string): Promise<T | undefined> {
      const BTTV_API = "https://api.betterttv.net/3";

      try {
        const response = await fetch(`${BTTV_API}${endPoint}`);

        if (!response.ok) {
          console.error(
            "BetterTTV.Emotes.init: Bad HTTP response:",
            response.status,
            response.statusText,
          );
          return;
        }

        return (await response.json()) as T;
      } catch (error) {
        console.error(
          "BetterTTV.Emotes.init: Threw while fetching data",
          error,
        );
      }
    }

    const globalEmotes = await getFrom<Emote[]>("/cached/emotes/global");
    if (globalEmotes) {
      for (const emote of globalEmotes) {
        this.add(emote);
      }
    }

    const userData = await getFrom<BTTVUserResponse>(
      `/cached/users/twitch/${userId}`,
    );
    for (const emote of userData?.channelEmotes || []) {
      this.add(emote);
    }
    for (const emote of userData?.sharedEmotes || []) {
      this.add(emote);
    }

    return userData?.bots;
  }

  makeEmoteList(message: string): Record<string, ChatEmote> {
    const delimiter = " ";
    const emotes: Record<string, ChatEmote> = {};
    const words = message
      .replaceAll(/(?<!(?:^|\s)[a-z])[^\w"':]/g, " ")
      .split(delimiter);

    for (const word of words) {
      if (this.emotes.has(word)) {
        const emoteName = word;
        const emote = this.emotes.get(emoteName);
        const marker = "#".repeat(emoteName.length);
        const message = words
          .map((word) => (word === emoteName ? marker : word))
          .join(delimiter);

        let position = message.indexOf(marker);

        while (position !== -1) {
          if (emote === undefined) {
            continue;
          }

          emotes[
            emoteName + position + "_" + (position + emoteName.length - 1)
          ] = {
            urlSmall: emote.urlSmall,
            urlBig: emote.urlBig,
            start: position,
            stop: position + emoteName.length - 1,
            modifier: BTTV_MODIFIER.has(emoteName) ? emoteName : "",
          };

          position = message.indexOf(marker, position + emoteName.length);
        }
      }
    }

    return emotes;
  }
}
