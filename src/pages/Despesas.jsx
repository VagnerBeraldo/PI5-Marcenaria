// import React, { useState, useMemo } from 'react';
// import PageTransition from "../components/Animation/PageTransition";
// import BotaoVoltar from '../components/BotaoVoltar/BotaoVoltar';
// import '../styles/Despesas.css';

// export default function Despesas() {
//   const [faturamento, setFaturamento] = useState(0);

//   // Despesas Fixas Predefinidas
//   const [manutencao, setManutencao] = useState(0);
//   const [internet, setInternet] = useState(0);
//   const [contador, setContador] = useState(0);
//   const [outrasFixas, setOutrasFixas] = useState([]);

//   // Despesas Variáveis Predefinidas
//   const [energia, setEnergia] = useState(0);
//   const [impostoPerc, setImpostoPerc] = useState(0);
//   const [taxaCartaoPerc, setTaxaCartaoPerc] = useState(0);
//   const [fornecedores, setFornecedores] = useState(0);
//   const [outrasVariaveis, setOutrasVariaveis] = useState([]);

//   // Cálculos dinâmicos
//   const impostoValor = useMemo(() => (faturamento * impostoPerc) / 100, [faturamento, impostoPerc]);
//   const taxaCartaoValor = useMemo(() => (faturamento * taxaCartaoPerc) / 100, [faturamento, taxaCartaoPerc]);

//   const totalFixas = useMemo(() => {
//     const somaOutras = outrasFixas.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
//     return manutencao + internet + contador + somaOutras;
//   }, [manutencao, internet, contador, outrasFixas]);

//   const totalVariaveis = useMemo(() => {
//     const somaOutras = outrasVariaveis.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
//     return energia + impostoValor + taxaCartaoValor + fornecedores + somaOutras;
//   }, [energia, impostoValor, taxaCartaoValor, fornecedores, outrasVariaveis]);

//   const totalDespesas = totalFixas + totalVariaveis;
//   const lucro = faturamento - totalDespesas;

//   // Helpers
//   const calcPerc = (valor) => (faturamento > 0 ? ((valor / faturamento) * 100).toFixed(2) : '0.00');
//   const formatMoney = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

//   const addOutraFixa = () => setOutrasFixas([...outrasFixas, { id: Date.now(), nome: '', valor: 0 }]);
//   const updateOutraFixa = (id, field, value) => {
//     setOutrasFixas(outrasFixas.map(item => (item.id === id ? { ...item, [field]: value } : item)));
//   };

//   const addOutraVariavel = () => setOutrasVariaveis([...outrasVariaveis, { id: Date.now(), nome: '', valor: 0 }]);
//   const updateOutraVariavel = (id, field, value) => {
//     setOutrasVariaveis(outrasVariaveis.map(item => (item.id === id ? { ...item, [field]: value } : item)));
//   };

//   return (
//     <PageTransition className="financeiro-container">
//       <BotaoVoltar/>
//       <div className="logo-wrapper">
//         <img src="/logo.svg" alt="Logo da Empresa" className="logo" />
//       </div>
//       <h1 className="nomefantasia">GR Marcenaria</h1>
//       <h1 className="title-center">Despesas</h1>
//       <h2 className="subtitle-left">Custos</h2>

//       <div className="form-group highlight">
//         <label>Faturamento Bruto</label>
//         <input 
//           type="number" 
//           value={faturamento || ''} 
//           onChange={(e) => setFaturamento(Number(e.target.value))} 
//           placeholder="R$ 0,00" 
//         />
//       </div>

//       <h3 className="section-title">Despesas Fixas</h3>
//       <div className="form-group">
//         <label>Manutenção Preventiva de Máquinas</label>
//         <input type="number" value={manutencao || ''} onChange={(e) => setManutencao(Number(e.target.value))} placeholder="R$ 0,00" />
//       </div>
//       <div className="form-group">
//         <label>Internet e Telefone</label>
//         <input type="number" value={internet || ''} onChange={(e) => setInternet(Number(e.target.value))} placeholder="R$ 0,00" />
//       </div>
//       <div className="form-group">
//         <label>Contador</label>
//         <input type="number" value={contador || ''} onChange={(e) => setContador(Number(e.target.value))} placeholder="R$ 0,00"/>
//       </div>

