import { eq } from "drizzle-orm";
import { db } from "./src/db/index";
import { plaudConnections, recordings } from "./src/db/schema";
import { decrypt } from "./src/lib/encryption";
import { createPlaudClient } from "./src/lib/plaud/client";
import { createUserStorageProvider } from "./src/lib/storage/factory";

const userId = "0jMTKTOjcukU8Ng9U6m3rq0tqqu5VYHC";

async function main() {
    console.log("🔍 Checking for missing audio files...");

    const [connection] = await db
        .select()
        .from(plaudConnections)
        .where(eq(plaudConnections.userId, userId));

    if (!connection) {
        console.error("No Plaud connection found!");
        return;
    }

    const plaudClient = await createPlaudClient(connection.bearerToken, connection.apiBase);
    const storage = await createUserStorageProvider(userId);

    const allRecordings = await db
        .select()
        .from(recordings)
        .where(eq(recordings.userId, userId));

    console.log(`Found ${allRecordings.length} recordings in DB`);

    let repaired = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const recording of allRecordings) {
        try {
            await storage.downloadFile(recording.storagePath);
            skipped++;
        } catch {
            process.stdout.write(`⬇️  Downloading ${recording.filename}...`);
            try {
                const audioBuffer = await plaudClient.downloadRecording(recording.plaudFileId, false);
                await storage.uploadFile(recording.storagePath, audioBuffer, "audio/mpeg");
                process.stdout.write(" ✅\n");
                repaired++;
            } catch (err) {
                process.stdout.write(` ❌ ${err}\n`);
                errors.push(`${recording.id}: ${err}`);
            }
        }
    }

    console.log(`\n✅ Done! repaired=${repaired}, skipped=${skipped}, errors=${errors.length}`);
    if (errors.length > 0) {
        console.log("Errors:", errors);
    }
}

main().catch(console.error).finally(() => process.exit(0));
