import { eq } from "drizzle-orm";
import { db } from "./src/db/index";
import { recordings } from "./src/db/schema";
import { env } from "./src/lib/env";

async function main() {
    const id = "aG2HUohOHcvFzKCIHYxgX";
    const [recording] = await db.select().from(recordings).where(eq(recordings.id, id));
    console.log("Found by ID:", recording ? recording.id : "null");
    
    // Test native query
    const result = await db.execute(`SELECT id FROM recordings WHERE id = '${id}'`);
    console.log("Found by native query:", result.rows.length);
    
    // Test native query with LIKE
    const resultLike = await db.execute(`SELECT id FROM recordings WHERE id LIKE '%${id}%'`);
    console.log("Found by native query with LIKE:", resultLike.rows.length);
}

main().catch(console.error).finally(() => process.exit(0));
