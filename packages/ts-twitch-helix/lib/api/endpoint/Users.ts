import { UserID } from "../../types/twitch/user.js";
import { BaseCrud } from "../BaseCrud.js";
import { type QueryParameters } from "../Helix.js";

interface Result {
  data: Data[];
}

interface Data {
  id: string;
  login: string;
  display_name: string;
  type: "admin" | "global_mod" | "staff" | "";
  broadcaster_type: "affiliate" | "partner" | "";
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  email?: string;
  created_at: string;
}

export class Users extends BaseCrud {
  async get(
    params: { id: UserID | UserID[] },
    controller?: AbortController,
  ): Promise<Data[]>;
  async get(
    params: { login: string | string[] },
    controller?: AbortController,
  ): Promise<Data[]>;
  async get(
    params: QueryParameters,
    controller?: AbortController,
  ): Promise<Data[]> {
    return (await this.helix.get<Result>("users", params, controller)).data;
  }

  async put(
    params: { description: string },
    controller?: AbortController,
  ): Promise<Data[]> {
    this.helix.checkScope("user:edit");

    return (await this.helix.put<Result>("users", params, controller)).data;
  }
}
