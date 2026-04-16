"use client";

import {
    ArrowLeft,
    ArrowRight,
    Bot,
    CheckCircle2,
    Mic,
    Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/onboarding-dialog-base";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DEFAULT_SERVER_KEY,
    PLAUD_SERVERS,
    type PlaudServerKey,
} from "@/lib/plaud/servers";

type OnboardingStep = "welcome" | "plaud" | "ai-provider" | "complete";

interface OnboardingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export function OnboardingDialog({
    open,
    onOpenChange,
    onComplete,
}: OnboardingDialogProps) {
    const router = useRouter();
    const [step, setStep] = useState<OnboardingStep>("welcome");
    const [bearerToken, setBearerToken] = useState("");
    const [server, setServer] = useState<PlaudServerKey>(DEFAULT_SERVER_KEY);
    const [customApiBase, setCustomApiBase] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasPlaudConnection, setHasPlaudConnection] = useState(false);
    const [hasAiProvider, setHasAiProvider] = useState(false);

    useEffect(() => {
        if (open && step === "plaud") {
            fetch("/api/plaud/connection")
                .then((res) => res.json())
                .then((data) => {
                    if (data.connected) {
                        setHasPlaudConnection(true);
                        if (data.server) {
                            setServer(data.server as PlaudServerKey);
                        }
                        if (data.apiBase) {
                            setCustomApiBase(data.apiBase);
                        }
                    }
                })
                .catch(() => {});
        }
    }, [open, step]);

    useEffect(() => {
        if (open && step === "ai-provider") {
            fetch("/api/settings/ai/providers")
                .then((res) => res.json())
                .then((data) => {
                    if (data.providers && data.providers.length > 0) {
                        setHasAiProvider(true);
                    }
                })
                .catch(() => {});
        }
    }, [open, step]);

    useEffect(() => {
        if (!open) {
            setStep("welcome");
            setBearerToken("");
            setServer(DEFAULT_SERVER_KEY);
            setCustomApiBase("");
            setIsLoading(false);
            setHasPlaudConnection(false);
            setHasAiProvider(false);
        }
    }, [open]);

    const handlePlaudConnect = async () => {
        if (!bearerToken.trim()) {
            toast.error("Por favor, informe seu bearer token");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/plaud/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bearerToken,
                    server,
                    ...(server === "custom" && { customApiBase }),
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Falha ao conectar");
            }

            toast.success("Dispositivo Plaud conectado");
            setHasPlaudConnection(true);
            setBearerToken("");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Falha ao conectar no Plaud",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkipPlaud = () => {
        setStep("ai-provider");
    };

    const handleSkipAiProvider = () => {
        setStep("complete");
    };

    const handleComplete = async () => {
        try {
            await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ onboardingCompleted: true }),
            });
            onComplete();
            onOpenChange(false);
            router.refresh();
        } catch {
            toast.error("Falha ao concluir a configuração inicial");
        }
    };

    const getStepIndex = () => {
        const steps: OnboardingStep[] = [
            "welcome",
            "plaud",
            "ai-provider",
            "complete",
        ];
        return steps.indexOf(step);
    };

    const isStepCompleted = (stepIndex: number) => {
        const currentIndex = getStepIndex();
        return stepIndex < currentIndex;
    };

    const isStepCurrent = (stepIndex: number) => {
        const currentIndex = getStepIndex();
        return stepIndex === currentIndex;
    };

    const canSkipStep = () => {
        if (step === "plaud") return true;
        if (step === "ai-provider") return true;
        return false;
    };

    const getNextStep = (): OnboardingStep | null => {
        if (step === "welcome") return "plaud";
        if (step === "plaud") return "ai-provider";
        if (step === "ai-provider") return "complete";
        return null;
    };

    const getPrevStep = (): OnboardingStep | null => {
        if (step === "plaud") return "welcome";
        if (step === "ai-provider") return "plaud";
        if (step === "complete") return "ai-provider";
        return null;
    };

    const handleNext = () => {
        const next = getNextStep();
        if (next) setStep(next);
    };

    const handlePrev = () => {
        const prev = getPrevStep();
        if (prev) setStep(prev);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl" hidden>
                        Bem-vindo ao OpenPlaud
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {step === "welcome" && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mic className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold">
                                    Seu Hub de Gravações com IA
                                </h3>
                                <p className="text-muted-foreground">
                                    A OpenPlaud te ajuda a gerenciar e transcrever
                                    suas gravações com IA. Vamos
                                    configurar a sua conta.
                                </p>
                            </div>

                            <div className="grid gap-4">
                                <Card className="gap-0 py-4">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Mic className="w-4 h-4" />
                                            Conecte seu Dispositivo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            Vincule seu botão Plaud para sincronizar
                                            suas gravações de modo automático.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="gap-0 py-4">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Bot className="w-4 h-4" />
                                            Adicione IA
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            Ajuste as chaves de API da LLM
                                            e transcreva local ou remotamente.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="gap-0 py-4">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            Comece a Gravar
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            Tudo pronto! Pressione o botão para gravar
                                            e confira os resultados.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {step === "plaud" && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mic className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold">
                                    Conecte seu Plaud
                                </h3>
                                <p className="text-muted-foreground">
                                    Insira seu Bearer token para sincronizar as
                                    gravações do aparelho à máquina
                                </p>
                            </div>

                            {hasPlaudConnection ? (
                                <Card className="border-primary/50 bg-primary/5 py-3">
                                    <CardContent className="px-4">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    Dispositivo Conectado
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Um Plaud já foi conectado
                                                    à sua conta
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setHasPlaudConnection(false)
                                                }
                                            >
                                                Reconectar
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="gap-0 py-4">
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="api-server">
                                                Servidor da API
                                            </Label>
                                            <Select
                                                value={server}
                                                onValueChange={(v) =>
                                                    setServer(
                                                        v as PlaudServerKey,
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    id="api-server"
                                                    disabled={isLoading}
                                                >
                                                    <SelectValue placeholder="Selecione o servidor da API" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[200]">
                                                    {(
                                                        Object.entries(
                                                            PLAUD_SERVERS,
                                                        ) as [
                                                            PlaudServerKey,
                                                            (typeof PLAUD_SERVERS)[PlaudServerKey],
                                                        ][]
                                                    ).map(([key, s]) => (
                                                        <SelectItem
                                                            key={key}
                                                            value={key}
                                                        >
                                                            {s.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                {
                                                    PLAUD_SERVERS[server]
                                                        .description
                                                }
                                            </p>
                                            {server === "custom" && (
                                                <div className="mt-2">
                                                    <Input
                                                        placeholder="https://api-xxx.plaud.ai"
                                                        value={customApiBase}
                                                        onChange={(e) =>
                                                            setCustomApiBase(
                                                                e.target.value,
                                                            )
                                                        }
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bearer-token">
                                                Bearer Token
                                            </Label>
                                            <Input
                                                id="bearer-token"
                                                type="password"
                                                placeholder="Insira o seu Plaud bearer token"
                                                value={bearerToken}
                                                onChange={(e) =>
                                                    setBearerToken(
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={isLoading}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Acesse plaud.ai por um computador, 
                                                aperte (F12) abrindo console → Network (Rede), 
                                                atualize a página e localize o cabeçalho "Authorization" 
                                                nas requests para a API. Copie aquele calor que inicia
                                                como "Bearer ey...".
                                            </p>
                                        </div>

                                        <Button
                                            onClick={handlePlaudConnect}
                                            disabled={
                                                isLoading || !bearerToken.trim()
                                            }
                                            className="w-full"
                                        >
                                            {isLoading
                                                ? "Conectando..."
                                                : "Conectar Dispositivo"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {step === "ai-provider" && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bot className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold">
                                    Configure IA (Chaves)
                                </h3>
                                <p className="text-muted-foreground">
                                    Adicione uma API Key de IA para ativar a
                                    transcrição e resumos gerados.
                                </p>
                            </div>

                            {hasAiProvider ? (
                                <Card className="border-primary/50 bg-primary/5 py-3">
                                    <CardContent>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    IA Configurada!
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Você detectou uma chave
                                                    para processar textos.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="gap-0 py-4">
                                    <CardContent className="pt-6 space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Você pode ajustar a sua chave depois
                                            no menu Configurações. Isto habilitará
                                            A automação dos serviços.
                                        </p>
                                        <Button
                                            onClick={() => {
                                                onOpenChange(false);
                                                window.location.href =
                                                    "/dashboard?settings=providers";
                                            }}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            Ir para Configurações
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {step === "complete" && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold">
                                    Tudo Pronto!
                                </h3>
                                <p className="text-muted-foreground">
                                    Comece gravando os áudios e nós
                                    gerenciamos todo o restante!
                                </p>
                            </div>

                            <Card className="gap-0 py-4">
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="font-medium">
                                                    Sincronização em background
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Seus áudios serão baixados
                                                    no serviço nos bastidores
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="font-medium">
                                                    Diários via Inteligência Artificial
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Utilize das potentes IA locais ou remotas 
                                                    na transcrição
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="font-medium">
                                                    Personalize livremente
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Altere o tema, o bucket e mais na aba Ajustes.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-3 relative">
                        <div className="flex gap-2 flex-1">
                            {getPrevStep() && (
                                <Button variant="outline" onClick={handlePrev}>
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Voltar
                                </Button>
                            )}
                        </div>

                        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 mt-0.5">
                            {[1, 2, 3, 4].map((stepNum, index) => {
                                const completed = isStepCompleted(index);
                                const current = isStepCurrent(index);
                                return (
                                    <div
                                        key={stepNum}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                            completed || current
                                                ? "bg-primary text-primary-foreground"
                                                : "border-2 border-muted-foreground/30 text-muted-foreground"
                                        }`}
                                    >
                                        {stepNum}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-2 flex-1 justify-end">
                            {canSkipStep() && step !== "complete" && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        if (step === "plaud") handleSkipPlaud();
                                        if (step === "ai-provider")
                                            handleSkipAiProvider();
                                    }}
                                >
                                    Pular
                                </Button>
                            )}
                            {step === "complete" ? (
                                <Button onClick={handleComplete}>
                                    Começar
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                getNextStep() && (
                                    <Button onClick={handleNext}>
                                        Avançar
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )
                            )}
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
