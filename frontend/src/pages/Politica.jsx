import React from "react";
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from "../components/BotaoVoltar/BotaoVoltar";
import NavegacaoFluxo from "../components/NavegacaoFluxo/NavegacaoFluxo";
import "../styles/ContainerVoltarNovo.css";
import "../styles/Politica.css";

export default function Politica() {
  return (
    <PageTransition className="politica-container">
      <div className="card-cliente">
        <div className="wrapper-header-actions">
          <div className="header-actions">
            <BotaoVoltar />
          </div>
        </div>
        <img src="/logo.svg" alt="Logo" className="logo-img" />
        <h1 className="nome-fantasia">GR Marcenaria</h1>

        <section className="politica-secao">
          <h1 className="titulo-pagina">Termos de Uso</h1>
          <p className="politica-texto">
            Seja bem-vindo ao sistema de gestão da <strong>DEVTech</strong>. Ao
            acessar e utilizar esta plataforma para simulação de orçamentos,
            acompanhamento de projetos e controle financeiro, você concorda
            explicitamente com os termos e condições abaixo estipulados.
          </p>

          <h2 className="politica-subtitulo">1. Escopo do Sistema</h2>
          <p className="politica-texto">
            Esta plataforma visa a profissionalização da gestão da marcenaria
            através da padronização de precificação (insumos, custos
            operacionais e impostos), Demonstrativo de Resultado por Exercício (DRE) 
            e emissão de orçamentos estruturados.
          </p>

          <h2 className="politica-subtitulo">
            2. Responsabilidade pelas Informações
          </h2>
          <p className="politica-texto">
            O usuário é inteiramente responsável pela exatidão dos dados
            inseridos no sistema (metragens, valores de insumos e especificações
            técnicas de móveis). A DEVTech não se responsabiliza por erros
            decorrentes de parametrizações incorretas feitas pelo operador.
          </p>

          <h2 className="politica-subtitulo">3. Propriedade Intelectual</h2>
          <p className="politica-texto">
            A arquitetura lógica do sistema, algoritmos de cálculo de ponto de
            equilíbrio e o design da interface são de propriedade exclusiva da
            DEVTech. É vedada qualquer tentativa de engenharia reversa ou
            reprodução sem autorização prévia.
          </p>
        </section>

        <hr className="politica-divisor" />

        <section className="politica-secao">
          <h1 className="titulo-pagina">Política de Privacidade</h1>
          <p className="politica-texto">
            A DEVTech preza pela segurança dos seus dados em conformidade
            com a Lei Geral de Proteção de Dados (LGPD). Esta política descreve
            como tratamos as informações coletadas no sistema.
          </p>

          <h2 className="politica-subtitulo">1. Coleta e Uso de Dados</h2>
          <p className="politica-texto">
            O sistema armazena dados necessários para a operação do negócio,
            incluindo nome do cliente, dados de contato, especificações de
            projetos de marcenaria e registros financeiros operacionais. Tais
            dados são utilizados estritamente para a geração de orçamentos e 
            dados financeiros, tais como o ponto de equilíbrio.
          </p>

          <h2 className="politica-subtitulo">
            2. Segurança e Retenção dos Dados
          </h2>
          <p className="politica-texto">
            Adotamos medidas técnicas adequadas para mitigar acessos não
            autorizados. Os dados financeiros e orçamentários são mantidos em
            banco de dados seguro e são armazenados pelo período necessário para
            cumprimento de obrigações legais e fiscais.
          </p>

          <h2 className="politica-subtitulo">3. Compartilhamento</h2>
          <p className="politica-texto">
            Não comercializamos ou compartilhamos dados de clientes ou
            relatórios financeiros com terceiros, exceto quando exigido por
            autoridades competentes para fins de cumprimento de obrigações
            legais.
          </p>
        </section>

        <div className="container-btn-rodape">
          <BotaoVoltar />
          <NavegacaoFluxo />
        </div>
      </div>
    </PageTransition>
  );
}
