const db = require('../config/db');

const obterCustos = async () => {
  // Retorna os projetos e monta um array interno com os materiais correspondentes usando JSON_ARRAYAGG
  const query = `
    SELECT 
      p.id_projeto, p.nome_projeto, p.mao_de_obra, p.instalacao, p.data_criacao,
      COALESCE(
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id_item', m.id_item, 'material', m.material, 'quantidade', m.quantidade, 
            'unidade_medida', m.unidade_medida, 'valor_unitario', m.valor_unitario, 'subtotal', m.subtotal
          )
        ), '[]'
      ) AS materiais
    FROM custo_projeto p
    LEFT JOIN custo_material_item m ON p.id_projeto = m.projeto_id
    GROUP BY p.id_projeto
    ORDER BY p.data_criacao DESC
  `;
  const [linhas] = await db.query(query);
  return linhas;
};

const salvarCusto = async (dados) => {
  const conexao = await db.getConnection();
  try {
    await conexao.beginTransaction();
    
    // 1. Salva o Mestre (Projeto)
    const [resultProjeto] = await conexao.query(
      `INSERT INTO custo_projeto (nome_projeto, mao_de_obra, instalacao) VALUES (?, ?, ?)`,
      [dados.nome_projeto, dados.mao_de_obra, dados.instalacao]
    );
    const idProjeto = resultProjeto.insertId;

    // 2. Salva os Detalhes (Materiais) iterando o array
    for (const item of dados.materiais) {
      await conexao.query(
        `INSERT INTO custo_material_item (projeto_id, material, quantidade, unidade_medida, valor_unitario) VALUES (?, ?, ?, ?, ?)`,
        [idProjeto, item.material, item.quantidade, item.unidade_medida, item.valor_unitario]
      );
    }
    
    await conexao.commit();
    return { id_projeto: idProjeto };
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
};

const atualizarCusto = async (id, dados) => {
  const conexao = await db.getConnection();
  try {
    await conexao.beginTransaction();
    
    // 1. Atualiza o Mestre
    await conexao.query(
      `UPDATE custo_projeto SET nome_projeto = ?, mao_de_obra = ?, instalacao = ? WHERE id_projeto = ?`,
      [dados.nome_projeto, dados.mao_de_obra, dados.instalacao, id]
    );
    
    // 2. Apaga os materiais antigos e reinsere os novos (forma mais limpa e livre de resíduos no MySQL)
    await conexao.query(`DELETE FROM custo_material_item WHERE projeto_id = ?`, [id]);
    
    for (const item of dados.materiais) {
      await conexao.query(
        `INSERT INTO custo_material_item (projeto_id, material, quantidade, unidade_medida, valor_unitario) VALUES (?, ?, ?, ?, ?)`,
        [id, item.material, item.quantidade, item.unidade_medida, item.valor_unitario]
      );
    }
    
    await conexao.commit();
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
};

const excluirCusto = async (id) => {
  const conexao = await db.getConnection();
  try {
    await conexao.beginTransaction();
    // Apagar o projeto apaga automaticamente os itens devido ao ON DELETE CASCADE
    await conexao.query(`DELETE FROM custo_projeto WHERE id_projeto = ?`, [id]);
    await conexao.commit();
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
};

module.exports = { obterCustos, salvarCusto, atualizarCusto, excluirCusto };