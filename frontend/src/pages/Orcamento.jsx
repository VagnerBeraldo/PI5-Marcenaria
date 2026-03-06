import React, { useState, useEffect, useMemo } from "react";
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from "../components/BotaoVoltar/BotaoVoltar";
import {
  Save,
  Trash2,
  Search,
  FilePlus,
  CirclePlus,
  Printer,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../services/api";
import "../styles/Orcamento.css";

export default function Orcamento() {
  const [isLoading, setIsLoading] = useState(false);
  const [idOrcamentoSalvo, setIdOrcamentoSalvo] = useState(null);

  // Estados Base
  const [clienteId, setClienteId] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [diasTrabalho, setDiasTrabalho] = useState(1);

  // Custos Diretos
  const [valorCustoBase, setValorCustoBase] = useState(0);
  const [impostoImportacao, setImpostoImportacao] = useState(0);
  const [frete, setFrete] = useState(0);

  // Taxas e Margens (%)
  const [impostoPerc, setImpostoPerc] = useState(0);
  const [taxaCartaoPerc, setTaxaCartaoPerc] = useState(0);
  const [margemLucroPerc, setMargemLucroPerc] = useState(50);

  // Adiantamento
  const [adiantamento, setAdiantamento] = useState(0);

  // Extras (.map)
  const [extras, setExtras] = useState([]);

  // Base de Despesas (Buscadas do Banco)
  const [baseDespesas, setBaseDespesas] = useState({
    custoFixoTotal: 0,
    energiaTotal: 0,
  });

  // Override Manual do Preço Final
  const [precoManual, setPrecoManual] = useState(null);

  // --- BUSCAR DESPESAS AO CARREGAR A PÁGINA ---
  useEffect(() => {
    const buscarDespesasBase = async () => {
      try {
        const response = await api.get("/despesas");
        const dados = response.data;

        if (!dados) return; // Segurança caso venha vazio

        // Como seu backend já manda o objeto direto, vamos usá-lo!
        // Extraímos os grupos de despesas (ou usamos o objeto principal como fallback)
        const fixas = dados.despesasFixas || dados;
        const variaveis = dados.despesasVariaveis || dados;

        // Somamos os valores de dentro do grupo despesasFixas
        let somaFixas =
          Number(fixas.manutencao_maquinas || 0) +
          Number(fixas.internet_telefone || 0) +
          Number(fixas.contador || 0);

        // Verifica as despesas da tabela dinâmica (adicionais)
        const adicionais = dados.despesas_adicionais || fixas.adicionais || [];
        if (adicionais.length > 0 || typeof adicionais === "string") {
          const listaAdicionais =
            typeof adicionais === "string"
              ? JSON.parse(adicionais)
              : adicionais;
          const extrasFixas = listaAdicionais
            .filter((d) => d.tipo === "FIXA")
            .reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
          somaFixas += extrasFixas;
        }

        // Pega a energia com o nome EXATO que o backend retornou
        const energia = Number(variaveis.energia || 0);
        const imposto = Number(variaveis.impostoPerc || 0);
        const taxaCartao = Number(variaveis.taxaCartaoPerc || 0);

        // Atualiza a tela com os valores encontrados!
        setBaseDespesas({
          custoFixoTotal: somaFixas,
          energiaTotal: energia,
          impostoPadrao: imposto,
          taxaCartaoPadrao: taxaCartao,
        });

        setImpostoPerc(imposto);
        setTaxaCartaoPerc(taxaCartao);
      } catch (error) {
        console.error("Erro ao buscar base de despesas:", error);
      }
    };

    buscarDespesasBase();
  }, []);

  // --- CÁLCULOS DINÂMICOS (useMemo) ---
  const custoFixoRateado = useMemo(
    () => (baseDespesas.custoFixoTotal / 22) * diasTrabalho,
    [baseDespesas.custoFixoTotal, diasTrabalho],
  );
  const energiaRateada = useMemo(
    () => (baseDespesas.energiaTotal / 22) * diasTrabalho,
    [baseDespesas.energiaTotal, diasTrabalho],
  );
  const custoMaterialTotal = useMemo(
    () => valorCustoBase * quantidade,
    [valorCustoBase, quantidade],
  );
  const totalExtras = useMemo(
    () => extras.reduce((acc, item) => acc + (Number(item.valor) || 0), 0),
    [extras],
  );

  const custoTotal = useMemo(() => {
    return (
      custoMaterialTotal +
      impostoImportacao +
      frete +
      custoFixoRateado +
      energiaRateada +
      totalExtras
    );
  }, [
    custoMaterialTotal,
    impostoImportacao,
    frete,
    custoFixoRateado,
    energiaRateada,
    totalExtras,
  ]);

  const precoSugerido = useMemo(() => {
    const totalTaxas = impostoPerc + taxaCartaoPerc + margemLucroPerc;
    if (totalTaxas >= 100) return 0; // Proteção matemática
    return custoTotal / (1 - totalTaxas / 100);
  }, [custoTotal, impostoPerc, taxaCartaoPerc, margemLucroPerc]);

  // Arredonda para o múltiplo de 50 mais próximo para cima
  const precoArredondado = useMemo(
    () => Math.ceil(precoSugerido / 50) * 50,
    [precoSugerido],
  );
  const precoFinalImpresso =
    precoManual !== null ? precoManual : precoArredondado;

  // --- FORMATAÇÃO ---
  const formatMoney = (valor) =>
    (Number(valor) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  const handleMoneyInput = (val, setter) =>
    setter(Number(val.replace(/\D/g, "")) / 100);

  // --- FUNÇÕES DE EXTRAS ---
  const adicionarExtra = () =>
    setExtras([...extras, { id: Date.now(), descricao: "", valor: 0 }]);
  const removerExtra = (id) => setExtras(extras.filter((e) => e.id !== id));
  const atualizarExtra = (id, campo, valor) =>
    setExtras(extras.map((e) => (e.id === id ? { ...e, [campo]: valor } : e)));

  // --- BUSCAR FICHA TÉCNICA (Lupa) ---
  const handleBuscarProjeto = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/custos");
      const listaCustos = Array.isArray(response.data)
        ? response.data
        : response.data.custos || [];

      if (!listaCustos.length) {
        Swal.fire({
          title: "Aviso",
          text: "Nenhuma Ficha Técnica encontrada.",
          icon: "info",
          customClass: { popup: "modal-pesquisa" },
        });
        return;
      }

      Swal.fire({
        title: "Importar Custo do Projeto",
        customClass: { popup: "modal-pesquisa" },
        html: `<input type="text" id="swal-search-proj" class="swal2-input input-pesquisa" placeholder="Buscar projeto..."><div id="swal-results-proj" class="lista-resultados"></div>`,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Fechar",
        didOpen: () => {
          const input = document.getElementById("swal-search-proj");
          const list = document.getElementById("swal-results-proj");

          const render = (val) => {
            const filtered = listaCustos.filter((p) =>
              p.nome_projeto.toLowerCase().includes(val.toLowerCase()),
            );

            list.innerHTML = filtered
              .map((p) => {
                // Faz o cálculo dinâmico da ficha técnica somando Mão de Obra + Instalação + Materiais
                const materiaisArray =
                  typeof p.materiais === "string"
                    ? JSON.parse(p.materiais)
                    : p.materiais || [];
                const custoMateriais = materiaisArray.reduce(
                  (acc, m) =>
                    acc +
                    Number(m.quantidade || 0) * Number(m.valor_unitario || 0),
                  0,
                );
                const custoCalculado =
                  Number(p.mao_de_obra || 0) +
                  Number(p.instalacao || 0) +
                  custoMateriais;

                return `
              <div class="swal-res-item item-resultado" data-id="${p.id_projeto}" data-custo="${custoCalculado}">
                <span class="item-titulo">${p.nome_projeto}</span>
                <span class="item-badge">${formatMoney(custoCalculado)}</span>
              </div>`;
              })
              .join("");

            document.querySelectorAll(".swal-res-item").forEach(
              (el) =>
                (el.onclick = () => {
                  setProjetoId(el.dataset.id);
                  setNomeProjeto(el.querySelector(".item-titulo").innerText);
                  setValorCustoBase(Number(el.dataset.custo) || 0);
                  Swal.close();
                }),
            );
          };
          render("");
          input.focus();
          input.oninput = (e) => render(e.target.value);
        },
      });
    } catch (error) {
      console.error("Erro ao buscar projetos.", error);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Erro ao buscar projetos.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const limparFormulario = () => {
    setIdOrcamentoSalvo(null);
    setProjetoId("");
    setNomeProjeto("");
    setQuantidade(1);
    setDiasTrabalho(1);
    setValorCustoBase(0);
    setImpostoImportacao(0);
    setFrete(0);
    setImpostoPerc(baseDespesas.impostoPadrao || 6);
    setTaxaCartaoPerc(baseDespesas.taxaCartaoPadrao || 3);
    setMargemLucroPerc(50);
    setExtras([]);
    setPrecoManual(null);
  };

  const handleSalvar = async () => {
    if (!nomeProjeto.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "O Nome do Serviço é obrigatório.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        id_cliente: clienteId ? Number(clienteId) : null,
        id_projeto: projetoId ? Number(projetoId) : null,
        nome_projeto: nomeProjeto,
        quantidade,
        dias_trabalho: diasTrabalho,
        valor_custo: valorCustoBase,
        imposto_importacao: impostoImportacao,
        frete,
        custo_fixo: custoFixoRateado,
        energia_eletrica: energiaRateada,
        imposto: impostoPerc,
        taxa_cartao: taxaCartaoPerc,
        margem_lucro: margemLucroPerc,
        preco_sugerido: precoSugerido,
        preco_final_impresso: precoFinalImpresso,
        adiantamento: adiantamento,
        extras: extras.map((e) => ({
          descricao: e.descricao,
          valor: Number(e.valor),
        })),
      };

      if (idOrcamentoSalvo) {
        await api.put(`/orcamentos/${idOrcamentoSalvo}`, payload);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Orçamento atualizado!",
          showConfirmButton: false,
          timer: 3000,
        });
      } else {
        const response = await api.post("/orcamentos", payload);
        setIdOrcamentoSalvo(response.data.id);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Orçamento salvo!",
          showConfirmButton: false,
          timer: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      Swal.fire({
        icon: "error",
        title: "Erro de Validação",
        text: "Não foi possível salvar o orçamento. Verifique os dados.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- CARREGAR DADOS NA TELA ---
  const carregarOrcamento = (orc) => {
    setIdOrcamentoSalvo(orc.id);
    setClienteId(orc.id_cliente || "");
    setProjetoId(orc.id_projeto || "");
    setNomeProjeto(orc.nome_projeto || "");
    setQuantidade(Number(orc.quantidade) || 1);
    setDiasTrabalho(Number(orc.dias_trabalho) || 1);
    setValorCustoBase(Number(orc.valor_custo) || 0);
    setImpostoImportacao(Number(orc.imposto_importacao) || 0);
    setFrete(Number(orc.frete) || 0);
    setImpostoPerc(Number(orc.imposto) || 0);
    setTaxaCartaoPerc(Number(orc.taxa_cartao) || 0);
    setMargemLucroPerc(Number(orc.margem_lucro) || 50);
    setAdiantamento(Number(orc.adiantamento) || 0);
    setPrecoManual(Number(orc.preco_final_impresso) || null);

    // Processar o JSON de extras garantindo IDs únicos para o React map
    try {
      const extrasParsed =
        typeof orc.extras === "string"
          ? JSON.parse(orc.extras)
          : orc.extras || [];
      setExtras(
        extrasParsed.map((e, idx) => ({
          id: Date.now() + idx,
          descricao: e.descricao,
          valor: Number(e.valor),
        })),
      );
    } catch (e) {
      console.error("Erro ao carregar orçamento", e);
      setExtras([]);
    }
  };

  // --- BUSCAR ORÇAMENTOS (Lupa Geral) ---
  const handleBuscarOrcamento = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/orcamentos");
      if (!data || data.length === 0) {
        Swal.fire({
          title: "Aviso",
          text: "Nenhum orçamento salvo encontrado.",
          icon: "info",
        });
        return;
      }

      Swal.fire({
        title: "Buscar Orçamento",
        customClass: { popup: "modal-pesquisa" },
        html: `<input type="text" id="swal-search-orc" class="swal2-input input-pesquisa" placeholder="Buscar projeto..."><div id="swal-results-orc" class="lista-resultados"></div>`,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Fechar",
        didOpen: () => {
          const input = document.getElementById("swal-search-orc");
          const list = document.getElementById("swal-results-orc");

          const render = (val) => {
            const filtered = data.filter((o) =>
              (o.nome_projeto || "").toLowerCase().includes(val.toLowerCase()),
            );

            list.innerHTML = filtered
              .map(
                (o) => `
              <div class="swal-res-item item-resultado" data-id="${o.id}">
                <span class="item-titulo">ID: ${o.id} - ${o.nome_projeto}</span>
                <span class="item-badge">${formatMoney(o.preco_final_impresso)}</span>
              </div>`,
              )
              .join("");

            document.querySelectorAll(".swal-res-item").forEach(
              (el) =>
                (el.onclick = () => {
                  const selectedOrc = data.find(
                    (item) => item.id === Number(el.dataset.id),
                  );
                  if (selectedOrc) carregarOrcamento(selectedOrc);
                  Swal.close();
                }),
            );
          };
          render("");
          input.focus();
          input.oninput = (e) => render(e.target.value);
        },
      });
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível carregar a lista.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- EXCLUIR ORÇAMENTO ---
  const handleExcluir = async () => {
    if (!idOrcamentoSalvo) return;

    const result = await Swal.fire({
      title: "Excluir Orçamento?",
      text: "Esta ação não pode ser desfeita!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/orcamentos/${idOrcamentoSalvo}`);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Orçamento excluído!",
          showConfirmButton: false,
          timer: 3000,
        });
        limparFormulario();
      } catch (error) {
        console.error("Erro ao excluir:", error);
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível excluir o orçamento.",
        });
      }
    }
  };

  const imprimirOrcamento = () => {
    window.print();
  };

  return (
    <PageTransition className="orcamento-container">
      <div className="card-orcamento">
        <div className="header-actions ocultar-na-impressao">
          <BotaoVoltar />
          <button className="btn-novo-topo" onClick={limparFormulario}>
            <FilePlus size={18} />
            <span>Novo</span>
          </button>
        </div>

        <div className="logo-wrapper">
          <img src="/logo.svg" alt="Logo" className="logo" />
        </div>
        <h1 className="nomefantasia">GR Marcenaria</h1>
        <h1 className="title-center">Orçamento Comercial</h1>

        <div className="secao-form">
          <h3 className="section-title">Dados do Serviço</h3>
          <div className="form-row">
            <div className="form-group highlight flex-2">
              <label>Nome do Serviço / Projeto</label>
              <div className="container-lupa">
                <input
                  type="text"
                  className="input-lupa-flex"
                  value={nomeProjeto}
                  onChange={(e) => setNomeProjeto(e.target.value)}
                  placeholder="Ex: Cozinha Planejada"
                />
                <button
                  type="button"
                  onClick={handleBuscarProjeto}
                  className="btn-icone-lupa"
                >
                  <Search size={20} />
                </button>
              </div>
            </div>

            
              <div className="form-group flex-1">
                <label>Quantidade</label>
                <input
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  min="1"
                />
              </div>
              <div className="form-group flex-1">
                <label>Dias de Trabalho</label>
                <input
                  type="number"
                  value={diasTrabalho}
                  onChange={(e) => setDiasTrabalho(Number(e.target.value))}
                  min="0"
                />
              </div>
            
          </div>
        </div>

        <div className="secao-form">
          <h3 className="section-title">Custos de Base</h3>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Custo do Material (Base)</label>
              <input
                type="text"
                value={formatMoney(valorCustoBase)}
                onChange={(e) =>
                  handleMoneyInput(e.target.value, setValorCustoBase)
                }
              />
            </div>
            <div className="container-custo-energia">
              <div className="form-group flex-1 readonly-box">
                <label className="mobile">Custo Fixo</label>
                <div className="readonly-val">
                  {formatMoney(custoFixoRateado)}
                </div>
              </div>
              <div className="form-group flex-1 readonly-box">
                <label className="mobile">Energia Elétrica</label>
                <div className="readonly-val">
                  {formatMoney(energiaRateada)}
                </div>
              </div>
            </div>
          </div>

          <div className="form-row mt-15">
            <div className="form-group flex-1">
              <label>Imposto de Importação (R$)</label>
              <input
                type="text"
                value={formatMoney(impostoImportacao)}
                onChange={(e) =>
                  handleMoneyInput(e.target.value, setImpostoImportacao)
                }
              />
            </div>
            <div className="form-group flex-1">
              <label>Frete (R$)</label>
              <input
                type="text"
                value={formatMoney(frete)}
                onChange={(e) => handleMoneyInput(e.target.value, setFrete)}
              />
            </div>
            <div className="form-group flex-1">
              <label>Adiantamento (R$)</label>
              <input
                type="text"
                value={formatMoney(adiantamento)}
                onChange={(e) =>
                  handleMoneyInput(e.target.value, setAdiantamento)
                }
              />
            </div>
          </div>
        </div>

        <div className="secao-form">
          <h3 className="section-title">Outras Despesas</h3>
          {extras.map((extra) => (
            <div key={extra.id} className="form-row extra-row">
              <input
                type="text"
                className="input-extra flex-2"
                value={extra.descricao}
                onChange={(e) =>
                  atualizarExtra(extra.id, "descricao", e.target.value)
                }
                placeholder="Descrição da despesa..."
              />
              <input
                type="text"
                className="input-extra flex-1"
                value={formatMoney(extra.valor)}
                onChange={(e) => {
                  const val = Number(e.target.value.replace(/\D/g, "")) / 100;
                  atualizarExtra(extra.id, "valor", val);
                }}
              />
              <button
                className="btn-del-extra"
                onClick={() => removerExtra(extra.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button className="btn-add-row" onClick={adicionarExtra}>
            <CirclePlus size={18} /> Adicionar Despesa Extra
          </button>
        </div>

        <div className="secao-form">
          <h3 className="section-title">Imposto / Taxa / Margem</h3>
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Imposto NFe (%)</label>
              <input
                type="number"
                value={impostoPerc}
                onChange={(e) => setImpostoPerc(Number(e.target.value))}
              />
            </div>
            <div className="form-group flex-1">
              <label>Taxa Cartão (%)</label>
              <input
                type="number"
                value={taxaCartaoPerc}
                onChange={(e) => setTaxaCartaoPerc(Number(e.target.value))}
              />
            </div>
            <div className="form-group flex-1">
              <label>Margem Lucro (%)</label>
              <input
                type="number"
                value={margemLucroPerc}
                onChange={(e) => setMargemLucroPerc(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        <div className="resumo-box">
          <div className="resumo-item">
            <span>Custo Total do Serviço:</span>{" "}
            <strong>{formatMoney(custoTotal)}</strong>
          </div>
          <div className="resumo-item">
            <span>Preço Sugerido:</span>{" "}
            <strong>{formatMoney(precoSugerido)}</strong>
          </div>
          <div className="resumo-item destaque">
            <span>Preço Fechado Cliente:</span>
            <input
              type="text"
              className="input-preco-fechado"
              value={formatMoney(precoFinalImpresso)}
              onChange={(e) => handleMoneyInput(e.target.value, setPrecoManual)}
              onBlur={() => {
                if (precoManual === precoArredondado) setPrecoManual(null);
              }}
            />
          </div>
          {adiantamento > 0 && (
            <div className="resumo-item mt-15">
              <span>Saldo a Pagar:</span>
              <strong>{formatMoney(precoFinalImpresso - adiantamento)}</strong>
            </div>
          )}
        </div>

        <div className="btn-container-acoes">
          <div className="btn-container-salvar-buscar">
          <button
            className="btn-acao-salvar"
            onClick={handleSalvar}
            disabled={isLoading}
          >
            <Save size={18} />
            <span>{isLoading ? "Salvando..." : "Salvar"}</span>
          </button>
          <button
            className="btn-acao-buscar"
            onClick={handleBuscarOrcamento}
            disabled={isLoading}
          >
            <Search size={18} />
            <span>{isLoading ? "Buscando..." : "Buscar Orçamento"}</span>
          </button>
</div>
<div className="btn-container-imprimir-excluir">
          <button className="btn-acao-imprimir" onClick={imprimirOrcamento}>
            <Printer size={18} />
            <span>Imprimir</span>
          </button>

          <button className="btn-acao-excluir" onClick={handleExcluir}>
            <Trash2 size={18} />
            <span>Excluir</span>
          </button>
        </div>
      </div>
      </div>

      {/* --- ÁREA EXCLUSIVA DE IMPRESSÃO --- */}
      <div className="recibo-impressao">
        <div className="cabecalho-impressao">
          <img
            src="/logo.svg"
            alt="Logo GR Marcenaria"
            className="logo-impressao"
          />
          <h2>GR Marcenaria</h2>
        </div>

        <div className="dados-impressao">
          <div className="linha-dado">
            <strong>Cliente:</strong>{" "}
            <span>{clienteId ? `ID ${clienteId}` : "Não informado"}</span>{" "}
            {/* Ajuste para sua variável de Nome do Cliente, se houver */}
          </div>
          <div className="linha-dado">
            <strong>Projeto:</strong>{" "}
            <span>{nomeProjeto || "Não especificado"}</span>
          </div>
          <div className="linha-dado">
            <strong>Data:</strong>{" "}
            <span>{new Date().toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        <div className="valores-impressao">
          <div className="linha-valor">
            <span>Valor do Orçamento:</span>
            <strong>{formatMoney(precoFinalImpresso)}</strong>
          </div>
          <div className="linha-valor">
            <span>Adiantamento:</span>
            <strong>{formatMoney(adiantamento)}</strong>
          </div>

          {adiantamento > 0 && (
            <div className="linha-valor destaque-saldo">
              <span>Saldo a Pagar:</span>
              <strong>{formatMoney(precoFinalImpresso - adiantamento)}</strong>
            </div>
          )}
        </div>
        <div className="assinaturas-impressao">
          <div className="linha-assinatura">
            <hr />
            <span>GR Marcenaria</span>
          </div>
          <div className="linha-assinatura">
            <hr />
            <span>De Acordo (Cliente)</span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
