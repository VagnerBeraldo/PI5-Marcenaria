const db = require('../config/db');

const salvarOrcamento = async (dados) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const { extras, ...mestre } = dados;

        const [result] = await connection.execute(
            `INSERT INTO orcamento 
                (id_cliente, id_projeto, nome_projeto, quantidade, dias_trabalho, valor_custo, imposto_importacao, frete, custo_fixo, energia_eletrica, imposto, taxa_cartao, margem_lucro, preco_sugerido, preco_final_impresso, adiantamento) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                mestre.id_cliente || null, mestre.id_projeto || null, mestre.nome_projeto, mestre.quantidade, mestre.dias_trabalho, 
                mestre.valor_custo, mestre.imposto_importacao, mestre.frete, mestre.custo_fixo, mestre.energia_eletrica, mestre.imposto, 
                mestre.taxa_cartao, mestre.margem_lucro, mestre.preco_sugerido, mestre.preco_final_impresso, mestre.adiantamento
            ]
        );

        const id_orcamento = result.insertId;

        if (extras && extras.length > 0) {
            for (const extra of extras) {
                await connection.execute(
                    'INSERT INTO orcamento_extra (id_orcamento, descricao, valor) VALUES (?, ?, ?)',
                    [id_orcamento, extra.descricao, extra.valor]
                );
            }
        }

        await connection.commit();
        return { id_orcamento, success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const listarOrcamentos = async () => {
    const connection = await db.getConnection();
    try {
        const [linhas] = await connection.execute(`
            SELECT 
                o.*,
                c.nome AS nome_cliente,
                COALESCE(
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT('id_extra', oe.id_extra, 'descricao', oe.descricao, 'valor', oe.valor)
                    ) FROM orcamento_extra oe WHERE oe.id_orcamento = o.id_orcamento), 
                    '[]'
                ) AS extras
            FROM orcamento o
            LEFT JOIN clientes c ON o.id_cliente = c.id_cliente
            ORDER BY o.data_orcamento DESC
        `);
        return linhas;
    } finally {
        connection.release();
    }
};

const editarOrcamento = async (id_orcamento, dados) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const { extras, ...mestre } = dados;

        await connection.execute(
            `UPDATE orcamento SET 
                id_cliente = ?, id_projeto = ?, nome_projeto = ?, quantidade = ?, dias_trabalho = ?, valor_custo = ?, 
                imposto_importacao = ?, frete = ?, custo_fixo = ?, energia_eletrica = ?, imposto = ?, 
                taxa_cartao = ?, margem_lucro = ?, preco_sugerido = ?, preco_final_impresso = ?
            WHERE id_orcamento = ?`,
            [
                mestre.id_cliente || null, mestre.id_projeto || null, mestre.nome_projeto, mestre.quantidade, mestre.dias_trabalho, 
                mestre.valor_custo, mestre.imposto_importacao, mestre.frete, mestre.custo_fixo, 
                mestre.energia_eletrica, mestre.imposto, mestre.taxa_cartao, mestre.margem_lucro, mestre.preco_sugerido, mestre.preco_final_impresso,
                id_orcamento
            ]
        );

        // Delete and Recreate para as despesas extras
        await connection.execute('DELETE FROM orcamento_extra WHERE id_orcamento = ?', [id_orcamento]);

        if (extras && extras.length > 0) {
            for (const extra of extras) {
                await connection.execute(
                    'INSERT INTO orcamento_extra (id_orcamento, descricao, valor) VALUES (?, ?, ?)',
                    [id_orcamento, extra.descricao, extra.valor]
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

const excluirOrcamento = async (id_orcamento) => {
    const connection = await db.getConnection();
    try {
        const [result] = await connection.execute('DELETE FROM orcamento WHERE id_orcamento = ?', [id_orcamento]);
        return result.affectedRows > 0;
    } finally {
        connection.release();
    }
};

module.exports = { salvarOrcamento, listarOrcamentos, editarOrcamento, excluirOrcamento };