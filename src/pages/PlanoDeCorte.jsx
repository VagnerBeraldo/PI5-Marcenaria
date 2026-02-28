import { useState, useRef, useEffect } from "react";
import Visualizador from "./Visualizador";
import { LayoutDashboard, Printer, Trash2 } from "lucide-react";
import "../styles/PlanoDeCorte.css";
import "../styles/Visualizador.css";

export default function PlanoDeCorte() {
  const [chapas, setChapas] = useState([
    { id: 1, largura: 2750, altura: 1840 },
  ]);
  const [chapaAtivaId, setChapaAtivaId] = useState(1);
  const [pecas, setPecas] = useState([]);
  const [largCorte, setLargCorte] = useState(3);
  const containerRef = useRef(null);
  const [escala, setEscala] = useState(0.3);
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
    // Capturamos o conteúdo total da área técnica
    const conteudoGabarito =
      document.querySelector(".espaco-impressao").innerHTML;

    // Cálculo da proporção: A4 tem aprox. 190mm de largura útil.
    // Se a chapa for muito larga na tela, reduzimos para caber 100% na largura da folha.
    const larguraChapaReal = chapaAtual.largura * escala;
    const proporcaoFixa = larguraChapaReal > 700 ? 700 / larguraChapaReal : 1;

    const janelaImpressao = window.open("", "_blank", "width=900,height=1000");

    janelaImpressao.document.write(`
    <html>
      <head>
        <title>Plano de Corte - Relatório</title>
        <style>
          /* 1. Reset e Cores */
          * { 
            box-sizing: border-box !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 10mm; 
            background: white; 
            color: #333;
          }

          /* 2. Ajuste de Escala sem Cortes */
          .wrapper-print {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .container-visualizador {
            transform: scale(${proporcaoFixa});
            transform-origin: top center;
            /* O segredo para a tabela subir: reduzimos a margem inferior 
               baseado no quanto o elemento encolheu */
            margin-bottom: calc(-${100 - proporcaoFixa * 100}% + 20px);
            width: 100% !important;
          }

          /* 3. Estilização dos Cards e Chapa (Mantendo Cores) */
          .grade-estatisticas { 
            display: flex; 
            gap: 10px; 
            margin-bottom: 20px; 
            width: 100%;
          }
          .card-estatistica { 
            border: 1px solid #ddd; 
            padding: 10px; 
            flex: 1; 
            text-align: center;
            background-color: #f9f9f9 !important;
            border-radius: 4px;
          }
          .valor-destaque { font-size: 16px; font-weight: bold; color: #2563eb; }

          .chapa-madeira { 
            border: 3px solid #451a03; 
            background-color: #deb887 !important; 
            position: relative; 
            margin: 0 auto;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
          }

          .peca-no-plano { 
            position: absolute; 
            background-color: #2563eb !important; 
            border: 1px solid #1e3a8a; 
            display: flex; 
            flex-direction: column;
            justify-content: center; 
            align-items: center;
            color: white; 
            font-size: 10px;
            font-weight: bold;
          }

          /* 4. Tabela Profissional */
          .secao-lista-corte { 
            width: 100%; 
            margin-top: 30px;
            clear: both;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
          }
          th { 
            background-color: #2563eb !important; 
            color: white !important; 
            font-size: 12px;
            padding: 10px;
            border: 1px solid #1e3a8a;
          }
          td { 
            border: 1px solid #ccc; 
            padding: 8px; 
            text-align: center; 
            font-size: 11px;
          }
          tr:nth-child(even) { background-color: #f2f2f2 !important; }

          h1 { color: #1e3a8a; margin-bottom: 5px; }

          @media print {
            @page { size: portrait; margin: 10mm; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper-print">
          <h1 style="text-align:center;">${nomeServico || "Plano de Corte"}</h1>
          <p style="text-align:center; color: #666; margin-bottom: 25px;">
            Relatório de Produção - Chapa ${chapas.findIndex((c) => c.id === chapaAtivaId) + 1}
          </p>

          <div class="container-visualizador">
            ${conteudoGabarito}
          </div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 600);
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

  useEffect(() => {
    const calcularEscala = () => {
      if (containerRef.current) {
        // OffsetWidth pega a largura real do card branco na tela
        const larguraDoCard = containerRef.current.offsetWidth;
        const larguraRealDaChapa = chapaAtual.largura;

        if (larguraRealDaChapa > 0) {
          // Deixa apenas 10px de margem total para não encostar no limite do card
          const novaEscala = (larguraDoCard - 10) / larguraRealDaChapa;
          setEscala(novaEscala);
        }
      }
    };

    // Executa após o componente montar
    setTimeout(calcularEscala, 50);

    window.addEventListener("resize", calcularEscala);
    return () => window.removeEventListener("resize", calcularEscala);
  }, [chapaAtual.largura, chapaAtivaId, chapas]);

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
      {/* <div className="cabecalho ocultar-na-impressao"> */}
      {/* <div className="logo-container">
          <img src="/logo.png" alt="Logo Marcenaria" className="logo-img" />
        </div> */}
      {/* <h2>Plano de Corte</h2> */}
      {/* </div> */}

      <div className="secao-nome-servico ocultar-na-impressao">
        <div className="grupo-input">
          <h2 className="titulo">Plano de Corte</h2>
          <label className="rotulo">Nome do Serviço / Projeto</label>
          <input
            type="text"
            value={nomeServico}
            className="input-padrao"
            placeholder="Ex: Armário 6 portas - Cliente: "
            onChange={(e) => setNomeServico(e.target.value)}
          />
        </div>
      </div>

      {/* Navegação de Chapas */}
      <div className="container-navegacao">
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
                  <LayoutDashboard size={18} />
                  <span>Chapa {index + 1}</span>
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
          <div className="linha"></div>
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
          {/* Fim da Listagem de Peças */}
        <div className="btn-container">
          <button onClick={adicionarPeca} className="btn-adicionar">
            + Adicionar Peça
          </button>
          <button onClick={imprimir} className="btn-imprimir">
            <Printer size={18} />
            <span className="texto-imprimir">Imprimir</span>
          </button>
        </div>
      </div> {/* Fecha .lista-pecas */}
    </div> 
    {/* Área Técnica de Impressão e Gabarito - FORA do container-navegacao */}
    <div className="espaco-impressao">
      <Visualizador
        chapa={chapaAtual}
        pecas={pecas.filter((p) => p.chapaId === chapaAtivaId)}
        largCorte={largCorte}
        escala={escala}
      />
    </div>
  </div> // Fecha .card-principal
  );
}

