import {
  TwitchChannelName,
  TwitchMessageID,
  TwitchUserID,
  TwitchUserName,
  UnixTimeStampMillis,
} from "./twitchTags.js";

export interface ClearChatCommand {
  type: "clearCommand";
  clear_type: "chat";
  channel: TwitchChannelName;
  user?: TwitchUserName;
  tags: ClearChatTags;
}

export interface ClearChatTags {
  /** Inlcuded if the user was put in a timeout, missing for bans */
  ban_duration?: string;
  room_id: string;
  /** The user who was banned or put in timeout */
  target_user_id?: TwitchUserID;
  tmi_sent_ts: UnixTimeStampMillis;
}

export interface ClearMessageCommand {
  type: "clearCommand";
  clear_type: "message";
  channel: TwitchChannelName;
  message: string;
  tags: ClearMessageTags;
}

export interface ClearMessageTags {
  /** The user who sent the message */
  login: TwitchUserName;
  room_id?: string;
  target_msg_id: TwitchMessageID;
  tmi_sent_ts: UnixTimeStampMillis;
}
