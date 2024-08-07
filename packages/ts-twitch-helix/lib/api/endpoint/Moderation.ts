import { BaseCrud } from "../BaseCrud.js";
import { Bans } from "./moderation/Bans.js";

export class Moderation extends BaseCrud {
  get bans() {
    return new Bans(this.helix);
  }
}
