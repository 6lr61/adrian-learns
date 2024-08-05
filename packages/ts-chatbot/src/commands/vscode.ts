import { readFile } from "node:fs/promises";
const SETTINGS_JSON_PATH = "/home/adrian/.config/Code/User/settings.json";

export async function readCurrentTheme() {
  const contents = await readFile(SETTINGS_JSON_PATH, { encoding: "utf8" });
  const settings = JSON.parse(contents);
  return settings["workbench.colorTheme"];
}

export async function readCurrentFont() {
  const contents = await readFile(SETTINGS_JSON_PATH, { encoding: "utf8" });
  const settings = JSON.parse(contents) as Record<string, unknown>;
  const fonts = settings["editor.fontFamily"] as string | undefined;
  const fontName = fonts?.split(",")[0];

  return fontName?.slice(1, fontName.length - 1);
}
