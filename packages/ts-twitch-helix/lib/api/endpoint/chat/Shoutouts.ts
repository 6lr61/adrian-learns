import { BaseCrud } from "../../BaseCrud.js";

interface Paramters {
  fromBroadcasterId: string;
  toBroadcasterId: string;
}

export class Shoutouts extends BaseCrud {
  post({ fromBroadcasterId, toBroadcasterId }: Paramters) {
    this.helix.checkScope("moderator:manage:shoutouts");

    this.helix.post<void>("chat/shoutouts", {
      fromBroadcasterId,
      toBroadcasterId,
      moderatorId: this.helix.auth.userId,
    });
  }
}
