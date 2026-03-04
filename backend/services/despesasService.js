const db = require('../config/db');

const obterDespesaAtual = async () => {
  const [despesas] = await db.query('SELECT * FROM despesas ORDER BY mes_referencia DESC LIMIT 1');
  
  if (despesas.length === 0) return null;

  const despesaAtual = despesas[0];
  const [adicionais] = await db.query('SELECT * FROM despesas_adicionais WHERE id_despesa = ?', [despesaAtual.id_despesa]);

  return {
    id: despesaAtual.id_despesa, // Fundamental para o frontend bloquear o botão salvar
    faturamento: despesaAtual.faturamento_bruto,
    despesasFixas: {
      manutencao: despesaAtual.manutencao_maquinas,
      internet: despesaAtual.internet_telefone,
      contador: despesaAtual.contador,
      outrasFixas: adicionais.filter(d => d.tipo === 'FIXA').map(d => ({ id: d.id_despesa_add, nome: d.descricao, valor: d.valor }))
    },
    despesasVariaveis: {
      energia: despesaAtual.energia_eletrica,
      impostoPerc: despesaAtual.imposto_perc,
      taxaCartaoPerc: despesaAtual.taxa_cartao_perc,
      fornecedores: despesaAtual.fornecedores,
      outrasVariaveis: adicionais.filter(d => d.tipo === 'VARIAVEL').map(d => ({ id: d.id_despesa_add, nome: d.descricao, valor: d.valor }))
    }
  };
};

const salvarDespesas = async (dados) => {
  const conexao = await db.getConnection();
  try {
    await conexao.beginTransaction();
    const dataAtual = new Date().toISOString().split('T')[0];
    
    const [resultDespesas] = await conexao.query(
      `INSERT INTO despesas (mes_referencia, faturamento_bruto, manutencao_maquinas, internet_telefone, contador, energia_eletrica, imposto_perc, taxa_cartao_perc, fornecedores) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [dataAtual, dados.faturamento || 0, dados.despesasFixas.manutencao || 0, dados.despesasFixas.internet || 0, dados.despesasFixas.contador || 0, dados.despesasVariaveis.energia || 0, dados.despesasVariaveis.impostoPerc || 0, dados.despesasVariaveis.taxaCartaoPerc || 0, dados.despesasVariaveis.fornecedores || 0]
    );

    const idDespesa = resultDespesas.insertId;
    const adicionais = [];
    
    dados.despesasFixas.outrasFixas?.forEach(i => i.nome && i.valor && adicionais.push([idDespesa, 'FIXA', i.nome, i.valor]));
    dados.despesasVariaveis.outrasVariaveis?.forEach(i => i.nome && i.valor && adicionais.push([idDespesa, 'VARIAVEL', i.nome, i.valor]));

    if (adicionais.length > 0) {
      await conexao.query(`INSERT INTO despesas_adicionais (id_despesa, tipo, descricao, valor) VALUES ?`, [adicionais]); 
    }

    await conexao.commit();
    return { id_despesa: idDespesa };
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
};

const atualizarDespesas = async (id, dados) => {
  const conexao = await db.getConnection();
  try {
    await conexao.beginTransaction();

    // 1. Atualiza a tabela principal
    await conexao.query(
      `UPDATE despesas SET faturamento_bruto = ?, manutencao_maquinas = ?, internet_telefone = ?, contador = ?, energia_eletrica = ?, imposto_perc = ?, taxa_cartao_perc = ?, fornecedores = ? WHERE id_despesa = ?`,
      [dados.faturamento || 0, dados.despesasFixas.manutencao || 0, dados.despesasFixas.internet || 0, dados.despesasFixas.contador || 0, dados.despesasVariaveis.energia || 0, dados.despesasVariaveis.impostoPerc || 0, dados.despesasVariaveis.taxaCartaoPerc || 0, dados.despesasVariaveis.fornecedores || 0, id]
    );

    // 2. Remove os itens dinâmicos antigos e insere os novos (abordagem mais segura para arrays editados)
    await conexao.query(`DELETE FROM despesas_adicionais WHERE id_despesa = ?`, [id]);

    const adicionais = [];
    dados.despesasFixas.outrasFixas?.forEach(i => i.nome && i.valor && adicionais.push([id, 'FIXA', i.nome, i.valor]));
    dados.despesasVariaveis.outrasVariaveis?.forEach(i => i.nome && i.valor && adicionais.push([id, 'VARIAVEL', i.nome, i.valor]));

    if (adicionais.length > 0) {
      await conexao.query(`INSERT INTO despesas_adicionais (id_despesa, tipo, descricao, valor) VALUES ?`, [adicionais]);
    }

    await conexao.commit();
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
};

const excluirDespesas = async (id) => {
  // A constraint ON DELETE CASCADE do banco já exclui os registros da tabela despesas_adicionais automaticamente
  await db.query(`DELETE FROM despesas WHERE id_despesa = ?`, [id]);
};

module.exports = { obterDespesaAtual, salvarDespesas, atualizarDespesas, excluirDespesas };