//       {outrasFixas.map((item) => (
//         <div key={item.id} className="form-row">
//           <div className="form-group flex-2">
//             <label>Descrição</label>
//             <input type="text" value={item.nome} onChange={(e) => updateOutraFixa(item.id, 'nome', e.target.value)}/>
//           </div>
//           <div className="form-group flex-1">
//             <label>Valor (R$)</label>
//             <input type="number" value={item.valor || ''} onChange={(e) => updateOutraFixa(item.id, 'valor', Number(e.target.value))}/>
//           </div>
//         </div>
//       ))}
//       <button className="btn-add" onClick={addOutraFixa}>+ Inserir Outra Despesa Fixa</button>

//       <h3 className="section-title">Despesas Variáveis</h3>
//       <div className="form-group">
//         <label>Energia Elétrica</label>
//         <input type="number" value={energia || ''} onChange={(e) => setEnergia(Number(e.target.value))} placeholder="R$ 0,00"/>
//       </div>
      
//       <div className="form-row">
//         <div className="form-group flex-1">
//           <label>Imposto (%)</label>
//           <input type="number" value={impostoPerc || ''} onChange={(e) => setImpostoPerc(Number(e.target.value))} placeholder="Ex.: 10"/>
//         </div>
//         <div className="form-group flex-2">
//           <label>Valor Calculado (Imposto)</label>
//           <input type="text" value={formatMoney(impostoValor)} disabled className="input-disabled" />
//         </div>
//       </div>

//       <div className="form-row">
//         <div className="form-group flex-1">
//           <label>Taxa de Cartão (%)</label>
//           <input type="number" value={taxaCartaoPerc || ''} onChange={(e) => setTaxaCartaoPerc(Number(e.target.value))} placeholder="Ex.: 3"/>
//         </div>
//         <div className="form-group flex-2">
//           <label>Valor Calculado (Taxa)</label>
//           <input type="text" value={formatMoney(taxaCartaoValor)} disabled className="input-disabled" />
//         </div>
//       </div>

//       <div className="form-group">
//         <label>Fornecedores</label>
//         <input type="number" value={fornecedores || ''} onChange={(e) => setFornecedores(Number(e.target.value))} placeholder="R$ 0,00"/>
//       </div>

//       {outrasVariaveis.map((item) => (
//         <div key={item.id} className="form-row">
//           <div className="form-group flex-2">
//             <label>Descrição</label>
//             <input type="text" value={item.nome} onChange={(e) => updateOutraVariavel(item.id, 'nome', e.target.value)} />
//           </div>
//           <div className="form-group flex-1">
//             <label>Valor (R$)</label>
//             <input type="number" value={item.valor || ''} onChange={(e) => updateOutraVariavel(item.id, 'valor', Number(e.target.value))} />
//           </div>
//         </div>
//       ))}
//       <button className="btn-add" onClick={addOutraVariavel}>+ Inserir Outra Despesa Variável</button>

//       <div className="footer-resumo">
//         <div className="resumo-linha">
//           <span>Despesas Fixas</span>
//           <span>{formatMoney(totalFixas)} ({calcPerc(totalFixas)}%)</span>
//         </div>
//         <div className="resumo-linha">
//           <span>Despesas Variáveis</span>
//           <span>{formatMoney(totalVariaveis)} ({calcPerc(totalVariaveis)}%)</span>
//         </div>
//         <div className="resumo-linha linha-destaque">
//           <span>Total Despesas</span>
//           <span>{formatMoney(totalDespesas)} ({calcPerc(totalDespesas)}%)</span>
//         </div>
//         <div className="resumo-linha linha-lucro">
//           <span>Lucro</span>
//           <span>{formatMoney(lucro)} ({calcPerc(lucro)}%)</span>
//         </div>
//       </div>
//      </PageTransition>
//   );
// }


