"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MetalButton } from "@/components/metal-button";
import { Panel } from "@/components/panel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AddProviderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const providerPresets = [
    {
        name: "OpenAI",
        baseUrl: "",
        placeholder: "sk-...",
        defaultModel: "whisper-1",
    },
    {
        name: "Groq",
        baseUrl: "https://api.groq.com/openai/v1",
        placeholder: "gsk_...",
        defaultModel: "whisper-large-v3-turbo",
    },
    {
        name: "Together AI",
        baseUrl: "https://api.together.xyz/v1",
        placeholder: "...",
        defaultModel: "whisper-large-v3",
    },
    {
        name: "OpenRouter",
        baseUrl: "https://openrouter.ai/api/v1",
        placeholder: "sk-or-...",
        defaultModel: "whisper-1",
    },
    {
        name: "LM Studio",
        baseUrl: "http://localhost:1234/v1",
        placeholder: "lm-studio",
        defaultModel: "",
    },
    {
        name: "Ollama",
        baseUrl: "http://localhost:11434/v1",
        placeholder: "ollama",
        defaultModel: "",
    },
    {
        name: "Custom",
        baseUrl: "",
        placeholder: "Sua chave da API",
        defaultModel: "",
    },
];

export function AddProviderDialog({
    open,
    onOpenChange,
    onSuccess,
}: AddProviderDialogProps) {
    const [provider, setProvider] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [defaultModel, setDefaultModel] = useState("");
    const [isDefaultTranscription, setIsDefaultTranscription] = useState(false);
    const [isDefaultEnhancement, setIsDefaultEnhancement] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleProviderChange = (value: string) => {
        setProvider(value);
        const preset = providerPresets.find((p) => p.name === value);
        if (preset) {
            setBaseUrl(preset.baseUrl);
            setDefaultModel(preset.defaultModel);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!provider || !apiKey) {
            toast.error("Provedor e chave da API são obrigatórios");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/settings/ai/providers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider,
                    apiKey,
                    baseUrl: baseUrl || null,
                    defaultModel: defaultModel || null,
                    isDefaultTranscription,
                    isDefaultEnhancement,
                }),
            });

            if (!response.ok) throw new Error("Falha ao adicionar provedor");

            toast.success("Provedor de IA adicionado com sucesso");
            onSuccess();
            onOpenChange(false);

            setProvider("");
            setApiKey("");
            setBaseUrl("");
            setDefaultModel("");
            setIsDefaultTranscription(false);
            setIsDefaultEnhancement(false);
        } catch {
            toast.error("Falha ao adicionar provedor de IA");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedPreset = providerPresets.find((p) => p.name === provider);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Adicionar Provedor de IA</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Provedor</Label>
                        <Select
                            value={provider}
                            onValueChange={handleProviderChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um provedor" />
                            </SelectTrigger>
                            <SelectContent>
                                {providerPresets.map((preset) => (
                                    <SelectItem
                                        key={preset.name}
                                        value={preset.name}
                                    >
                                        {preset.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="apiKey">Chave da API</Label>
                        <Input
                            id="apiKey"
                            type="password"
                            placeholder={
                                selectedPreset?.placeholder ||
                                "Sua chave da API"
                            }
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            disabled={isLoading}
                            className="font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="baseUrl">URL Base (Opcional)</Label>
                        <Input
                            id="baseUrl"
                            type="text"
                            placeholder="https://api.example.com/v1"
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            disabled={isLoading}
                            className="font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="defaultModel">
                            Modelo Padrão (Opcional)
                        </Label>
                        <Input
                            id="defaultModel"
                            type="text"
                            placeholder="whisper-1, gpt-4o, etc."
                            value={defaultModel}
                            onChange={(e) => setDefaultModel(e.target.value)}
                            disabled={isLoading}
                            className="font-mono text-sm"
                        />
                    </div>

                    <Panel variant="inset" className="space-y-2 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isDefaultTranscription}
                                onChange={(e) =>
                                    setIsDefaultTranscription(e.target.checked)
                                }
                                disabled={isLoading}
                            />
                            <span>Usar para transcrição</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isDefaultEnhancement}
                                onChange={(e) =>
                                    setIsDefaultEnhancement(e.target.checked)
                                }
                                disabled={isLoading}
                            />
                            <span>Usar para análises de IA</span>
                        </label>
                    </Panel>

                    <div className="flex gap-2">
                        <MetalButton
                            type="button"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancelar
                        </MetalButton>
                        <MetalButton
                            type="submit"
                            variant="cyan"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading
                                ? "Adicionando..."
                                : "Adicionar Provedor"}
                        </MetalButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
