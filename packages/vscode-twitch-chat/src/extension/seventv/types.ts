import type {
  ActiveEmoteFlag,
  EmoteFlag,
  EmoteLifecycle,
  EmoteSetFlag,
} from "./flags";

export interface EmoteModel {
  /** Object ID */
  id: string;
  /** Emote name, eg. KEKW */
  name: string;
  flags: ActiveEmoteFlag;
  timestamp: number;
  actor_id: string | null;
  /** EmotePartialModel */
  data: EmotePartialModel | null;
}

export interface EmoteSet {
  /** Emote Set ID */
  id?: string;
  /** Emote Set Name */
  name: string;
  tags: string[];
  flags: EmoteSetFlag;
  /** Deprecated - Use flags */
  immutable: boolean;
  /** Deprecated - Use flags */
  privileged: boolean;
  emotes?: EmoteModel[];
  emote_count?: number;
  capacity: number;
  owner: UserPartial | null;
}

export interface EmotePartialModel {
  /** Object ID */
  id: string;
  /** Emote name, eg. KEKW */
  name: string;
  flags: EmoteFlag;
  lifecycle: EmoteLifecycle;
  /** Emote version state */
  state: ("PERSONAL" | "NO_PERSONAL" | "LISTED")[];
  listed: boolean;
  animated: boolean;
  owner: UserPartial;
  /** Image Host */
  host: {
    /** Partial url? */
    // "//cdn.7tv.app/emote/60a487509485e7cf2f5a6fa7";
    url: string;
    /** Image File */
    files: {
      name: string; // "1x.avif"
      static_name: string; // "1x_static.avif"
      width: number;
      height: number;
      frame_count?: number;
      size?: number;
      format: "AVIF" | "WEBP";
    }[];
  };
}

export interface UserPartial {
  id: string;
  username: string;
  display_name: string;
  created_at?: number;
  avatar_url?: string;
  style: Record<string, unknown>;
  roles?: string[];
  connections?: Connection[];
}

interface Connection {
  id: string;
  platform: "TWITCH" | "YOUTUBE" | "DISCORD";
  username: string;
  display_name: string;
  linked_at: number;
  emote_capacity: number;
  emote_set_id: string | null;
  emote_set: EmoteSet | null;
}
