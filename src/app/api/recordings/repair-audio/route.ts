import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { plaudConnections, recordings } from "@/db/schema";
import { auth } from "@/lib/auth";
import { createPlaudClient } from "@/lib/plaud/client";
import { createUserStorageProvider } from "@/lib/storage/factory";

/**
 * POST /api/recordings/repair-audio
 * Re-downloads missing audio files from Plaud API for recordings
 * that exist in the database but whose local file is missing.
 */
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        // Optionally repair a specific recording; otherwise repair all
        const specificId = body.id as string | undefined;

        // Get user's Plaud connection
        const [connection] = await db
            .select()
            .from(plaudConnections)
            .where(eq(plaudConnections.userId, session.user.id))
            .limit(1);

        if (!connection) {
            return NextResponse.json({ error: "No Plaud account connected" }, { status: 400 });
        }

        const plaudClient = await createPlaudClient(
            connection.bearerToken,
            connection.apiBase,
        );
        const storage = await createUserStorageProvider(session.user.id);

        // Get recordings to check
        const recordingsToCheck = specificId
            ? await db
                  .select()
                  .from(recordings)
                  .where(
                      and(
                          eq(recordings.id, specificId),
                          eq(recordings.userId, session.user.id),
                      ),
                  )
            : await db
                  .select()
                  .from(recordings)
                  .where(eq(recordings.userId, session.user.id));

        let repaired = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const recording of recordingsToCheck) {
            try {
                // Try to download from local storage — if it fails, re-fetch from Plaud
                await storage.downloadFile(recording.storagePath);
                skipped++;
            } catch {
                // File missing — re-download from Plaud
                try {
                    const audioBuffer = await plaudClient.downloadRecording(
                        recording.plaudFileId,
                        false,
                    );
                    await storage.uploadFile(
                        recording.storagePath,
                        audioBuffer,
                        "audio/mpeg",
                    );
                    repaired++;
                } catch (downloadErr) {
                    errors.push(
                        `${recording.id}: ${downloadErr instanceof Error ? downloadErr.message : String(downloadErr)}`,
                    );
                }
            }
        }

        return NextResponse.json({ repaired, skipped, errors });
    } catch (error) {
        console.error("Error repairing audio:", error);
        return NextResponse.json(
            { error: "Failed to repair audio files" },
            { status: 500 },
        );
    }
}
