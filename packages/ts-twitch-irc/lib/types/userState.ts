import { TwitchEmoteSet, TwitchMessageID, TwitchTags } from "./twitchTags.js";

export interface UserState {
  tags?: UserStateTags;
}

interface UserStateTags extends TwitchTags {
  emote_sets: TwitchEmoteSet;
  id?: TwitchMessageID; // Only set if a privmsg was sent
}
