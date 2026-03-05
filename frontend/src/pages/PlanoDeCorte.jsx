import { useState, useRef, useEffect } from "react";
import Visualizador from "./Visualizador";
import {
  LayoutDashboard,
  Printer,
  Trash2,
  Save,
  FileEditIcon,
  Search,
  CircleMinus,
  FilePlus,
} from "lucide-react";
import DOMPurify from "dompurify";
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from "../components/BotaoVoltar/BotaoVoltar";
import Swal from "sweetalert2";
import logoMarcenaria from "/logo.svg";
import api from "../../services/api"; // Import da API adicionado
import "../styles/PlanoDeCorte.css";
import "../styles/Visualizador.css";

export default function PlanoDeCorte() {
  const [chapas, setChapas] = useState([
    { id: 1, largura: 2750, altura: 1840 },
  ]);
  const [isLoading, setIsLoading] = useState(false); // Corrigido
  const [idPlanoSalvo, setIdPlanoSalvo] = useState(null); // Novo estado
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

  const removerChapa = async (id) => {
    if (chapas.length === 1) {
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "Você deve ter pelo menos uma chapa no projeto.",
        confirmButtonColor: "#27ae60",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Exclusão chapa",
      text: "Excluir esta chapa e todas as peças?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#27ae60",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      setIsLoading(true);

      try {
        const novasChapas = chapas.filter((c) => c.id !== id);
        setChapas(novasChapas);
        setPecas(pecas.filter((p) => p.chapaId !== id));

        if (chapaAtivaId === id) {
          setChapaAtivaId(novasChapas[0].id);
        }

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Chapa excluída com sucesso!",
          showConfirmButton: false,
          timer: 2000,
        });
      } catch (error) {
        console.error("Erro ao excluir:", error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Erro ao excluir a chapa.",
        });
      } finally {
        setIsLoading(false);
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

  // --- Início das Funções de CRUD ---
  const handleSalvar = async () => {
    if (!nomeServico.trim()) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "O nome do serviço é obrigatório.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        nome_servico: DOMPurify.sanitize(nomeServico),
        espessura_serra: largCorte,
        chapas: chapas,
        pecas: pecas.map((p) => ({
          ...p,
          nome: DOMPurify.sanitize(p.nome),
        })),
      };

      const { data } = await api.post("/planos-corte", payload);
      setIdPlanoSalvo(data.id_plano);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Plano salvo com sucesso!",
        showConfirmButton: false,
        timer: 2500,
        customClass: { popup: "mensagem-confirmacao" },
      });
    } catch (e) {
      console.error("Falha ao salvar dados", e);
      const errorMsg = e.response?.data?.error || "Falha ao salvar o plano.";
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: errorMsg,
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditar = async () => {
    if (!idPlanoSalvo) return;

    if (!nomeServico.trim()) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "O nome do serviço é obrigatório.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        nome_servico: DOMPurify.sanitize(nomeServico),
        espessura_serra: largCorte,
        chapas: chapas,
        pecas: pecas.map((p) => ({
          ...p,
          nome: DOMPurify.sanitize(p.nome),
        })),
      };

      await api.put(`/planos-corte/${idPlanoSalvo}`, payload);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Plano atualizado com sucesso!",
        showConfirmButton: false,
        timer: 2500,
        customClass: { popup: "mensagem-confirmacao" },
      });
    } catch (e) {
      console.error("Falha ao atualizar dados", e);
      const errorMsg = e.response?.data?.error || "Falha ao atualizar o plano.";
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: errorMsg,
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcluir = async () => {
    if (!idPlanoSalvo) return;

    const result = await Swal.fire({
      title: "Excluir Plano de Corte?",
      text: "Esta ação apagará o projeto, suas chapas e peças.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#27ae60",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        await api.delete(`/planos-corte/${idPlanoSalvo}`);

        // Limpa a tela após excluir
        setIdPlanoSalvo(null);
        setNomeServico("");
        setLargCorte(3);
        setChapas([{ id: 1, largura: 2750, altura: 1840 }]);
        setPecas([]);
        setChapaAtivaId(1);

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Plano excluído com sucesso!",
          showConfirmButton: false,
          timer: 2500,
          customClass: { popup: "mensagem-confirmacao" },
        });
      } catch (error) {
        console.error("Erro ao excluir:", error);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Erro ao excluir o plano.",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-erro" },
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBuscar = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/planos-corte");

      const dadosNormalizados = response.data.map((plano) => ({
        ...plano,
        chapas:
          typeof plano.chapas === "string"
            ? JSON.parse(plano.chapas)
            : plano.chapas,
        pecas:
          typeof plano.pecas === "string"
            ? JSON.parse(plano.pecas)
            : plano.pecas,
      }));

      if (!dadosNormalizados.length) {
        Swal.fire({
          title: "Aviso",
          text: "Nenhum plano de corte encontrado.",
          icon: "info",
          customClass: { popup: "modal-pesquisa" },
        });
        return;
      }

      Swal.fire({
        title: "Pesquisar Planos de Corte",
        customClass: { popup: "modal-pesquisa" },
        html: `
          <input type="text" id="swal-search" class="swal2-input input-pesquisa" placeholder="Digite o nome do serviço...">
          <div id="swal-results" class="lista-resultados"></div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Fechar",
        didOpen: () => {
          const input = document.getElementById("swal-search");
          const list = document.getElementById("swal-results");

          const render = (val) => {
            const filtered = dadosNormalizados.filter((p) =>
              p.nome_servico.toLowerCase().includes(val.toLowerCase()),
            );

            if (filtered.length === 0) {
              list.innerHTML =
                '<div class="item-vazio">Nenhum plano encontrado.</div>';
              return;
            }

            list.innerHTML = filtered
              .map(
                (p) => `
              <div class="swal-res-item item-resultado" data-id="${p.id_plano}">
                <span class="item-titulo">${p.nome_servico}</span>
                <span class="item-badge">${p.chapas.length} ${p.chapas.length === 1 ? "chapa" : "chapas"}</span>
              </div>`,
              )
              .join("");

            document.querySelectorAll(".swal-res-item").forEach(
              (el) =>
                (el.onclick = () => {
                  const plano = dadosNormalizados.find(
                    (x) => x.id_plano == el.dataset.id,
                  );

                  // Popula a tela com os dados do banco
                  setIdPlanoSalvo(plano.id_plano);
                  setNomeServico(plano.nome_servico);
                  setLargCorte(Number(plano.espessura_serra));

                  // Garante que arrays vazios não quebrem a aplicação caso não haja chapa/peça salva
                  const chapasCarregadas =
                    plano.chapas.length > 0
                      ? plano.chapas
                      : [{ id: 1, largura: 2750, altura: 1840 }];
                  setChapas(chapasCarregadas);
                  setPecas(plano.pecas || []);

                  setChapaAtivaId(chapasCarregadas[0].id); // Foca na primeira chapa do projeto

                  Swal.close();
                }),
            );
          };

          render("");
          input.focus();
          input.oninput = (e) => render(e.target.value);
        },
      });
    } catch (e) {
      console.error("Falha ao buscar dados", e);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Falha ao buscar dados.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };
  // --- Fim das Funções de CRUD ---

  const imprimir = () => {
    const conteudoGabarito =
      document.querySelector(".espaco-impressao").innerHTML;

    const larguraChapaReal = chapaAtual.largura * escala;
    const proporcaoFixa = larguraChapaReal > 700 ? 700 / larguraChapaReal : 1;

    const janelaImpressao = window.open("", "_blank", "width=900,height=1000");

    janelaImpressao.document.write(`
    <html>
      <head>
        <title>Plano de Corte - Relatório</title>
        <style>
          * { 
            box-sizing: border-box !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          body { 
            font-family: 'Montserrat', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 10mm; 
            background: white; 
            color: #444;
          }
          .wrapper-print {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .container-visualizador {
            transform: scale(${proporcaoFixa});
            transform-origin: top center;
            margin-bottom: calc(-${100 - proporcaoFixa * 100}% + 20px);
            width: 100% !important;
          }
          .grade-estatisticas { 
            display: flex; 
            gap: 10px; 
            margin-bottom: 20px; 
            width: 100%;
          }
          .card-estatistica { 
            border: 1px solid #f3f2f2; 
            padding: 10px; 
            flex: 1; 
            text-align: center;
            background-color: #f3f2f2 !important;
            border-radius: 4px;
          }
          .valor-cor-primaria { font-size: 16px; font-weight: bold; color: #000000; }
          .chapa-madeira { 
            border: 3px solid #451a03; 
            background-color: #deb887 !important; 
            position: relative; 
            margin: 0 auto;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
          }
          .peca-no-plano { 
            position: absolute; 
            background-color: #8B4513 !important; 
            border: 1px solid #8B4513; 
            display: flex; 
            flex-direction: column;
            justify-content: center; 
            align-items: center;
            color: white; 
            font-size: 10px;
            font-weight: bold;
          }
          .secao-lista-corte { 
            width: 100%; 
            margin-top: 60px;
            clear: both;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
          }
          th { 
            background-color: #f3f2f2 !important; 
            color: black !important; 
            font-size: 12px;
            padding: 10px;
            border: 1px solid #000;
          }
          td { 
            border: 1px solid #000; 
            padding: 8px; 
            text-align: center; 
            font-size: 11px;
          }
          tr:nth-child(even) { background-color: #4444 !important; }
          h1 { color: #000000; margin-bottom: 5px; }
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
        const larguraDoCard = containerRef.current.offsetWidth;
        const larguraRealDaChapa = chapaAtual.largura;

        if (larguraRealDaChapa > 0) {
          const novaEscala = (larguraDoCard - 10) / larguraRealDaChapa;
          setEscala(novaEscala);
        }
      }
    };

    setTimeout(calcularEscala, 50);

    window.addEventListener("resize", calcularEscala);
    return () => window.removeEventListener("resize", calcularEscala);
  }, [chapaAtual.largura, chapaAtivaId, chapas]);

  const atualizarDadosChapa = (campo, valor) => {
    const valorNumerico = valor === "" ? 0 : Number(valor);

    setChapas((prevChapas) =>
      prevChapas.map((c) =>
        c.id === chapaAtivaId ? { ...c, [campo]: valorNumerico } : c,
      ),
    );
  };

  const handleNovo = () => {
    setIdPlanoSalvo(null);
    setNomeServico("");
    setLargCorte(3);
    setChapas([{ id: 1, largura: 2750, altura: 1840 }]);
    setPecas([]);
    setChapaAtivaId(1);
  };

  return (
    <PageTransition className="card-principal">
      <div className="secao-nome-servico ocultar-na-impressao">
        <div className="header-actions-plano ocultar-na-impressao">
          <BotaoVoltar />
          <button
            className="btn-novo-topo-plano"
            onClick={handleNovo}
            title="Iniciar novo plano"
          >
            <FilePlus size={18} strokeWidth={2} />
            <span>Novo</span>
          </button>
        </div>

        <div>
          <img
            src={logoMarcenaria}
            alt="Logo GR Marcenaria"
            className="logo-img"
          />
        </div>
        <h1 className="nome-fantasia">GR Marcenaria</h1>
        <div className="grupo-input">
          <h2 className="titulo">Plano de Corte</h2>
          <label className="rotulo">Nome do Serviço / Projeto</label>
          <input
            type="text"
            value={nomeServico}
            className="input-padrao"
            placeholder="Ex: Armário 6 portas - Cliente: "
            onChange={(e) => setNomeServico(e.target.value)}
            disabled={isLoading}
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
            .filter((p) => p.chapaId === chapaAtivaId)
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

          <div className="btn-container">
            <button onClick={adicionarPeca} className="btn-adicionar">
              + Adicionar Peça
            </button>
            <button onClick={imprimir} className="btn-imprimir">
              <Printer size={18} />
              <span className="texto-imprimir">Imprimir</span>
            </button>
          </div>
        </div>


{/* --- Rodapé de Ações do Plano de Corte --- */}
      <div className="btn-container-corte ocultar-na-impressao">
        <div className="btn-wrapper-corte">
          <div className="btn-wrapper-flex-corte">
            <button
              className="btn-salvar-corte"
              onClick={handleSalvar}
              disabled={isLoading || idPlanoSalvo !== null}
            >
              <Save size={18} strokeWidth={2} />
              <span>Salvar</span>
            </button>
            <button
              className="btn-editar-corte"
              onClick={handleEditar}
              disabled={isLoading || idPlanoSalvo === null}
            >
              <FileEditIcon size={18} strokeWidth={2} />
              <span>Editar</span>
            </button>
          </div>
          <div className="btn-wrapper-flex-corte">
            <button className="btn-buscar-corte" onClick={handleBuscar}>
              <Search size={18} strokeWidth={2} />
              <span>Buscar</span>
            </button>
            <button className="btn-excluir-corte" onClick={handleExcluir}>
              <CircleMinus size={18} strokeWidth={2} />
              <span>Excluir</span>
            </button>
          </div>
        </div>
      </div>

      </div>

      {/* Área Técnica de Impressão e Gabarito */}
      <div className="espaco-impressao" ref={containerRef}>
        <Visualizador
          chapa={chapaAtual}
          pecas={pecas.filter((p) => p.chapaId === chapaAtivaId)}
          largCorte={largCorte}
          escala={escala}
        />
      </div>
    </PageTransition>
  );
}
