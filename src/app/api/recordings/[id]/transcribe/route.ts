import { and, eq } from "drizzle-orm";
import { after, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { db } from "@/db";
import {
    apiCredentials,
    recordings,
    transcriptionChunks,
    transcriptions,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";
import { createUserStorageProvider } from "@/lib/storage/factory";
import {
    getResponseFormat,
    parseTranscriptionResponse,
} from "@/lib/transcription/format";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const overrideProviderId = body.providerId as string | undefined;
        const overrideModel = body.model as string | undefined;

        const [recording] = await db
            .select()
            .from(recordings)
            .where(
                and(
                    eq(recordings.id, id),
                    eq(recordings.userId, session.user.id),
                ),
            )
            .limit(1);

        if (!recording) {
            return NextResponse.json(
                { error: "Recording not found" },
                { status: 404 },
            );
        }

        // Get user's transcription API credentials
        // If a specific provider was requested, look it up by ID
        const [credentials] = overrideProviderId
            ? await db
                  .select()
                  .from(apiCredentials)
                  .where(
                      and(
                          eq(apiCredentials.id, overrideProviderId),
                          eq(apiCredentials.userId, session.user.id),
                      ),
                  )
                  .limit(1)
            : await db
                  .select()
                  .from(apiCredentials)
                  .where(
                      and(
                          eq(apiCredentials.userId, session.user.id),
                          eq(apiCredentials.isDefaultTranscription, true),
                      ),
                  )
                  .limit(1);

        if (!credentials) {
            return NextResponse.json(
                { error: "No transcription API configured. Go to Settings → AI Providers and add an OpenAI or Groq key." },
                { status: 400 },
            );
        }

        // Validate provider supports audio transcription
        // OpenRouter and other LLM-only proxies do not support /audio/transcriptions
        const baseUrl = credentials.baseUrl || "";
        const isLlmOnlyProvider =
            baseUrl.includes("openrouter.ai") ||
            baseUrl.includes("anthropic.com") ||
            baseUrl.includes("cohere.ai");

        if (isLlmOnlyProvider) {
            return NextResponse.json(
                {
                    error: `The provider "${credentials.provider}" does not support audio transcription. Please configure an OpenAI or Groq credential and set it as the default transcription provider in Settings → AI Providers.`,
                },
                { status: 400 },
            );
        }

        // Decrypt API key
        const apiKey = decrypt(credentials.apiKey);

        // Create OpenAI-compatible client for audio transcription
        const openai = new OpenAI({
            apiKey,
            baseURL: baseUrl || undefined,
        });

        // Get storage provider and download audio
        const storage = await createUserStorageProvider(session.user.id);
        const audioBuffer = await storage.downloadFile(recording.storagePath);

        // Detect actual audio format from magic bytes
        // Plaud files may have .mp3 extension but contain OGG/Opus data
        const header = new Uint8Array(audioBuffer.slice(0, 4));
        const isOgg =
            header[0] === 0x4f &&
            header[1] === 0x67 &&
            header[2] === 0x67 &&
            header[3] === 0x53; // "OggS"

        const ext = isOgg
            ? "ogg"
            : recording.storagePath.split(".").pop() || "mp3";
        const contentType = isOgg
            ? "audio/ogg"
            : recording.storagePath.endsWith(".mp3")
              ? "audio/mpeg"
              : "audio/opus";

        // Ensure filename has a valid extension so the API can detect the format
        const filename = recording.filename.match(/\.\w{2,4}$/)
            ? recording.filename
            : `${recording.filename}.${ext}`;

        const model = overrideModel || credentials.defaultModel || "whisper-1";
        const responseFormat = getResponseFormat(model);

        // Whisper API limit is 25MB — split large files into sequential chunks
        const MAX_CHUNK_BYTES = 24 * 1024 * 1024; // 24MB safety margin
        let transcriptionText: string;
        let detectedLanguage: string | undefined;

        if (audioBuffer.length <= MAX_CHUNK_BYTES) {
            // File fits — send in a single request
            const audioFile = new File([new Uint8Array(audioBuffer)], filename, {
                type: contentType,
            });
            const transcription = await openai.audio.transcriptions.create({
                file: audioFile,
                model,
                response_format: responseFormat,
            });
            const parsed = parseTranscriptionResponse(transcription, responseFormat);
            transcriptionText = parsed.text;
            detectedLanguage = parsed.detectedLanguage;
        } else {
            // File too large — split into ≤24MB chunks and concatenate results
            const chunks: Buffer[] = [];
            for (let offset = 0; offset < audioBuffer.length; offset += MAX_CHUNK_BYTES) {
                chunks.push(audioBuffer.slice(offset, offset + MAX_CHUNK_BYTES));
            }

            const parts: string[] = [];
            let firstDetectedLanguage: string | undefined;

            for (let i = 0; i < chunks.length; i++) {
                const chunkFile = new File(
                    [new Uint8Array(chunks[i])],
                    `${filename.replace(/\.[^.]+$/, "")}_part${i + 1}.${ext}`,
                    { type: contentType },
                );
                const chunkTranscription = await openai.audio.transcriptions.create({
                    file: chunkFile,
                    model,
                    response_format: responseFormat,
                });
                const parsed = parseTranscriptionResponse(chunkTranscription, responseFormat);
                parts.push(parsed.text);
                if (!firstDetectedLanguage && parsed.detectedLanguage) {
                    firstDetectedLanguage = parsed.detectedLanguage;
                }
            }

            transcriptionText = parts.join(" ");
            detectedLanguage = firstDetectedLanguage;
        }

        // Save transcription
        let transcriptionId: string;
        const [existingTranscription] = await db
            .select()
            .from(transcriptions)
            .where(eq(transcriptions.recordingId, id))
            .limit(1);

        if (existingTranscription) {
            transcriptionId = existingTranscription.id;
            await db
                .update(transcriptions)
                .set({
                    text: transcriptionText,
                    detectedLanguage,
                    transcriptionType: "server",
                    provider: credentials.provider,
                    model,
                })
                .where(eq(transcriptions.id, existingTranscription.id));
        } else {
            const [inserted] = await db
                .insert(transcriptions)
                .values({
                    recordingId: id,
                    userId: session.user.id,
                    text: transcriptionText,
                    detectedLanguage,
                    transcriptionType: "server",
                    provider: credentials.provider,
                    model,
                })
                .returning({ id: transcriptions.id });
            transcriptionId = inserted.id;
        }

        // Generate and store embeddings for RAG asynchronously
        after(async () => {
            try {
                // Strategic Overlapping Chunking Strategy
                const splitIntoChunks = (
                    text: string,
                    chunkSize = 800,
                    overlap = 100,
                ) => {
                    const out: string[] = [];
                    let i = 0;
                    while (i < text.length) {
                        let end = i + chunkSize;
                        if (end < text.length) {
                            const prevSpace = text.lastIndexOf(" ", end);
                            if (prevSpace > i + overlap) {
                                end = prevSpace;
                            }
                        }
                        out.push(text.substring(i, end).trim());
                        const nextI = end - overlap;
                        if (nextI <= i) break; // Forward progression failsafe
                        i = nextI;
                    }
                    return out;
                };

                const chunks = splitIntoChunks(transcriptionText);

                // Delete old chunks if updating
                if (existingTranscription) {
                    await db
                        .delete(transcriptionChunks)
                        .where(
                            eq(
                                transcriptionChunks.transcriptionId,
                                transcriptionId,
                            ),
                        );
                }

                if (chunks.length > 0 && transcriptionText.trim() !== "") {
                    const maxBatchSize = 100;

                    for (let i = 0; i < chunks.length; i += maxBatchSize) {
                        const batch = chunks
                            .slice(i, i + maxBatchSize)
                            .map((c) => c.trim())
                            .filter((c) => c.length > 5); // Ignore tiny artifacts
                        if (batch.length === 0) continue;

                        const embeddingResponse =
                            await openai.embeddings.create({
                                model: "text-embedding-3-small",
                                input: batch,
                            });

                        const chunkValues = batch.map((text, idx) => ({
                            transcriptionId,
                            userId: session.user.id,
                            text,
                            chunkIndex: i + idx,
                            embedding: embeddingResponse.data[idx].embedding,
                        }));

                        await db
                            .insert(transcriptionChunks)
                            .values(chunkValues);
                    }
                }
            } catch (embeddingError) {
                console.error(
                    "Error generating embeddings asynchronously:",
                    embeddingError,
                );
            }
        });

        return NextResponse.json({
            transcription: transcriptionText,
            detectedLanguage,
        });
    } catch (error) {
        console.error("Error transcribing:", error);
        return NextResponse.json(
            { error: "Failed to transcribe recording" },
            { status: 500 },
        );
    }
}
