"use client";

import { Bot, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddProviderDialog } from "@/components/settings/add-provider-dialog";
import { EditProviderDialog } from "@/components/settings/edit-provider-dialog";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { useSettings } from "@/hooks/use-settings";
import { PROMPT_PRESETS } from "@/lib/ai/prompt-presets";

type AISubSection = "providers" | "prompts";

interface Provider {
    id: string;
    provider: string;
    baseUrl: string | null;
    defaultModel: string | null;
    isDefaultTranscription: boolean;
    isDefaultEnhancement: boolean;
    createdAt: Date;
}

interface ProvidersSectionProps {
    initialProviders?: Provider[];
}

export function ProvidersSection({
    initialProviders = [],
}: ProvidersSectionProps) {
    const { isLoadingSettings, isSavingSettings, setIsLoadingSettings } =
        useSettings();
    const [providers, setProviders] = useState<Provider[]>(initialProviders);
    const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
    const [isEditProviderOpen, setIsEditProviderOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<Provider | null>(
        null,
    );
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [aiSubSection, setAiSubSection] = useState<AISubSection>("providers");
    const [selectedPromptId, setSelectedPromptId] = useState<string>("default");
    const [customPrompts, setCustomPrompts] = useState<
        Array<{
            id: string;
            name: string;
            prompt: string;
            createdAt: string;
        }>
    >([]);
    const [editingCustomPrompt, setEditingCustomPrompt] = useState<{
        id?: string;
        name: string;
        prompt: string;
    } | null>(null);
    const [viewingPromptId, setViewingPromptId] = useState<string | null>(null);

    useEffect(() => {
        setProviders(initialProviders);
    }, [initialProviders]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    if (data.titleGenerationPrompt) {
                        const promptConfig = data.titleGenerationPrompt as {
                            selectedPrompt?: string;
                            customPrompts?: Array<{
                                id: string;
                                name: string;
                                prompt: string;
                                createdAt: string;
                            }>;
                        };
                        setSelectedPromptId(
                            promptConfig.selectedPrompt || "default",
                        );
                        setCustomPrompts(promptConfig.customPrompts || []);
                    } else {
                        setSelectedPromptId("default");
                        setCustomPrompts([]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [setIsLoadingSettings]);

    const handlePromptSettingChange = async (config: {
        selectedPrompt: string;
        customPrompts: Array<{
            id: string;
            name: string;
            prompt: string;
            createdAt: string;
        }>;
    }) => {
        try {
            const response = await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    titleGenerationPrompt: config,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save prompt settings");
            }
            toast.success("Configurações de prompt salvas");
        } catch {
            toast.error("Falha ao salvar configurações de prompt");
        }
    };

    const handleSaveCustomPrompt = async (prompt: {
        id?: string;
        name: string;
        prompt: string;
    }) => {
        const isEdit = !!prompt.id;
        const newPrompt = {
            id: prompt.id || nanoid(),
            name: prompt.name,
            prompt: prompt.prompt,
            createdAt: isEdit
                ? customPrompts.find((p) => p.id === prompt.id)?.createdAt ||
                  new Date().toISOString()
                : new Date().toISOString(),
        };

        const updatedPrompts = isEdit
            ? customPrompts.map((p) => (p.id === prompt.id ? newPrompt : p))
            : [...customPrompts, newPrompt];

        setCustomPrompts(updatedPrompts);
        setEditingCustomPrompt(null);

        await handlePromptSettingChange({
            selectedPrompt: selectedPromptId,
            customPrompts: updatedPrompts,
        });
    };

    const handleDeleteCustomPrompt = async (id: string) => {
        if (
            !confirm(
                "Tem certeza de que deseja excluir este prompt personalizado?",
            )
        ) {
            return;
        }

        const updatedPrompts = customPrompts.filter((p) => p.id !== id);
        setCustomPrompts(updatedPrompts);

        const newSelectedPrompt =
            selectedPromptId === id ? "default" : selectedPromptId;

        setSelectedPromptId(newSelectedPrompt);

        await handlePromptSettingChange({
            selectedPrompt: newSelectedPrompt,
            customPrompts: updatedPrompts,
        });
    };

    const refreshProviders = async () => {
        try {
            const response = await fetch("/api/settings/ai/providers");
            if (!response.ok) throw new Error("Failed to fetch");
            const data = await response.json();
            setProviders(data.providers);
        } catch {
            toast.error("Falha ao atualizar provedores");
        }
    };

    const handleEdit = (provider: Provider) => {
        setEditingProvider(provider);
        setIsEditProviderOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza de que deseja excluir este provedor?")) {
            return;
        }

        setDeletingId(id);
        try {
            const response = await fetch(`/api/settings/ai/providers/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Falha ao excluir");
            }

            toast.success("Provedor excluído com sucesso");
            await refreshProviders();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Falha ao excluir o provedor",
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        Configurações de IA
                    </h2>
                    {aiSubSection === "providers" && (
                        <Button
                            onClick={() => setIsAddProviderOpen(true)}
                            size="sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Provedor
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b">
                    <button
                        type="button"
                        onClick={() => setAiSubSection("providers")}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            aiSubSection === "providers"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Provedores
                    </button>
                    <button
                        type="button"
                        onClick={() => setAiSubSection("prompts")}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                            aiSubSection === "prompts"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        Prompts
                    </button>
                </div>

                {/* Providers Section */}
                {aiSubSection === "providers" && (
                    <div>
                        {providers.length === 0 ? (
                            <div className="text-center py-12">
                                <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="font-semibold mb-2">
                                    Nenhum provedor configurado
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Adicione um provedor de IA para habilitar a
                                    transcrição
                                </p>
                                <Button
                                    onClick={() => setIsAddProviderOpen(true)}
                                    size="sm"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar Provedor
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {providers.map((provider) => (
                                    <div
                                        key={provider.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold">
                                                    {provider.provider}
                                                </h3>
                                                {provider.isDefaultTranscription && (
                                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                                                        Transcrição
                                                    </span>
                                                )}
                                                {provider.isDefaultEnhancement && (
                                                    <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded border border-purple-500/20">
                                                        Melhorias
                                                    </span>
                                                )}
                                            </div>
                                            {provider.defaultModel && (
                                                <p className="text-sm text-muted-foreground">
                                                    Modelo:{" "}
                                                    {provider.defaultModel}
                                                </p>
                                            )}
                                            {provider.baseUrl && (
                                                <p className="text-xs text-muted-foreground font-mono truncate">
                                                    {provider.baseUrl}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button
                                                onClick={() =>
                                                    handleEdit(provider)
                                                }
                                                variant="outline"
                                                size="icon"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                onClick={() =>
                                                    handleDelete(provider.id)
                                                }
                                                variant="outline"
                                                size="icon"
                                                disabled={
                                                    deletingId === provider.id
                                                }
                                            >
                                                {deletingId === provider.id ? (
                                                    <div className="animate-spin w-4 h-4 border-2 border-destructive border-t-transparent rounded-full" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Prompts Section */}
                {aiSubSection === "prompts" && (
                    <div className="space-y-6">
                        {isLoadingSettings ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : (
                            <>
                                {/* Selected Prompt */}
                                <div className="space-y-2">
                                    <Label htmlFor="selected-prompt">
                                        Prompt Ativo
                                    </Label>
                                    <Select
                                        value={selectedPromptId}
                                        onValueChange={(value) => {
                                            setSelectedPromptId(value);
                                            handlePromptSettingChange({
                                                selectedPrompt: value,
                                                customPrompts,
                                            });
                                        }}
                                        disabled={isSavingSettings}
                                    >
                                        <SelectTrigger id="selected-prompt">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(PROMPT_PRESETS).map(
                                                (preset) => (
                                                    <SelectItem
                                                        key={preset.id}
                                                        value={preset.id}
                                                    >
                                                        {preset.name}{" "}
                                                        (Predefinição)
                                                    </SelectItem>
                                                ),
                                            )}
                                            {customPrompts.map((prompt) => (
                                                <SelectItem
                                                    key={prompt.id}
                                                    value={prompt.id}
                                                >
                                                    {prompt.name}{" "}
                                                    (Personalizado)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Selecione qual prompt usar para a
                                        geração de títulos
                                    </p>
                                </div>

                                {/* Preset Prompts (Read-only) */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">
                                            Prompts Predefinidos
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {Object.values(PROMPT_PRESETS).map(
                                            (preset) => (
                                                <div
                                                    key={preset.id}
                                                    className="p-4 border rounded-lg"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-medium">
                                                                    {
                                                                        preset.name
                                                                    }
                                                                </h4>
                                                                {selectedPromptId ===
                                                                    preset.id && (
                                                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                                                                        Ativo
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mb-2">
                                                                {
                                                                    preset.description
                                                                }
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                setViewingPromptId(
                                                                    preset.id,
                                                                )
                                                            }
                                                        >
                                                            Ver Prompt
                                                        </Button>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>

                                {/* Custom Prompts */}
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">
                                            Prompts Personalizados
                                        </h3>
                                        <Button
                                            onClick={() =>
                                                setEditingCustomPrompt({
                                                    name: "",
                                                    prompt: "",
                                                })
                                            }
                                            size="sm"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Adicionar Prompt Personalizado
                                        </Button>
                                    </div>
                                    {customPrompts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            Nenhum prompt personalizado ainda.
                                            Crie um para começar.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {customPrompts.map((prompt) => (
                                                <div
                                                    key={prompt.id}
                                                    className="p-4 border rounded-lg"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-medium">
                                                                    {
                                                                        prompt.name
                                                                    }
                                                                </h4>
                                                                {selectedPromptId ===
                                                                    prompt.id && (
                                                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                                                                        Ativo
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setViewingPromptId(
                                                                        prompt.id,
                                                                    )
                                                                }
                                                            >
                                                                Visualizar
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setEditingCustomPrompt(
                                                                        {
                                                                            id: prompt.id,
                                                                            name: prompt.name,
                                                                            prompt: prompt.prompt,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleDeleteCustomPrompt(
                                                                        prompt.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="w-4 h-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* View Prompt Dialog */}
                {viewingPromptId && (
                    <Dialog
                        open={!!viewingPromptId}
                        onOpenChange={(open) =>
                            !open && setViewingPromptId(null)
                        }
                    >
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogTitle>
                                {PROMPT_PRESETS[
                                    viewingPromptId as keyof typeof PROMPT_PRESETS
                                ]?.name ||
                                    customPrompts.find(
                                        (p) => p.id === viewingPromptId,
                                    )?.name ||
                                    "Prompt"}
                            </DialogTitle>
                            <DialogDescription>
                                {PROMPT_PRESETS[
                                    viewingPromptId as keyof typeof PROMPT_PRESETS
                                ]?.description || "Prompt personalizado"}
                            </DialogDescription>
                            <div className="mt-4">
                                <pre className="p-4 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                                    {PROMPT_PRESETS[
                                        viewingPromptId as keyof typeof PROMPT_PRESETS
                                    ]?.prompt ||
                                        customPrompts.find(
                                            (p) => p.id === viewingPromptId,
                                        )?.prompt ||
                                        ""}
                                </pre>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Edit/Create Custom Prompt Dialog */}
                {editingCustomPrompt && (
                    <Dialog
                        open={!!editingCustomPrompt}
                        onOpenChange={(open) =>
                            !open && setEditingCustomPrompt(null)
                        }
                    >
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogTitle>
                                {editingCustomPrompt.id
                                    ? "Editar Prompt Personalizado"
                                    : "Criar Prompt Personalizado"}
                            </DialogTitle>
                            <DialogDescription>
                                Crie um prompt personalizado para a geração de
                                títulos. Use{" "}
                                <code className="px-1 py-0.5 bg-muted rounded">
                                    {"{transcription}"}
                                </code>{" "}
                                como um espaço reservado para o texto da
                                transcrição.
                            </DialogDescription>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="custom-prompt-name">
                                        Nome
                                    </Label>
                                    <Input
                                        id="custom-prompt-name"
                                        value={editingCustomPrompt.name}
                                        onChange={(e) =>
                                            setEditingCustomPrompt({
                                                ...editingCustomPrompt,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="Meu Prompt Personalizado"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="custom-prompt-text">
                                        Prompt
                                    </Label>
                                    <textarea
                                        id="custom-prompt-text"
                                        className="w-full min-h-[300px] px-3 py-2 text-sm border rounded-md resize-y font-mono"
                                        value={editingCustomPrompt.prompt}
                                        onChange={(e) =>
                                            setEditingCustomPrompt({
                                                ...editingCustomPrompt,
                                                prompt: e.target.value,
                                            })
                                        }
                                        placeholder={`Você é um gerador de títulos para gravações de áudio. Gere um título conciso e descritivo com base na transcrição fornecida.

REGRAS (DEVE SEGUIR):
1. Máximo de 60 caracteres (limite estrito)
2. Sem aspas, dois pontos, ponto e vírgula ou sinais de pontuação especiais
3. Use o formato do título (letras iniciais maiúsculas nas palavras importantes)
4. Foco no tópico principal, assunto ou ação discutida
5. Remova palavras de preenchimento, saudações e conversa fiada
6. Seja específico e descritivo, não genérico
7. Se a transcrição for muito curta ou incerta, crie um título significativo com base no contexto
8. Não inclua marcas de tempo, datas ou metadados
9. Não use frases como "Gravação sobre" ou "Discussão de"
10. Retorne APENAS o texto do título, nada mais

Transcrição:
{transcription}

Gere o título agora:`}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setEditingCustomPrompt(null)
                                        }
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            if (
                                                !editingCustomPrompt.name ||
                                                !editingCustomPrompt.prompt
                                            ) {
                                                toast.error(
                                                    "Nome e prompt são obrigatórios",
                                                );
                                                return;
                                            }
                                            handleSaveCustomPrompt(
                                                editingCustomPrompt,
                                            );
                                        }}
                                        disabled={
                                            !editingCustomPrompt.name ||
                                            !editingCustomPrompt.prompt
                                        }
                                    >
                                        {editingCustomPrompt.id
                                            ? "Salvar"
                                            : "Criar"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <AddProviderDialog
                open={isAddProviderOpen}
                onOpenChange={setIsAddProviderOpen}
                onSuccess={() => {
                    setIsAddProviderOpen(false);
                    refreshProviders();
                }}
            />

            <EditProviderDialog
                open={isEditProviderOpen}
                onOpenChange={(open) => {
                    setIsEditProviderOpen(open);
                    if (!open) {
                        setEditingProvider(null);
                    }
                }}
                provider={editingProvider}
                onSuccess={() => {
                    setIsEditProviderOpen(false);
                    setEditingProvider(null);
                    refreshProviders();
                }}
            />
        </>
    );
}
