import type { ChannelCheerNotificationPayload } from "../channelCheer.js";
import type { ChannelFollowNotificationPayload } from "../channelFollow.js";
import type { ChannelPointsCustomRewardRedemptionNotificationPayload } from "../channelPointsCustomRewardRedemption.js";
import type { ChannelRaidNotificationPayload } from "../channelRaid.js";
import type { ChannelShoutoutNotificationPayload } from "../channelShoutout.js";
import type { ChannelSubscribeNotificationPayload } from "../channelSubscribe.js";
import type { ChannelSubscriptionGiftNotificationPayload } from "../channelSubscriptionGift.js";
import type { ChannelSubscriptionMessagePayload } from "../channelSubscriptionMessage.js";
import type { EventSubTransport } from "./eventSubRequest.js";

export interface NotificationMessage {
  metadata: {
    message_id: string; // Unique message identifier
    message_type: "notification";
    message_timestamp: string; // UTC date for when message sent
    subscription_type: string; // Type of event sent in the message
    subscription_version: string; // Version number for the subscription's definition
  };
  payload: NotificationPayload; // Object that contains the message
}

export type NotificationPayload =
  | ChannelCheerNotificationPayload
  | ChannelFollowNotificationPayload
  | ChannelPointsCustomRewardRedemptionNotificationPayload
  | ChannelRaidNotificationPayload
  | ChannelShoutoutNotificationPayload
  | ChannelSubscribeNotificationPayload
  | ChannelSubscriptionGiftNotificationPayload
  | ChannelSubscriptionMessagePayload;

export interface NotificationPayloadTemplate {
  subscription: {
    id: string; // Unique identifier for this subscription
    type: string; // Type of the event sent in the message
    status: "enabled"; // Status of the subscription
    version: string; // Version number of the subscription\s definition
    cost: string; // How much the subscription counts against your limit
    condition: Record<string, unknown>; // Conditions under which the event fires
    transport: EventSubTransport; // Information about the transport used for notifications
    method: "websocket";
    session_id: string; // Unique identifier for the WebSocket connection
    created_at: string; // UTC date for when the subscription was created
  };
  event: unknown; // Event specific information
}
