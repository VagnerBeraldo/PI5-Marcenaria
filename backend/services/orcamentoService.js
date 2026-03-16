const db = require("../config/db");

const salvarOrcamento = async (dados) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { extras, ...mestre } = dados;
    // 0. Insere o nome do cliente, somente o nome
    if (!mestre.id_cliente && mestre.nome_cliente) {
      const [resultCliente] = await connection.execute(
        "INSERT INTO clientes (nome) VALUES (?)",
        [mestre.nome_cliente],
      );
      mestre.id_cliente = resultCliente.insertId;
    }

    // 1. Insere o Orçamento Mestre (INCLUÍDO outras_var)
    const [result] = await connection.execute(
      `INSERT INTO orcamentos 
                (id_cliente, id_projeto, nome_projeto, quantidade, dias_trabalho, valor_custo, imposto_importacao, frete, custo_fixo, energia_eletrica, outras_var, imposto, taxa_cartao, margem_lucro, desconto, preco_sugerido, preco_final_impresso, entrada, situacao) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'gerado')`,
      [
        mestre.id_cliente || null,
        mestre.id_projeto || null,
        mestre.nome_projeto,
        mestre.quantidade,
        mestre.dias_trabalho,
        mestre.valor_custo,
        mestre.imposto_importacao,
        mestre.frete,
        mestre.custo_fixo,
        mestre.energia_eletrica,
        mestre.outras_var !== undefined ? mestre.outras_var : 0,
        mestre.imposto,
        mestre.taxa_cartao,
        mestre.margem_lucro,
        mestre.desconto,
        mestre.preco_sugerido,
        mestre.preco_final_impresso,
        mestre.entrada,
      ],
    );

    const id_orcamento = result.insertId;

    // Se houver um nome de projeto, procura-se um plano de corte avulso com esse nome e vincula-o ao orçamento
    await connection.execute(
      `UPDATE planos_corte SET id_orcamento = ? 
             WHERE id_orcamento IS NULL AND id_plano IN (
                /* Subquery para segurança: vincula o plano mais recente que tenha o nome vindo do fluxo anterior */
                SELECT id_plano FROM (
                    SELECT p.id_plano FROM planos_corte p 
                    LEFT JOIN orcamentos o ON p.id_orcamento = o.id_orcamento
                    WHERE o.id_orcamento IS NULL
                ) AS tmp
             ) LIMIT 1`,
      [id_orcamento],
    );

    // 3. Insere os Extras
    if (extras && extras.length > 0) {
      for (const extra of extras) {
        await connection.execute(
          "INSERT INTO orcamentos_extras (id_orcamento, descricao, valor) VALUES (?, ?, ?)",
          [id_orcamento, extra.descricao, extra.valor],
        );
      }
    }

    await connection.commit();
    return { id_orcamento, id_cliente: mestre.id_cliente, success: true };
  } catch (err) {
    await connection.rollback();
    console.error("Erro ao carregar orçamento", err);
    throw err;
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
                    ) FROM orcamentos_extras oe WHERE oe.id_orcamento = o.id_orcamento), 
                    '[]'
                ) AS extras
            FROM orcamentos o
            LEFT JOIN clientes c ON o.id_cliente = c.id_cliente
            ORDER BY o.data_orcamento DESC
        `);
    return linhas;
  } catch (err) {
    console.error("Erro ao carregar orçamento", err);
    throw err;
  } finally {
    connection.release();
  }
};

const editarOrcamento = async (id_orcamento, dados) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { extras, ...mestre } = dados;

    if (mestre.id_cliente && mestre.nome_cliente) {
      await connection.execute(
        "UPDATE clientes SET nome = ? WHERE id_cliente = ?",
        [mestre.nome_cliente, mestre.id_cliente],
      );
    } else if (!mestre.id_cliente && mestre.nome_cliente) {
      const [resultCliente] = await connection.execute(
        "INSERT INTO clientes (nome) VALUES (?)",
        [mestre.nome_cliente],
      );
      mestre.id_cliente = resultCliente.insertId;
    }

    await connection.execute(
      `UPDATE orcamentos SET 
                id_cliente = ?, id_projeto = ?, nome_projeto = ?, quantidade = ?, dias_trabalho = ?, valor_custo = ?, 
                imposto_importacao = ?, frete = ?, custo_fixo = ?, energia_eletrica = ?, outras_var = ?, imposto = ?, 
                taxa_cartao = ?, margem_lucro = ?, desconto = ?, preco_sugerido = ?, preco_final_impresso = ?, entrada = ?, situacao = 'gerado'            
            WHERE id_orcamento = ?`,
      [
        mestre.id_cliente || null,
        mestre.id_projeto || null,
        mestre.nome_projeto,
        mestre.quantidade,
        mestre.dias_trabalho,
        mestre.valor_custo,
        mestre.imposto_importacao,
        mestre.frete,
        mestre.custo_fixo,
        mestre.energia_eletrica,
        mestre.outras_var !== undefined ? mestre.outras_var : 0, // Fallback
        mestre.imposto,
        mestre.taxa_cartao,
        mestre.margem_lucro,
        mestre.desconto,
        mestre.preco_sugerido,
        mestre.preco_final_impresso,
        mestre.entrada,
        id_orcamento,
      ],
    );

    await connection.execute(
      "DELETE FROM orcamentos_extras WHERE id_orcamento = ?",
      [id_orcamento],
    );

    if (extras && extras.length > 0) {
      for (const extra of extras) {
        await connection.execute(
          "INSERT INTO orcamentos_extras (id_orcamento, descricao, valor) VALUES (?, ?, ?)",
          [id_orcamento, extra.descricao, extra.valor],
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

const excluirOrcamento = async (id_orcamento) => {
  const connection = await db.getConnection();
  try {
    const [result] = await connection.execute(
      "DELETE FROM orcamentos WHERE id_orcamento = ?",
      [id_orcamento],
    );
    return result.affectedRows > 0;
  } catch (err) {
    console.error("Erro ao carregar orçamento", err);
    throw err;
  } finally {
    connection.release();
  }
};

const buscarOrcamentosPorCliente = async (id_cliente) => {
  const connection = await db.getConnection();
  try {
    const [linhas] = await connection.execute(
      `
            SELECT 
                o.*,
                c.nome AS nome_cliente,
                COALESCE(
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT('id_extra', oe.id_extra, 'descricao', oe.descricao, 'valor', oe.valor)
                    ) FROM orcamentos_extras oe WHERE oe.id_orcamento = o.id_orcamento), 
                    '[]'
                ) AS extras
            FROM orcamentos o
            LEFT JOIN clientes c ON o.id_cliente = c.id_cliente
            WHERE o.id_cliente = ?
            ORDER BY o.data_orcamento DESC
        `,
      [id_cliente],
    );
    return linhas;
  } catch (err) {
    console.error("Erro ao carregar orçamento", err);
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = {
  salvarOrcamento,
  listarOrcamentos,
  editarOrcamento,
  excluirOrcamento,
  buscarOrcamentosPorCliente,
};
