import { BaseCrud } from "../../BaseCrud.js";

interface RequestBody {
  userId: string;
  duration?: number;
  reason?: string;
}

interface Response {
  data: Data[];
}

interface Data {
  broadcaster_id: string;
  moderator_id: string;
  user_id: string;
  /** RFC3339 timestamp for the ban or  start */
  created_at: string;
  /** RC3339 timestamp when for the ban or timeout ends */
  end_time: string;
}

interface Parameters {
  broadcasterId: string;
}

export class Bans extends BaseCrud {
  async post(
    { broadcasterId }: Parameters,
    { userId, duration, reason }: RequestBody,
    controller?: AbortController,
  ): Promise<Data[] | undefined> {
    return (
      await this.helix.post<Response>(
        "moderation/bans",
        {
          broadcasterId,
          moderatorId: this.helix.auth.userId,
        },
        { data: { userId, duration, reason } },
        controller,
      )
    )?.data;
  }
}
