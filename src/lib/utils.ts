import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Prisma } from "../../prisma/generated/prisma/client";

type Decimal = Prisma.Decimal;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility type that maps Prisma types to their JSON-serialized equivalents
export type Serialized<T> = {
  [K in keyof T]: T[K] extends Decimal
    ? number
    : T[K] extends Decimal | null
    ? number | null
    : T[K] extends Date
    ? string
    : T[K] extends Date | null
    ? string | null
    : T[K] extends bigint
    ? string
    : T[K] extends bigint | null
    ? string | null
    : T[K];
};

// Now returns Serialized<T> instead of T — matches the runtime reality
export function serializeData<T>(data: T): Serialized<T> {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  ) as Serialized<T>;
}
