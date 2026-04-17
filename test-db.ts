import { eq } from "drizzle-orm";
import { db } from "./src/db/index";
import { recordings } from "./src/db/schema";
import { env } from "./src/lib/env";

async function main() {
    const userId = "0jMTKTOjcukU8Ng9U6m3rq0tqqu5VYHC";
    const targetId = "aG2HUohOHcvFzKCIHYxgX";

    const allRecordings = await db
        .select()
        .from(recordings)
        .where(eq(recordings.userId, userId));

    for (const recording of allRecordings) {
        console.log(`ID: "${recording.id}"`);
        console.log(`PlaudFileId: "${recording.plaudFileId}"`);
        console.log(`Equals '${targetId}'?`, recording.id === targetId);
        console.log(`Length:`, recording.id.length);
        console.log("Char codes:", [...recording.id].map(c => c.charCodeAt(0)).join(","));
        console.log("Target codes:", [...targetId].map(c => c.charCodeAt(0)).join(","));
        console.log("----");
    }
}

main().catch(console.error).finally(() => process.exit(0));
