const db = require('../config/db');

const obterDespesaAtual = async () => {
  const [despesas] = await db.query('SELECT * FROM despesas ORDER BY mes_referencia DESC LIMIT 1');
  
  if (despesas.length === 0) {
    return null;
  }

  const despesaAtual = despesas[0];
  const [adicionais] = await db.query('SELECT * FROM despesas_adicionais WHERE id_despesa = ?', [despesaAtual.id_despesa]);

  return {
    faturamento: despesaAtual.faturamento_bruto,
    despesasFixas: {
      manutencao: despesaAtual.manutencao_maquinas,
      internet: despesaAtual.internet_telefone,
      contador: despesaAtual.contador,
      outrasFixas: adicionais
        .filter(d => d.tipo === 'FIXA')
        .map(d => ({ id: d.id_despesa_add, nome: d.descricao, valor: d.valor }))
    },
    despesasVariaveis: {
      energia: despesaAtual.energia_eletrica,
      impostoPerc: despesaAtual.imposto_perc,
      taxaCartaoPerc: despesaAtual.taxa_cartao_perc,
      fornecedores: despesaAtual.fornecedores,
      outrasVariaveis: adicionais
        .filter(d => d.tipo === 'VARIAVEL')
        .map(d => ({ id: d.id_despesa_add, nome: d.descricao, valor: d.valor }))
    }
  };
};

const salvarDespesas = async (dados) => {
  // Pega uma conexão exclusiva do pool para garantir a transação isolada
  const conexao = await db.getConnection();
  
  try {
    await conexao.beginTransaction();

    // 1. Insere na tabela pai (despesas)
    const dataAtual = new Date().toISOString().split('T')[0]; // Ex: 2026-03-01
    
    const queryDespesas = `
      INSERT INTO despesas 
      (mes_referencia, faturamento_bruto, manutencao_maquinas, internet_telefone, contador, energia_eletrica, imposto_perc, taxa_cartao_perc, fornecedores)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const valoresDespesas = [
      dataAtual,
      dados.faturamento || 0,
      dados.despesasFixas.manutencao || 0,
      dados.despesasFixas.internet || 0,
      dados.despesasFixas.contador || 0,
      dados.despesasVariaveis.energia || 0,
      dados.despesasVariaveis.impostoPerc || 0,
      dados.despesasVariaveis.taxaCartaoPerc || 0,
      dados.despesasVariaveis.fornecedores || 0
    ];

    const [resultDespesas] = await conexao.query(queryDespesas, valoresDespesas);
    const idDespesa = resultDespesas.insertId;

    // 2. Prepara inserção em lote na tabela filha (despesas_adicionais)
    const adicionais = [];
    
    if (dados.despesasFixas.outrasFixas && dados.despesasFixas.outrasFixas.length > 0) {
      dados.despesasFixas.outrasFixas.forEach(item => {
        if (item.nome && item.valor) {
          adicionais.push([idDespesa, 'FIXA', item.nome, item.valor]);
        }
      });
    }

    if (dados.despesasVariaveis.outrasVariaveis && dados.despesasVariaveis.outrasVariaveis.length > 0) {
      dados.despesasVariaveis.outrasVariaveis.forEach(item => {
        if (item.nome && item.valor) {
          adicionais.push([idDespesa, 'VARIAVEL', item.nome, item.valor]);
        }
      });
    }

    // Executa a inserção em lote se houver itens
    if (adicionais.length > 0) {
      const queryAdicionais = `INSERT INTO despesas_adicionais (id_despesa, tipo, descricao, valor) VALUES ?`;
      await conexao.query(queryAdicionais, [adicionais]); 
    }

    // Confirma a transação
    await conexao.commit();
    return { id_despesa: idDespesa };

  } catch (erro) {
    // Reverte todas as operações caso qualquer uma falhe
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release(); // Devolve a conexão ao pool
  }
};

module.exports = {
  obterDespesaAtual,
  salvarDespesas
};