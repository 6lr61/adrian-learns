import type { ChannelEvent } from "./types/channelEvent.js";
import type { EventSubscription } from "./types/eventSubRequest.js";
import type { NotificationPayloadTemplate } from "./types/notificationMessage.js";

export type ChannelSubscriptionGiftNotificationPayload =
  NotificationPayloadTemplate & {
    subscription: {
      type: "channel.subscription.gift";
      condition: ChannelSubscriptionGiftCondition;
    };
    event: ChannelSubscriptionGiftEvent;
  };

interface ChannelSubscriptionGiftCondition {
  broadcaster_user_id: string;
}

export interface ChannelSubscriptionGiftEvent extends ChannelEvent {
  total: number;
  tier: "1000" | "2000" | "3000";
  cumulative_total: number | null; //null if anonymous or not shared by the user
  is_anonymous: boolean;
}

export const channelSubscriptionGift: EventSubscription = {
  type: "channel.subscription.gift",
  version: "1",
  condition: {
    broadcaster_user_id: process.env.BROADCASTER_USER_ID,
  },
  authorization: {
    scope: ["channel:read:subscriptions"],
  },
};
