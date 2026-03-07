import db from './config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('🚀 Iniciando migração do Banco de Dados PostgreSQL...');

    // Caminho para o schema.sql
    const schemaPath = path.join(__dirname, '..', '..', 'sql', 'supabase_schema.sql');

    if (!fs.existsSync(schemaPath)) {
        console.error('❌ Arquivo schema.sql não encontrado em:', schemaPath);
        process.exit(1);
    }

    try {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Divide o SQL por ';' mas cuida para não quebrar dentro de funções ou strings complexas
        // Para o schema fornecido, dividir por ';' resolve a maioria dos casos simples de DDL
        const commands = schemaSql
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0);

        console.log(`📑 Encontrados ${commands.length} comandos SQL. Executando...`);

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            try {
                // Remove comentários de linha únicas no início para o log ficar limpo
                const cleanCommand = command.replace(/^\s*--.*$/gm, '').trim();
                if (!cleanCommand) continue;

                await db.query(command);
                process.stdout.write(`\r✅ Progress: [${i + 1}/${commands.length}]`);
            } catch (err) {
                // Alguns erros como "already exists" são ignorados se usarmos CREATE IF NOT EXISTS,
                // mas logamos erros reais.
                if (!err.message.includes('already exists')) {
                    console.error(`\n❌ Erro no comando ${i + 1}:`, err.message);
                    console.error('SQL:', command.substring(0, 100) + '...');
                }
            }
        }

        console.log('\n\n🎉 Migração finalizada com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Erro fatal durante a migração:', err);
        process.exit(1);
    }
}

runMigration();
