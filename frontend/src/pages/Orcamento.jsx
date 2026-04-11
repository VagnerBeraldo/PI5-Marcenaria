import React, { useState, useEffect, useMemo } from "react";
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from "../components/BotaoVoltar/BotaoVoltar";
import NavegacaoFluxo from "../components/NavegacaoFluxo/NavegacaoFluxo";
import {
  Save,
  Trash2,
  Search,
  FilePlus,
  CirclePlus,
  Printer,
  FileEdit,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../services/api";
import { useProjeto } from "../hooks/useProjeto";
import "../styles/ContainerVoltarNovo.css";
import "../styles/Orcamento.css";

export default function Orcamento() {
  const [isLoading, setIsLoading] = useState(false);
  const [idOrcamentoSalvo, setIdOrcamentoSalvo] = useState(null);

  const { contextoGlobal, atualizarContexto } = useProjeto();

  const [clienteId, setClienteId] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [nomeProjeto, setNomeProjeto] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [diasTrabalho, setDiasTrabalho] = useState(1);

  const [valorCustoBase, setValorCustoBase] = useState(0);
  const [impostoImportacao, setImpostoImportacao] = useState(0);
  const [frete, setFrete] = useState(0);

  const [impostoPerc, setImpostoPerc] = useState(0);
  const [taxaCartaoPerc, setTaxaCartaoPerc] = useState(0);
  const [margemLucroPerc, setMargemLucroPerc] = useState(20);
  const [desconto, setDesconto] = useState(0);

  const [entrada, setEntrada] = useState(0);
  const [extras, setExtras] = useState([]);

  const [baseDespesas, setBaseDespesas] = useState({
    custoFixoTotal: 0,
    energiaTotal: 0,
    outrasVariaveisTotal: 0,
  });

  const [precoManual, setPrecoManual] = useState(null);

  const [custoFixoSalvo, setCustoFixoSalvo] = useState(null);
  const [energiaSalva, setEnergiaSalva] = useState(null);
  const [outrasVariaveisSalvas, setOutrasVariaveisSalvas] = useState(null);

  const buscarDespesasBase = async () => {
    try {
      const response = await api.get("/despesas");
      const dados = response.data;

      if (!dados) return;

      const fixas = dados.despesasFixas || dados;
      const variaveis = dados.despesasVariaveis || dados;

      let somaFixas =
        Number(fixas.manutencao || 0) +
        Number(fixas.internet || 0) +
        Number(fixas.contador || 0);

      const adicionais = fixas.outrasFixas || [];
      if (adicionais.length > 0 || typeof adicionais === "string") {
        const listaAdicionais =
          typeof adicionais === "string" ? JSON.parse(adicionais) : adicionais;

        const extrasFixas = listaAdicionais.reduce(
          (acc, curr) => acc + Number(curr.valor || 0),
          0,
        );
        somaFixas += extrasFixas;
      }

      const energia = Number(variaveis.energia || 0);
      const imposto = Number(variaveis.impostoPerc || 0);
      const taxaCartao = Number(variaveis.taxaCartaoPerc || 0);

      const outrasVar = variaveis.outrasVariaveis || [];
      const listaOutrasVar =
        typeof outrasVar === "string" ? JSON.parse(outrasVar) : outrasVar;
      const somaOutrasVar = listaOutrasVar.reduce(
        (acc, curr) => acc + Number(curr.valor || 0),
        0,
      );

      setBaseDespesas({
        custoFixoTotal: somaFixas,
        energiaTotal: energia,
        outrasVariaveisTotal: somaOutrasVar,
        impostoPadrao: imposto,
        taxaCartaoPadrao: taxaCartao,
      });

      setImpostoPerc(imposto);
      setTaxaCartaoPerc(taxaCartao);
    } catch (err) {
      console.error("Erro ao buscar despesas", err);
    }
  };

  useEffect(() => {
    buscarDespesasBase();
  }, []);

  const custoFixoAtual = useMemo(() => {
    if (custoFixoSalvo !== null && custoFixoSalvo !== undefined)
      return custoFixoSalvo;
    return (baseDespesas.custoFixoTotal / 22) * diasTrabalho;
  }, [custoFixoSalvo, baseDespesas.custoFixoTotal, diasTrabalho]);

  const energiaAtual = useMemo(() => {
    if (energiaSalva !== null && energiaSalva !== undefined)
      return energiaSalva;
    return (baseDespesas.energiaTotal / 22) * diasTrabalho;
  }, [energiaSalva, baseDespesas.energiaTotal, diasTrabalho]);

  const outrasVariaveisAtual = useMemo(() => {
    if (outrasVariaveisSalvas !== null && outrasVariaveisSalvas !== undefined)
      return outrasVariaveisSalvas;
    return (baseDespesas.outrasVariaveisTotal / 22) * diasTrabalho;
  }, [outrasVariaveisSalvas, baseDespesas.outrasVariaveisTotal, diasTrabalho]);

  const custoMaterialTotal = useMemo(
    () => valorCustoBase * quantidade,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [valorCustoBase, parseInt(quantidade)],
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
      custoFixoAtual +
      energiaAtual +
      outrasVariaveisAtual +
      totalExtras
    );
  }, [
    custoMaterialTotal,
    impostoImportacao,
    frete,
    custoFixoAtual,
    energiaAtual,
    outrasVariaveisAtual,
    totalExtras,
  ]);

  const precoSugerido = useMemo(() => {
    const totalTaxas = impostoPerc + taxaCartaoPerc + margemLucroPerc;
    if (totalTaxas >= 100) return 0;
    return custoTotal / (1 - totalTaxas / 100);
  }, [custoTotal, impostoPerc, taxaCartaoPerc, margemLucroPerc]);

  const precoArredondado = useMemo(() => {
    const precoComDesconto = precoSugerido - precoSugerido * (desconto / 100);
    return Math.ceil(precoComDesconto / 5) * 5;
  }, [precoSugerido, desconto]);

  const precoFinalImpresso =
    precoManual !== null ? precoManual : precoArredondado;

  useEffect(() => {
    setPrecoManual(null);
  }, [quantidade, diasTrabalho, valorCustoBase]);

  const formatMoney = (valor) =>
    (Number(valor) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const handleMoneyInput = (val, setter) =>
    setter(Number(val.replace(/\D/g, "")) / 100);

  const adicionarExtra = () =>
    setExtras([...extras, { id: Date.now(), descricao: "", valor: 0 }]);

  const removerExtra = async (id) => {
    const result = await Swal.fire({
      customClass: { popup: "modal-confirma-exclusao" },
      title: "Excluir item?",
      text: "Deseja remover este item do orçamento?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "var(--btn-confirmar-exclusao)",
      cancelButtonColor: "var(--btn-cancelar-exclusao)",
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        // 1. Remove o item visualmente
        const novosExtras = extras.filter((e) => e.id !== id);
        setExtras(novosExtras);

        let idAtual =
          idOrcamentoSalvo ||
          contextoGlobal?.orcamento?.id_orcamento ||
          contextoGlobal?.orcamento?.id;

        // 2. Se o orçamento existe no banco, fazemos o auto-save com recálculo manual
        if (idAtual) {
          // --- RECÁLCULO DOS TOTAIS BASEADOS NA NOVA LISTA ---
          const novoTotalExtras = novosExtras.reduce(
            (acc, item) => acc + (Number(item.valor) || 0),
            0,
          );

          const novoCustoTotal =
            custoMaterialTotal +
            impostoImportacao +
            frete +
            custoFixoAtual +
            energiaAtual +
            (outrasVariaveisAtual || 0) +
            novoTotalExtras;

          const totalTaxas = impostoPerc + taxaCartaoPerc + margemLucroPerc;
          const novoPrecoSugerido =
            totalTaxas >= 100 ? 0 : novoCustoTotal / (1 - totalTaxas / 100);

          const precoComDesconto =
            novoPrecoSugerido - novoPrecoSugerido * (desconto / 100);
          const novoPrecoArredondado = Math.ceil(precoComDesconto / 5) * 5;
          const novoPrecoFinalImpresso =
            precoManual !== null ? precoManual : novoPrecoArredondado;
          // ---------------------------------------------------

          const payloadExtras = novosExtras.map((e) => ({
            descricao: e.descricao,
            valor: Number(e.valor),
          }));

          const payload = {
            id_cliente: clienteId ? Number(clienteId) : null,
            nome_cliente: nomeCliente,
            id_projeto: projetoId ? Number(projetoId) : null,
            nome_projeto: nomeProjeto,
            quantidade: Number(quantidade),
            dias_trabalho: Number(diasTrabalho),
            valor_custo: valorCustoBase,
            imposto_importacao: impostoImportacao,
            frete: frete,
            custo_fixo: custoFixoAtual,
            energia_eletrica: energiaAtual,
            outras_var: outrasVariaveisAtual ? Number(outrasVariaveisAtual) : 0,
            imposto: impostoPerc,
            taxa_cartao: taxaCartaoPerc,
            margem_lucro: margemLucroPerc,
            desconto: desconto,
            preco_sugerido: novoPrecoSugerido,
            preco_final_impresso: novoPrecoFinalImpresso,
            entrada: entrada,
            extras: payloadExtras,
          };

          await api.put(`/orcamentos/${idAtual}`, payload);
        }

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Item excluído com sucesso",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-confirmacao" },
        });
      } catch (err) {
        {
          console.error("Erro ao remover desp expra", err);
        }
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Erro ao excluir extra no banco.",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-erro" },
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const atualizarExtra = (id, campo, valor) =>
    setExtras(extras.map((e) => (e.id === id ? { ...e, [campo]: valor } : e)));

  // --- CARREGAR AMBIENTE GLOBAL (Projetos do Cliente) ---
  const carregarAmbienteGlobal = async (cliente) => {
    setIsLoading(true);
    try {
      const { data: orcamentos } = await api.get(
        `/orcamentos/cliente/${cliente.id_cliente}`,
      );

      if (!orcamentos || orcamentos.length === 0) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Cliente carregado (Sem projetos vinculados)",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-confirmacao" },
        });
        return;
      }

      Swal.fire({
        title: "Selecionar Projeto",
        text: "Escolha qual projeto deste cliente deseja carregar:",
        customClass: { popup: "modal-pesquisa" },
        html: `<div id="swal-results-proj" class="lista-resultados"></div>`,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        didOpen: () => {
          const list = document.getElementById("swal-results-proj");
          list.innerHTML = orcamentos
            .map(
              (o) => `
            <div class="swal-res-item item-resultado" data-id="${o.id_orcamento}">
              <span class="item-titulo">${o.nome_projeto}</span>
              <span class="item-badge">${new Date(o.data_orcamento).toLocaleDateString("pt-BR")}</span>
            </div>
          `,
            )
            .join("");

          document.querySelectorAll(".swal-res-item").forEach((el) => {
            el.onclick = async () => {
              Swal.close();
              setIsLoading(true);
              const selectedOrc = orcamentos.find(
                (item) => item.id_orcamento === Number(el.dataset.id),
              );

              let planoCorte = null;
              let custo = null;

              try {
                const resPlano = await api.get(
                  `/plano-corte/orcamento/${selectedOrc.id_orcamento}`,
                );
                planoCorte = resPlano.data;
              } catch (err) {
                console.error("Erro ao carregar ambiente global", err);
              }

              if (selectedOrc.id_projeto) {
                try {
                  const resCusto = await api.get(
                    `/custos/${selectedOrc.id_projeto}`,
                  );
                  custo = resCusto.data;
                } catch (err) {
                  console.error("Erro ao carregar ambiente global", err);
                }
              }

              atualizarContexto({ orcamento: selectedOrc, planoCorte, custo });

              Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Projeto carregado com sucesso!",
                showConfirmButton: false,
                timer: 3000,
                customClass: { popup: "mensagem-confirmacao" },
              });
              setIsLoading(false);
            };
          });
        },
      });
    } catch (err) {
      console.error("Erro ao carregar ambiente global", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuscarCliente = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/clientes");
      if (!data || data.length === 0) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          text: "Nenhum cliente cadastrado.",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-erro" },
        });
        return;
      }

      Swal.fire({
        title: "Selecionar Cliente",
        customClass: { popup: "modal-pesquisa" },
        html: `<input type="text" id="swal-search-cli" class="swal2-input input-pesquisa" placeholder="Buscar por nome..."><div id="swal-results-cli" class="lista-resultados"></div>`,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Fechar",
        didOpen: () => {
          const input = document.getElementById("swal-search-cli");
          const list = document.getElementById("swal-results-cli");

          const render = (val) => {
            const filtered = data.filter((c) =>
              (c.nome || "").toLowerCase().includes(val.toLowerCase()),
            );
            list.innerHTML = filtered
              .map(
                (c) => `
              <div class="swal-res-item item-resultado" data-id="${c.id_cliente}">
                <span class="item-titulo">${c.nome}</span>
              </div>`,
              )
              .join("");

            document.querySelectorAll(".swal-res-item").forEach((el) => {
              el.onclick = () => {
                const selectedCli = data.find(
                  (item) => item.id_cliente === Number(el.dataset.id),
                );

                if (selectedCli) {
                  limparFormulario();

                  setClienteId(selectedCli.id_cliente);
                  setNomeCliente(selectedCli.nome);
                  atualizarContexto({
                    cliente: {
                      id_cliente: selectedCli.id_cliente,
                      nome: selectedCli.nome,
                    },
                  });
                  carregarAmbienteGlobal(selectedCli);
                }
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
      console.error("Erro ao buscar cliente", err);
    } finally {
      setIsLoading(false);
    }
  };

  const limparFormulario = () => {
    setIdOrcamentoSalvo(null);
    setProjetoId("");
    setNomeProjeto("");
    setClienteId("");
    setNomeCliente("");
    setQuantidade(1);
    setDiasTrabalho(1);
    setEntrada(0);
    setValorCustoBase(0);
    setImpostoImportacao(0);
    setFrete(0);
    setMargemLucroPerc(20);
    setDesconto(0);
    setExtras([]);
    setPrecoManual(null);

    setCustoFixoSalvo(null);
    setEnergiaSalva(null);
    setOutrasVariaveisSalvas(null);

    buscarDespesasBase();

    atualizarContexto({
      nomeProjetoGlobal: "",
      cliente: null,
      orcamento: null,
      planoCorte: null,
      custo: null,
    });

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      text: "Limpeza realizada com sucesso",
      showConfirmButton: false,
      timer: 3000,
      customClass: { popup: "mensagem-confirmacao" },
    });
  };

  const handleSalvar = async () => {
    if (!nomeProjeto.trim()) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: "O Nome do Serviço é obrigatório.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verificação de Nome de Cliente Duplicado antes de salvar
      if (nomeCliente && nomeCliente.trim() !== "") {
        const { data: clientesExistentes } = await api.get("/clientes");

        if (clientesExistentes && clientesExistentes.length > 0) {
          const clienteConflitante = clientesExistentes.find(
            (c) => c.nome.toLowerCase() === nomeCliente.trim().toLowerCase(),
          );

          // Barra se o nome existir em OUTRO cliente (ID diferente) ou se o nome existir e não houver ID
          if (
            clienteConflitante &&
            (!clienteId || clienteConflitante.id_cliente !== Number(clienteId))
          ) {
            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "error",
              text: "Já existe um cliente com esse nome",
              showConfirmButton: false,
              timer: 4000,
              customClass: { popup: "mensagem-erro" },
            });
            setIsLoading(false);
            return;
          }
        }
      }

      // 2. Verificação de Orçamento Existente
      const { data: orcamentosExistentes } = await api.get("/orcamentos");
      const orcExistente = orcamentosExistentes.find(
        (o) =>
          o.nome_projeto &&
          o.nome_projeto.trim().toLowerCase() ===
            nomeProjeto.trim().toLowerCase(),
      );

      if (orcExistente) {
        setIdOrcamentoSalvo(orcExistente.id_orcamento || orcExistente.id);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "info",
          text: "Orçamento já existe. Utilize o botão Editar.",
          showConfirmButton: false,
          timer: 3000,
        });
        setIsLoading(false);
        return;
      }

      const payloadExtras = extras.map((e) => ({
        descricao: e.descricao,
        valor: Number(e.valor),
      }));

      const payload = {
        id_cliente: clienteId ? Number(clienteId) : null,
        nome_cliente: nomeCliente,
        id_projeto: projetoId ? Number(projetoId) : null,
        nome_projeto: nomeProjeto,
        quantidade: Number(quantidade),
        dias_trabalho: Number(diasTrabalho),
        valor_custo: valorCustoBase,
        imposto_importacao: impostoImportacao,
        frete,
        custo_fixo: custoFixoAtual,
        energia_eletrica: energiaAtual,
        outras_var: outrasVariaveisAtual ? Number(outrasVariaveisAtual) : 0,
        imposto: impostoPerc,
        taxa_cartao: taxaCartaoPerc,
        margem_lucro: margemLucroPerc,
        desconto: desconto,
        preco_sugerido: precoSugerido,
        preco_final_impresso: precoFinalImpresso,
        entrada: entrada,
        extras: payloadExtras,
      };

      const response = await api.post("/orcamentos", payload);
      const novoId = response.data.id || response.data.id_orcamento;
      const novoIdCliente = response.data.id_cliente;

      setIdOrcamentoSalvo(novoId);

      setCustoFixoSalvo(custoFixoAtual);
      setEnergiaSalva(energiaAtual);
      setOutrasVariaveisSalvas(outrasVariaveisAtual);

      if (novoIdCliente) {
        setClienteId(novoIdCliente);
        atualizarContexto({
          cliente: { id_cliente: novoIdCliente, nome: nomeCliente },
        });
      }

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Orçamento salvo com sucesso",
        customClass: { popup: "mensagem-confirmacao" },
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (err) {
      console.error("Erro ao salvar orçamento", err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: "Não foi possível salvar os dados.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditar = async () => {
    let idAtual =
      idOrcamentoSalvo ||
      contextoGlobal?.orcamento?.id_orcamento ||
      contextoGlobal?.orcamento?.id;

    if (!idAtual) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "warning",
        text: "Nenhum orçamento selecionado para edição",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    if (!nomeProjeto.trim()) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: "O Nome do Serviço é obrigatório",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verificação de Nome de Cliente Duplicado antes de editar
      if (nomeCliente && nomeCliente.trim() !== "") {
        const { data: clientesExistentes } = await api.get("/clientes");

        if (clientesExistentes && clientesExistentes.length > 0) {
          const clienteConflitante = clientesExistentes.find(
            (c) => c.nome.toLowerCase() === nomeCliente.trim().toLowerCase(),
          );

          // Barra se o nome existir em OUTRO cliente (ID diferente) ou se o nome existir e não houver ID
          if (
            clienteConflitante &&
            (!clienteId || clienteConflitante.id_cliente !== Number(clienteId))
          ) {
            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "error",
              text: "Já existe um cliente com esse nome",
              showConfirmButton: false,
              timer: 4000,
              customClass: { popup: "mensagem-erro" },
            });
            setIsLoading(false);
            return;
          }
        }
      }

      const payloadExtras = extras.map((e) => ({
        descricao: e.descricao,
        valor: Number(e.valor),
      }));

      const payload = {
        id_cliente: clienteId ? Number(clienteId) : null,
        nome_cliente: nomeCliente,
        id_projeto: projetoId ? Number(projetoId) : null,
        nome_projeto: nomeProjeto,
        quantidade: Number(quantidade),
        dias_trabalho: Number(diasTrabalho),
        valor_custo: valorCustoBase,
        imposto_importacao: impostoImportacao,
        frete,
        custo_fixo: custoFixoAtual,
        energia_eletrica: energiaAtual,
        outras_var: outrasVariaveisAtual ? Number(outrasVariaveisAtual) : 0,
        imposto: impostoPerc,
        taxa_cartao: taxaCartaoPerc,
        margem_lucro: margemLucroPerc,
        desconto: desconto,
        preco_sugerido: precoSugerido,
        preco_final_impresso: precoFinalImpresso,
        entrada: entrada,
        extras: payloadExtras,
      };

      await api.put(`/orcamentos/${idAtual}`, payload);
      setIdOrcamentoSalvo(idAtual);

      setCustoFixoSalvo(custoFixoAtual);
      setEnergiaSalva(energiaAtual);
      setOutrasVariaveisSalvas(outrasVariaveisAtual);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Orçamento atualizado com sucesso",
        customClass: { popup: "mensagem-confirmacao" },
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (err) {
      console.error("Erro ao editar orçamento", err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: "Não foi possível atualizar os dados.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const carregarOrcamento = (orc) => {
    const id = orc.id_orcamento || orc.id;
    setIdOrcamentoSalvo(id);
    setClienteId(orc.id_cliente || "");
    setNomeCliente(orc.nome_cliente || "");
    setProjetoId(orc.id_projeto || "");
    setNomeProjeto(orc.nome_projeto || "");
    setQuantidade(Number(orc.quantidade) || 1);
    setDiasTrabalho(Number(orc.dias_trabalho) || 1);
    setValorCustoBase(Number(orc.valor_custo || orc.custo_total || 0));
    setImpostoImportacao(Number(orc.imposto_importacao) || 0);
    setFrete(Number(orc.frete) || 0);
    setImpostoPerc(Number(orc.imposto) || 0);
    setTaxaCartaoPerc(Number(orc.taxa_cartao) || 0);
    setMargemLucroPerc(Number(orc.margem_lucro) || 20);
    setDesconto(Number(orc.desconto) || 0);
    setEntrada(Number(orc.entrada) || 0);
    setPrecoManual(Number(orc.preco_final_impresso) || null);

    atualizarContexto({
      nomeProjetoGlobal: orc.nome_projeto || "",
      orcamento: orc,
    });

    try {
      const extrasParsed =
        typeof orc.extras === "string"
          ? JSON.parse(orc.extras)
          : orc.extras || [];

      const rateioSalvo = extrasParsed.find(
        (e) => e.descricao === "Rateio Outras Variáveis",
      );
      const extrasManuais = extrasParsed.filter(
        (e) => e.descricao !== "Rateio Outras Variáveis",
      );

      setCustoFixoSalvo(
        orc.custo_fixo !== undefined && orc.custo_fixo !== null
          ? Number(orc.custo_fixo)
          : null,
      );
      setEnergiaSalva(
        orc.energia_eletrica !== undefined && orc.energia_eletrica !== null
          ? Number(orc.energia_eletrica)
          : null,
      );
      setOutrasVariaveisSalvas(
        orc.outras_var !== undefined && orc.outras_var !== null
          ? Number(orc.outras_var)
          : rateioSalvo
            ? Number(rateioSalvo.valor)
            : null,
      );

      setExtras(
        extrasManuais.map((e, idx) => ({
          id: Date.now() + idx,
          descricao: e.descricao,
          valor: Number(e.valor),
        })),
      );
    } catch (err) {
      console.error("Erro ao carregar orçamento", err);
      setExtras([]);
      setCustoFixoSalvo(null);
      setEnergiaSalva(null);
      setOutrasVariaveisSalvas(null);
    }
  };

  useEffect(
    () => {
      if (contextoGlobal?.orcamento) {
        const orcId =
          contextoGlobal.orcamento.id_orcamento || contextoGlobal.orcamento.id;
        if (orcId !== idOrcamentoSalvo)
          carregarOrcamento(contextoGlobal.orcamento);
      }

      if (
        contextoGlobal?.cliente?.nome &&
        contextoGlobal.cliente.nome !== nomeCliente &&
        contextoGlobal.cliente.id_cliente
      ) {
        setNomeCliente(contextoGlobal.cliente.nome);
        setClienteId(contextoGlobal.cliente.id_cliente);
      }

      if (
        contextoGlobal?.nomeProjetoGlobal !== undefined &&
        contextoGlobal.nomeProjetoGlobal !== nomeProjeto
      ) {
        setNomeProjeto(contextoGlobal.nomeProjetoGlobal);
      }

      if (
        contextoGlobal?.custo &&
        contextoGlobal.custo.id_projeto !== projetoId
      ) {
        const p = contextoGlobal.custo;
        const mat =
          typeof p.materiais === "string"
            ? JSON.parse(p.materiais)
            : p.materiais || [];
        const custoMat = mat.reduce(
          (acc, m) =>
            acc + Number(m.quantidade || 0) * Number(m.valor_unitario || 0),
          0,
        );
        const totalFicha =
          Number(p.mao_de_obra || 0) + Number(p.instalacao || 0) + custoMat;
        setValorCustoBase(totalFicha);
        setProjetoId(p.id_projeto);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contextoGlobal, idOrcamentoSalvo, nomeCliente, nomeProjeto, projetoId],
  );

  const handleBuscarOrcamento = async (situacaoDesejada) => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/orcamentos");
      if (!data || data.length === 0) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          text: "Nenhum orçamento salvo encontrado.",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-erro" },
        });
        return;
      }

      const dadosFiltradosPorSituacao = data.filter(
        (o) => o.situacao === situacaoDesejada,
      );

      if (dadosFiltradosPorSituacao.length === 0) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          text: `Nenhum orçamento "${situacaoDesejada}" encontrado.`,
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-erro" },
        });
        return;
      }

      Swal.fire({
        title: `Buscar Orçamento (${situacaoDesejada})`,
        customClass: { popup: "modal-pesquisa" },
        html: `<input type="text" id="swal-search-orc" class="swal2-input input-pesquisa" placeholder="Buscar projeto..."><div id="swal-results-orc" class="lista-resultados"></div>`,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Fechar",
        didOpen: () => {
          const input = document.getElementById("swal-search-orc");
          const list = document.getElementById("swal-results-orc");

          const render = (val) => {
            const filtered = dadosFiltradosPorSituacao.filter((o) =>
              (o.nome_projeto || "").toLowerCase().includes(val.toLowerCase()),
            );

            list.innerHTML = filtered
              .map(
                (o) => `
              <div class="swal-res-item item-resultado" data-id="${o.id_orcamento || o.id}">
                <span class="item-titulo">${o.nome_projeto}</span>
                <span class="item-badge">${formatMoney(o.preco_final_impresso)}</span>
              </div>`,
              )
              .join("");

            document.querySelectorAll(".swal-res-item").forEach((el) => {
              el.onclick = () => {
                const selectedOrc = dadosFiltradosPorSituacao.find(
                  (item) =>
                    (item.id_orcamento || item.id) === Number(el.dataset.id),
                );

                if (selectedOrc) {
                  // 1. Limpa o formulário e o contexto anterior
                  limparFormulario();

                  // 2. Carrega os dados do orçamento escolhido
                  carregarOrcamento(selectedOrc);

                  // 3. Força o contexto global a assumir o cliente deste orçamento
                  if (selectedOrc.id_cliente || selectedOrc.nome_cliente) {
                    atualizarContexto({
                      cliente: {
                        id_cliente: selectedOrc.id_cliente,
                        nome: selectedOrc.nome_cliente,
                      },
                    });
                  }
                }

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
      console.error("Erro ao buscar orçamento", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcluir = async () => {
    if (!idOrcamentoSalvo) return;
    const result = await Swal.fire({
      customClass: { popup: "modal-confirma-exclusao" },
      title: "Excluir Orçamento?",
      text: "Esta ação não pode ser desfeita!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--btn-confirmar-exclusao)",
      cancelButtonColor: "var(--btn-cancelar-exclusao)",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/orcamentos/${idOrcamentoSalvo}`);
        limparFormulario();
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Orçamento excluído com sucesso",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-confirmacao" },
        });
      } catch (err) {
        console.error("Erro ao excluir orçamento", err);
      }
    }
  };

  return (
    <PageTransition className="orcamento-container">
      <div className="card-orcamento">
        <div className="wrapper-header-actions">
          <div className="header-actions ocultar-na-impressao">
            <BotaoVoltar />
            <button className="btn-novo-topo" onClick={limparFormulario}>
              <FilePlus size={18} />
              <span>Novo</span>
            </button>
          </div>
        </div>
        <img src="/logo.svg" alt="Logo" className="logo-img" />
        <h1 className="nome-fantasia">GR Marcenaria</h1>
        <h1 className="titulo-pagina">Orçamento Comercial</h1>

        <div className="secao-form">
          <h2 className="subtitulo">Dados do Serviço</h2>
          <div className="form-row">
            <div className="form-group flex-2">
              <label className="titulo-input">Cliente</label>
              <div className="container-lupa">
                <input
                  type="text"
                  className="input-lupa-flex"
                  value={nomeCliente}
                  onChange={(e) => {
                    const novoNome = e.target.value;
                    setNomeCliente(novoNome);
                    if (novoNome.trim() === "") {
                      setClienteId("");
                      atualizarContexto({
                        cliente: { id_cliente: "", nome: "" },
                      });
                    } else {
                      atualizarContexto({
                        cliente: { id_cliente: clienteId, nome: novoNome },
                      });
                    }
                  }}
                  placeholder="Nome do cliente..."
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleBuscarCliente}
                  disabled={isLoading}
                  className="btn-icone-lupa"
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group flex-2">
              <label className="titulo-input">Nome do Serviço / Projeto</label>
              <div className="container-lupa">
                <input
                  type="text"
                  className="input-lupa-flex"
                  value={nomeProjeto}
                  onChange={(e) => {
                    setNomeProjeto(e.target.value);
                    atualizarContexto({ nomeProjetoGlobal: e.target.value });
                  }}
                  placeholder="Ex: Cozinha Planejada"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => handleBuscarOrcamento("aberto")}
                  className="btn-icone-lupa"
                  disabled={isLoading}
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
            <div className="form-group flex-1">
              <label className="titulo-input">Quantidade</label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                min="1"
              />
            </div>
            <div className="form-group flex-1">
              <label className="titulo-input">Dias de Trabalho</label>
              <input
                type="number"
                value={diasTrabalho}
                onChange={(e) => setDiasTrabalho(Number(e.target.value))}
                min="1"
              />
            </div>
          </div>
        </div>

        <div className="secao-form">
          <h2 className="subtitulo">Custos de Base</h2>
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="titulo-input">Entrada (R$)</label>
              <input
                type="text"
                value={formatMoney(entrada)}
                onChange={(e) => handleMoneyInput(e.target.value, setEntrada)}
              />
              <label className="titulo-input">Custo do Material (Base)</label>
              <input
                type="text"
                value={formatMoney(valorCustoBase * quantidade)}
                onChange={(e) =>
                  handleMoneyInput(e.target.value, setValorCustoBase)
                }
              />
            </div>
            <div className="container-custo-energia">
              <div className="form-group flex-1 wrapper-custo-ee-outrasvariaveis">
                <label className="mobile">Custo Fixo</label>
                <input
                  type="text"
                  value={formatMoney(custoFixoAtual)}
                  onChange={(e) =>
                    handleMoneyInput(e.target.value, setCustoFixoSalvo)
                  }
                />
                <button
                  type="button"
                  className="btn-refresh-rateio"
                  onClick={() => setCustoFixoSalvo(null)}
                >
                  <RefreshCw size={12} /> Atualizar
                </button>
              </div>

              <div className="form-group flex-1 wrapper-custo-ee-outrasvariaveis">
                <label className="mobile">Energia</label>
                <input
                  type="text"
                  value={formatMoney(energiaAtual)}
                  onChange={(e) =>
                    handleMoneyInput(e.target.value, setEnergiaSalva)
                  }
                />
                <button
                  type="button"
                  className="btn-refresh-rateio"
                  onClick={() => setEnergiaSalva(null)}
                >
                  <RefreshCw size={12} /> Atualizar
                </button>
              </div>

              <div className="form-group flex-1 wrapper-custo-ee-outrasvariaveis">
                <label className="mobile">Outras Var.</label>
                <input
                  type="text"
                  value={formatMoney(outrasVariaveisAtual)}
                  onChange={(e) =>
                    handleMoneyInput(e.target.value, setOutrasVariaveisSalvas)
                  }
                />
                <button
                  type="button"
                  className="btn-refresh-rateio"
                  onClick={() => setOutrasVariaveisSalvas(null)}
                >
                  <RefreshCw size={12} /> Atualizar
                </button>
              </div>
            </div>
          </div>
          <div className="form-row mt-15">
            <div className="form-group flex-1">
              <label className="titulo-input">Importação (R$)</label>
              <input
                type="text"
                value={formatMoney(impostoImportacao)}
                onChange={(e) =>
                  handleMoneyInput(e.target.value, setImpostoImportacao)
                }
              />
            </div>
            <div className="form-group flex-1">
              <label className="titulo-input">Frete (R$)</label>
              <input
                type="text"
                value={formatMoney(frete)}
                onChange={(e) => handleMoneyInput(e.target.value, setFrete)}
              />
            </div>
          </div>
        </div>

        <div className="secao-form">
          <h2 className="subtitulo">Outras Despesas</h2>
          {extras.map((extra) => (
            <div key={extra.id} className="form-row extra-row">
              <input
                type="text"
                className="input-extra flex-2"
                value={extra.descricao}
                onChange={(e) =>
                  atualizarExtra(extra.id, "descricao", e.target.value)
                }
                placeholder="Nome da sua despesa"
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
          <h2 className="subtitulo">Parâmetros de Precificação</h2>
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="titulo-input">Imposto (%)</label>
              <input
                type="number"
                value={impostoPerc}
                onChange={(e) => setImpostoPerc(Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="form-group flex-1">
              <label className="titulo-input">Taxa Cartão (%)</label>
              <input
                type="number"
                value={taxaCartaoPerc}
                onChange={(e) => setTaxaCartaoPerc(Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="form-group flex-1">
              <label className="titulo-input">Margem de Lucro(%)</label>
              <input
                type="number"
                value={margemLucroPerc}
                onChange={(e) => setMargemLucroPerc(Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="form-group flex-1">
              <label className="titulo-input">Desconto (%)</label>
              <input
                type="number"
                value={desconto}
                onChange={(e) => setDesconto(Number(e.target.value))}
                min="0"
                step="0.5"
              />
            </div>
          </div>
        </div>

        <div className="resumo-box">
          <button className="imprimir" onClick={() => window.print()}>
            <Printer size={18} />
          </button>
          <div className="resumo-item">
            <span>Custo Total:</span> <strong>{formatMoney(custoTotal)}</strong>
          </div>
          <div className="resumo-item">
            <span>Preço Sugerido:</span>{" "}
            <strong>{formatMoney(precoSugerido)}</strong>
          </div>
          {desconto > 0 && (
            <div className="resumo-item">
              <span>Valo com Desconto:</span>{" "}
              <strong>
                {formatMoney(precoSugerido - precoSugerido * (desconto / 100))}
              </strong>
            </div>
          )}

          <div className="resumo-item destaque">
            <span>Preço Fechado:</span>
            <input
              type="text"
              className="input-preco-fechado"
              value={formatMoney(precoFinalImpresso)}
              onChange={(e) => handleMoneyInput(e.target.value, setPrecoManual)}
            />
          </div>

          {entrada > 0 && (
            <div className="resumo-item destaque-saldo">
              <span>Saldo a Pagar:</span>
              <strong>{formatMoney(precoFinalImpresso - entrada)}</strong>
            </div>
          )}
        </div>

        <div className="btn-containver-acoes">
          <div className="btn-wrapper-acoes">
            <div className="btn-wrapper-flex-acoes">
              <button
                className="btn-salvar"
                onClick={handleSalvar}
                disabled={isLoading || idOrcamentoSalvo !== null}
              >
                <Save size={18} />
                <span>Salvar</span>
              </button>
              <button
                className="btn-editar"
                onClick={handleEditar}
                disabled={isLoading || idOrcamentoSalvo === null}
              >
                <FileEdit size={18} />
                <span>Editar</span>
              </button>
            </div>
            <div className="btn-wrapper-flex-acoes">
              <button
                className="btn-buscar"
                onClick={() => handleBuscarOrcamento("gerado")}
                disabled={isLoading}
              >
                <Search size={18} />
                <span>Buscar</span>
              </button>

              <button
                className="btn-excluir"
                onClick={handleExcluir}
                disabled={isLoading || idOrcamentoSalvo === null}
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
            <span>
              {nomeCliente ||
                (clienteId ? `ID ${clienteId}` : "Nome não informado")}
            </span>
          </div>
          <div className="linha-dado">
            <strong>Projeto:</strong>{" "}
            <span>{nomeProjeto || "Não especificado"}</span>
          </div>
          <div className="linha-dado">
            <strong>Data:</strong>{" "}
            <span>{new Date().toLocaleDateString("pt-BR")}</span>
          </div>
          <div className="linha-dado">
            <strong>Validade:</strong>{" "}
            <span>
              {new Date(
                new Date().setDate(new Date().getDate() + 15),
              ).toLocaleDateString("pt-BR")}{" "}
              (15 dias)
            </span>
          </div>
        </div>

        <div className="valores-impressao">
          <div className="linha-valor">
            <span>Valor do Orçamento:</span>
            <strong>{formatMoney(Math.ceil(precoSugerido / 5) * 5)}</strong>
          </div>
          {desconto > 0 && (
            <div className="linha-valor">
              <span>Valor com Desconto:</span>
              <strong>{formatMoney(precoFinalImpresso)}</strong>
            </div>
          )}

          {entrada > 0 && (
            <div className="linha-valor">
              <span>Entrada:</span>
              <strong>{formatMoney(entrada)}</strong>
            </div>
          )}
          <div className="linha-valor destaque-saldo">
            <span>Saldo a pagar:</span>
            <strong>{formatMoney(precoFinalImpresso - entrada)}</strong>
          </div>
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
