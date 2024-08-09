type TwitchBadgeInfo = string;

type TwitchBadges = string;

export type UnixTimeStampMillis = string;

export type TwitchTagBoolean = "0" | "1";

export type TwitchTagNumber = string;

// The mod user type is undocumented
type TwitchTagUserType = "" | "admin" | "global_mod" | "staff" | "mod";

export type TwitchUserID = string;

/** The channel ID is the same as the user of the broadcaster */
export type TwitchChannelID = TwitchUserID;

export type TwitchChannelName = string;

export type TwitchDisplayName = string;

export type TwitchUserName = string;

export type TwitchEmoteSet = string;

export type TwitchEmotesList = string;

/** UUID for the message */
export type TwitchMessageID = string;

export interface TwitchTags {
  badge_info: TwitchBadgeInfo | undefined;
  badges: TwitchBadges | undefined;
  color: string | undefined; // #RRGGBB hex
  display_name: TwitchDisplayName;
  mod: TwitchTagBoolean;
  subscriber: TwitchTagBoolean;
  turbo: TwitchTagBoolean;
  user_type: TwitchTagUserType;
}
