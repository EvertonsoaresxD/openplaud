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

    const match = allRecordings.find(r => r.id === targetId);
    
    if (match) {
        console.log("EXACT MATCH IN JAVASCRIPT:", match.id);
        console.log("PlaudFileId:", match.plaudFileId);
    } else {
        console.log("NO EXACT MATCH IN JAVASCRIPT!!!");
        // See if there's any partial match
        const partial = allRecordings.find(r => r.id.includes(targetId) || targetId.includes(r.id));
        if (partial) {
            console.log("Found partial match:", partial.id);
            console.log("Char codes:", [...partial.id].map(c => c.charCodeAt(0)).join(","));
            console.log("Target codes:", [...targetId].map(c => c.charCodeAt(0)).join(","));
        } else {
            console.log("Not even a partial match.");
        }
    }
}

main().catch(console.error).finally(() => process.exit(0));
