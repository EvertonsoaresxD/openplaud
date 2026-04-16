import { cosineDistance, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { db } from "@/db";
import { apiCredentials, transcriptionChunks } from "@/db/schema";
import { auth } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const messages = body.messages || [];

        if (messages.length === 0) {
            return new Response("Messages are required", { status: 400 });
        }

        // Get the latest query
        const query = messages[messages.length - 1].content;

        // Fetch OpenAI credentials configured by the user
        const [credentials] = await db
            .select()
            .from(apiCredentials)
            .where(
                eq(apiCredentials.userId, session.user.id)
            )
            .limit(1);

        if (!credentials) {
            return new Response("No API configured for AI Chat", { status: 400 });
        }

        const apiKey = decrypt(credentials.apiKey);
        const openai = new OpenAI({
            apiKey,
            baseURL: credentials.baseUrl || undefined,
        });

        // 1. Generate local embedding for user query
        const queryEmbeddingRes = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
        });
        const queryEmbedding = queryEmbeddingRes.data[0].embedding;

        // 2. Perform RAG Vector Search
        // cosineDistance returns a value from 0 to 2, where 0 is identical and 2 is opposite.
        const relevantChunks = await db
            .select({
                text: transcriptionChunks.text,
                similarity: cosineDistance(transcriptionChunks.embedding, queryEmbedding),
            })
            .from(transcriptionChunks)
            .where(eq(transcriptionChunks.userId, session.user.id))
            .orderBy(t => t.similarity)
            .limit(8); // Top 8 relevant chunks

        const contextText = relevantChunks
            .map((chunk, i) => `[Context ${i + 1}]: ${chunk.text}`)
            .join("\n\n");

        // 3. Inject context into system prompt
        const systemPrompt = `Você é um assistente pessoal integrado ao gravador inteligente OpenPlaud. 
Sua tarefa é responder as perguntas do usuário com base nas transcrições das suas reuniões e notas de voz arquivadas.
Responda APENAS usando os CONTEXTOS ARQUIVADOS listados abaixo. Se a informação não estiver lá, diga que não há gravações que mencionem isso.
Responda sempre em Português. Formate bonitinho.

CONTEXTOS ARQUIVADOS:
${contextText}`;

        // Modify the messages payload to include our RAG context
        const enhancedMessages = [
            { role: "system", content: systemPrompt },
            ...messages.slice(0, -1),
            { role: "user", content: query },
        ];

        const completion = await openai.chat.completions.create({
            model: credentials.defaultModel || "gpt-4o-mini",
            messages: enhancedMessages,
            // Could stream here if needed using OpenAIStream / AI SDK, keeping it standard for now
        });

        return NextResponse.json({
            response: completion.choices[0].message.content,
            contextsFound: relevantChunks.length
        });
    } catch (error) {
        console.error("AI Chat Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
