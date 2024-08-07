import { unCamelCase } from "../util/unCamelCase.js";
import { Channels } from "./endpoint/Channels.js";
import { Chat } from "./endpoint/Chat.js";
import { Moderation } from "./endpoint/Moderation.js";
import { Streams } from "./endpoint/Streams.js";
import { Users } from "./endpoint/Users.js";
import { Whispers } from "./endpoint/Whispers.js";

interface Auth {
  userId: string;
  username: string;
  accessToken: string;
  clientId: string;
  expires: Date;
  scopes: string[];
}

export type QueryParameters = Record<string, string | string[] | undefined>;

export class Helix {
  constructor(
    public auth: Auth,
    private baseUrl = "https://api.twitch.tv/helix",
  ) {}

  checkScope(scope: string): void;
  checkScope(scopes: string[]): void;
  checkScope(scopes: string | string[]): void {
    if (Array.isArray(scopes)) {
      if (!this.hasAnyScope(scopes)) {
        throw new Error(
          `Token missing one of the scopes: ${scopes.join(", ")}`,
        );
      }
    } else {
      if (!this.hasScope(scopes)) {
        throw new Error(`Token missing scope: ${scopes}`);
      }
    }
  }

  hasScope(scope: string): boolean {
    return this.auth.scopes.includes(scope);
  }

  hasAnyScope(scopes: string[]): boolean {
    return scopes.some((scope) => this.auth.scopes.includes(scope));
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.auth.accessToken}`,
      "Client-Id": this.auth.clientId,
    };
  }

  private urlWithParameters(endPoint: string, params: QueryParameters): URL {
    const url = new URL(`${this.baseUrl}/${endPoint}`);

    Object.entries(params).forEach(([param, value]) => {
      if (Array.isArray(value)) {
        value.forEach((value) => url.searchParams.append(param, value));
      } else if (typeof value === "string") {
        url.searchParams.append(param, value);
      }
    });

    return url;
  }

  async get<R>(
    endPoint: string,
    params: QueryParameters,
    controller?: AbortController,
  ): Promise<R> {
    const url = this.urlWithParameters(endPoint, unCamelCase(params));
    // TODO: Deal with exceptions from fetch
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
      signal: controller?.signal,
    });

    if (!response.ok) {
      // TODO: Make a custom error type?
      //  Possible reason: Bad token, missing permissions (not a mod)
      throw new Error(
        `/${endPoint}: Bad HTTP response: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result;
  }

  async post<R>(
    endPoint: string,
    params: QueryParameters,
    body?: Record<string, unknown>,
    controller?: AbortController,
  ): Promise<R | null> {
    const url = this.urlWithParameters(endPoint, unCamelCase(params));

    // TODO: Deal with exceptions from fetch
    const response = await fetch(url, {
      method: "POST",
      headers: {
        ...this.getAuthHeaders(),
        ...(body && { "Content-Type": "application/json" }),
      },
      ...(body && { body: JSON.stringify(unCamelCase(body)) }),
      signal: controller?.signal,
    });

    if (!response.ok) {
      // TODO: Make a custom error type?
      //  Possible reason: Bad token, missing permissions (not a mod)
      throw new Error(
        `/${endPoint}: Bad HTTP response: ${response.status} ${response.statusText}`,
      );
    }

    if (response.headers.get("content-type") === "application/json") {
      const result = await response.json();
      return result;
    }

    // TODO: How to deal with missing return values?
    return null;
  }

  // TODO: This should probably be able to take a body?
  async put<R>(
    endPoint: string,
    params: QueryParameters,
    controller?: AbortController,
  ): Promise<R> {
    const url = this.urlWithParameters(endPoint, unCamelCase(params));

    // TODO: Deal with exceptions from fetch
    const response = await fetch(url, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      signal: controller?.signal,
    });

    if (!response.ok) {
      // TODO: Make a custom error type?
      //  Possible reason: Bad token, missing permissions (not a mod)
      throw new Error(
        `/${endPoint}: Bad HTTP response: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result;
  }

  /*
   * API Endpoints
   */

  get users() {
    return new Users(this);
  }

  get chat() {
    return new Chat(this);
  }

  get channels() {
    return new Channels(this);
  }

  get moderation() {
    return new Moderation(this);
  }

  get streams() {
    return new Streams(this);
  }

  get whispers() {
    return new Whispers(this);
  }
}
