const db = require('../config/db'); 

const salvarPlanoCompleto = async (dadosMestre) => {
    const { nome_servico, espessura_serra, chapas, pecas } = dadosMestre;
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Insere o Plano (Mestre)
        const [planoResult] = await connection.execute(
            'INSERT INTO plano_corte (nome_servico, espessura_serra) VALUES (?, ?)',
            [nome_servico, espessura_serra]
        );
        const id_plano = planoResult.insertId;

        // 2. Insere Chapas e Peças
        for (const chapa of chapas) {
            const [chapaResult] = await connection.execute(
                'INSERT INTO plano_corte_chapa (id_plano, largura, altura) VALUES (?, ?, ?)',
                [id_plano, chapa.largura, chapa.altura]
            );
            const id_chapa_db = chapaResult.insertId;

            // Filtra as peças desta chapa e ignora linhas vazias
            const pecasDaChapa = pecas.filter(p => p.chapaId === chapa.id && p.nome && p.largura > 0 && p.altura > 0);

            for (const peca of pecasDaChapa) {
                await connection.execute(
                    'INSERT INTO plano_corte_peca (id_chapa, nome_peca, largura, altura, quantidade) VALUES (?, ?, ?, ?, ?)',
                    [id_chapa_db, peca.nome, peca.largura, peca.altura, peca.qtd]
                );
            }
        }

        await connection.commit();
        return { success: true, id_plano };

    } catch (error) {
        await connection.rollback();
        throw error; // Joga o erro para o Controller tratar
    } finally {
        connection.release();
    }
};


const listarPlanos = async () => {
    const connection = await db.getConnection();
    try {
        const [linhas] = await connection.execute(`
            SELECT 
                p.id_plano, 
                p.nome_servico, 
                p.espessura_serra,
                COALESCE(
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT('id', c.id_chapa, 'largura', c.largura, 'altura', c.altura)
                    ) FROM plano_corte_chapa c WHERE c.id_plano = p.id_plano), 
                    '[]'
                ) AS chapas,
                COALESCE(
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT('id', pe.id_peca, 'chapaId', pe.id_chapa, 'nome', pe.nome_peca, 'largura', pe.largura, 'altura', pe.altura, 'qtd', pe.quantidade)
                    ) 
                    FROM plano_corte_peca pe 
                    INNER JOIN plano_corte_chapa c ON pe.id_chapa = c.id_chapa 
                    WHERE c.id_plano = p.id_plano), 
                    '[]'
                ) AS pecas
            FROM plano_corte p
            ORDER BY p.data_criacao DESC
        `);
        return linhas;
    } finally {
        connection.release();
    }
};


const editarPlanoCompleto = async (id_plano, dadosMestre) => {
    const { nome_servico, espessura_serra, chapas, pecas } = dadosMestre;
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Atualiza o Mestre (Plano)
        await connection.execute(
            'UPDATE plano_corte SET nome_servico = ?, espessura_serra = ? WHERE id_plano = ?',
            [nome_servico, espessura_serra, id_plano]
        );

        // 2. Apaga todas as Chapas antigas (As Peças são apagadas automaticamente pelo CASCADE)
        await connection.execute('DELETE FROM plano_corte_chapa WHERE id_plano = ?', [id_plano]);

        // 3. Insere as novas Chapas e Peças atualizadas
        for (const chapa of chapas) {
            const [chapaResult] = await connection.execute(
                'INSERT INTO plano_corte_chapa (id_plano, largura, altura) VALUES (?, ?, ?)',
                [id_plano, chapa.largura, chapa.altura]
            );
            const id_chapa_db = chapaResult.insertId;

            const pecasDaChapa = pecas.filter(p => p.chapaId === chapa.id && p.nome && p.largura > 0 && p.altura > 0);

            for (const peca of pecasDaChapa) {
                await connection.execute(
                    'INSERT INTO plano_corte_peca (id_chapa, nome_peca, largura, altura, quantidade) VALUES (?, ?, ?, ?, ?)',
                    [id_chapa_db, peca.nome, peca.largura, peca.altura, peca.qtd]
                );
            }
        }

        await connection.commit();
        return { success: true };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const excluirPlano = async (id_plano) => {
    const connection = await db.getConnection();
    try {
        const [result] = await connection.execute('DELETE FROM plano_corte WHERE id_plano = ?', [id_plano]);
        return result.affectedRows > 0;
    } finally {
        connection.release();
    }
};

module.exports = { salvarPlanoCompleto, listarPlanos, editarPlanoCompleto, excluirPlano };


