import { BaseCrud } from "../../BaseCrud.js";
import { QueryParameters } from "../../Helix.js";

interface Response {
  total: number;
  data: FollowerData[];
  pagination: { cursor?: string };
}

interface FollowerData {
  user_id: string;
  user_name: string;
  user_login: string;
  followed_at: string;
}

interface Parameters extends QueryParameters {
  userId?: string;
  broadcasterId: string;
  first?: `${number}`;
  after?: string;
}

export class Followers extends BaseCrud {
  async get({
    userId,
    broadcasterId,
    first,
    after,
  }: Parameters): Promise<Response> {
    this.helix.checkScope("moderator:read:followers");

    return this.helix.get<Response>("channels/followers", {
      userId,
      broadcasterId,
      first,
      after,
    });
  }
}
