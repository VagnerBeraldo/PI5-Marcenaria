const db = require("../config/db");

const obterCustos = async () => {
  // Retorna os projetos e monta um array interno com os materiais correspondentes usando JSON_ARRAYAGG
  const query = `
    SELECT 
      p.id_projeto, 
      p.nome_modelo AS nome_projeto, /* Alias para não quebrar o Frontend */
      p.mao_de_obra, 
      p.instalacao, 
      p.data_criacao,
      COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id_item', m.id_item, 'material', m.material, 'quantidade', m.quantidade, 
            'unidade_medida', m.unidade_medida, 'valor_unitario', m.valor_unitario, 'subtotal', m.subtotal
          )
        ), '[]'
      ) AS materiais
    FROM custos_projetos p
    LEFT JOIN custos_materiais_itens m ON p.id_projeto = m.projeto_id
    GROUP BY p.id_projeto
    ORDER BY p.data_criacao DESC
  `;
  const [linhas] = await db.query(query);
  return linhas;
};

const salvarCusto = async (dados) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let orcamentoId = dados.id_orcamento;

    // 1. Salva o Mestre (Projeto) PRIMEIRO, pois a tabela orcamento depende do id_projeto gerado aqui
    const [resultProjeto] = await connection.query(
      `INSERT INTO custos_projetos (nome_modelo, mao_de_obra, instalacao) VALUES (?, ?, ?)`,
      [dados.nome_projeto, dados.mao_de_obra, dados.instalacao],
    );
    const idProjeto = resultProjeto.insertId;

    if (!orcamentoId) {
      // Se não existir orçamento, cria um novo já vinculando o id_projeto gerado
      const [orcamentoResult] = await connection.query(
        "INSERT INTO orcamentos (nome_projeto, id_projeto) VALUES (?, ?)",
        [dados.nome_projeto, idProjeto],
      );
      orcamentoId = orcamentoResult.insertId;
    } else {
      // Se já existir um orçamento (ex: veio do Plano de Corte), apenas atualiza a linha vinculando o id_projeto
      await connection.query(
        "UPDATE orcamentos SET id_projeto = ? WHERE id_orcamento = ?",
        [idProjeto, orcamentoId],
      );
    }

    // 2. Salva os Detalhes (Materiais)
    for (const item of dados.materiais) {
      await connection.query(
        `INSERT INTO custos_materiais_itens (projeto_id, material, quantidade, unidade_medida, valor_unitario) VALUES (?, ?, ?, ?, ?)`,
        [
          idProjeto,
          item.material,
          item.quantidade,
          item.unidade_medida,
          item.valor_unitario,
        ],
      );
    }

    await connection.commit();
    return { id_projeto: idProjeto, id_orcamento: orcamentoId };
  } catch (erro) {
    await connection.rollback();
    console.error("Erro ao carregar orçamento", erro);
    throw erro;
  } finally {
    connection.release();
  }
};

const atualizarCusto = async (id, dados) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Atualiza o Mestre - Atualizando a coluna nome_modelo
    await connection.query(
      `UPDATE custos_projetos SET nome_modelo = ?, mao_de_obra = ?, instalacao = ? WHERE id_projeto = ?`,
      [dados.nome_projeto, dados.mao_de_obra, dados.instalacao, id],
    );

    // Sincroniza o nome do projeto na tabela orcamento vinculada
    await connection.query(
      `UPDATE orcamentos SET nome_projeto = ? WHERE id_projeto = ?`,
      [dados.nome_projeto, id],
    );

    // 2. Apaga os materiais antigos e reinsere os novos
    await connection.query(
      `DELETE FROM custos_materiais_itens WHERE projeto_id = ?`,
      [id],
    );

    for (const item of dados.materiais) {
      await connection.query(
        `INSERT INTO custos_materiais_itens (projeto_id, material, quantidade, unidade_medida, valor_unitario) VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          item.material,
          item.quantidade,
          item.unidade_medida,
          item.valor_unitario,
        ],
      );
    }

    await connection.commit();
  } catch (erro) {
    await connection.rollback();
    console.error("Erro ao carregar orçamento", erro);
    throw erro;
  } finally {
    connection.release();
  }
};

const excluirCusto = async (id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Desvincula o projeto do orçamento para não dar erro de restrição de chave e não afetar orçamentos existentes
    await connection.query(
      `UPDATE orcamentos SET id_projeto = NULL WHERE id_projeto = ?`,
      [id],
    );

    // Apagar o projeto apaga automaticamente os itens devido ao ON DELETE CASCADE
    await connection.query(`DELETE FROM custos_projetos WHERE id_projeto = ?`, [
      id,
    ]);

    await connection.commit();
  } catch (erro) {
    await connection.rollback();
    console.error("Erro ao carregar orçamento", erro);
    throw erro;
  } finally {
    connection.release();
  }
};

const obterCustoPorId = async (id_projeto) => {
  const query = `
    SELECT 
      p.id_projeto, 
      o.id_orcamento, /* Adicionado para enviar o id_orcamento ao Frontend e manter a sincronia */
      p.nome_modelo AS nome_projeto, /* Alias para não quebrar o Frontend */
      p.mao_de_obra, 
      p.instalacao, 
      p.data_criacao,
      COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id_item', m.id_item, 'material', m.material, 'quantidade', m.quantidade, 
            'unidade_medida', m.unidade_medida, 'valor_unitario', m.valor_unitario, 'subtotal', m.subtotal
          )
        ), '[]'
      ) AS materiais
    FROM custos_projetos p
    LEFT JOIN orcamentos o ON p.id_projeto = o.id_projeto /* Relacionamento com a tabela orcamentos */
    LEFT JOIN custos_materiais_itens m ON p.id_projeto = m.projeto_id
    WHERE p.id_projeto = ?
    GROUP BY p.id_projeto, o.id_orcamento
  `;
  const [linhas] = await db.query(query, [id_projeto]);
  return linhas[0]; // Retorna apenas o objeto do projeto, não um array
};

module.exports = {
  obterCustos,
  salvarCusto,
  atualizarCusto,
  excluirCusto,
  obterCustoPorId,
};
