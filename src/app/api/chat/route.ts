import { and, cosineDistance, desc, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import OpenAI from "openai";
import { db } from "@/db";
import { apiCredentials, transcriptionChunks, transcriptions } from "@/db/schema";
import { auth } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";

export async function POST(req: NextRequest) {
    try {
        // Authenticate user
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const { messages, recordingId } = await req.json();

        const lastUserMessage = messages
            .slice()
            .reverse()
            .find((m: { role: string }) => m.role === "user");

        if (!lastUserMessage) {
            return new Response("Mensagem do usuário não encontrada", { status: 400 });
        }

        // Fetch user's default enhancement credentials (used for chat)
        const [credentials] = await db
            .select()
            .from(apiCredentials)
            .where(
                and(
                    eq(apiCredentials.userId, session.user.id),
                    eq(apiCredentials.isDefaultEnhancement, true),
                ),
            )
            .limit(1)
            // Fallback: any transcription credential
            .then(async (rows) => {
                if (rows.length > 0) return rows;
                return db
                    .select()
                    .from(apiCredentials)
                    .where(
                        and(
                            eq(apiCredentials.userId, session.user.id),
                            eq(apiCredentials.isDefaultTranscription, true),
                        ),
                    )
                    .limit(1);
            });

        if (!credentials) {
            return new Response(
                JSON.stringify({ error: "Nenhuma credencial de API configurada. Acesse Configurações → Provedores e adicione uma chave de API." }),
                { status: 400, headers: { "Content-Type": "application/json" } },
            );
        }

        const apiKey = decrypt(credentials.apiKey);
        const openai = new OpenAI({
            apiKey,
            baseURL: credentials.baseUrl || undefined,
        });

        // 1. Generate embedding for the user's question
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: lastUserMessage.content,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // 2. Vector search for relevant chunks
        const similarity = sql<number>`1 - (${cosineDistance(
            transcriptionChunks.embedding,
            queryEmbedding,
        )})`;

        // Build query — optionally filter by specific recording
        const baseQuery = db
            .select({
                content: transcriptionChunks.text,
                recordingId: transcriptions.recordingId,
                similarity: similarity,
            })
            .from(transcriptionChunks)
            .innerJoin(
                transcriptions,
                eq(transcriptionChunks.transcriptionId, transcriptions.id),
            )
            // Only return chunks belonging to this user
            .where(
                and(
                    eq(transcriptionChunks.userId, session.user.id),
                    sql`${similarity} > 0.35`,
                    ...(recordingId
                        ? [eq(transcriptions.recordingId, recordingId)]
                        : []),
                ),
            )
            .orderBy((t) => desc(t.similarity))
            .limit(10);

        const relevantChunks = await baseQuery;

        // 3. Build context-aware system prompt
        const contextSection =
            relevantChunks.length > 0
                ? `Contexto recuperado das gravações:\n${relevantChunks
                      .map(
                          (chunk, i) =>
                              `[Trecho ${i + 1}] (Recording ID: ${chunk.recordingId}):\n${chunk.content}`,
                      )
                      .join("\n\n")}`
                : "Nenhum trecho relevante foi encontrado nas gravações para esta pergunta.";

        const systemInstruction = `Você é o assistente inteligente do OpenPlaud.
Você tem acesso ao conhecimento das gravações do usuário através de pesquisa semântica.
Responda de forma clara, prestativa e referencie informações do contexto fornecido quando apropriado.
Se a informação não estiver no contexto, diga que não tem certeza baseando-se nas gravações atuais, mas tente ajudar como um assistente de IA geral se a pergunta não for estritamente sobre as gravações.
Use marcações MD para formatar a resposta, por exemplo com listas, negritos, quebras de linhas, quando necessário para organização visual.

${contextSection}
`;

        const enhancedMessages = [
            { role: "system", content: systemInstruction },
            ...messages,
        ];

        // 4. Determine model — use configured model or a sensible default per provider
        const model = credentials.defaultModel || (credentials.baseUrl?.includes("openrouter") ? "openai/gpt-4o-mini" : "gpt-4o-mini");

        // 5. Stream response
        const completion = await openai.chat.completions.create({
            model,
            messages: enhancedMessages,
            stream: true,
        });

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of completion) {
                    const text = chunk.choices[0]?.delta?.content || "";
                    if (text) {
                        controller.enqueue(new TextEncoder().encode(text));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "x-contexts-found": relevantChunks.length.toString(),
            },
        });
    } catch (error) {
        console.error("Chat Error:", error);
        const message = error instanceof Error ? error.message : "Internal Server Error";
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
