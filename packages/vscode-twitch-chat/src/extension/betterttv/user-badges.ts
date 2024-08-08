const BTTV_API = "https://api.betterttv.net/3";

export class UserBadges {
  private badges: Map<string, string>;
  static _instance: UserBadges;

  private constructor() {
    this.badges = new Map<string, string>();
  }

  static get instance(): UserBadges {
    if (!UserBadges._instance) {
      UserBadges._instance = new UserBadges();
    }

    return UserBadges._instance;
  }

  async initGlobalBadges(): Promise<void> {
    try {
      const response = await fetch(`${BTTV_API}/cached/badges/twitch`);

      const data = (await response.json()) as {
        name: string;
        badge: { svg: string };
      }[];

      for (const user of data) {
        this.badges.set(user.name, user.badge.svg);
      }
    } catch (error) {
      console.error("getGlobalBttvBadges: fetch failed", error);
    }
  }

  addBadge(loginName: string, badgeImageUrl: string): void {
    this.badges.set(loginName, badgeImageUrl);
  }

  get(loginName: string): string | undefined {
    return this.badges.get(loginName);
  }
}
