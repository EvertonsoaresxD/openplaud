const postgres = require("postgres");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// Configurações
const DB_URL =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/openplaud";
const VAULT_PATH =
    "D:\\Modelos Obsidian\\Vaults\\LifeOS-vault\\5-Expresso\\Inbox";
const STATE_FILE = path.join(__dirname, "lifeos_sync_state.json");

// Conexão com o Banco de Dados
const sql = postgres(DB_URL);

async function formatMarkdown(recording, transcription, enhancement) {
    const date = new Date(recording.start_time).toISOString().split("T")[0];
    const time = new Date(recording.start_time)
        .toISOString()
        .split("T")[1]
        .substring(0, 5);

    let content = `---
tags: [transcricao, plaud, expresso]
data: ${date}
hora: ${time}
dispositivo: ${recording.device_sn}
---

# 🎙️ ${recording.filename}

`;

    if (enhancement) {
        content += `## 📝 Resumo AI\n${enhancement.summary || ""}\n\n`;

        if (enhancement.key_points && enhancement.key_points.length > 0) {
            content += `### 🎯 Pontos Chave\n`;
            enhancement.key_points.forEach((kp) => {
                content += `- ${kp}\n`;
            });
            content += "\n";
        }

        if (enhancement.action_items && enhancement.action_items.length > 0) {
            content += `### ✅ Action Items\n`;
            enhancement.action_items.forEach((ai) => {
                content += `- [ ] ${ai}\n`;
            });
            content += "\n";
        }
    }

    content += `## 📜 Transcrição Completa\n\n${transcription.text}\n`;

    return content;
}

async function run() {
    console.log("🔄 Iniciando sincronização com LifeOS...");

    if (!fs.existsSync(VAULT_PATH)) {
        console.error(`❌ Pasta do LifeOS não encontrada: ${VAULT_PATH}`);
        process.exit(1);
    }

    let lastSync = 0;
    if (fs.existsSync(STATE_FILE)) {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
        lastSync = state.lastSync || 0;
    }
    const syncTime = new Date("1970-01-01T00:00:00.000Z");
    syncTime.setTime(lastSync);

    try {
        console.log(
            `Buscando transcrições criadas após: ${syncTime.toISOString()}`,
        );

        // Busca transcrições mais recentes que o último sync
        const newTranscriptions = await sql`
            SELECT t.*, 
                   r.filename, r.start_time, r.device_sn, r.duration
            FROM transcriptions t
            JOIN recordings r ON t.recording_id = r.id
            WHERE t.created_at > ${syncTime}
            ORDER BY t.created_at ASC
        `;

        if (newTranscriptions.length === 0) {
            console.log("✅ Nenhuma nova transcrição encontrada.");
            process.exit(0);
        }

        console.log(
            `Encontradas ${newTranscriptions.length} novas transcrições.`,
        );

        let latestTimestamp = syncTime;

        for (const t of newTranscriptions) {
            // Busca enhancements (se houver)
            const enhancements = await sql`
                SELECT * FROM ai_enhancements 
                WHERE recording_id = ${t.recording_id} 
                ORDER BY created_at DESC LIMIT 1
            `;
            const enhancement =
                enhancements.length > 0 ? enhancements[0] : null;

            const markdown = await formatMarkdown(t, t, enhancement);

            // Define o nome do arquivo, limpando caracteres inválidos
            const safeFileName =
                t.filename.replace(/[^a-zA-Z0-9 -_]/g, "").trim() || "Sem_Nome";
            const uuid = t.id.substring(0, 5); // Adiciona um UUID curto caso hajam nomes duplicados
            const finalFilePath = path.join(
                VAULT_PATH,
                `${safeFileName}_${uuid}.md`,
            );

            fs.writeFileSync(finalFilePath, markdown, "utf8");
            console.log(`📄 Arquivo criado no LifeOS: ${finalFilePath}`);

            if (t.created_at > latestTimestamp) {
                latestTimestamp = t.created_at;
            }
        }

        // Atualiza o estado
        fs.writeFileSync(
            STATE_FILE,
            JSON.stringify({ lastSync: new Date(latestTimestamp).getTime() }),
        );
        console.log("✅ Sincronização concluída com sucesso!");
    } catch (err) {
        console.error("❌ Erro durante a sincronização:", err);
    } finally {
        await sql.end();
    }
}

run();
