import pool from './config/db.js';

const migrate = async () => {
    try {
        console.log('🚀 Iniciando migração para Perfis de Leitores...');

        // 1. Adicionar campos extras na tabela de users
        const [columns] = await pool.query('SHOW COLUMNS FROM users');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('title')) {
            await pool.query('ALTER TABLE users ADD COLUMN title VARCHAR(100) DEFAULT "Novato" AFTER level');
            console.log('✅ Coluna "title" adicionada.');
        }

        if (!columnNames.includes('last_active_at')) {
            await pool.query('ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER updated_at');
            console.log('✅ Coluna "last_active_at" adicionada.');
        }

        if (!columnNames.includes('is_public')) {
            await pool.query('ALTER TABLE users ADD COLUMN is_public TINYINT(1) DEFAULT 1 AFTER last_active_at');
            console.log('✅ Coluna "is_public" adicionada.');
        }

        console.log('🎉 Migração concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
};

migrate();
