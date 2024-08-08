export enum EmoteSetFlag {
  None = 0,
  /** Set is immutable, meaning it cannot be modified */
  Immutable = 1,
  /** Set is privileged, meaning it can only be modified by its owner */
  Privileged = 1 << 1,
  /** Set is personal, meaning its content can be used globally and it is subject to stricter content moderation rules */
  Personal = 1 << 2,
  /** Set is commercial, meaning it is sold and subject to extra rules on content ownership */
  Commercial = 1 << 3,
}

export enum ActiveEmoteFlag {
  None = 0,
  /** Emote is zero-width*/
  ZeroWidth = 1,
  /** Overrides Twitch Global emotes with the same name*/
  OverrideTwitchGlobal = 1 << 16,
  /** Overrides Twitch Subscriber emotes with the same name*/
  OverrideTwitchSubscriber = 1 << 17,
  /** Overrides BetterTTV emotes with the same name*/
  OverrideBetterTTV = 1 << 18,
}

export enum EmoteFlag {
  None = 0,
  /** The emote is private and can only be accessed by its owner, editors and moderators */
  Private = 1,
  /** The emote was verified to be an original creation by the uploader */
  Authentic = 1 << 1,
  /** The emote is recommended to be enabled as Zero-Width */
  ZeroWidth = 1 << 8,
  /** Sexually Suggesive */
  ContentSexual = 1 << 16,
  /** Rapid flashing */
  ContentEpilepsy = 1 << 17,
  /** Edgy or distasteful, may be offensive to some users */
  ContentEdgy = 1 << 18,
  /** Not allowed specifically on the Twitch platform */
  ContentTwitchDisallowed = 1 << 24,
}

export const EmoteFlagDescriptions = {
  [EmoteFlag.Private]: "PRIVATE",
  [EmoteFlag.ZeroWidth]: "ZERO_WIDTH",
  [EmoteFlag.ContentSexual]: "SEXUALLY_SUGGESTIVE",
  [EmoteFlag.ContentEpilepsy]: "EPILEPSY",
  [EmoteFlag.ContentEdgy]: "EDGY_OR_DISASTEFUL",
  [EmoteFlag.ContentTwitchDisallowed]: "TWITCH_DISALLOWED",
};

export enum EmoteLifecycle {
  Deleted = -1,
  Pending,
  Processing,
  Disabled,
  Live,
  Failed = -2,
}
