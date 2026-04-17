"use client";

import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Message {
    role: "user" | "assistant";
    content: string;
    contextsFound?: number;
}

interface AiChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AiChatDialog({ open, onOpenChange }: AiChatDialogProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial greeting
    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([
                {
                    role: "assistant",
                    content:
                        "Olá! Sou seu assistente integrado. Como posso ajudar você com suas gravações hoje?",
                },
            ]);
        }
    }, [open, messages.length]);

    // Auto-scroll
    // biome-ignore lint/correctness/useExhaustiveDependencies: we need to trigger auto-scroll when messages or loading state changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput("");

        const newMessages: Message[] = [
            ...messages,
            { role: "user", content: userMsg },
        ];

        setMessages(newMessages);
        setIsLoading(true);

        try {
            // We format messages properly for the backend endpoint
            const formattedMessages = newMessages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: formattedMessages }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || "Falha na comunicação com a IA");
            }

            const data = await response.json();

            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: data.response,
                    contextsFound: data.contextsFound,
                },
            ]);
        } catch (error) {
            console.error(error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Erro ao enviar mensagem",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl h-[85vh] sm:h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b flex-shrink-0 bg-muted/30">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Assistente AI
                    </DialogTitle>
                </DialogHeader>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                    {messages.map((msg, i) => (
                        <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: simple array render without reordering
                            key={i}
                            className={`flex gap-3 ${
                                msg.role === "user"
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            {msg.role === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex flex-shrink-0 items-center justify-center">
                                    <Bot className="w-5 h-5 text-primary" />
                                </div>
                            )}

                            <div
                                className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${
                                    msg.role === "user"
                                        ? "items-end"
                                        : "items-start"
                                }`}
                            >
                                <div
                                    className={`px-4 py-2.5 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed ${
                                        msg.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted text-foreground rounded-tl-sm"
                                    }`}
                                >
                                    {msg.content}
                                </div>
                                {msg.contextsFound !== undefined && (
                                    <span className="text-[10px] text-muted-foreground mr-1">
                                        Contextos analisados:{" "}
                                        {msg.contextsFound}
                                    </span>
                                )}
                            </div>

                            {msg.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-muted flex flex-shrink-0 items-center justify-center">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div className="px-4 py-3 bg-muted rounded-2xl rounded-tl-sm flex flex-col gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-background">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="Pergunte sobre as suas reuniões e anotações..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className="flex-1 rounded-full px-4"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isLoading}
                            className="rounded-full shrink-0"
                        >
                            <Send className="w-4 h-4" />
                            <span className="sr-only">Enviar</span>
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
