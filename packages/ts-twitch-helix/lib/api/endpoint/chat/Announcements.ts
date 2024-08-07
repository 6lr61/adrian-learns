import { BaseCrud } from "../../BaseCrud.js";
import { QueryParameters } from "../../Helix.js";

export type HighlightColor = "blue" | "green" | "orange" | "purple" | "primary";

interface Parameters extends QueryParameters {
  broadcasterId: string;
}

interface RequestBody {
  message: string;
  color?: HighlightColor;
}

export class Announcements extends BaseCrud {
  async post(
    { broadcasterId }: Parameters,
    { message, color }: RequestBody,
    controller?: AbortController,
  ): Promise<void> {
    this.helix.checkScope("moderator:manage:announcements");

    this.helix.post<void>(
      "chat/announcements",
      { broadcasterId, moderatorId: this.helix.auth.userId },
      { message, color },
      controller,
    );
  }
}
