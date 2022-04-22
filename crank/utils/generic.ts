import * as fs from "fs";
import {randomInt} from "crypto";

/**
 * Small helper function to read a JSON file as a type from a filepath
 *
 * @param filePath The path to read the data from
 */
export function readJsonFile<T>(filePath: string): T {
    return JSON.parse(
        fs.readFileSync(
            filePath,
            "utf-8"
        )
    )
}

export function pickRandomItem<T>(items: T[]): T {
    if (items.length === 0) {
        throw new Error("Can't pick item");
    }
    return items[randomInt(items.length)];
}