const db = require('../config/db'); 

const salvarPlanoCompleto = async (dadosMestre) => {
    const { id_orcamento, nome_servico, espessura_serra, chapas, pecas } = dadosMestre;
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        let orcamentoId = id_orcamento;

        // Se não veio ID de orçamento, cria um agora só com o nome
        // Isso evita que o Plano de Corte fique "órfão"
        if (!orcamentoId) {
            const [orcamentoResult] = await connection.execute(
                'INSERT INTO orcamento (nome_projeto) VALUES (?)',
                [nome_servico]
            );
            orcamentoId = orcamentoResult.insertId;
        }

        // 1. Insere o Plano vinculado ao ID do Orçamento (novo ou existente)
        const [planoResult] = await connection.execute(
            'INSERT INTO plano_corte (id_orcamento, espessura_serra) VALUES (?, ?)',
            [orcamentoId, espessura_serra]
        );
        const id_plano = planoResult.insertId;

        // 2. Insere Chapas e Peças
        for (const chapa of chapas) {
            const [chapaResult] = await connection.execute(
                'INSERT INTO plano_corte_chapa (id_plano, largura, altura, material) VALUES (?, ?, ?, ?)',
                [id_plano, chapa.largura, chapa.altura, chapa.material || '']
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
        
        // Retorna o sucesso e os IDs para o Frontend sincronizar o contexto
        return { success: true, id_plano, id_orcamento: orcamentoId };

    } catch (err) {
        await connection.rollback();
        console.error("Erro ao carregar orçamento", err);
        throw err;
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
                p.id_orcamento,
                COALESCE(o.nome_projeto, 'Plano em rascunho (ID: ' || p.id_plano || ')') AS nome_servico, 
                p.espessura_serra,
                COALESCE(
                    (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', c.id_chapa, 'largura', c.largura, 'altura', c.altura, 'material', c.material))
                    FROM plano_corte_chapa c WHERE c.id_plano = p.id_plano), '[]'
                ) AS chapas,
                COALESCE(
                    (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', pe.id_peca, 'chapaId', pe.id_chapa, 'nome', pe.nome_peca, 'largura', pe.largura, 'altura', pe.altura, 'qtd', pe.quantidade)) 
                    FROM plano_corte_peca pe INNER JOIN plano_corte_chapa c ON pe.id_chapa = c.id_chapa 
                    WHERE c.id_plano = p.id_plano), '[]'
                ) AS pecas
            FROM plano_corte p
            LEFT JOIN orcamento o ON p.id_orcamento = o.id_orcamento
            ORDER BY p.data_criacao DESC
        `);
        return linhas;
    } finally {
        connection.release();
    }
};

const editarPlanoCompleto = async (id_plano, dadosMestre) => {
    const { id_orcamento, nome_servico, espessura_serra, chapas, pecas } = dadosMestre;
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // Sincroniza o nome do projeto na tabela orcamento, se o id existir
        if (id_orcamento && nome_servico) {
            await connection.execute(
                'UPDATE orcamento SET nome_projeto = ? WHERE id_orcamento = ?',
                [nome_servico, id_orcamento]
            );
        }

        // 1. Atualiza o Mestre (Plano)
        await connection.execute(
            'UPDATE plano_corte SET id_orcamento = ?, espessura_serra = ? WHERE id_plano = ?',
            [id_orcamento || null, espessura_serra, id_plano]
        );

        // 2. Apaga todas as Chapas antigas (As Peças são apagadas automaticamente pelo CASCADE)
        await connection.execute('DELETE FROM plano_corte_chapa WHERE id_plano = ?', [id_plano]);

        // 3. Insere as novas Chapas e Peças atualizadas
        for (const chapa of chapas) {
            const [chapaResult] = await connection.execute(
                'INSERT INTO plano_corte_chapa (id_plano, largura, altura, material) VALUES (?, ?, ?, ?)',
                [id_plano, chapa.largura, chapa.altura, chapa.material || '']
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

    } catch (err) {
        await connection.rollback();
        console.error("Erro ao carregar orçamento", err);
        throw err;
    } finally {
        connection.release();
    }
};

const excluirPlano = async (id_plano) => {
    const connection = await db.getConnection();
    try {
        const [result] = await connection.execute('DELETE FROM plano_corte WHERE id_plano = ?', [id_plano]);
        return result.affectedRows > 0;
    } catch (err) {
        console.error("Erro ao carregar orçamento", err);
        throw err;
    } finally {
        connection.release();
    }
};

const buscarPlanoPorOrcamento = async (id_orcamento) => {
    const connection = await db.getConnection();
    try {
        const [linhas] = await connection.execute(`
            SELECT 
                p.id_plano, 
                p.id_orcamento, 
                o.nome_projeto AS nome_servico, 
                p.espessura_serra,
                COALESCE(
                    (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', c.id_chapa, 'largura', c.largura, 'altura', c.altura, 'material', c.material))
                    FROM plano_corte_chapa c WHERE c.id_plano = p.id_plano), '[]'
                ) AS chapas,
                COALESCE(
                    (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', pe.id_peca, 'chapaId', pe.id_chapa, 'nome', pe.nome_peca, 'largura', pe.largura, 'altura', pe.altura, 'qtd', pe.quantidade)) 
                    FROM plano_corte_peca pe INNER JOIN plano_corte_chapa c ON pe.id_chapa = c.id_chapa 
                    WHERE c.id_plano = p.id_plano), '[]'
                ) AS pecas
            FROM plano_corte p
            INNER JOIN orcamento o ON p.id_orcamento = o.id_orcamento
            WHERE p.id_orcamento = ?
        `, [id_orcamento]);
        return linhas[0] || null; 
    } catch (err) {
        console.error("Erro ao carregar orçamento", err);
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = { salvarPlanoCompleto, listarPlanos, editarPlanoCompleto, excluirPlano, buscarPlanoPorOrcamento };