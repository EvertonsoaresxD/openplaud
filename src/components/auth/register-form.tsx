"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/icons/logo";
import { MetalButton } from "@/components/metal-button";
import { Panel } from "@/components/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";

export function RegisterForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        if (password.length < 8) {
            toast.error("A senha deve ter pelo menos 8 caracteres");
            return;
        }

        setIsLoading(true);

        try {
            const result = await signUp.email({
                email,
                password,
                name,
            });

            if (result.error) {
                toast.error(result.error.message || "Falha ao criar conta");
                return;
            }

            toast.success("Conta criada com sucesso");
            router.push("/onboarding");
            router.refresh();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Falha ao criar conta";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Panel className="w-full max-w-md space-y-6">
            <div className="flex items-center gap-3">
                <Logo className="size-10 shrink-0" />
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Criar Conta
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Comece a usar o OpenPlaud
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="João da Silva"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="voce@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        minLength={8}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>

                <MetalButton
                    type="submit"
                    className="w-full"
                    variant="cyan"
                    disabled={isLoading}
                >
                    {isLoading ? "Criando a conta..." : "Criar Conta"}
                </MetalButton>
            </form>

            <div className="text-center text-sm">
                <span className="text-muted-foreground">
                    Já possui uma conta?{" "}
                </span>
                <Link
                    href="/login"
                    className="text-accent-cyan hover:underline"
                >
                    Entrar
                </Link>
            </div>
        </Panel>
    );
}
