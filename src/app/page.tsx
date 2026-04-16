import {
    ArrowRight,
    Check,
    Clock,
    Cpu,
    Database,
    Download,
    FileText,
    HardDrive,
    Languages,
    Pause,
    Play,
    RefreshCw,
    Search,
    Settings,
    Shield,
    Sparkles,
    Terminal,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { Github } from "@/components/icons/icons";
import { Logo } from "@/components/icons/logo";
import { MetalButton } from "@/components/metal-button";
import { Panel } from "@/components/panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth-server";

export default async function HomePage() {
    const session = await getSession();

    if (session?.user) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">
            {/* Navigation */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <Logo className="size-8" />
                        <span className="text-xl font-bold tracking-tight font-mono">
                            OpenPlaud
                        </span>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Link
                            href="https://github.com/openplaud/openplaud"
                            target="_blank"
                            className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Github className="size-4" />
                            GitHub
                        </Link>
                        <ThemeToggle />
                        <Link href="/login">
                            <MetalButton
                                size="sm"
                                className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary/50 shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                            >
                                Login
                            </MetalButton>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(var(--primary),0.1),transparent)]" />

                    <div className="container mx-auto px-4 text-center relative z-10">
                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]"></span>
                            v1.0 Pronto para Produção
                        </div>

                        <h1 className="text-4xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground/90 to-foreground/50">
                            A Interface Profissional
                            <br />
                            <span className="text-foreground">
                                para Plaud Note
                            </span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                            Pare de pagar assinaturas mensais. Use suas próprias chaves de API, armazene seus dados localmente e obtenha transcrições profissionais com total privacidade.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                            <Link href="/register" className="w-full sm:w-auto">
                                <MetalButton
                                    size="lg"
                                    className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-primary/50 h-14 px-8 text-lg shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                                >
                                    Começar{" "}
                                    <ArrowRight className="size-5" />
                                </MetalButton>
                            </Link>
                            <Link
                                href="https://github.com/openplaud/openplaud"
                                target="_blank"
                                className="w-full sm:w-auto"
                            >
                                <MetalButton
                                    size="lg"
                                    variant="default"
                                    className="w-full sm:w-auto gap-2 bg-background/50 backdrop-blur hover:bg-background/80 h-14 px-8 text-lg"
                                >
                                    <Github className="size-5" /> Ver Código
                                </MetalButton>
                            </Link>
                        </div>

                        {/* Product Demo / Mockup */}
                        <div className="mx-auto max-w-6xl relative perspective-1000">
                            <div className="absolute -inset-4 bg-gradient-to-t from-primary/20 to-transparent opacity-20 blur-3xl -z-10 rounded-full" />
                            <div className="relative rounded-xl border bg-background/50 backdrop-blur shadow-2xl overflow-hidden">
                                {/* Mock Browser/App Header */}
                                <div className="h-12 border-b bg-muted/30 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="size-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                        <div className="size-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                        <div className="size-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                    </div>
                                    <div className="flex-1 text-center text-xs font-mono text-muted-foreground opacity-50">
                                        OpenPlaud - Dashboard
                                    </div>
                                </div>

                                {/* Mock Dashboard Content */}
                                <div className="p-6 bg-background/95">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h1 className="text-2xl font-bold">
                                                Gravações
                                            </h1>
                                            <p className="text-muted-foreground text-sm mt-1">
                                                3 gravações
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-xs text-muted-foreground">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                                Sincronizado agora
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9"
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Sincronizar App
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                                        {/* Left: Recording List */}
                                        <div className="lg:col-span-1">
                                            <Card hasNoPadding>
                                                <CardContent className="p-0">
                                                    <div className="divide-y">
                                                        {[
                                                            {
                                                                id: 1,
                                                                filename:
                                                                    "Reunião Semanal.mp3",
                                                                time: "10:00 AM",
                                                                duration:
                                                                    "45:20",
                                                                size: "24.5 MB",
                                                                active: true,
                                                            },
                                                            {
                                                                id: 2,
                                                                filename:
                                                                    "Roadmap do Produto.mp3",
                                                                time: "Ontem",
                                                                duration:
                                                                    "1:15:00",
                                                                size: "42.1 MB",
                                                                active: false,
                                                            },
                                                            {
                                                                id: 3,
                                                                filename:
                                                                    "Entrevista com Cliente.mp3",
                                                                time: "Há 2 dias",
                                                                duration:
                                                                    "22:15",
                                                                size: "12.8 MB",
                                                                active: false,
                                                            },
                                                        ].map((rec) => (
                                                            <div
                                                                key={rec.id}
                                                                className={`w-full p-4 transition-colors border-l-2 ${
                                                                    rec.active
                                                                        ? "bg-accent border-l-primary"
                                                                        : "hover:bg-accent/50 border-l-transparent"
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <Play className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                            <h3 className="font-medium truncate text-sm">
                                                                                {
                                                                                    rec.filename
                                                                                }
                                                                            </h3>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-6">
                                                                            <div className="flex items-center gap-1">
                                                                                <Clock className="w-3 h-3" />
                                                                                <span>
                                                                                    {
                                                                                        rec.duration
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <HardDrive className="w-3 h-3" />
                                                                                <span>
                                                                                    {
                                                                                        rec.size
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Right: Player & Transcription */}
                                        <div className="lg:col-span-2 space-y-6">
                                            <Card>
                                                <CardHeader className="pb-4">
                                                    <CardTitle className="text-lg">
                                                        Reunião Semanal.mp3
                                                    </CardTitle>
                                                    <p className="text-xs text-muted-foreground">
                                                        Hoje às 10:00
                                                    </p>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <Button
                                                            size="lg"
                                                            className="w-12 h-12 rounded-full shrink-0"
                                                        >
                                                            <Pause className="w-5 h-5" />
                                                        </Button>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-10 flex items-center gap-0.5 opacity-80 mask-image-linear-gradient-to-r from-transparent to-black">
                                                                {Array.from({
                                                                    length: 60,
                                                                }).map(
                                                                    (_, i) => {
                                                                        const height =
                                                                            20 +
                                                                            Math.random() *
                                                                                80;
                                                                        return (
                                                                            <div
                                                                                key={`waveform-${i}-${height}`}
                                                                                className={`flex-1 rounded-full ${
                                                                                    i <
                                                                                    25
                                                                                        ? "bg-primary"
                                                                                        : "bg-primary/20"
                                                                                }`}
                                                                                style={{
                                                                                    height: `${height}%`,
                                                                                }}
                                                                            />
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                                <span>
                                                                    12:45
                                                                </span>
                                                                <span>
                                                                    45:20
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="flex items-center gap-2 text-base">
                                                            <FileText className="w-4 h-4" />
                                                            Transcrição
                                                        </CardTitle>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 text-xs"
                                                            >
                                                                <Download className="w-3 h-3 mr-1" />
                                                                Exportar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="bg-muted/50 rounded-lg p-4">
                                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                                            <span className="text-foreground font-medium">
                                                                Orador A:
                                                            </span>{" "}
                                                            Certo, vamos
                                                            começar. O principal
                                                            objetivo para esta semana
                                                            é finalizar o
                                                            roadmap do Q3.
                                                            <br />
                                                            <br />
                                                            <span className="text-foreground font-medium">
                                                                Orador B:
                                                            </span>{" "}
                                                            Atualizei o
                                                            quadro do Jira com as
                                                            novas solicitações de
                                                            recursos recebidas
                                                            nas ligações com clientes.
                                                            <br />
                                                            <br />
                                                            <span className="text-foreground font-medium">
                                                                Orador A:
                                                            </span>{" "}
                                                            Ótimo. Precisamos nos
                                                            focar na estabilidade
                                                            da integração da API. Tem
                                                            sido um problema recorrente...
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t mt-3">
                                                        <div className="flex items-center gap-1">
                                                            <Languages className="w-3 h-3" />
                                                            <span>
                                                                Idioma:
                                                                Inglês
                                                            </span>
                                                        </div>
                                                        <div>4.281 palavras</div>
                                                        <div className="flex items-center gap-1 ml-auto text-primary">
                                                            <Sparkles className="w-3 h-3" />
                                                            <span>
                                                                Resumo IA Pronto
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-secondary/20 border-y border-border/40">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                                Por que OpenPlaud?
                            </h2>
                            <p className="text-muted-foreground text-lg">
                                Nós construímos isso porque queríamos controle
                                sobre nossos próprios dados. Veja o porquê 
                                você deveria migrar.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FeatureCard
                                icon={<Database className="size-6" />}
                                title="Seus Dados, Seu Disco"
                                description="As gravações são armazenadas no sistema de arquivos local ou no seu próprio S3. Sem fidelidade a provedores, sem uso misterioso da nuvem."
                            />
                            <FeatureCard
                                icon={<Cpu className="size-6" />}
                                title="Traga a sua Própria IA"
                                description="Conecte-se com OpenAI, Anthropic, Groq ou use LLMs locais. Escolha o modelo e valores que se encaixam ao que você busca."
                            />
                            <FeatureCard
                                icon={<Search className="size-6" />}
                                title="Privacidade"
                                description="Sem telemetria e sem rastreio. Use a transcrição offline no próprio browser para manter sua voz totalmente privada."
                            />
                            <FeatureCard
                                icon={<Zap className="size-6" />}
                                title="Sincronização Rápida"
                                description="Sincronização em background mantém a sua lib atualizada sem você precisar carregar nenhum arquivo."
                            />
                            <FeatureCard
                                icon={<Download className="size-6" />}
                                title="Exporte para Onde Quiser"
                                description="Exporte notas com um clique para Markdown, JSON, SRT ou VTT. Perfeito para o Notion, Obsidian ou CapCut."
                            />
                            <FeatureCard
                                icon={<Shield className="size-6" />}
                                title="Código Aberto (AGPL-3.0)"
                                description="Audite o código você mesmo. Contribua com recursos. O rumo do projeto é determinado pela comunidade livre."
                            />
                        </div>
                    </div>
                </section>

                {/* Comparison Section */}
                <section className="py-24 container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">
                            A Alternativa Inteligente
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-8 rounded-2xl border border-border bg-card">
                                <h3 className="text-xl font-bold mb-6 text-muted-foreground">
                                    Nuvem Oficial
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3 text-muted-foreground">
                                        <div className="size-5 rounded-full border border-border flex items-center justify-center shrink-0">
                                            ×
                                        </div>
                                        Mensalidade recorrente e cara
                                    </li>
                                    <li className="flex items-center gap-3 text-muted-foreground">
                                        <div className="size-5 rounded-full border border-border flex items-center justify-center shrink-0">
                                            ×
                                        </div>
                                        Minutos limitados para transcrição
                                    </li>
                                    <li className="flex items-center gap-3 text-muted-foreground">
                                        <div className="size-5 rounded-full border border-border flex items-center justify-center shrink-0">
                                            ×
                                        </div>
                                        Seus aúdios nos servidores deles
                                    </li>
                                    <li className="flex items-center gap-3 text-muted-foreground">
                                        <div className="size-5 rounded-full border border-border flex items-center justify-center shrink-0">
                                            ×
                                        </div>
                                        Sem escolha, apenas o modelo da casa
                                    </li>
                                </ul>
                            </div>

                            <div className="p-8 rounded-2xl border-2 border-primary bg-card relative shadow-lg">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase rounded-full tracking-wider">
                                    OpenPlaud
                                </div>
                                <h3 className="text-xl font-bold mb-6 text-primary">
                                    Auto-Hospedado (O Meu)
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <div className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                            <Check className="size-3" />
                                        </div>
                                        <span className="font-medium">
                                            Grátis para sempre na sua máquina
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                            <Check className="size-3" />
                                        </div>
                                        <span className="font-medium">
                                            100% de minutos limitados pelo seu uso
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                            <Check className="size-3" />
                                        </div>
                                        <span className="font-medium">
                                            Tudo gravado seguro e com backup onde você escolher
                                        </span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                            <Check className="size-3" />
                                        </div>
                                        <span className="font-medium">
                                            Use DeepSeek, Llama, Gemini, o que vier!
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Developer/Deployment Section */}
                <section className="py-20 bg-zinc-950 text-zinc-50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-12">
                            <div className="lg:w-1/2 space-y-6">
                                <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-400">
                                    <Terminal className="mr-2 size-3" />
                                    Suba em Minutos (Zero Config)
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight">
                                    Implante Rápido
                                </h2>
                                <p className="text-zinc-400 text-lg">
                                    Rode de casa em segundos com o seu própro Docker Compose. O OpenPlaud
                                    inclusive cuida das atualizações do BD Sozinho.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <div className="size-2 rounded-full bg-green-500" />
                                        Docker
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <div className="size-2 rounded-full bg-blue-500" />
                                        Next.js 15
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <div className="size-2 rounded-full bg-yellow-500" />
                                        TypeScript
                                    </div>
                                </div>
                            </div>
                            <div className="lg:w-1/2 w-full">
                                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur shadow-2xl overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
                                        <div className="flex gap-1.5">
                                            <div className="size-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                            <div className="size-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                            <div className="size-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                        </div>
                                        <div className="text-xs font-mono text-zinc-500 ml-2">
                                            bash — 80x24
                                        </div>
                                    </div>
                                    <div className="p-6 font-mono text-sm overflow-x-auto">
                                        <div className="flex gap-2">
                                            <span className="text-purple-400">
                                                git
                                            </span>
                                            <span className="text-zinc-300">
                                                clone
                                                https://github.com/openplaud/openplaud.git
                                            </span>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-purple-400">
                                                cd
                                            </span>
                                            <span className="text-zinc-300">
                                                openplaud
                                            </span>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-blue-400">
                                                docker
                                            </span>
                                            <span className="text-zinc-300">
                                                compose up -d
                                            </span>
                                        </div>
                                        <div className="mt-4 text-green-400">
                                            ➜ Container openplaud-web-1 Started
                                            <br />➜ Container openplaud-db-1
                                            Started
                                            <br />➜ App running at
                                            http://localhost:3000
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="container mx-auto px-4 py-24">
                    <div className="bg-primary/5 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden border border-primary/10">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary),0.1),transparent_70%)]" />
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 relative z-10">
                            Pronto para assumir o controle?
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto mb-8 relative z-10">
                            Junte-se à comunidade de profissionais de áudio e
                            desenvolvedores que preferem soluções abertas.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                            <Link href="/register">
                                <MetalButton
                                    size="lg"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 border-primary/50 w-full sm:w-auto"
                                >
                                    Criar Conta
                                </MetalButton>
                            </Link>
                            <Link
                                href="https://github.com/openplaud/openplaud"
                                target="_blank"
                            >
                                <MetalButton
                                    size="lg"
                                    variant="default"
                                    className="bg-background/50 w-full sm:w-auto"
                                >
                                    Dar Estrela no GitHub
                                </MetalButton>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <Panel
            variant="default"
            className="space-y-4 hover:border-primary/50 transition-colors group h-full"
        >
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform text-primary">
                {icon}
            </div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
            </p>
        </Panel>
    );
}
