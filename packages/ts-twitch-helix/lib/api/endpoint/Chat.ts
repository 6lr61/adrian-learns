import { BaseCrud } from "../BaseCrud.js";
import { Announcements } from "./chat/Announcements.js";
import { Shoutouts } from "./chat/Shoutouts.js";

export class Chat extends BaseCrud {
  get announcements() {
    return new Announcements(this.helix);
  }

  get shoutouts() {
    return new Shoutouts(this.helix);
  }
}
