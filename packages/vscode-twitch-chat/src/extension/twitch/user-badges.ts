import type { Token } from "ts-twitch-irc";

interface ValidResponse {
  data: DataEntry[];
}

interface DataEntry {
  set_id: string;
  versions: BadgeData[];
}

interface BadgeData {
  id: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  title: string;
  description: string;
  click_action: string | null;
  click_url: string | null;
}

export const twitchBadges: Record<string, string> = {};

export async function downloadBadges(token: Token): Promise<void> {
  const globalBadges = await downloadGlobalBadges(token);
  const channelBadges = await downloadChannelBadges(token);

  if (!globalBadges || !channelBadges) {
    console.error("Badges: Some badges are missing!");
    return;
  }

  // At this point we've downloaded all the badges and their corresponding image links,
  // but they're in two separate objects and not easiy to use for our purposes.

  // The response -> An object with { subscriber/1: https//.... }

  // The global badges
  for (const badgeData of globalBadges.data) {
    const name = badgeData.set_id;

    for (const badgeVersion of badgeData.versions) {
      const version = badgeVersion.id;
      const imageUrl = badgeVersion.image_url_1x;

      twitchBadges[`${name}/${version}`] = imageUrl;
    }
  }

  // The channel badges
  for (const badgeData of channelBadges.data) {
    const name = badgeData.set_id;

    for (const badgeVersion of badgeData.versions) {
      const version = badgeVersion.id;
      const imageUrl = badgeVersion.image_url_1x;

      twitchBadges[`${name}/${version}`] = imageUrl;
    }
  }
}

async function downloadGlobalBadges(
  token: Token
): Promise<ValidResponse | undefined> {
  const response = await fetch(
    "https://api.twitch.tv/helix/chat/badges/global",
    {
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Client-Id": token.client_id,
      },
    }
  );

  if (!response.ok) {
    console.error(
      "Badges: Failed to retrive global badges!",
      response.status,
      response.statusText
    );
    return;
  }

  return (await response.json()) as Promise<ValidResponse>;
}

async function downloadChannelBadges(
  token: Token
): Promise<ValidResponse | undefined> {
  // Download the channel specific subscriber and bits badges
  const url = new URL("https://api.twitch.tv/helix/chat/badges");
  url.searchParams.set("broadcaster_id", token.user_id); // TODO: Don't assume the token holder is the broadcaster

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.token}`,
      "Client-Id": token.client_id,
    },
  });

  if (!response.ok) {
    console.error(
      "Badges: Failed to retrive channel badges!",
      response.status,
      response.statusText
    );
    return;
  }

  return (await response.json()) as Promise<ValidResponse>;
}
