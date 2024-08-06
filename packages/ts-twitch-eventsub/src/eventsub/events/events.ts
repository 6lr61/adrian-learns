import { channelCheer } from "./channelCheer.js";
import { channelFollow } from "./channelFollow.js";
import { channelRaid } from "./channelRaid.js";
import { channelSubscribe } from "./channelSubscribe.js";
import { channelSubscriptionGift } from "./channelSubscriptionGift.js";
import { channelSubscriptionMessage } from "./channelSubscriptionMessage.js";
import {
  channelPointsRewardRedeem,
  channelPointsRedeemUpdate,
} from "./channelPointsCustomRewardRedemption.js";
import { channelShoutout } from "./channelShoutout.js";

export const events = [
  channelCheer,
  channelFollow,
  channelRaid,
  channelShoutout,
  channelSubscribe,
  channelSubscriptionGift,
  channelSubscriptionMessage,
  channelPointsRewardRedeem,
  channelPointsRedeemUpdate,
] as const;
