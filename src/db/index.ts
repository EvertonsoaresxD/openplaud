import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import { isBuild } from "@/lib/utils";
import * as schema from "./schema";

if (!env.DATABASE_URL && !isBuild) {
    throw new Error(
        "DATABASE_URL must be set in non-build runtime (dev/prod server)",
    );
}

declare global {
    // eslint-disable-next-line no-var
    var postgresClient: postgres.Sql | undefined;
}

const client = env.DATABASE_URL
    ? globalThis.postgresClient || postgres(env.DATABASE_URL)
    : undefined;

if (client && process.env.NODE_ENV !== "production") {
    globalThis.postgresClient = client;
}

export const db = client
    ? drizzle(client, { schema })
    : ({} as ReturnType<typeof drizzle<typeof schema>>);

export { schema };
