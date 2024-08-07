import { BaseCrud } from "../BaseCrud.js";
import { QueryParameters } from "../Helix.js";

interface Response {
  data: StreamData[];
  pagination: {
    cursor: string;
  };
}

interface StreamData {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  tags: string[];
  viewer_count: number;
  /** UTC date in RFC3339 format */
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

interface Parameters extends QueryParameters {
  userId?: string | string[];
  userLogin?: string | string[];
  gameId?: string | string[];
  type?: "all" | "live";
  /** ISO 639-1 two-letter language code or "other" */
  language?: string;
  first?: `${number}`;
  before?: string;
  after?: string;
}

export class Streams extends BaseCrud {
  async get(
    {
      userId,
      userLogin,
      gameId,
      type,
      language,
      first,
      before,
      after,
    }: Parameters,
    controller?: AbortController,
  ) {
    return await this.helix.get<Response>(
      "streams",
      {
        userId,
        userLogin,
        gameId,
        type,
        language,
        first,
        before,
        after,
      },
      controller,
    );
  }
}
