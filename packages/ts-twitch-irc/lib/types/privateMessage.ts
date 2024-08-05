import {
  TwitchChannelName,
  TwitchDisplayName,
  TwitchEmotesList,
  TwitchMessageID,
  TwitchTagBoolean,
  TwitchTags,
  TwitchUserID,
  TwitchUserName,
} from "./twitchTags.js";

// Prototype:
// :ronni!ronni@ronni.tmi.twitch.tv PRIVMSG #ronni :Kappa Keepo Kappa

export interface PrivateMessage {
  type: "privateMessage";
  username: TwitchUserName;
  identity: TwitchUserName;
  hostname: TwitchUserName;
  channel: TwitchChannelName;
  message: string;
  tags: PrivateMessageTags;
}

export interface PrivateMessageTags extends TwitchTags {
  bits?: number;
  emotes: TwitchEmotesList;
  first_msg: TwitchTagBoolean;
  id: TwitchMessageID;
  msg_id?: string; // only set for highlighted messages?
  pinned_chat_paid_amount?: number;
  pinned_chat_paid_currency?: string; // ISO 4217 currency code
  pinned_chat_paid_exponent?: number; // Number of decimal points
  pinned_chat_paid_level?:
    | "ONE"
    | "TWO"
    | "THREE"
    | "FOUR"
    | "FIVE"
    | "SIX"
    | "SEVEN"
    | "EIGHT"
    | "NINE"
    | "TEN";
  pinned_chat_paid_is_system_message?: TwitchTagBoolean;
  reply_parent_msg_id?: TwitchMessageID;
  reply_parent_user_id?: TwitchUserID;
  reply_parent_user_login?: TwitchUserName;
  reply_parent_display_name?: TwitchDisplayName;
  reply_parent_msg_body?: string;
  reply_thread_parent_msg_id?: TwitchMessageID;
  reply_thread_parent_user_login?: TwitchUserName;
  room_id: string;
  tmi_sent_ts: number; // Unix timestamp
  user_id: TwitchUserID;
  vip: TwitchTagBoolean;
}
