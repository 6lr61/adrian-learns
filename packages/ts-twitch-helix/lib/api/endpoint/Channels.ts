import { BaseCrud } from "../BaseCrud.js";
import { QueryParameters } from "../Helix.js";
import { Followers } from "./channels/Followers.js";

interface Response {
  data: ChannelData[];
}

interface ChannelData {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  broadcaster_language: string;
  game_id: string;
  game_name: string;
  title: string;
  delay: number;
  tags: string[];
  content_classification_labels: string[];
  is_branded_content: boolean;
}

export class Channels extends BaseCrud {
  async get(
    { broadcasterId }: QueryParameters,
    controller?: AbortController,
  ): Promise<ChannelData[]> {
    return (
      await this.helix.get<Response>("channels", { broadcasterId }, controller)
    ).data;
  }

  get followers() {
    return new Followers(this.helix);
  }
}
