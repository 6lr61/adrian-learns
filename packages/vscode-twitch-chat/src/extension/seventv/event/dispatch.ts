import { Emotes } from "../emotes";
import type { EmoteFlag } from "../flags";
import type { EmoteModel, UserPartial } from "../types";
import type { DispatchMessage } from "./connect";

export interface ChangeMap {
  /** the object's ID */
  id: string;
  /** the object kind */
  kind: number;
  /** if true, this event represents a change local only to the current session */
  contextual?: boolean;
  /** the user responsible for these changes */
  actor: UserPartial;
  /** a list of added fields */
  added?: ChangeField[];
  /** a list of updated fields */
  updated?: ChangeField[];
  /** a list of removed fields */
  removed?: ChangeField[];
  /** a list of items pushed to an array */
  pushed?: ChangeField[];
  /** a list of items pulled from an array */
  pulled?: ChangeField[];
}

type ChangeField = GenericChange | EmoteChange;

interface GenericChange {
  /** the key in context */
  key: string;
  /** if the field is an array, this is the index of the item within the array that was updated */
  index: number;
  /** if true, this means the current value is a nested ChangeField array */
  nested?: boolean;
  /** the previous value */
  old_value?: Record<string, unknown> | null;
  /** the new value */
  value: Record<string, unknown> | ChangeField[] | null;
  /** this wasn't documented, but it's in the source code */
  type: "string" | "number" | "bool" | "object";
}

interface EmoteChange {
  key: "emotes";
  value: EmoteModel | null;
  type: "object";
  old_value?:
    | Record<string, unknown>
    | {
        actor_id: string;
        flags: EmoteFlag;
        /** Emote ID */
        id: string;
        /** Emote name, eg. KEKW */
        name: string;
        /** Don't know if this is used, was a negative number */
        timestamp: number;
      };
}

function isEmoteChange(change: ChangeField): change is EmoteChange {
  return (change as EmoteChange).key === "emotes";
}

export async function handleDispatchEvent(
  webSocketMessage: DispatchMessage
): Promise<void> {
  const data = webSocketMessage.d;
  switch (data.type) {
    case "emote_set.update": {
      if (data.body.pushed) {
        for (const entry of data.body.pushed) {
          if (isEmoteChange(entry) && entry.value) {
            Emotes.instance.addEmote(entry.value);
          }
        }
      } else if (data.body.pulled) {
        for (const entry of data.body.pulled) {
          if (
            isEmoteChange(entry) &&
            entry.old_value &&
            typeof entry.old_value.name === "string"
          ) {
            Emotes.instance.deleteEmote(entry.old_value.name);
          }
        }
      } else if (data.body.updated) {
        for (const entry of data.body.updated) {
          if (
            isEmoteChange(entry) &&
            entry.old_value &&
            typeof entry.old_value.name === "string"
          ) {
            Emotes.instance.deleteEmote(entry.old_value.name);
          }
          if (isEmoteChange(entry) && entry.value) {
            Emotes.instance.addEmote(entry.value);
          }
        }
      }
      break;
    }
    default:
  }
}
