import type {
  TwitchDisplayName,
  TwitchTagBoolean,
  TwitchTags,
  TwitchUserName,
  TwitchUserID,
  TwitchEmotesList,
  TwitchMessageID,
  UnixTimeStampMillis,
  TwitchTagNumber,
} from "./twitchTags.js";

// Prototype:
// :tmi.twitch.tv USERNOTICE #<channel> :[<message>]

export type UserNotice =
  | AnnouncementNotice
  | RaidNotice
  | SubscriptionNotice
  | RitualNotice;

export type UserNoticeTags =
  | AnnouncementNoticeTags
  | SubscriptionNoticeTags
  | SubgiftNoticeTags
  | SubMysteryGiftNoticeTags
  | SubGiftUpgradeNoticeTags
  | RaidNoticeTags
  | RitualNoticeTags;

export interface UserNoticeCommon {
  type: "userNotice";
  channel: string;
  message?: string;
}

export interface RaidNotice extends UserNoticeCommon {
  notice_type: "raid";
  tags: RaidNoticeTags;
}

export interface SubscriptionNotice extends UserNoticeCommon {
  notice_type: "subscription";
  tags:
    | SubscriptionNoticeTags
    | SubgiftNoticeTags
    | SubMysteryGiftNoticeTags
    | SubGiftUpgradeNoticeTags;
}

export interface RitualNotice extends UserNoticeCommon {
  notice_type: "ritual";
  tags: RitualNoticeTags;
}

export interface AnnouncementNotice extends UserNoticeCommon {
  notice_type: "announcement";
  tags: AnnouncementNoticeTags;
}

interface UserNoticeCommonTags extends TwitchTags {
  emotes: TwitchEmotesList;
  id: TwitchMessageID;
  login: TwitchUserName;
  room_id: string;
  system_msg: string;
  tmi_sent_ts: UnixTimeStampMillis;
  user_id: string;
  vip: TwitchTagBoolean;
}

interface RaidNoticeTags extends UserNoticeCommonTags {
  msg_id: "raid";
  msg_param_displayName: TwitchDisplayName;
  msg_param_login: TwitchUserName;
  msg_param_viewerCount: string;
  /** This is undocumented! */
  msg_param_profileImageURL: string;
}

interface SubscriptionNoticeTags extends UserNoticeCommonTags {
  msg_id: "sub" | "resub";
  msg_param_cumulative_months: TwitchTagNumber;
  msg_param_should_share_streak: TwitchTagBoolean;
  msg_param_streak_months: TwitchTagNumber;
  msg_param_sub_plan: TwitchSubscriptionPlan;
  msg_param_sub_plan_name: string;
}

interface SubgiftNoticeTags extends UserNoticeCommonTags {
  msg_id: "subgift";
  msg_param_months: TwitchTagNumber;
  msg_param_recipient_display_name: TwitchDisplayName;
  msg_param_recipient_id: TwitchUserID;
  msg_param_recipient_user_name: TwitchUserName;
  msg_param_sub_plan: TwitchSubscriptionPlan;
  msg_param_sub_plan_name: string;
  msg_param_gift_months: TwitchTagNumber;
}

/* This the tags for this notification are not documented? */
interface SubMysteryGiftNoticeTags extends UserNoticeCommonTags {
  msg_id: "submysterygift";
  msg_param_mass_gift_count: TwitchTagNumber;
  msg_param_origin_id: string; // No clue!
  msg_param_sender_count: TwitchTagNumber;
  msg_param_sub_plan: TwitchSubscriptionPlan;
}

interface SubGiftUpgradeNoticeTags extends UserNoticeCommonTags {
  msg_id: "anongiftpaidupgrade" | "giftpaidupgrade";
  msg_param_promo_gift_total: TwitchTagNumber;
  msg_param_promo_name: string;
  msg_param_sender_login?: TwitchUserName;
  msg_param_sender_name?: TwitchDisplayName;
}

type TwitchSubscriptionPlan = "Prime" | "1000" | "2000" | "3000";

interface RitualNoticeTags extends UserNoticeCommonTags {
  msg_id: "ritual";
  msg_param_ritual_name: "new_chatter";
}

/** This is not documented, at all */
interface AnnouncementNoticeTags extends UserNoticeCommonTags {
  msg_id: "announcement";
  login: TwitchUserName;
  flags: string | undefined; // Don't know the use of this
  msg_param_color: "BLUE" | "GREEN" | "ORANGE" | "PURPLE" | "PRIMARY";
}
