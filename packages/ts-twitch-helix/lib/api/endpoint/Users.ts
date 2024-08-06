import { UserID } from "../../types/twitch/user.js";
import { BaseCrud } from "../BaseCrud.js";
import { Helix, type QueryParameters } from "../Helix.js";

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
  async get(params: { id: UserID | UserID[] }): Promise<Data[]>;
  async get(params: { login: string | string[] }): Promise<Data[]>;
  async get(params: QueryParameters): Promise<Data[]> {
    return await this.helix.get<Data>("users", params);
  }

  async put(params: { description: string }): Promise<Data[]> {
    const scope = "user:edit";

    if (!this.helix.hasScope(scope)) {
      throw new Error(`Token missing scope: ${scope}`);
    }

    return await this.helix.put<Data>("users", params);
  }
}
