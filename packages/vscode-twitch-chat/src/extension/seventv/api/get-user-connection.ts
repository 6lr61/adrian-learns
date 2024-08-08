import type { EmoteSet, UserPartial } from "../types";

interface Response {
  id?: string;
  platform: "TWITCH" | "YOUTUBE" | "DISCORD";
  username: string;
  display_name: string;
  linked_at: number;
  emote_capacity: number;
  emote_set_id?: null; // no longer in use?
  emote_set?: EmoteSet;
  user: UserPartial;
}

export async function getUserConnection(
  connectionId: string,
  connectionPlatform = "twitch"
): Promise<EmoteSet | undefined> {
  const url = `https://7tv.io/v3/users/${connectionPlatform}/${connectionId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `7TV: Bad response: ${response.status}: ${response.statusText}`
      );
    }

    const data = (await response.json()) as Response;
    console.debug("7TV: Got User Connect Response:", data);

    if (!data.emote_set?.id) {
      console.error("7TV: No emote ID in the user connection response?");
      return;
    }

    console.debug(`7TV: Reading in emote set: ${data.emote_set.name}`);

    if (!data.emote_set.emotes || data.emote_set.emotes.length === 0) {
      console.debug("7TV: Emote set is empty?");
    }

    return data.emote_set;
  } catch (error) {
    console.error("7TV: User Connection GET request failed:", error);
    return;
  }
}
