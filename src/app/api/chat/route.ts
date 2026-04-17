import { cosineDistance, desc, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import OpenAI from "openai";
import { db } from "@/db";
import { transcriptionChunks, transcriptions } from "@/db/schema";

const openai = new OpenAI();

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        // Extrai a última mensagem do usuário
        const lastUserMessage = messages
            .slice()
            .reverse()
            .find((m: any) => m.role === "user");

        if (!lastUserMessage) {
            return new Response("Mensagem do usuário não encontrada", {
                status: 400,
            });
        }

        // 1. Gera o embedding da pergunta do usuário
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: lastUserMessage.content,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // 2. Busca os chunks mais relevantes usando pgvector
        const similarity = sql<number>`1 - (${cosineDistance(
            transcriptionChunks.embedding,
            queryEmbedding,
        )})`;

        // Ajuste no threshold e limite (ajuste dependendo da densidade dos seus chunks e do overlap)
        const relevantChunks = await db
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
            .where(sql`${similarity} > 0.4`) // Busca documentos com similaridade > 0.4
            .orderBy((t) => desc(t.similarity))
            .limit(10); // Aumento do limite para compensar os chunks menores

        // 3. Monta o contexto para o prompt
        const systemInstruction = `Você é o assistente inteligente do OpenPlaud.
Você tem acesso ao conhecimento das gravações do usuário através de pesquisa semântica.
Responda de forma clara, prestativa e referencie informações do contexto fornecido quando apropriado.
Se a informação não estiver no contexto, diga que não tem certeza baseando-se nas gravações atuais, mas tente ajudar como um assistente de IA geral se a pergunta não for estritamente sobre as gravações.
Use marcações MD para formatar a resposta, por exemplo com listas, negritos, quebras de linhas, quando necessário para organização visual.

Contexto recuperado das gravações:
${relevantChunks
    .map(
        (chunk, i) =>
            `[Trecho ${i + 1}] (Recording ID: ${chunk.recordingId}):\n${chunk.content}`,
    )
    .join("\n\n")}
`;

        const enhancedMessages = [
            { role: "system", content: systemInstruction },
            ...messages,
        ];

        // 4. Executa a geração com OpenAI via Stream Nativo
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
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
        return new Response("Internal Server Error", { status: 500 });
    }
}
