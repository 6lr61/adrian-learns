import type { ChannelEvent } from "./types/channelEvent.js";
import type { EventSubscription } from "./types/eventSubRequest.js";
import type { NotificationPayloadTemplate } from "./types/notificationMessage.js";

export type ChannelCheerNotificationPayload = NotificationPayloadTemplate & {
  subscription: {
    type: "channel.cheer";
    condition: ChannelCheerCondition;
  };
  event: ChannelCheerEvent;
};

interface ChannelCheerCondition {
  broadcaster_user_id: string;
}

export interface ChannelCheerEvent extends ChannelEvent {
  is_anonymous: boolean;
  message: string;
  bits: number;
}

export const channelCheer: EventSubscription = {
  type: "channel.cheer",
  version: "1",
  condition: {
    broadcaster_user_id: process.env.BROADCASTER_USER_ID,
  },
  authorization: {
    scope: ["bits:read"],
  },
};
