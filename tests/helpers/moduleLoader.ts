import { existsSync } from "node:fs";
import path from "node:path";
import { test } from "vitest";

export type LoadedModule<T extends Record<string, unknown> = Record<string, unknown>> = {
  module: T;
  path: string;
};

export function findExistingPath(candidates: string[]): string | undefined {
  return candidates
    .map((candidate) => path.resolve(process.cwd(), candidate))
    .find((candidate) => existsSync(candidate));
}

export async function loadFirstModule<T extends Record<string, unknown>>(
  candidates: string[],
): Promise<LoadedModule<T> | undefined> {
  const foundPath = findExistingPath(candidates);

  if (!foundPath) {
    return undefined;
  }

  const viteFsPath = `/@fs/${foundPath.replace(/\\/g, "/")}`;
  const module = (await import(/* @vite-ignore */ viteFsPath)) as T;
  return { module, path: foundPath };
}

export function pickFunction<TArgs extends unknown[], TResult>(
  module: Record<string, unknown>,
  names: string[],
): ((...args: TArgs) => TResult) | undefined {
  for (const name of names) {
    const value = module[name];

    if (typeof value === "function") {
      return value as (...args: TArgs) => TResult;
    }
  }

  return undefined;
}

export function testOrSkip(available: boolean) {
  return available ? test : test.skip;
}
