const URL = "https://api.pronouns.alejo.io/v1";

interface PronounDescription {
  name: string;
  subject: string;
  object: string;
  singular: boolean;
}

interface UserEntry {
  channel_id: string;
  channel_login: string;
  pronoun_id: string;
  alt_pronoun_id: null; // unused?
}

export class Pronouns {
  private static _instance: Pronouns | undefined;
  private descriptors: Map<string, PronounDescription>;
  private users: Map<string, UserEntry | null>;

  private constructor() {
    this.descriptors = new Map<string, PronounDescription>();
    this.users = new Map<string, UserEntry>();
  }

  static get instance(): Pronouns {
    if (!Pronouns._instance) {
      Pronouns._instance = new Pronouns();
    }

    return Pronouns._instance;
  }

  private toString(description: PronounDescription): string {
    return description.singular
      ? description.subject
      : `${description.subject}/${description.object}`;
  }

  async init(): Promise<Pronouns> {
    try {
      const response = await fetch(`${URL}/pronouns`);
      const result = (await response.json()) as Record<
        string,
        PronounDescription
      >;
      console.log("Pronouns:", result);

      this.descriptors = new Map(Object.entries(result));
    } catch (error) {
      console.error("Pronouns.init:", error);
    }

    return this;
  }

  async lookup(username: string): Promise<string | undefined> {
    const userEntry = this.users.get(username);

    if (userEntry) {
      const pronoun = this.descriptors.get(userEntry.pronoun_id);
      return pronoun ? this.toString(pronoun) : undefined;
    }

    try {
      const response = await fetch(`${URL}/users/${username}`);

      if (!response.ok) {
        // Returns 404 if there's no pronoun set for the user
        this.users.set(username, null);
        return;
      }

      const result = (await response.json()) as UserEntry;
      this.users.set(username, result);
      const pronoun = this.descriptors.get(result.pronoun_id);

      return pronoun ? this.toString(pronoun) : undefined;
    } catch (error) {
      console.error("pronouns.lookup:", error);
    }
  }
}
