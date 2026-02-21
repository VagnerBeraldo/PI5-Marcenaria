import { useState } from "react";
import Visualizador from "./Visualizador";
import { BrushCleaning, Printer, Trash2 } from "lucide-react";
import "./PlanoDeCorte.css";
import "./Visualizador.css";
import "./ImpressaoCortes.css";

export default function PlanoDeCorte() {
  const [chapas, setChapas] = useState([
    { id: 1, largura: 2750, altura: 1840 },
  ]);
  const [chapaAtivaId, setChapaAtivaId] = useState(1);
  const [pecas, setPecas] = useState([]);
  const [largCorte, setLargCorte] = useState(3);
  const [escala, setEscala] = useState(0.2);
  const [nomeServico, setNomeServico] = useState("");

  const atualizarPeca = (id, campo, valor) => {
    const novasPecas = pecas.map((p) =>
      p.id === id
        ? { ...p, [campo]: campo === "nome" ? valor : Number(valor) }
        : p,
    );
    setPecas(novasPecas);
  };

  const adicionarPeca = () => {
    const novoId =
      pecas.length > 0 ? Math.max(...pecas.map((p) => p.id)) + 1 : 1;
    setPecas([
      ...pecas,
      {
        id: novoId,
        chapaId: chapaAtivaId,
        largura: 0,
        altura: 0,
        qtd: 1,
        rotacionar: false,
        nome: "",
      },
    ]);
  };

  const removerPeca = (id) => {
    setPecas(pecas.filter((p) => p.id !== id));
  };

  const removerChapa = (id) => {
    if (chapas.length === 1) {
      alert("Você deve ter pelo menos uma chapa no projeto.");
      return;
    }

    if (window.confirm("Excluir esta chapa e todas as peças?")) {
      // 1. Remove a chapa da lista
      const novasChapas = chapas.filter((c) => c.id !== id);
      setChapas(novasChapas);

      // 2. Remove todas as peças vinculadas a essa chapa
      setPecas(pecas.filter((p) => p.chapaId !== id));

      // 3. Se a chapa apagada era a ativa, volta para a primeira disponível
      if (chapaAtivaId === id) {
        setChapaAtivaId(novasChapas[0].id);
      }
    }
  };

  const adicionarChapa = () => {
    const novoId =
      chapas.length > 0 ? Math.max(...chapas.map((c) => c.id)) + 1 : 1;
    const novaChapa = { id: novoId, largura: 2750, altura: 1840 };
    setChapas([...chapas, novaChapa]);
    setChapaAtivaId(novoId);
  };

  const imprimir = () => {
    const conteudoGabarito =
      document.querySelector(".espaco-impressao").innerHTML;
    const janelaImpressao = window.open("", "_blank", "width=900,height=1000");

    janelaImpressao.document.write(`
    <html>
      <head>
        <title>Plano de Corte - Impressão</title>
        <style>
          
          * { 
            box-sizing: border-box !important; 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          
          body { 
            font-family: sans-serif; 
            padding: 15mm; 
            background: white; 
            width: 100% !important;
          }

          /* 2. Container de Proteção contra Cortes Laterais */
          .secao-lista-corte, .espaco-impressao, .wrapper-visualizador-impressao {
            width: 100% !important;
            max-width: 100% !important;
            display: block !important;
            overflow: visible !important;
          }

          /* 3. Tabela com Ajuste Forçado (Fit) */
          table { 
            width: 100% !important; 
            border-collapse: collapse; 
            margin-top: 20px;
            table-layout: fixed; /* Força o respeito total às larguras */
          }

          th, td { 
            border: 1px solid #000; 
            padding: 5px 2px; 
            text-align: center; 
            font-size: 10px; /* Redução estratégica para garantir o fit */
            word-wrap: break-word;
            overflow-wrap: break-word;
          }

          /* Definição de Larguras para evitar que a coluna de Nome empurre as outras */
          th:nth-child(1) { width: 35px; }  /* Item */
          th:nth-child(2) { width: auto; }  /* Nome (Flexível) */
          th:nth-child(3) { width: 90px; }  /* Medidas */
          th:nth-child(4) { width: 40px; }  /* Qtd */
          th:nth-child(5) { width: 80px; }  /* Área */

          th { background-color: #eee !important; font-weight: bold; }

          /* 4. Chapa e Visualizador */
          .chapa-madeira { 
            border: 2px solid #451a03; 
            background-color: #deb887 !important; 
            position: relative; 
            margin: 0 auto 20px;
            max-width: 100% !important; /* Impede a imagem de sair da folha */
            transform-origin: top center;
          }

          .peca-no-plano { 
            position: absolute; 
            background-color: #2563eb !important; 
            border: 1px solid #000; 
            display: flex; 
            justify-content: center; 
            align-items: center;
            color: white;
            font-size: 8px;
          }

          .grade-estatisticas { display: flex; gap: 5px; margin-bottom: 20px; width: 100%; }
          .card-estatistica { border: 1px solid #ddd; padding: 5px; flex: 1; text-align: center; }
          .valor-destaque { font-size: 12px; font-weight: bold; }

          @media print {
            @page { size: portrait; margin: 0; }
            body { padding: 10mm; }
          }
        </style>
      </head>
     

<body>
  <h1 style="text-align:center; font-size: 20px; margin-top: 10px;">
    ${nomeServico || "Plano de Corte"}
  </h1>
  <h2 style="text-align:center; font-size: 14px; color: #666; margin-bottom: 20px;">
    Relatório Técnico: Chapa ${chapas.findIndex((c) => c.id === chapaAtivaId) + 1}
  </h2>
  ${conteudoGabarito}
  <script>
    window.onload = () => {
      window.print();
      window.close();
    };
  </script>
</body>
    </html>
  `);

    janelaImpressao.document.close();
  };

  const chapaAtual = chapas.find((c) => c.id === chapaAtivaId) || {
    id: 1,
    largura: 2750,
    altura: 1840,
  };

  // Função para atualizar as medidas de uma chapa específica no array
  const atualizarDadosChapa = (campo, valor) => {
    // Converte para número, mas mantém 0 se o campo for apagado para evitar NaN
    const valorNumerico = valor === "" ? 0 : Number(valor);

    setChapas((prevChapas) =>
      prevChapas.map((c) =>
        c.id === chapaAtivaId ? { ...c, [campo]: valorNumerico } : c,
      ),
    );
  };

  return (
    <div className="card-principal">
      <div className="cabecalho ocultar-na-impressao">
        <h2>Plano de Corte</h2>
        <div className="btn-container">
          <button
            onClick={imprimir}
            className="btn-icone btn-imprimir"
            title="Imprimir Plano"
          >
            <Printer size={20} />
          </button>
        </div>
      </div>

      <div className="secao-nome-servico ocultar-na-impressao">
        <div className="grupo-input">
          <label className="rotulo">Nome do Serviço / Projeto</label>
          <input
            type="text"
            value={nomeServico}
            className="input-padrao"
            placeholder="Ex: Armário 6 portas"
            onChange={(e) => setNomeServico(e.target.value)}
          />
        </div>
      </div>

      {/* Navegação de Chapas */}
      <div className="navegacao-chapas ocultar-na-impressao">
        <div className="abas-container">
          {chapas.map((c, index) => (
            <div
              key={c.id}
              className={`tab-wrapper ${chapaAtivaId === c.id ? "ativa" : ""}`}
            >
              <button
                className="tab-chapa"
                onClick={() => setChapaAtivaId(c.id)}
              >
                Chapa {index + 1}
              </button>
              {chapas.length > 1 && (
                <button
                  className="btn-excluir-chapa"
                  onClick={() => removerChapa(c.id)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <button onClick={adicionarChapa} className="btn-nova-chapa">
            + Nova Chapa
          </button>
        </div>
      </div>

      {/* Configurações da Chapa de MDF */}
      <div className="secao-config-chapa ocultar-na-impressao">
        <div className="grupo-input">
          <label className="rotulo">Largura Chapa (mm)</label>
          <input
            type="number"
            value={chapaAtual.largura || ""}
            className="input-padrao"
            onChange={(e) => atualizarDadosChapa("largura", e.target.value)}
          />
        </div>
        <div className="grupo-input">
          <label className="rotulo">Altura Chapa (mm)</label>
          <input
            type="number"
            value={chapaAtual.altura || ""}
            className="input-padrao"
            onChange={(e) => atualizarDadosChapa("altura", e.target.value)}
          />
        </div>
        <div className="grupo-input">
          <label className="rotulo">Espessura da Serra (mm)</label>
          <input
            type="number"
            step="0.5"
            value={largCorte}
            className="input-padrao"
            onChange={(e) => setLargCorte(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Listagem de Peças para Produção */}
      <div className="lista-pecas ocultar-na-impressao">
        <h3>Peças</h3>
        {pecas
          .filter((p) => p.chapaId === chapaAtivaId) // Filtra as peças da chapa selecionada
          .map((peca) => (
            <div key={peca.id} className="item-peca">
              <div className="coluna-nome">
                <span className="sub-rotulo">Nome da Peça</span>
                <input
                  type="text"
                  value={peca.nome}
                  className="input-padrao"
                  placeholder="Ex: Porta"
                  onChange={(e) =>
                    atualizarPeca(peca.id, "nome", e.target.value)
                  }
                />
              </div>
              <div className="coluna-medida">
                <span className="sub-rotulo">Largura</span>
                <input
                  type="number"
                  value={peca.largura === 0 ? "" : peca.largura}
                  className="input-padrao"
                  onChange={(e) =>
                    atualizarPeca(peca.id, "largura", e.target.value)
                  }
                />
              </div>
              <div className="coluna-medida">
                <span className="sub-rotulo">Altura</span>
                <input
                  type="number"
                  value={peca.altura === 0 ? "" : peca.altura}
                  className="input-padrao"
                  onChange={(e) =>
                    atualizarPeca(peca.id, "altura", e.target.value)
                  }
                />
              </div>
              <div className="coluna-qtd">
                <span className="sub-rotulo">Qtd</span>
                <input
                  type="number"
                  value={peca.qtd}
                  className="input-padrao"
                  onChange={(e) =>
                    atualizarPeca(peca.id, "qtd", e.target.value)
                  }
                />
              </div>
              <button
                onClick={() => removerPeca(peca.id)}
                className="btn-icone btn-remover"
                title="Remover Peça"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        <button onClick={adicionarPeca} className="btn-adicionar">
          + Adicionar Peça
        </button>
      </div>

      {/* Controles de Visualização */}
      <div className="controle-zoom ocultar-na-impressao">
        <div className="zoom-container">
          <label className="rotulo">Zoom do Gabarito</label>
          <input
            type="range"
            min="0.1"
            max="0.5"
            step="0.05"
            value={escala}
            onChange={(e) => setEscala(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Área Técnica de Impressão e Gabarito */}
      <div className="espaco-impressao">
        <Visualizador
          chapa={chapaAtual}
          pecas={pecas.filter((p) => p.chapaId === chapaAtivaId)}
          largCorte={largCorte}
          escala={escala}
        />
      </div>
    </div>
  );
}
