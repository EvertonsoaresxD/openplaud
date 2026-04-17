import { eq } from "drizzle-orm";
import { db } from "./src/db/index";
import { recordings } from "./src/db/schema";

async function main() {
    const id = "aG2HUohOHcvFzKCIHYxgX";
    
    await db.execute(`SET enable_indexscan = off; SET enable_bitmapscan = off;`);
    const res = await db.execute(`SELECT id FROM recordings WHERE id = '${id}'`);
    
    console.log("Found without index:", Array.isArray(res) ? res.length : (res as any).rows?.length);
    
    await db.execute(`SET enable_indexscan = on; SET enable_bitmapscan = on;`);
    const res2 = await db.execute(`SELECT id FROM recordings WHERE id = '${id}'`);
    
    console.log("Found with index:", Array.isArray(res2) ? res2.length : (res2 as any).rows?.length);
}

main().catch(console.error).finally(() => process.exit(0));
