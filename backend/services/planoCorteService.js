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

module.exports = { salvarPlanoCompleto };