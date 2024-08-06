import type { ChannelEvent } from "./types/channelEvent.js";
import type { EventSubscription } from "./types/eventSubRequest.js";
import type { NotificationPayloadTemplate } from "./types/notificationMessage.js";

export type ChannelPointsCustomRewardRedemptionNotificationPayload =
  NotificationPayloadTemplate & {
    subscription: {
      type: "channel.channel_points_custom_reward_redemption.add";
      condition: ChannelPointsCondition;
    };
    event: ChannelPointsCustomRewardRedemptionEvent;
  };

interface ChannelPointsCondition {
  broadcaster_user_id: string;
}

export interface ChannelPointsCustomRewardRedemptionEvent extends ChannelEvent {
  id: string;
  user_input: string;
  status: "unknown" | "unfulfilled" | "fulfilled" | "canceled";
  reward: ChannelPointsReward;
  redeemed_at: string; // RFC3339 timestap for the redeem
}

interface ChannelPointsReward {
  id: string;
  title: string;
  cost: number;
  prompt: string;
}

export const channelPointsRewardRedeem: EventSubscription = {
  type: "channel.channel_points_custom_reward_redemption.add",
  version: "1",
  condition: {
    broadcaster_user_id: process.env.BROADCASTER_USER_ID,
  },
  authorization: {
    scope: ["channel:read:redemptions", "channel:manage:redemptions"],
  },
};

export const channelPointsRedeemUpdate: EventSubscription = {
  type: "channel.channel_points_custom_reward_redemption.update",
  version: "1",
  condition: {
    broadcaster_user_id: process.env.BROADCASTER_USER_ID,
  },
  authorization: {
    scope: ["channel:read:redemptions", "channel:manage:redemptions"],
  },
};
