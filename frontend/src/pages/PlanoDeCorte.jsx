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
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from "../components/BotaoVoltar/BotaoVoltar";
import Swal from "sweetalert2";
import logoMarcenaria from "/logo.svg";
import api from "../../services/api";
import { useProjeto } from "../hooks/useProjeto"; 
import "../styles/PlanoDeCorte.css";
import "../styles/Visualizador.css";

export default function PlanoDeCorte() {
  const [chapas, setChapas] = useState([
    { id: 1, largura: 2750, altura: 1840 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [idPlanoSalvo, setIdPlanoSalvo] = useState(null);
  const [chapaAtivaId, setChapaAtivaId] = useState(1);
  const [pecas, setPecas] = useState([]);
  const [largCorte, setLargCorte] = useState(3);
  const containerRef = useRef(null);
  const [escala, setEscala] = useState(0.3);
  const [nomeServico, setNomeServico] = useState("");

  const { contextoGlobal, atualizarContexto } = useProjeto();

  useEffect(() => {
    if (contextoGlobal?.planoCorte) {
      const plano = contextoGlobal.planoCorte;
      setIdPlanoSalvo(plano.id_plano);
      setNomeServico(plano.nome_servico);
      setLargCorte(Number(plano.espessura_serra));

      const chapasParsed = typeof plano.chapas === "string" ? JSON.parse(plano.chapas) : (plano.chapas || []);
      const pecasParsed = typeof plano.pecas === "string" ? JSON.parse(plano.pecas) : (plano.pecas || []);

      const chapasCarregadas = chapasParsed.length > 0 ? chapasParsed : [{ id: 1, largura: 2750, altura: 1840 }];
      
      setChapas(chapasCarregadas);
      setPecas(pecasParsed);
      setChapaAtivaId(chapasCarregadas[0].id);

    } else if (contextoGlobal?.orcamento) {
      const nomeCli = contextoGlobal.cliente ? ` - Cliente: ${contextoGlobal.cliente.nome}` : "";
      setNomeServico(`${contextoGlobal.orcamento.nome_projeto}${nomeCli}`);
    }
  }, [contextoGlobal]);

  useEffect(() => {
    if (contextoGlobal.nomeProjetoGlobal !== undefined && contextoGlobal.nomeProjetoGlobal !== nomeServico) {
      setNomeServico(contextoGlobal.nomeProjetoGlobal); 
    }
  }, [contextoGlobal.nomeProjetoGlobal, nomeServico]); 

  const atualizarPeca = (id, campo, valor) => {
    const novasPecas = pecas.map((p) =>
      p.id === id
        ? { ...p, [campo]: campo === "nome" ? valor : Number(valor) }
        : p,
    );
    setPecas(novasPecas);
  };

  const adicionarPeca = () => {
    const novoId = pecas.length > 0 ? Math.max(...pecas.map((p) => p.id)) + 1 : 1;
    setPecas([
      ...pecas,
      { id: novoId, chapaId: chapaAtivaId, largura: 0, altura: 0, qtd: 1, rotacionar: false, nome: "" },
    ]);
  };

  const removerPeca = (id) => {
    setPecas(pecas.filter((p) => p.id !== id));
  };

  const removerChapa = async (id) => {
    if (chapas.length === 1) {
      Swal.fire({ icon: "warning", title: "Atenção", text: "Você deve ter pelo menos uma chapa no projeto." });
      return;
    }
    const result = await Swal.fire({
      title: "Excluir chapa",
      text: "Excluir esta chapa e todas as peças?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      confirmButtonText: "Sim, excluir!",
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        const novasChapas = chapas.filter((c) => c.id !== id);
        setChapas(novasChapas);
        setPecas(pecas.filter((p) => p.chapaId !== id));
        if (chapaAtivaId === id) setChapaAtivaId(novasChapas[0].id);
      } finally {
        setIsLoading(false);
      }
    }
  };

 const adicionarChapa = () => {
    const novoId = chapas.length > 0 ? Math.max(...chapas.map((c) => c.id)) + 1 : 1;
    // Pega o material da chapa atual para agilizar a criação
    const materialAtual = chapaAtual.material || ""; 
    setChapas([...chapas, { id: novoId, largura: 2750, altura: 1840, material: materialAtual }]);
    setChapaAtivaId(novoId);
  };


  const handleSalvar = async () => {
    if (!nomeServico.trim()) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        title: "O nome do serviço é obrigatório.",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        id_orcamento: contextoGlobal?.orcamento?.id_orcamento || contextoGlobal?.orcamento?.id || null, 
        nome_servico: nomeServico, 
        espessura_serra: largCorte,
        chapas: chapas,
        pecas: pecas.map((p) => ({
          ...p,
          nome: p.nome,
        })),
      };

      const { data } = await api.post("/planos-corte", payload);
      
      setIdPlanoSalvo(data.id_plano);

      atualizarContexto({ 
        nomeProjetoGlobal: nomeServico,
        orcamento: { 
          id_orcamento: data.id_orcamento, 
          nome_projeto: nomeServico 
        } 
      });

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Plano e Orçamento vinculados com sucesso!",
        showConfirmButton: false,
        timer: 2500,
      });

    } catch (err) {
      console.error("Erro ao carregar orçamento", err);
      Swal.fire({
        icon: "error",
        title: "Erro ao salvar",
        text: err.response?.data?.error || "Falha na comunicação com o servidor.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditar = async () => {
    if (!idPlanoSalvo) return;
    setIsLoading(true);
    try {
      const payload = {
        id_orcamento: contextoGlobal?.orcamento?.id_orcamento || null, 
        nome_servico: nomeServico,
        espessura_serra: largCorte,
        chapas: chapas,
        pecas: pecas.map((p) => ({ ...p, nome: p.nome })),
      };
      await api.put(`/planos-corte/${idPlanoSalvo}`, payload);
      Swal.fire({ icon: "success", title: "Plano atualizado!", timer: 2000, showConfirmButton: false });
    } catch (err) {
      console.error("Erro ao carregar orçamento", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcluir = async () => {
    if (!idPlanoSalvo) return;
    const result = await Swal.fire({ title: "Excluir Plano?", icon: "warning", showCancelButton: true });
    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        await api.delete(`/planos-corte/${idPlanoSalvo}`);
        handleNovo();
      } catch (err) {
        console.error("Erro ao carregar orçamento", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBuscar = async () => {
    setIsLoading(true);
    try {
      const resOrc = await api.get("/orcamentos");
      if (!resOrc.data || resOrc.data.length === 0) {
        Swal.fire({ 
          icon: "error", 
          title: "Sem Orçamentos", 
          text: "Não existem orçamentos cadastrados no sistema. Inicie um orçamento primeiro." 
        });
        return;
      }

      const response = await api.get("/planos-corte");
      const dadosNormalizados = response.data;

      if (!dadosNormalizados.length) {
        Swal.fire({ title: "Aviso", text: "Nenhum plano de corte encontrado.", icon: "info" });
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
        didOpen: () => {
          const input = document.getElementById("swal-search");
          const list = document.getElementById("swal-results");
          const render = (val) => {
            const filtered = dadosNormalizados.filter((p) => (p.nome_servico || "").toLowerCase().includes(val.toLowerCase()));
            list.innerHTML = filtered.map((p) => `
              <div class="swal-res-item item-resultado" data-id="${p.id_plano}">
                <span class="item-titulo">${p.nome_servico || `ID: ${p.id_plano}`}</span>
              </div>`).join("");

            document.querySelectorAll(".swal-res-item").forEach((el) => {
              el.onclick = () => {
                const plano = dadosNormalizados.find((x) => x.id_plano == el.dataset.id);
                setIdPlanoSalvo(plano.id_plano);
                setNomeServico(plano.nome_servico || "");
                setLargCorte(Number(plano.espessura_serra));
                const cP = typeof plano.chapas === "string" ? JSON.parse(plano.chapas) : (plano.chapas || []);
                const pP = typeof plano.pecas === "string" ? JSON.parse(plano.pecas) : (plano.pecas || []);
                setChapas(cP.length > 0 ? cP : [{ id: 1, largura: 2750, altura: 1840 }]);
                setPecas(pP);
                setChapaAtivaId(cP.length > 0 ? cP[0].id : 1);
                atualizarContexto({ 
  nomeProjetoGlobal: plano.nome_servico, 
  planoCorte: plano,
  orcamento: {
    id_orcamento: plano.id_orcamento,
    nome_projeto: plano.nome_servico
  }
});
                Swal.close();
              };
            });
          };
          render("");
          input.focus();
          input.oninput = (e) => render(e.target.value);
        },
      });
    } catch (err) {
      console.error("Erro ao carregar orçamento", err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const chapaAtual = chapas.find((c) => c.id === chapaAtivaId) || { id: 1, largura: 2750, altura: 1840, material: "" };

  useEffect(() => {
    const calcularEscala = () => {
      if (containerRef.current) {
        const cardWidth = containerRef.current.offsetWidth;
        if (chapaAtual.largura > 0) setEscala((cardWidth - 10) / chapaAtual.largura);
      }
    };
    setTimeout(calcularEscala, 50);
    window.addEventListener("resize", calcularEscala);
    return () => window.removeEventListener("resize", calcularEscala);
  }, [chapaAtual.largura, chapaAtivaId, chapas]);

  const atualizarDadosChapa = (campo, valor) => {
    setChapas((prev) => prev.map((c) => 
      c.id === chapaAtivaId ? { ...c, [campo]: campo === "material" ? valor : Number(valor) } : c
    ));
  };

  const handleNovo = () => {
    setIdPlanoSalvo(null);
    setNomeServico("");
    setLargCorte(3);
    setChapas([{ id: 1, largura: 2750, altura: 1840 }]);
    setPecas([]);
    setChapaAtivaId(1);
    atualizarContexto({ nomeProjetoGlobal: "", planoCorte: null, orcamento: null, custo: null });
  };

  return (
    <PageTransition className="card-principal">
      <div className="secao-nome-servico ocultar-na-impressao">
        <div className="header-actions-plano ocultar-na-impressao">
          <BotaoVoltar />
          <button className="btn-novo-topo-plano" onClick={handleNovo} title="Novo"><FilePlus size={18} /><span>Novo</span></button>
        </div>
        <img src={logoMarcenaria} alt="Logo" className="logo-img" />
        <h1 className="nome-fantasia">GR Marcenaria</h1>
        <div className="grupo-input">
          <h2 className="titulo-pagina">Plano de Corte</h2>
          <h2 className="subtitulo">Nome do Serviço / Projeto</h2>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              value={nomeServico}
              className="input-padrao"
              placeholder="Ex: Armário 6 portas"
              onChange={(e) => {
                setNomeServico(e.target.value);
                atualizarContexto({ nomeProjetoGlobal: e.target.value });
              }}
              disabled={isLoading}
            />
            <button type="button" onClick={handleBuscar} style={{ background: "none", border: "1px solid #ccc", padding: "8px", borderRadius: "4px", cursor: "pointer" }}>
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="container-navegacao">
        <div className="navegacao-chapas ocultar-na-impressao">
          <div className="abas-container">
            {chapas.map((c, index) => (
              <div key={c.id} className={`tab-wrapper ${chapaAtivaId === c.id ? "ativa" : ""}`}>
                <button className="tab-chapa" onClick={() => setChapaAtivaId(c.id)}>
                  <LayoutDashboard size={18} /> <span>Chapa {index + 1}</span>
                </button>
                {chapas.length > 1 && <button className="btn-excluir-chapa" onClick={() => removerChapa(c.id)}><Trash2 size={16} /></button>}
              </div>
            ))}
            <button onClick={adicionarChapa} className="btn-nova-chapa">+ Nova Chapa</button>
          </div>
        </div>

        <div className="secao-config-chapa ocultar-na-impressao">
          
          <div className="grupo-input">
            <label className="titulo-input">Largura (mm)</label>
            <input type="number" value={chapaAtual.largura || ""} className="input-padrao" onChange={(e) => atualizarDadosChapa("largura", e.target.value)} />
          </div>
          <div className="grupo-input">
            <label className="titulo-input">Altura (mm)</label>
            <input type="number" value={chapaAtual.altura || ""} className="input-padrao" onChange={(e) => atualizarDadosChapa("altura", e.target.value)} />
          </div>
          <div className="grupo-input">
            <label className="titulo-input">Serra (mm)</label>
            <input type="number" step="0.5" value={largCorte} className="input-padrao" onChange={(e) => setLargCorte(Number(e.target.value))} />
          </div>
        </div>

          {/* Substitua o código comentado por este: */}
        <div className="grupo-input" style={{ marginTop: "10px", width: "100%" }}>
          <label className="titulo-input">Descrição / Material da Chapa</label>
          <input 
            type="text" 
            value={chapaAtual.material || ""} 
            className="input-padrao" 
            placeholder="Ex: MDF Branco TX 15mm" 
            onChange={(e) => atualizarDadosChapa("material", e.target.value)} 
          />
        </div>
        
        <div className="lista-pecas ocultar-na-impressao">
          <h2 className="subtitulo">Peças</h2>
          {pecas.filter((p) => p.chapaId === chapaAtivaId).map((peca) => (
          
            
            <div key={peca.id} className="item-peca">
              <div className="coluna-nome">
                <span className="sub-rotulo">Nome da Peça</span>
                <input type="text" value={peca.nome} className="input-padrao" placeholder="Ex: Porta" onChange={(e) => atualizarPeca(peca.id, "nome", e.target.value)} />
              </div>
              <div className="coluna-medida">
                <span className="sub-rotulo">Largura</span>
                <input type="number" value={peca.largura === 0 ? "" : peca.largura} className="input-padrao" onChange={(e) => atualizarPeca(peca.id, "largura", e.target.value)} />
              </div>
              <div className="coluna-medida">
                <span className="sub-rotulo">Altura</span>
                <input type="number" value={peca.altura === 0 ? "" : peca.altura} className="input-padrao" onChange={(e) => atualizarPeca(peca.id, "altura", e.target.value)} />
              </div>
              <div className="coluna-qtd">
                <span className="sub-rotulo">Qtd</span>
                <input type="number" value={peca.qtd} className="input-padrao" onChange={(e) => atualizarPeca(peca.id, "qtd", e.target.value)} />
              </div>
              <button onClick={() => removerPeca(peca.id)} className="btn-icone btn-remover"><Trash2 size={20} /></button>
            </div>
          ))}
          <div className="btn-container">
            <button onClick={adicionarPeca} className="btn-adicionar">+ Adicionar Peça</button>
            <button onClick={imprimir} className="btn-imprimir"><Printer size={18} /> <span className="texto-imprimir">Imprimir</span></button>
          </div>
        </div>

      <div className="btn-container-corte ocultar-na-impressao">
        <div className="btn-wrapper-flex-corte">
          <button className="btn-salvar-corte" onClick={handleSalvar} disabled={isLoading || idPlanoSalvo !== null}><Save size={18} /> <span>Salvar</span></button>
          <button className="btn-editar-corte" onClick={handleEditar} disabled={isLoading || idPlanoSalvo === null}><FileEditIcon size={18} /> <span>Editar</span></button>
          <button className="btn-buscar-corte" onClick={handleBuscar}><Search size={18} /> <span>Buscar</span></button>
          <button className="btn-excluir-corte" onClick={handleExcluir}><CircleMinus size={18} /> <span>Excluir</span></button>
        </div>
      </div>
      </div>

      <div className="espaco-impressao" ref={containerRef}>
        <Visualizador chapa={chapaAtual} pecas={pecas.filter((p) => p.chapaId === chapaAtivaId)} largCorte={largCorte} escala={escala} />
      </div>
    </PageTransition>
  );
}