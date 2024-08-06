import type { ChannelEvent } from "./types/channelEvent.js";
import type { EventSubscription } from "./types/eventSubRequest.js";
import type { NotificationPayloadTemplate } from "./types/notificationMessage.js";

export type ChannelSubscribeNotificationPayload =
  NotificationPayloadTemplate & {
    subscription: {
      type: "channel.subscribe";
      condition: ChannelSubscribeCondition;
    };
    event: ChannelSubscribeEvent;
  };

interface ChannelSubscribeCondition {
  broadcaster_user_id: string;
}

export interface ChannelSubscribeEvent extends ChannelEvent {
  tier: "1000" | "2000" | "3000";
  is_gift: boolean;
}

export const channelSubscribe: EventSubscription = {
  type: "channel.subscribe",
  version: "1",
  condition: {
    broadcaster_user_id: process.env.BROADCASTER_USER_ID,
  },
  authorization: {
    scope: ["channel:read:subscriptions"],
  },
};
