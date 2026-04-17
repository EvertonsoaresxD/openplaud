"use client";

import { Download, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/use-settings";

const exportFormatOptions = [
    {
        label: "JSON",
        value: "json",
        description: "Formato de dados estruturado",
    },
    { label: "TXT", value: "txt", description: "Formato de texto simples" },
    { label: "SRT", value: "srt", description: "Formato de legenda" },
    { label: "VTT", value: "vtt", description: "Formato de legenda WebVTT" },
];

const backupFrequencyOptions = [
    { label: "Nunca", value: "never" },
    { label: "Diariamente", value: "daily" },
    { label: "Semanalmente", value: "weekly" },
    { label: "Mensalmente", value: "monthly" },
];

interface ExportSectionProps {
    onReRunOnboarding?: () => void;
}

export function ExportSection({ onReRunOnboarding }: ExportSectionProps) {
    const { isLoadingSettings, isSavingSettings, setIsLoadingSettings } =
        useSettings();
    const [defaultExportFormat, setDefaultExportFormat] = useState("json");
    const [autoExport, setAutoExport] = useState(false);
    const [backupFrequency, setBackupFrequency] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/settings/user");
                if (response.ok) {
                    const data = await response.json();
                    setDefaultExportFormat(data.defaultExportFormat ?? "json");
                    setAutoExport(data.autoExport ?? false);
                    setBackupFrequency(data.backupFrequency ?? null);
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [setIsLoadingSettings]);

    const handleExportBackupSettingChange = async (updates: {
        defaultExportFormat?: string;
        autoExport?: boolean;
        backupFrequency?: string | null;
    }) => {
        const previousValues: Record<string, unknown> = {};
        if (updates.defaultExportFormat !== undefined) {
            previousValues.defaultExportFormat = defaultExportFormat;
            setDefaultExportFormat(updates.defaultExportFormat);
        }
        if (updates.autoExport !== undefined) {
            previousValues.autoExport = autoExport;
            setAutoExport(updates.autoExport);
        }
        if (updates.backupFrequency !== undefined) {
            previousValues.backupFrequency = backupFrequency;
            setBackupFrequency(updates.backupFrequency);
        }

        try {
            const response = await fetch("/api/settings/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error("Falha ao salvar configurações");
            }
        } catch {
            if (updates.defaultExportFormat !== undefined) {
                const prev = previousValues.defaultExportFormat;
                if (typeof prev === "string") setDefaultExportFormat(prev);
            }
            if (updates.autoExport !== undefined) {
                const prev = previousValues.autoExport;
                if (typeof prev === "boolean") setAutoExport(prev);
            }
            if (updates.backupFrequency !== undefined) {
                const prev = previousValues.backupFrequency;
                if (typeof prev === "string" || prev === null)
                    setBackupFrequency(prev);
            }
            toast.error("Falha ao salvar configurações. Mudanças revertidas.");
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch(
                `/api/export?format=${defaultExportFormat}`,
            );
            if (!response.ok) throw new Error("Falha na exportação");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download =
                response.headers
                    .get("Content-Disposition")
                    ?.split("filename=")[1]
                    ?.replace(/"/g, "") || `export.${defaultExportFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success("Exportação concluída");
        } catch {
            toast.error("Falha ao exportar gravações");
        } finally {
            setIsExporting(false);
        }
    };

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const response = await fetch("/api/backup", { method: "POST" });
            if (!response.ok) throw new Error("Falha ao criar backup");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download =
                response.headers
                    .get("Content-Disposition")
                    ?.split("filename=")[1]
                    ?.replace(/"/g, "") || "backup.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success("Backup criado");
        } catch {
            toast.error("Falha ao criar backup");
        } finally {
            setIsBackingUp(false);
        }
    };

    if (isLoadingSettings) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <Download className="w-5 h-5" />
                Configurações de Exportação/Backup
            </h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="export-format">
                        Formato de exportação padrão
                    </Label>
                    <Select
                        value={defaultExportFormat}
                        onValueChange={(value) => {
                            setDefaultExportFormat(value);
                            handleExportBackupSettingChange({
                                defaultExportFormat: value,
                            });
                        }}
                        disabled={isSavingSettings}
                    >
                        <SelectTrigger id="export-format" className="w-full">
                            <SelectValue>
                                {exportFormatOptions.find(
                                    (opt) => opt.value === defaultExportFormat,
                                )?.label || "JSON"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {exportFormatOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    <div>
                                        <div>{option.label}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {option.description}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between opacity-60">
                    <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="auto-export" className="text-base">
                                Exportar novas gravações automaticamente
                            </Label>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                Em breve
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Exportar gravações automaticamente quando forem
                            sincronizadas
                        </p>
                    </div>
                    <Switch
                        id="auto-export"
                        checked={autoExport}
                        onCheckedChange={(checked) => {
                            setAutoExport(checked);
                            handleExportBackupSettingChange({
                                autoExport: checked,
                            });
                        }}
                        disabled={true}
                    />
                </div>

                <div className="space-y-2 opacity-60">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="backup-frequency">
                            Frequência de backup
                        </Label>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            Em breve
                        </span>
                    </div>
                    <Select
                        value={backupFrequency || "never"}
                        onValueChange={(value) => {
                            const frequency = value === "never" ? null : value;
                            setBackupFrequency(frequency);
                            handleExportBackupSettingChange({
                                backupFrequency: frequency,
                            });
                        }}
                        disabled={true}
                    >
                        <SelectTrigger id="backup-frequency" className="w-full">
                            <SelectValue>
                                {backupFrequencyOptions.find(
                                    (opt) =>
                                        opt.value ===
                                        (backupFrequency || "never"),
                                )?.label || "Nunca"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {backupFrequencyOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Com que frequência criar backups automaticamente
                    </p>
                </div>
            </div>

            <div className="pt-4 border-t space-y-3">
                <div className="space-y-2">
                    <Label className="text-base">Ações Manuais</Label>
                    <Button
                        onClick={async () => {
                            try {
                                await fetch("/api/settings/user", {
                                    method: "PUT",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        onboardingCompleted: false,
                                    }),
                                });
                                onReRunOnboarding?.();
                            } catch {
                                toast.error("Falha ao redefinir o onboarding");
                            }
                        }}
                        variant="outline"
                        className="w-full"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refazer o Onboarding
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Redefine o onboarding para vê-lo novamente em sua
                        próxima visita
                    </p>
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            variant="outline"
                            className="flex-1"
                        >
                            {isExporting ? (
                                <>
                                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full" />
                                    Exportando...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Exportar Tudo
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={handleBackup}
                            disabled={isBackingUp}
                            variant="outline"
                            className="flex-1"
                        >
                            {isBackingUp ? (
                                <>
                                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-primary border-t-transparent rounded-full" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Criar Backup
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
