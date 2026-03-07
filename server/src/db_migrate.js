import db from './config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('🚀 Iniciando script de migração do Banco de Dados PostgreSQL...');

    // --- ⏳ Esperar o Banco de Dados (Retry loop) ---
    let retries = 10;
    while (retries > 0) {
        try {
            await db.query('SELECT 1');
            console.log('✅ Banco de Dados está pronto.');
            break;
        } catch (err) {
            retries--;
            console.warn(`⏳ Aguardando banco de dados... (${retries} tentativas restantes)`);
            if (retries === 0) {
                console.error('❌ Falha ao conectar ao banco após 10 tentativas. Abortando migração.');
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, 5000)); // Espera 5s
        }
    }

    // Caminho para o schema.sql
    const schemaPath = path.join(__dirname, '..', '..', 'sql', 'supabase_schema.sql');
    if (!fs.existsSync(schemaPath)) {
        console.error('❌ Arquivo schema.sql não encontrado em:', schemaPath);
        process.exit(1);
    }

    try {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const commands = schemaSql.split(';').map(cmd => cmd.trim()).filter(cmd => cmd.length > 0);

        console.log(`📑 Encontrados ${commands.length} comandos SQL. Executando...`);

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            try {
                const cleanCommand = command.replace(/^\s*--.*$/gm, '').trim();
                if (!cleanCommand) continue;

                await db.query(command);
                if ((i + 1) % 10 === 0) console.log(`⏩ Rodados ${i + 1}/${commands.length} comandos...`);
            } catch (err) {
                if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
                    console.error(`\n❌ Erro no comando ${i + 1}:`, err.message);
                }
            }
        }

        console.log('\n🎉 Migração finalizada com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Erro fatal:', err);
        process.exit(1);
    }
}

runMigration();
