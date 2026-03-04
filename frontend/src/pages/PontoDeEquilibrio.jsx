import React, { useState, useEffect, useMemo } from 'react';
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from '../components/BotaoVoltar/BotaoVoltar';
import '../styles/PontoDeEquilibrio.css';
import api from '../../services/api';

export default function PontoDeEquilibrio() {
  const [isLoading, setIsLoading] = useState(true);
  const [dados, setDados] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/despesas');
        if (response.data) {
          setDados(response.data);
        }
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          console.error("Erro ao buscar dados:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Cálculos financeiros com base no objeto retornado
  const faturamento = Number(dados?.faturamento) || 0;

  const totalFixas = useMemo(() => {
    if (!dados) return 0;
    const somaOutras = dados.despesasFixas.outrasFixas.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
    return Number(dados.despesasFixas.manutencao) + Number(dados.despesasFixas.internet) + Number(dados.despesasFixas.contador) + somaOutras;
  }, [dados]);

  const totalVariaveis = useMemo(() => {
    if (!dados) return 0;
    const impostoValor = (faturamento * Number(dados.despesasVariaveis.impostoPerc)) / 100;
    const taxaCartaoValor = (faturamento * Number(dados.despesasVariaveis.taxaCartaoPerc)) / 100;
    const somaOutras = dados.despesasVariaveis.outrasVariaveis.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
    
    return Number(dados.despesasVariaveis.energia) + impostoValor + taxaCartaoValor + Number(dados.despesasVariaveis.fornecedores) + somaOutras;
  }, [dados, faturamento]);

  const totalDespesas = totalFixas + totalVariaveis;
  const lucro = faturamento - totalDespesas;

  // Cálculo do Ponto de Equilíbrio com tratamento de Margem Negativa
  const pontoEquilibrio = useMemo(() => {
    if (faturamento <= 0) return 0;
    
    // Se o custo variável empata ou supera o faturamento, é impossível ter lucro.
    if (totalVariaveis >= faturamento) return null; 
    
    const margemContribuicao = faturamento - totalVariaveis;
    const indiceMC = margemContribuicao / faturamento;
    return totalFixas / indiceMC;
  }, [faturamento, totalFixas, totalVariaveis]);

  // Helpers de formatação
  const calcPerc = (valor) => (faturamento > 0 ? ((valor / faturamento) * 100).toFixed(2) : '0.00');
  const formatMoney = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (isLoading) {
    return (
      <PageTransition className="financeiro-container">
        <BotaoVoltar />
        <div className="loading-state">Carregando dados financeiros...</div>
      </PageTransition>
    );
  }

  if (!dados) {
    return (
      <PageTransition className="financeiro-container">
        <BotaoVoltar />
        <div className="empty-state">Nenhum registro de despesas encontrado. Cadastre as despesas primeiro.</div>
      </PageTransition>
    );
  }

  // Define se o cálculo é inviável
  const isPEInviavel = pontoEquilibrio === null;

  return (
    <PageTransition className="financeiro-container">
      <BotaoVoltar />
      
      <div className="logo-wrapper">
        <img src="/logo.svg" alt="Logo da Empresa" className="logo" />
      </div>
      
      <h1 className="nomefantasia">GR Marcenaria</h1>
      <h1 className="title-center">Ponto de Equilíbrio</h1>

      <div className="painel-resultados">
        <div className="resumo-linha">
          <span>Faturamento Bruto</span>
          <span className="valor-normal">{formatMoney(faturamento)}</span>
        </div>
        
        <div className="resumo-linha">
          <span>Despesas Fixas</span>
          <span className="valor-normal">{formatMoney(totalFixas)} ({calcPerc(totalFixas)}%)</span>
        </div>
        
        <div className="resumo-linha">
          <span>Despesas Variáveis</span>
          <span className="valor-normal">{formatMoney(totalVariaveis)} ({calcPerc(totalVariaveis)}%)</span>
        </div>
        
        <div className="resumo-linha linha-destaque">
          <span>Total de Despesas</span>
          <span>{formatMoney(totalDespesas)} ({calcPerc(totalDespesas)}%)</span>
        </div>
        
        <div className="resumo-linha linha-lucro" style={{ color: lucro < 0 ? '#e74c3c' : '#27ae60', backgroundColor: lucro < 0 ? '#fdedec' : '#eafaf1' }}>
          <span>Lucro</span>
          <span>{formatMoney(lucro)} ({calcPerc(lucro)}%)</span>
        </div>

        <div className="resumo-linha linha-ponto-equilibrio" style={{ backgroundColor: isPEInviavel ? '#e74c3c' : 'var(--cor-primaria)' }}>
          <div className="pe-info">
            <span className="pe-titulo">Ponto de Equilíbrio (R$)</span>
            <span className="pe-subtitulo">
              {isPEInviavel 
                ? "Custos Variáveis superam o Faturamento. Ajuste os preços!" 
                : "Faturamento mínimo necessário para não ter prejuízo"}
            </span>
          </div>
          <span className="pe-valor" style={{ fontSize: isPEInviavel ? '1.4rem' : '1.8rem' }}>
            {isPEInviavel ? "Inviável" : formatMoney(pontoEquilibrio)}
          </span>
        </div>
      </div>
    </PageTransition>
  );
}