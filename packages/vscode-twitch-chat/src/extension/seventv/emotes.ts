import type { ChatEmote } from "../types";
import { EmoteFlag, EmoteLifecycle } from "./flags";
import type { EmoteModel } from "./types";

interface Emote {
  id: string;
  urlSmall: string;
  urlBig: string;
}

export class Emotes {
  private emotes: Map<string, Emote>;
  private static singleton: Emotes;

  private constructor() {
    this.emotes = new Map<string, Emote>();
  }

  public static get instance(): Emotes {
    if (!Emotes.singleton) {
      Emotes.singleton = new Emotes();
    }
    return Emotes.singleton;
  }

  public addEmotes(emotes: EmoteModel[]): void {
    if (!Array.isArray(emotes)) {
      console.error("SevenTV.Emotes.addEmotes: Emote set is missing emotes");
      return;
    }

    for (const emote of emotes) {
      this.addEmote(emote);
    }
  }

  public addEmote(emote: EmoteModel): void {
    if (!emote.data) {
      console.log("SevenTV.Emotes.addEmote: Emote is missing data");
      return;
    }

    if (
      emote.data.lifecycle !== EmoteLifecycle.Live ||
      emote.data.flags & EmoteFlag.ContentEdgy ||
      emote.data.flags & EmoteFlag.ContentEpilepsy ||
      emote.data.flags & EmoteFlag.ContentSexual ||
      emote.data.flags & EmoteFlag.ContentTwitchDisallowed
    ) {
      console.error(
        "SevenTV.Emotes.addEmote: Inappropriate or unlisted emote, not adding",
        emote
      );
      return;
    }

    // TODO: This string might be malformed?
    const url = `https:${emote.data?.host.url}`;

    // TODO: Make use of the file information in the emote set
    this.emotes.set(emote.name, {
      id: emote.id,
      urlSmall: `${url}/1x.webp`,
      urlBig: `${url}/4x.webp`,
    });

    console.debug("SevenTV.Emotes.addEmote: Added emote", emote.name);
  }

  public hasEmote(name: string): boolean {
    return this.emotes.has(name);
  }

  public getEmote(name: string): Emote | undefined {
    return this.emotes.get(name);
  }

  public getEmoteList(): string[] {
    return [...this.emotes.keys()];
  }

  public deleteEmote(name: string): boolean {
    return this.emotes.delete(name);
  }

  makeEmoteList(message: string): Record<string, ChatEmote> {
    const delimiter = " ";
    const emotesList: Record<string, ChatEmote> = {};
    const words = message
      .replaceAll(/(?<!(?:^|\s)[a-z])[^\w"':]/g, " ")
      .split(delimiter);

    for (const word of words) {
      if (this.hasEmote(word)) {
        const emoteName = word;
        const marker = "#".repeat(emoteName.length);
        const message = words
          .map((word) => (word === emoteName ? marker : word))
          .join(delimiter);

        let position = message.indexOf(marker);

        while (position !== -1) {
          emotesList[
            emoteName + position + "_" + (position + emoteName.length - 1)
          ] = {
            urlSmall: this.getEmote(emoteName)?.urlSmall || "",
            urlBig: this.getEmote(emoteName)?.urlBig || "",
            start: position,
            stop: position + emoteName.length - 1,
            modifier: "",
          };

          position = message.indexOf(marker, position + emoteName.length);
        }
      }
    }

    return emotesList;
  }
}
