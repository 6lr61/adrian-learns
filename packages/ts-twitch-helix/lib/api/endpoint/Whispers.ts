import { BaseCrud } from "../BaseCrud.js";

interface Parameters {
  toUserId: string;
}

interface RequestBody {
  message: string;
}

export class Whispers extends BaseCrud {
  async post(
    { toUserId }: Parameters,
    { message }: RequestBody,
    controller?: AbortController,
  ): Promise<void> {
    this.helix.checkScope("user:manage:whispers");

    this.helix.post<void>(
      "whispers",
      {
        toUserId,
        fromUserId: this.helix.auth.userId,
      },
      { message },
      controller,
    );
  }
}
