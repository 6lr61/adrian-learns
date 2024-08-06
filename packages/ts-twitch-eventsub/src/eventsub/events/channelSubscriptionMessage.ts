import type { ChannelEvent } from "./types/channelEvent.js";
import type { EventSubscription } from "./types/eventSubRequest.js";
import type { NotificationPayloadTemplate } from "./types/notificationMessage.js";

export type ChannelSubscriptionMessagePayload = NotificationPayloadTemplate & {
  subscription: {
    type: "channel.subscription.message";
    condition: ChannelSubscriptionMessageCondition;
  };
  event: ChannelSubscriptionMessageEvent;
};

interface ChannelSubscriptionMessageCondition {
  broadcaster_user_id: string;
}

export interface ChannelSubscriptionMessageEvent extends ChannelEvent {
  tier: "1000" | "2000" | "3000";
  message: SubscriptionMessage;
  cumulative_months: number;
  streak_months: number | null;
  duration_months: number;
}

interface SubscriptionMessage {
  text: string;
  emotes: SubscriptionMessageEmote[];
}

interface SubscriptionMessageEmote {
  begin: number; // Index of emote in text
  end: number;
  id: string; // Emote ID
}

export const channelSubscriptionMessage: EventSubscription = {
  type: "channel.subscription.message",
  version: "1",
  condition: {
    broadcaster_user_id: process.env.BROADCASTER_USER_ID,
  },
  authorization: {
    scope: ["channel:read:subscriptions"],
  },
};
