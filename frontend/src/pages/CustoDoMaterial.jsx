import React, { useState, useMemo, useEffect } from "react";
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from "../components/BotaoVoltar/BotaoVoltar";
import NavegacaoFluxo from "../components/NavegacaoFluxo/NavegacaoFluxo";
import {
  FileEditIcon,
  Save,
  Trash2,
  Search,
  FilePlus,
  CirclePlus,
} from "lucide-react";
import Swal from "sweetalert2";
import "../styles/ContainerVoltarNovo.css";
import "../styles/CustoDoMaterial.css";
import api from "../../services/api";
import { useProjeto } from "../hooks/useProjeto";

export default function CustoDoMaterial() {
  const [isLoading, setIsLoading] = useState(false);
  const [idProjetoSalvo, setIdProjetoSalvo] = useState(null);

  const { contextoGlobal, atualizarContexto } = useProjeto();

  const [nomeProjeto, setNomeProjeto] = useState("");
  const [maoDeObra, setMaoDeObra] = useState(0);
  const [instalacao, setInstalacao] = useState(0);

  const [materiais, setMateriais] = useState([
    {
      id: Date.now(),
      material: "",
      quantidade: "",
      unidade_medida: "",
      valor_unitario: 0,
    },
  ]);

  useEffect(() => {
    if (contextoGlobal?.custo) {
      const proj = contextoGlobal.custo;
      setIdProjetoSalvo(proj.id_projeto || proj.id);
      setNomeProjeto(proj.nome_projeto);
      setMaoDeObra(Number(proj.mao_de_obra));
      setInstalacao(Number(proj.instalacao));

      const materiaisParsed =
        typeof proj.materiais === "string"
          ? JSON.parse(proj.materiais)
          : proj.materiais || [];
      const materiaisCarregados =
        materiaisParsed.length > 0
          ? materiaisParsed.map((m) => ({
              ...m,
              id: m.id_item || Date.now() + Math.random(),
            }))
          : [
              {
                id: Date.now(),
                material: "",
                quantidade: "",
                unidade_medida: "",
                valor_unitario: 0,
              },
            ];

      setMateriais(materiaisCarregados);
    }
  }, [contextoGlobal?.custo]);

  useEffect(() => {
    const sincronizarEBuscarPlano = async () => {
      if (
        contextoGlobal.nomeProjetoGlobal &&
        contextoGlobal.nomeProjetoGlobal !== nomeProjeto
      ) {
        // Bloqueio para evitar que a sincronização automática sobrescreva os dados já carregados do banco
        if (
          contextoGlobal?.custo &&
          contextoGlobal.custo.nome_projeto === contextoGlobal.nomeProjetoGlobal
        ) {
          setNomeProjeto(contextoGlobal.nomeProjetoGlobal);
          return;
        }

        const novoNome = contextoGlobal.nomeProjetoGlobal;
        setNomeProjeto(novoNome);

        try {
          const response = await api.get("/planos-corte");
          const planoEncontrado = response.data.find(
            (p) => p.nome_servico === novoNome,
          );

          if (planoEncontrado) {
            // 1. Converte as chapas que vieram do banco
            const chapas =
              typeof planoEncontrado.chapas === "string"
                ? JSON.parse(planoEncontrado.chapas)
                : planoEncontrado.chapas || [];

            atualizarContexto({
              orcamento: {
                id_orcamento: planoEncontrado.id_orcamento,
                nome_projeto: novoNome,
              },
              // Importante: Guardar o plano no contexto para o useEffect não rodar em loop
              planoCorte: planoEncontrado,
            });

            // 2. Lógica de Agrupamento por Nome do Material
            const grupos = {};
            chapas.forEach((c) => {
              // Se c.material existir, usa ele. Se não, usa o nome genérico.
              const nomeMaterial =
                c.material && c.material.trim() !== ""
                  ? c.material
                  : "Chapa de MDF (Sem descrição)";

              grupos[nomeMaterial] = (grupos[nomeMaterial] || 0) + 1;
            });

            // 3. Transforma o agrupamento no formato da tabela de materiais
            const materiaisAgrupados = Object.entries(grupos).map(
              ([nome, qtd], idx) => ({
                id: Date.now() + idx,
                material: nome,
                quantidade: qtd,
                unidade_medida: "chapa",
                valor_unitario: 0,
              }),
            );

            setMateriais(
              materiaisAgrupados.length > 0
                ? materiaisAgrupados
                : [
                    {
                      id: Date.now(),
                      material: "",
                      quantidade: "",
                      unidade_medida: "",
                      valor_unitario: 0,
                    },
                  ],
            );
          }
        } catch (err) {
          console.error("Erro ao sincronizar e buscar plano", err);
        }
      }
    };

    sincronizarEBuscarPlano();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextoGlobal.nomeProjetoGlobal, nomeProjeto]);

  const extrairMensagensErro = (err) => {
    const data = err.response?.data;
    if (!data) return "Falha na comunicação com o servidor.";

    const listaErros = data.errors || data.issues || data.detalhes;
    if (Array.isArray(listaErros) && listaErros.length > 0) {
      return listaErros
        .map((e) => {
          const path = e.path ? (Array.isArray(e.path) ? e.path.join(" > ") : e.path) : "";
          const msg = e.message || e.msg || e.erro || JSON.stringify(e);
          // O Zod retorna índices para arrays, ex: materiais > 0 > quantidade
          return path ? `<b>Campo [${path}]:</b> ${msg}` : msg;
        })
        .join("<br/><br/>");
    }

    return data.error || data.message || "Erro interno ao processar requisição.";
  };

  const subtotalMateriais = useMemo(() => {
    return materiais.reduce(
      (acc, item) =>
        acc + (Number(item.quantidade) || 0) * (item.valor_unitario || 0),
      0,
    );
  }, [materiais]);

  const custoTotal = useMemo(
    () => subtotalMateriais + maoDeObra + instalacao,
    [subtotalMateriais, maoDeObra, instalacao],
  );

  const formatMoney = (valor) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const formatInputBR = (valor) =>
    (Number(valor) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const adicionarLinha = () => {
    setMateriais([
      ...materiais,
      {
        id: Date.now(),
        material: "",
        quantidade: "",
        unidade_medida: "",
        valor_unitario: 0,
      },
    ]);
  };

  const removerLinha = async (id) => {
    if (materiais.length === 1) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        iconColor: "var(--vermelho-destaque)",
        text: "O projeto deve ter pelo menos um material.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
      return;
    }

    const result = await Swal.fire({
      customClass: { popup: "modal-confirma-exclusao" },
      title: "Excluir item?",
      text: "Deseja remover este material da lista?",
      icon: "warning",
      iconColor: "var(--vermelho-destaque)",
      showCancelButton: true,
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "var(--vermelho-destaque)",
      cancelButtonColor: "var(--btn-cancelar-exclusao)",
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        // 1. Remove o item visualmente criando uma nova lista
        const novaListaMateriais = materiais.filter((m) => m.id !== id);
        setMateriais(novaListaMateriais);

        // 2. Se o projeto já existe no banco, força o salvamento automático da nova lista
        if (idProjetoSalvo) {

          const materiaisPreenchidos = novaListaMateriais.filter(
            (m) => m.material.trim() !== "" || m.quantidade !== "" || m.unidade_medida.trim() !== ""
          );

        const payload = {
            id_orcamento:
              contextoGlobal?.orcamento?.id_orcamento ||
              contextoGlobal?.orcamento?.id ||
              null,
            nome_projeto: nomeProjeto,
            mao_de_obra: maoDeObra,
            instalacao: instalacao,
            materiais: materiaisPreenchidos.map((m) => ({
              material: m.material,
              quantidade: Number(m.quantidade) || 0,
              unidade_medida: m.unidade_medida,
              valor_unitario: Number(m.valor_unitario) || 0,
            })),
          };

          await api.put(`/custos/${idProjetoSalvo}`, payload);
        }

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          iconColor: "var(--verde-destaque)",
          title: "Excluído com sucesso!",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-confirmacao" },
        });
      } catch (err) {
        {
          console.error("Erro ao remover linha", err);
        }

        handleBuscar();
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          iconColor: "var(--vermelho-destaque)",
          title: "Erro ao excluir material do banco.",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-erro" },
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const atualizarItem = (id, campo, valor) => {
    setMateriais(
      materiais.map((m) => (m.id === id ? { ...m, [campo]: valor } : m)),
    );
  };

  const handleKeyDownTab = (e, index) => {
    if (e.key === "Tab" && !e.shiftKey && index === materiais.length - 1) {
      adicionarLinha();
    }
  };

 const montarPayload = () => {
    // Filtra (descarta) as linhas que estão completamente em branco
    const materiaisPreenchidos = materiais.filter(
      (m) => m.material.trim() !== "" || m.quantidade !== "" || m.unidade_medida.trim() !== ""
    );

    return {
      id_orcamento:
        contextoGlobal?.orcamento?.id_orcamento ||
        contextoGlobal?.orcamento?.id ||
        null,
      nome_projeto: nomeProjeto,
      mao_de_obra: maoDeObra,
      instalacao: instalacao,
      materiais: materiaisPreenchidos.map((m) => ({
        material: m.material,
        quantidade: Number(m.quantidade) || 0,
        unidade_medida: m.unidade_medida,
        valor_unitario: Number(m.valor_unitario) || 0,
      })),
    };
  };

  const limparFormulario = () => {
    setIdProjetoSalvo(null);
    setNomeProjeto("");
    setMaoDeObra(0);
    setInstalacao(0);
    setMateriais([
      {
        id: Date.now(),
        material: "",
        quantidade: "",
        unidade_medida: "",
        valor_unitario: 0,
      },
    ]);
    atualizarContexto({ nomeProjetoGlobal: "", custo: null });

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      iconColor: "var(--verde-destaque)",
      text: "Limpeza realizada com sucesso",
      showConfirmButton: false,
      timer: 3000,
      customClass: { popup: "mensagem-confirmacao" },
    });
  };

  const handleBuscar = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/custos");
      const dadosNormalizados = response.data.map((projeto) => ({
        ...projeto,
        materiais:
          typeof projeto.materiais === "string"
            ? JSON.parse(projeto.materiais)
            : projeto.materiais,
      }));

      if (!dadosNormalizados.length) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          iconColor: "var(--vermelho-destaque)",
          text: "Nenhum projeto encontrado.",
          customClass: { popup: "mensagem-erro" },
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }

      Swal.fire({
        title: "Pesquisar Projetos",
        customClass: { popup: "modal-pesquisa" },
        html: `<input type="text" id="swal-search" class="swal2-input input-pesquisa" placeholder="Digite o nome..."><div id="swal-results" class="lista-resultados"></div>`,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Fechar",
        didOpen: () => {
          const input = document.getElementById("swal-search");
          const list = document.getElementById("swal-results");
          const render = (val) => {
            const filtered = dadosNormalizados.filter((p) =>
              (p.nome_projeto || "").toLowerCase().includes(val.toLowerCase()),
            );
            list.innerHTML = filtered
              .map(
                (p) => `
              <div class="swal-res-item item-resultado" data-id="${p.id_projeto}">
                <span class="item-titulo">${p.nome_projeto}</span>
              </div>`,
              )
              .join("");

            document.querySelectorAll(".swal-res-item").forEach(
              (el) =>
                (el.onclick = async () => {
                  const proj = dadosNormalizados.find(
                    (x) => x.id_projeto == el.dataset.id,
                  );
                  setIdProjetoSalvo(proj.id_projeto);
                  setNomeProjeto(proj.nome_projeto);
                  setMaoDeObra(Number(proj.mao_de_obra));
                  setInstalacao(Number(proj.instalacao));
                  setMateriais(
                    proj.materiais.map((m) => ({
                      ...m,
                      id: m.id_item || Date.now() + Math.random(),
                    })),
                  );
                  atualizarContexto({
                    nomeProjetoGlobal: proj.nome_projeto,
                    custo: proj,
                  });
                  Swal.close();
                }),
            );
          };
          render("");
          input.focus();
          input.oninput = (e) => render(e.target.value);
        },
      });
    } catch (err) {
      console.error("Erro ao buscar custo", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuscarPlanoDeCorte = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/planos-corte");
      const planos = response.data;
      if (!planos.length) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          iconColor: "var(--vermelho-destaque)",
          text: "Nenhum serviço encontrado.",
          customClass: { popup: "mensagem-erro" },
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }

      Swal.fire({
        title: "Importar Plano de Corte",
        customClass: { popup: "modal-pesquisa" },
        html: `<input type="text" id="swal-search-plano" class="swal2-input input-pesquisa" placeholder="Buscar projeto..."><div id="swal-results-plano" class="lista-resultados"></div>`,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        didOpen: () => {
          const input = document.getElementById("swal-search-plano");
          const list = document.getElementById("swal-results-plano");
          const render = (val) => {
            const filtered = planos.filter((p) =>
              (p.nome_servico || "").toLowerCase().includes(val.toLowerCase()),
            );
            list.innerHTML = filtered
              .map(
                (p) => `
              <div class="swal-res-item item-resultado" data-id="${p.id_plano}">
                <span class="item-titulo">${p.nome_servico || `ID: ${p.id_plano}`}</span>
              </div>`,
              )
              .join("");

            document.querySelectorAll(".swal-res-item").forEach(
              (el) =>
                (el.onclick = async () => {
                  const plano = planos.find((x) => x.id_plano == el.dataset.id);
                  const nomeDoPlano = plano.nome_servico;

                  // Tenta carregar os custos já salvos para este projeto primeiro
                  try {
                    const resCustos = await api.get("/custos");
                    const custoExistente = resCustos.data.find(
                      (c) => c.nome_projeto === nomeDoPlano,
                    );

                    if (custoExistente) {
                      const materiaisParsed =
                        typeof custoExistente.materiais === "string"
                          ? JSON.parse(custoExistente.materiais)
                          : custoExistente.materiais;

                      setIdProjetoSalvo(
                        custoExistente.id_projeto || custoExistente.id,
                      );
                      setNomeProjeto(custoExistente.nome_projeto);
                      setMaoDeObra(Number(custoExistente.mao_de_obra));
                      setInstalacao(Number(custoExistente.instalacao));
                      setMateriais(
                        materiaisParsed.map((m) => ({
                          ...m,
                          id: m.id_item || Date.now() + Math.random(),
                        })),
                      );

                      atualizarContexto({
                        nomeProjetoGlobal: custoExistente.nome_projeto,
                        custo: custoExistente,
                        orcamento: {
                          id_orcamento: plano.id_orcamento,
                          nome_projeto: nomeDoPlano,
                        },
                      });

                      Swal.close();
                      return; // Interrompe para não zerar os dados
                    }
                  } catch (err) {
                    console.error("Erro ao verificar custo existente", err);
                  }

                  // Se não encontrou projeto salvo, importa a base zerada das chapas
                  const chapas =
                    typeof plano.chapas === "string"
                      ? JSON.parse(plano.chapas)
                      : plano.chapas || [];
                  setNomeProjeto(nomeDoPlano);

                  atualizarContexto({
                    nomeProjetoGlobal: nomeDoPlano,
                    orcamento: {
                      id_orcamento: plano.id_orcamento,
                      nome_projeto: nomeDoPlano,
                    },
                  });

                  // Agrupa chapas pelo nome/material
                  const grupos = {};
                  chapas.forEach((c) => {
                    const nome = c.material?.trim()
                      ? c.material
                      : "Chapa de MDF (Sem descrição)";
                    grupos[nome] = (grupos[nome] || 0) + 1;
                  });

                  const materiaisAgrupados = Object.entries(grupos).map(
                    ([mat, qtd], idx) => ({
                      id: Date.now() + idx,
                      quantidade: qtd,
                      material: mat,
                      unidade_medida: "chapa",
                      valor_unitario: 0,
                    }),
                  );

                  setMateriais(
                    materiaisAgrupados.length > 0
                      ? materiaisAgrupados
                      : [
                          {
                            id: Date.now(),
                            material: "",
                            quantidade: "",
                            unidade_medida: "",
                            valor_unitario: 0,
                          },
                        ],
                  );
                  Swal.close();
                }),
            );
          };
          render("");
          input.oninput = (e) => render(e.target.value);
          input.focus();
        },
      });
    } catch (err) {
      console.error("Erro ao buscar plano de corte", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvar = async () => {
  if (!nomeProjeto || !nomeProjeto.trim()) {
      return Swal.fire({
        toast: false, position: "center", icon: "warning", iconColor: "var(--vermelho-destaque)",
        title: "Nome Obrigatório", text: "O nome do projeto não pode ficar em branco.",
        showConfirmButton: true, confirmButtonColor: "var(--vermelho-destaque)",
      });
    }

   // Validação Early Return isolada para itens parcialmente preenchidos
    const materiaisPreenchidos = materiais.filter(
      (m) => m.material.trim() !== "" || m.quantidade !== "" || m.unidade_medida.trim() !== ""
    );

    const indexInvalido = materiaisPreenchidos.findIndex(
      (m) => !m.material.trim() || Number(m.quantidade) <= 0 || !m.unidade_medida.trim()
    );

    if (indexInvalido !== -1) {
      return Swal.fire({
        toast: false, position: "center", icon: "warning", iconColor: "var(--vermelho-destaque)",
        title: "Material Inválido",
        html: `Verifique os materiais adicionados.<br/>Nome, unidade e quantidade (maior que zero) são obrigatórios para os itens preenchidos.`,
        showConfirmButton: true, confirmButtonColor: "var(--vermelho-destaque)",
      });
    }

    setIsLoading(true);
    try {
      const payload = montarPayload();
      const { data } = await api.post("/custos", payload);
      
      setIdProjetoSalvo(data.id_projeto);

      atualizarContexto({
        nomeProjetoGlobal: nomeProjeto,
        orcamento: {
          id_orcamento: data.id_orcamento || payload.id_orcamento,
          nome_projeto: nomeProjeto,
        },
        custo: { ...payload, id_projeto: data.id || data.id_projeto },
      });

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        iconColor: "var(--verde-destaque)",
        title: "Projeto salvo com sucesso",
        customClass: { popup: "mensagem-confirmacao" },
        showConfirmButton: false,
        timer: 3000,
      });
   } catch (err) {
      console.error("Erro ao salvar custo", err);
      Swal.fire({
        toast: false, position: "center", icon: "error", iconColor: "var(--vermelho-destaque)",
        title: "Falha de Validação",
        html: extrairMensagensErro(err),
        showConfirmButton: true, confirmButtonColor: "var(--vermelho-destaque)",
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditar = async () => {
   if (!idProjetoSalvo) return;
    
    if (!nomeProjeto || !nomeProjeto.trim()) {
      return Swal.fire({
        toast: false, position: "center", icon: "warning", iconColor: "var(--vermelho-destaque)",
        title: "Nome Obrigatório", text: "O nome do projeto não pode ficar em branco.",
        showConfirmButton: true, confirmButtonColor: "var(--vermelho-destaque)",
      });
    }

  // Validação Early Return isolada para itens parcialmente preenchidos
    const materiaisPreenchidos = materiais.filter(
      (m) => m.material.trim() !== "" || m.quantidade !== "" || m.unidade_medida.trim() !== ""
    );

    const indexInvalido = materiaisPreenchidos.findIndex(
      (m) => !m.material.trim() || Number(m.quantidade) <= 0 || !m.unidade_medida.trim()
    );

    if (indexInvalido !== -1) {
      return Swal.fire({
        toast: false, position: "center", icon: "warning", iconColor: "var(--vermelho-destaque)",
        title: "Material Inválido",
        html: `Verifique os materiais adicionados.<br/>Nome, unidade e quantidade (maior que zero) são obrigatórios para os itens preenchidos.`,
        showConfirmButton: true, confirmButtonColor: "var(--vermelho-destaque)",
      });
    }

    setIsLoading(true);
    try {
      const payload = montarPayload();
      await api.put(`/custos/${idProjetoSalvo}`, payload);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        iconColor: "var(--verde-destaque)",
        title: "Projeto editado com sucesso",
        customClass: { popup: "mensagem-confirmacao" },
        showConfirmButton: false,
        timer: 3000,
      });
   } catch (err) {
      console.error("Erro ao editar custo", err);
      Swal.fire({
        toast: false, position: "center", icon: "error", iconColor: "var(--vermelho-destaque)",
        title: "Falha de Validação",
        html: extrairMensagensErro(err),
        showConfirmButton: true, confirmButtonColor: "var(--vermelho-destaque)",
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcluir = async () => {
    if (!idProjetoSalvo) return;
    const result = await Swal.fire({
      customClass: { popup: "modal-confirma-exclusao" },
      title: "Excluir item?",
      text: "Deseja remover este material da lista?",
      icon: "warning",
      iconColor: "var(--vermelho-destaque)",
      showCancelButton: true,
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "var(--vermelho-destaque)",
      cancelButtonColor: "var(--btn-cancelar-exclusao)",
    });
    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        await api.delete(`/custos/${idProjetoSalvo}`);
        limparFormulario();
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          iconColor: "var(--verde-destaque)",
          title: "Excluído com sucesso!",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-confirmacao" },
        });
      } catch (err) {
        console.error("Erro ao excluir custo", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <PageTransition className="financeiro-container">
      <div className="wrapper-header-actions">
        <div className="header-actions">
          <BotaoVoltar />
          <button className="btn-novo-topo" onClick={limparFormulario}>
            <FilePlus size={18} />
            <span>Novo</span>
          </button>
        </div>
      </div>
      <img src="/logo.svg" alt="Logo" className="logo-img" />
      <h1 className="nome-fantasia">GR Marcenaria</h1>
      <h1 className="titulo-pagina">Custo do Material</h1>
      <div className="form-group">
        <h2 className="subtitulo">Nome do Projeto *</h2>
        <div className="cotainer-nomeProjeto">
          <input
            type="text"
            placeholder="Nome do projeto completo ( * obrigatório)"
            className="nomeProjeto"
            value={nomeProjeto}
            onChange={(e) => {
              setNomeProjeto(e.target.value);
              atualizarContexto({ nomeProjetoGlobal: e.target.value });
            }}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleBuscarPlanoDeCorte}
            disabled={isLoading}
            className="btn-icone-lupa"
          >
            <Search size={18} />
            <span>Orçamento</span>
          </button>
        </div>
      </div>
      <h2 className="subtitulo">Itens da Ficha Técnica</h2>
      <div className="tabela-materiais">
        <div className="tabela-header">
          <span className="col-mat">Material</span>
          <span className="col-qtd">Qtd</span>
          <span className="col-un">Unid</span>
          <span className="col-val">Valor Un.</span>
          <span className="col-sub">Subtotal</span>
          <span className="col-del"></span>
        </div>
        {materiais.map((item, index) => (
          <div key={item.id} className="tabela-row">
            <input
              className="col-mat"
              placeholder="Nome do material"
              type="text"
              value={item.material}
              onChange={(e) =>
                atualizarItem(item.id, "material", e.target.value)
              }
            />
            <input
              className="col-qtd"
              type="number"
              placeholder="Ex. 1"
              value={item.quantidade}
              onChange={(e) =>
                atualizarItem(item.id, "quantidade", e.target.value)
              }
              min="1"
            />
            <input
              className="col-un"
              placeholder="Ex. caixa"
              type="text"
              value={item.unidade_medida}
              onChange={(e) =>
                atualizarItem(item.id, "unidade_medida", e.target.value)
              }
            />
            <input
              className="col-val"
              type="text"
              value={formatInputBR(item.valor_unitario)}
              onChange={(e) =>
                atualizarItem(
                  item.id,
                  "valor_unitario",
                  Number(e.target.value.replace(/\D/g, "")) / 100,
                )
              }
              onKeyDown={(e) => handleKeyDownTab(e, index)}
            />
            <span className="col-sub">
              {formatMoney(
                (Number(item.quantidade) || 0) * item.valor_unitario,
              )}
            </span>
            <button
              className="btn-del-row"
              onClick={() => removerLinha(item.id)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      <button className="btn-add-row" onClick={adicionarLinha}>
        <CirclePlus size={16} /> Adicionar Material
      </button>
      <div className="form-row" style={{ marginTop: "20px" }}>
        <div className="form-group flex-1">
          <label className="titulo-input">Mão de Obra</label>
          <input
            type="text"
            value={formatInputBR(maoDeObra)}
            onChange={(e) =>
              setMaoDeObra(Number(e.target.value.replace(/\D/g, "")) / 100)
            }
          />
        </div>
        <div className="form-group flex-1">
          <label className="titulo-input">Instalação</label>
          <input
            type="text"
            value={formatInputBR(instalacao)}
            onChange={(e) =>
              setInstalacao(Number(e.target.value.replace(/\D/g, "")) / 100)
            }
          />
        </div>
      </div>
      <div className="total-box">
        <span>Custo Total:</span>
        <strong>{formatMoney(custoTotal)}</strong>
      </div>
      <div className="btn-containver-acoes">
        <div className="btn-wrapper-acoes">
          <div className="btn-wrapper-flex-acoes">
            <button
              className="btn-salvar"
              onClick={handleSalvar}
              disabled={isLoading || idProjetoSalvo !== null}
            >
              <Save size={18} />
              <span>Salvar</span>
            </button>
            <button
              className="btn-editar"
              onClick={handleEditar}
              disabled={isLoading || idProjetoSalvo === null}
            >
              <FileEditIcon size={18} />
              <span>Editar</span>
            </button>
          </div>
          <div className="btn-wrapper-flex-acoes">
            <button
              className="btn-buscar"
              onClick={handleBuscar}
              disabled={isLoading}
            >
              <Search size={18} />
              <span>Buscar</span>
            </button>
            <button
              className="btn-excluir"
              onClick={handleExcluir}
              disabled={isLoading || idProjetoSalvo === null}
            >
              <Trash2 size={18} />
              <span>Excluir</span>
            </button>
          </div>
        </div>
      </div>
      <div className="container-btn-rodape">
        <BotaoVoltar />
        <NavegacaoFluxo />
      </div>
    </PageTransition>
  );
}