import React, { useState, useMemo } from 'react';
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from '../components/BotaoVoltar/BotaoVoltar';
import '../styles/Despesas.css';

export default function Despesas() {
  const [faturamento, setFaturamento] = useState(0);

  // Despesas Fixas Predefinidas
  const [manutencao, setManutencao] = useState(0);
  const [internet, setInternet] = useState(0);
  const [contador, setContador] = useState(0);
  const [outrasFixas, setOutrasFixas] = useState([]);

  // Despesas Variáveis Predefinidas
  const [energia, setEnergia] = useState(0);
  const [impostoPerc, setImpostoPerc] = useState(0);
  const [taxaCartaoPerc, setTaxaCartaoPerc] = useState(0);
  const [fornecedores, setFornecedores] = useState(0);
  const [outrasVariaveis, setOutrasVariaveis] = useState([]);

  // Cálculos dinâmicos
  const impostoValor = useMemo(() => (faturamento * impostoPerc) / 100, [faturamento, impostoPerc]);
  const taxaCartaoValor = useMemo(() => (faturamento * taxaCartaoPerc) / 100, [faturamento, taxaCartaoPerc]);

  const totalFixas = useMemo(() => {
    const somaOutras = outrasFixas.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
    return manutencao + internet + contador + somaOutras;
  }, [manutencao, internet, contador, outrasFixas]);

  const totalVariaveis = useMemo(() => {
    const somaOutras = outrasVariaveis.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
    return energia + impostoValor + taxaCartaoValor + fornecedores + somaOutras;
  }, [energia, impostoValor, taxaCartaoValor, fornecedores, outrasVariaveis]);

  const totalDespesas = totalFixas + totalVariaveis;
  const lucro = faturamento - totalDespesas;

  // Helpers
  const calcPerc = (valor) => (faturamento > 0 ? ((valor / faturamento) * 100).toFixed(2) : '0.00');
  const formatMoney = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const addOutraFixa = () => setOutrasFixas([...outrasFixas, { id: Date.now(), nome: '', valor: 0 }]);
  const updateOutraFixa = (id, field, value) => {
    setOutrasFixas(outrasFixas.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addOutraVariavel = () => setOutrasVariaveis([...outrasVariaveis, { id: Date.now(), nome: '', valor: 0 }]);
  const updateOutraVariavel = (id, field, value) => {
    setOutrasVariaveis(outrasVariaveis.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // Preparação para o Banco de Dados
  // const handleSalvar = async () => {
  //   const despesasData = {
  //     faturamento,
  //     despesasFixas: {
  //       manutencao,
  //       internet,
  //       contador,
  //       outrasFixas
  //     },
  //     despesasVariaveis: {
  //       energia,
  //       impostoPerc,
  //       taxaCartaoPerc,
  //       fornecedores,
  //       outrasVariaveis
  //     },
  //     resumo: {
  //       totalFixas,
  //       totalVariaveis,
  //       totalDespesas,
  //       lucro
  //     }
  //   };

        // Chamada da API
  // };

  return (
    <PageTransition className="financeiro-container">
      <BotaoVoltar/>
      <div className="logo-wrapper">
        <img src="/logo.svg" alt="Logo da Empresa" className="logo" />
      </div>
      <h1 className="nomefantasia">GR Marcenaria</h1>
      <h1 className="title-center">Despesas</h1>
      <h2 className="subtitle-left">Custos</h2>

      <div className="form-group highlight">
        <label>Faturamento Bruto</label>
        <input 
          type="number" 
          value={faturamento || ''} 
          onChange={(e) => setFaturamento(Number(e.target.value))} 
          placeholder="R$ 0,00" 
        />
      </div>

      <h3 className="section-title">Despesas Fixas</h3>
      <div className="form-group">
        <label>Manutenção Preventiva de Máquinas</label>
        <input type="number" value={manutencao || ''} onChange={(e) => setManutencao(Number(e.target.value))} placeholder="R$ 0,00" />
      </div>
      <div className="form-group">
        <label>Internet e Telefone</label>
        <input type="number" value={internet || ''} onChange={(e) => setInternet(Number(e.target.value))} placeholder="R$ 0,00" />
      </div>
      <div className="form-group">
        <label>Contador</label>
        <input type="number" value={contador || ''} onChange={(e) => setContador(Number(e.target.value))} placeholder="R$ 0,00"/>
      </div>

      {outrasFixas.map((item) => (
        <div key={item.id} className="form-row">
          <div className="form-group flex-2">
            <label>Descrição</label>
            <input type="text" value={item.nome} onChange={(e) => updateOutraFixa(item.id, 'nome', e.target.value)}/>
          </div>
          <div className="form-group flex-1">
            <label>Valor (R$)</label>
            <input type="number" value={item.valor || ''} onChange={(e) => updateOutraFixa(item.id, 'valor', Number(e.target.value))}/>
          </div>
        </div>
      ))}
      <button className="btn-add" onClick={addOutraFixa}>+ Inserir Outra Despesa Fixa</button>

      <h3 className="section-title">Despesas Variáveis</h3>
      <div className="form-group">
        <label>Energia Elétrica</label>
        <input type="number" value={energia || ''} onChange={(e) => setEnergia(Number(e.target.value))} placeholder="R$ 0,00"/>
      </div>
      
      <div className="form-row">
        <div className="form-group flex-1">
          <label>Imposto (%)</label>
          <input type="number" value={impostoPerc || ''} onChange={(e) => setImpostoPerc(Number(e.target.value))} placeholder="Ex.: 10"/>
        </div>
        <div className="form-group flex-2">
          <label>Valor Calculado (Imposto)</label>
          <input type="text" value={formatMoney(impostoValor)} disabled className="input-disabled" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label>Taxa de Cartão (%)</label>
          <input type="number" value={taxaCartaoPerc || ''} onChange={(e) => setTaxaCartaoPerc(Number(e.target.value))} placeholder="Ex.: 3"/>
        </div>
        <div className="form-group flex-2">
          <label>Valor Calculado (Taxa)</label>
          <input type="text" value={formatMoney(taxaCartaoValor)} disabled className="input-disabled" />
        </div>
      </div>

      <div className="form-group">
        <label>Fornecedores</label>
        <input type="number" value={fornecedores || ''} onChange={(e) => setFornecedores(Number(e.target.value))} placeholder="R$ 0,00"/>
      </div>

      {outrasVariaveis.map((item) => (
        <div key={item.id} className="form-row">
          <div className="form-group flex-2">
            <label>Descrição</label>
            <input type="text" value={item.nome} onChange={(e) => updateOutraVariavel(item.id, 'nome', e.target.value)} />
          </div>
          <div className="form-group flex-1">
            <label>Valor (R$)</label>
            <input type="number" value={item.valor || ''} onChange={(e) => updateOutraVariavel(item.id, 'valor', Number(e.target.value))} />
          </div>
        </div>
      ))}
      <button className="btn-add" onClick={addOutraVariavel}>+ Inserir Outra Despesa Variável</button>

      <div className="footer-resumo">
        <div className="resumo-linha">
          <span>Faturamento</span>
          <span>{formatMoney(faturamento)}</span>
        </div>
        <div className="resumo-linha">
          <span>Despesas Fixas</span>
          <span>{formatMoney(totalFixas)} ({calcPerc(totalFixas)}%)</span>
        </div>
        <div className="resumo-linha">
          <span>Despesas Variáveis</span>
          <span>{formatMoney(totalVariaveis)} ({calcPerc(totalVariaveis)}%)</span>
        </div>
        <div className="resumo-linha linha-destaque">
          <span>Total Despesas</span>
          <span>{formatMoney(totalDespesas)} ({calcPerc(totalDespesas)}%)</span>
        </div>
        <div className="resumo-linha linha-lucro">
          <span>Lucro</span>
          <span>{formatMoney(lucro)} ({calcPerc(lucro)}%)</span>
        </div>
      </div>

      {/* <button className="btn-salvar" onClick={handleSalvar}>
        Salvar Despesas
      </button> */}
    </PageTransition>
  );
}