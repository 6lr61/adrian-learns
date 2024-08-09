import type { UserNotice } from "ts-twitch-irc";

export interface WebViewMessage {
  type: "message";
  displayName: string;
  username: string;
  userId: string;
  badges: string[] | undefined;
  color: string | undefined;
  profilePicture: string | undefined;
  message: string;
  emotes: ChatEmote[];
  pronoun?: string;
  cursive: boolean;
  firstMessage: boolean;
  highlighted: boolean;
  messageId: string;
  hightlightColor: "BLUE" | "GREEN" | "ORANGE" | "PURPLE" | "PRIMARY";
  replyingToDisplayname?: string;
  replyingToUsername?: string;
  replyingToMessage?: string;
}

export interface WebViewAnnouncementMessage {
  type: "announcement";
  name: string;
  username: string;
  userId: string;
  badges: string[] | undefined;
  color: string | undefined;
  message: string;
  emotes: ChatEmote[];
  cursive: boolean;
  firstMessage: boolean;
  highlighted: boolean;
  messageId: string;
}

export interface ChatEmote {
  start: number;
  stop: number;
  urlSmall: string;
  urlBig: string;
  modifier: string;
}

export type WebViewCommand = DeleteCommand | ClearCommand;

export interface DeleteCommand {
  type: "command";
  command: "delete";
  messageId: string;
}

export interface ClearCommand {
  type: "command";
  command: "clear";
  userId?: string;
}

export type WebViewNotice = WebViewRaidNotice;

export interface WebViewAnnouncementNotice {
  type: "notice";
  notice_type: "announcement";
  name: string;
  message: string;
  color: string; // should this be a string literal union?
}

export interface WebViewRaidNotice {
  type: "notice";
  notice_type: UserNotice["notice_type"];
  raiderName: string;
  raiderPicture: string;
  numberOfRaiders: number;
}

export type BTTVModifer = "h!" | "v!" | "w!" | "r!" | "l!" | "z!" | "c!";
