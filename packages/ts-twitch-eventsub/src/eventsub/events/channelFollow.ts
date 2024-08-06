import type { ChannelEvent } from "./types/channelEvent.js";
import type { EventSubscription } from "./types/eventSubRequest.js";
import type { NotificationPayloadTemplate } from "./types/notificationMessage.js";

export type ChannelFollowNotificationPayload = NotificationPayloadTemplate & {
  type: "channel.follow";
  subscription: {
    condition: ChannelFollowCondition;
  };
  event: ChannelFollowEvent;
};

interface ChannelFollowCondition {
  broadcaster_user_id: string;
  moderator_user_id: string;
}

export interface ChannelFollowEvent extends ChannelEvent {
  followed_at: string; // RFC3339 timestamp for the event
}

export const channelFollow: EventSubscription = {
  type: "channel.follow",
  version: "2",
  condition: {
    broadcaster_user_id: process.env.BROADCASTER_USER_ID,
    moderator_user_id: process.env.MODERATOR_USER_ID,
  },
  authorization: {
    scope: ["moderator:read:followers"],
  },
};
