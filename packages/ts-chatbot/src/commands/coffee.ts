import { readFile } from "node:fs/promises";
import { randomInt } from "crypto";

interface Coffee {
  descriptions: string[];
  cups: string[];
  cupTypes: string[];
  coffeeTypes: string[];
  espressoTypes: string[];
  milkTypes: string[];
  drinkToppings: string[];
  drinkTypes: string[];
}

function getRandom(list: string[]): string {
  return list[randomInt(list.length)] || "";
}

async function readCoffee(): Promise<Coffee | null> {
  try {
    return JSON.parse(await readFile("coffee.json", "utf-8")) as Coffee;
  } catch (error) {
    console.error("Coffee: Couldn't read `coffee,json`");
    return null;
  }
}

export async function makeACupOfCoffee(name: string): Promise<string> {
	// [0, 100[
  const randomNumber = randomInt(100);
  const coffee = await readCoffee();

  if (!coffee) {
    return `Sorry ${name}, we're all out of coffee!`;
  }

  if (randomNumber < 1) {
	  return "418: I'm a teapot";
  } else if (randomNumber < 25) {
    // Espresso
    // Here you go @name, it's [a cold] cup of [moka pot] [espresso], served in a [small] [toy car].
    return `Here you go ${name}, it's ${getRandom(
      coffee.descriptions
    )} cup of ${getRandom(
      coffee.espressoTypes
    )} espresso, served in ${getRandom(coffee.cupTypes)} ${getRandom(
      coffee.cups
    )}.`;
  } else if (randomNumber < 50) {
    // Coffee
    // Here you go @name, it's [a cold] cup of [perculator] coffee, served in a [small] [toy car].
    return `Here you go ${name}, it's ${getRandom(
      coffee.descriptions
    )} cup of ${getRandom(coffee.coffeeTypes)} coffee, served in ${getRandom(
      coffee.cupTypes
    )} ${getRandom(coffee.cups)}.`;
  } else {
    // Milk drink
    // Here you go @name, it's [a lukewarm] cup of [soy milk] [pumpkin spice] [latte], served in a [large] [styrofoam mug].
    return `Here you go ${name}, it's ${getRandom(
      coffee.descriptions
    )} cup of ${getRandom(coffee.milkTypes)} milk ${getRandom(
      coffee.drinkToppings
    )} ${getRandom(coffee.drinkTypes)}, served in ${getRandom(
      coffee.cupTypes
    )} ${getRandom(coffee.cups)}.`;
  }
}
