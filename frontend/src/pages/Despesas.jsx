import React, { useState, useEffect, useMemo } from "react";
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from "../components/BotaoVoltar/BotaoVoltar";
import { CirclePlus, FileEditIcon, Save, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import DOMPurify from "dompurify";
import { z } from "zod";
import "../styles/Despesas.css";
import api from "../../services/api";

// Schema de Validação do Frontend com Coerção (Conversão Automática)
const itemSchema = z.object({
  id: z.coerce.number(),
  nome: z
    .string()
    .trim()
    .min(1, "A descrição das despesas extras não pode estar vazia."),
  valor: z.coerce
    .number()
    .min(0.01, "O valor das despesas extras deve ser maior que zero."),
});

const despesasSchema = z.object({
  faturamento: z.coerce.number().min(0, "Faturamento inválido."),
  despesasFixas: z.object({
    manutencao: z.coerce.number().min(0),
    internet: z.coerce.number().min(0),
    contador: z.coerce.number().min(0),
    outrasFixas: z.array(itemSchema),
  }),
  despesasVariaveis: z.object({
    energia: z.coerce.number().min(0),
    impostoPerc: z.coerce.number().min(0),
    taxaCartaoPerc: z.coerce.number().min(0),
    fornecedores: z.coerce.number().min(0),
    outrasVariaveis: z.array(itemSchema),
  }),
});

export default function Despesas() {
  const [isLoading, setIsLoading] = useState(false);
  const [idDespesaSalva, setIdDespesaSalva] = useState(null);

  // Estados do Formulário
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
  const impostoValor = useMemo(
    () => (faturamento * impostoPerc) / 100,
    [faturamento, impostoPerc],
  );
  const taxaCartaoValor = useMemo(
    () => (faturamento * taxaCartaoPerc) / 100,
    [faturamento, taxaCartaoPerc],
  );

  // Helpers de Formatação
  const formatMoney = (valor) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatInputBR = (valor) => {
    return (Number(valor) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleMonetarioChange = (setter) => (e) => {
    const apenasNumeros = e.target.value.replace(/\D/g, "");
    setter(Number(apenasNumeros) / 100);
  };

  // Funções para itens dinâmicos
  const addOutraFixa = () =>
    setOutrasFixas([...outrasFixas, { id: Date.now(), nome: "", valor: 0 }]);
  const updateOutraFixa = (id, field, value) => {
    setOutrasFixas(
      outrasFixas.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeOutraFixa = async (id) => {
    const result = await Swal.fire({
      title: "Remover despesa?",
      text: "Deseja remover este item da lista?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#27ae60",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const novasFixas = outrasFixas.filter((item) => item.id !== id);
      setOutrasFixas(novasFixas);

      if (idDespesaSalva) {
        setIsLoading(true);
        try {
          const payloadBruto = montarPayload();
          // Atualiza o payload com a lista nova (sem o item removido)
          payloadBruto.despesasFixas.outrasFixas = novasFixas.map((item) => ({
            ...item,
            nome: DOMPurify.sanitize(item.nome),
            valor: item.valor,
          }));

          // Obriga a passar pelo Zod para fazer a coerção (conversão de strings numéricas)
          const validacao = despesasSchema.safeParse(payloadBruto);

          if (!validacao.success)
            throw new Error("Falha de conversão ao remover item.");

          // Envia o payload limpo e tipado
          await api.put(`/despesas/${idDespesaSalva}`, validacao.data);

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Item removido do banco!",
            showConfirmButton: false,
            timer: 2000,
            customClass: { popup: "mensagem-confirmacao" },
          });
        } catch (error) {
          console.error("Erro ao atualizar banco após exclusão:", error);
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "Não foi possível remover o item do banco.",
            showConfirmButton: false,
            timer: 3000,
            customClass: { popup: "mensagem-erro" },
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
  };
  const addOutraVariavel = () =>
    setOutrasVariaveis([
      ...outrasVariaveis,
      { id: Date.now(), nome: "", valor: 0 },
    ]);
  const updateOutraVariavel = (id, field, value) => {
    setOutrasVariaveis(
      outrasVariaveis.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const removeOutraVariavel = async (id) => {
    const result = await Swal.fire({
      title: "Remover despesa?",
      text: "Deseja remover este item da lista?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
      cancelButtonColor: "#27ae60",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const novasVariaveis = outrasVariaveis.filter((item) => item.id !== id);
      setOutrasVariaveis(novasVariaveis);

      if (idDespesaSalva) {
        setIsLoading(true);
        try {
          const payloadBruto = montarPayload();
          // Atualiza o payload com a lista nova (sem o item removido)
          payloadBruto.despesasVariaveis.outrasVariaveis = novasVariaveis.map(
            (item) => ({
              ...item,
              nome: DOMPurify.sanitize(item.nome),
              valor: item.valor,
            }),
          );

          // Obriga a passar pelo Zod para fazer a coerção
          const validacao = despesasSchema.safeParse(payloadBruto);

          if (!validacao.success)
            throw new Error("Falha de conversão ao remover item.");

          // Envia o payload limpo e tipado
          await api.put(`/despesas/${idDespesaSalva}`, validacao.data);

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Item removido do banco!",
            showConfirmButton: false,
            timer: 1500,
            customClass: { popup: "mensagem-confirmacao" },
          });
        } catch (error) {
          console.error("Erro ao atualizar banco após exclusão:", error);
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "Não foi possível remover o item do banco.",
            showConfirmButton: false,
            timer: 3000,
            customClass: { popup: "mensagem-erro" },
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/despesas");
        if (response.data) {
          const data = response.data;
          setIdDespesaSalva(data.id || 1);

          setFaturamento(Number(data.faturamento) || 0);
          setManutencao(Number(data.despesasFixas.manutencao) || 0);
          setInternet(Number(data.despesasFixas.internet) || 0);
          setContador(Number(data.despesasFixas.contador) || 0);
          setOutrasFixas(data.despesasFixas.outrasFixas || []);

          setEnergia(Number(data.despesasVariaveis.energia) || 0);
          setImpostoPerc(Number(data.despesasVariaveis.impostoPerc) || 0);
          setTaxaCartaoPerc(Number(data.despesasVariaveis.taxaCartaoPerc) || 0);
          setFornecedores(Number(data.despesasVariaveis.fornecedores) || 0);
          setOutrasVariaveis(data.despesasVariaveis.outrasVariaveis || []);
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

  const montarPayload = () => ({
    faturamento,
    despesasFixas: {
      manutencao,
      internet,
      contador,
      outrasFixas: outrasFixas.map((item) => ({
        ...item,
        nome: DOMPurify.sanitize(item.nome),
        valor: item.valor,
      })),
    },
    despesasVariaveis: {
      energia,
      impostoPerc,
      taxaCartaoPerc,
      fornecedores,
      outrasVariaveis: outrasVariaveis.map((item) => ({
        ...item,
        nome: DOMPurify.sanitize(item.nome),
        valor: item.valor,
      })),
    },
  });

  const handleSalvar = async () => {
    setIsLoading(true);
    try {
      const payloadBruto = montarPayload();
      const validacao = despesasSchema.safeParse(payloadBruto);

      if (!validacao.success) {
        const erroMensagem = validacao.error.issues[0].message;
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "warning",
          title: erroMensagem || "Verifique os dados preenchidos.",
          showConfirmButton: false,
          timer: 3500,
          customClass: { popup: "mensagem-erro" },
        });
        setIsLoading(false);
        return;
      }

      // Envia os dados limpos e tipados pelo Zod (validacao.data) para a API
      const response = await api.post("/despesas", validacao.data);
      if (response.status === 201) {
        setIdDespesaSalva(response.data.id || 1);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Despesas salvas com sucesso no banco de dados!",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-confirmacao" },
        });
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Erro ao salvar as despesas.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditar = async () => {
    if (!idDespesaSalva) return;
    setIsLoading(true);
    try {
      const payloadBruto = montarPayload();
      const validacao = despesasSchema.safeParse(payloadBruto);

      if (!validacao.success) {
        const erroMensagem = validacao.error.issues[0].message;
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "warning",
          title: erroMensagem || "Verifique os dados preenchidos.",
          showConfirmButton: false,
          timer: 3500,
          customClass: { popup: "mensagem-erro" },
        });
        setIsLoading(false);
        return;
      }

      // Envia os dados limpos e tipados pelo Zod (validacao.data) para a API
      await api.put(`/despesas/${idDespesaSalva}`, validacao.data);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Despesas atualizadas com sucesso!",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-confirmacao" },
      });
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Erro ao atualizar as despesas.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcluir = async () => {
    if (!idDespesaSalva) return;

    const result = await Swal.fire({
      title: "Exclusão de despesa",
      text: "Excluir as despesas fixas e variáveis?",
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
        await api.delete(`/despesas/${idDespesaSalva}`);
        setIdDespesaSalva(null);
        setFaturamento(0);
        setManutencao(0);
        setInternet(0);
        setContador(0);
        setOutrasFixas([]);
        setEnergia(0);
        setImpostoPerc(0);
        setTaxaCartaoPerc(0);
        setFornecedores(0);
        setOutrasVariaveis([]);

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Despesas excluídas com sucesso!",
          showConfirmButton: false,
          timer: 2000,
          customClass: { popup: "mensagem-confirmacao" },
        });
      } catch (error) {
        console.error("Erro ao excluir:", error);

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Erro ao excluir as despesas.",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-erro" },
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <PageTransition className="financeiro-container">
      <BotaoVoltar />
      <div className="logo-wrapper">
        <img src="/logo.svg" alt="Logo da Empresa" className="logo" />
      </div>
      <h1 className="nomefantasia">GR Marcenaria</h1>
      <h1 className="title-center">Despesas</h1>
      <h2 className="subtitle-left">Custos</h2>

      <div className="form-group highlight">
        <label>Faturamento Bruto</label>
        <input
          type="text"
          value={formatInputBR(faturamento)}
          onChange={handleMonetarioChange(setFaturamento)}
          placeholder="R$ 0,00"
          disabled={isLoading}
        />
      </div>

      <h3 className="section-title">Despesas Fixas</h3>
      <div className="form-group">
        <label>Manutenção Preventiva de Máquinas</label>
        <input
          type="text"
          value={formatInputBR(manutencao)}
          onChange={handleMonetarioChange(setManutencao)}
          placeholder="R$ 0,00"
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label>Internet e Telefone</label>
        <input
          type="text"
          value={formatInputBR(internet)}
          onChange={handleMonetarioChange(setInternet)}
          placeholder="R$ 0,00"
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label>Contador</label>
        <input
          type="text"
          value={formatInputBR(contador)}
          onChange={handleMonetarioChange(setContador)}
          placeholder="R$ 0,00"
          disabled={isLoading}
        />
      </div>

      {outrasFixas.map((item) => (
        <div key={item.id} className="form-row">
          <div className="form-group flex-2">
            <label>Descrição</label>
            <input
              type="text"
              value={item.nome}
              onChange={(e) => updateOutraFixa(item.id, "nome", e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group flex-1">
            <label>Valor</label>
            <input
              type="text"
              value={formatInputBR(item.valor)}
              onChange={(e) => {
                const apenasNumeros = e.target.value.replace(/\D/g, "");
                updateOutraFixa(item.id, "valor", Number(apenasNumeros) / 100);
              }}
              placeholder="R$ 0,00"
              disabled={isLoading}
            />
          </div>
          <button
            className="btn-delete-item"
            onClick={() => removeOutraFixa(item.id)}
            disabled={isLoading}
            title="Remover item"
          >
            <Trash2 size={20} />
          </button>
        </div>
      ))}
      <button className="btn-add" onClick={addOutraFixa} disabled={isLoading}>
        <CirclePlus size={18} className="btn-icon-add" strokeWidth={2} />
        <span>Inserir Outra Despesa Fixa</span>
      </button>

      <h3 className="section-title">Despesas Variáveis</h3>
      <div className="form-group">
        <label>Energia Elétrica</label>
        <input
          type="text"
          value={formatInputBR(energia)}
          onChange={handleMonetarioChange(setEnergia)}
          placeholder="R$ 0,00"
          disabled={isLoading}
        />
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label>Imposto (%)</label>
          <input
            type="number"
            value={impostoPerc || ""}
            onChange={(e) => setImpostoPerc(Number(e.target.value))}
            placeholder="Ex.: 10"
            disabled={isLoading}
          />
        </div>
        <div className="form-group flex-2">
          <label>Valor Calculado (Imposto)</label>
          <input
            type="text"
            value={formatMoney(impostoValor)}
            disabled
            className="input-disabled"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label>Taxa de Cartão (%)</label>
          <input
            type="number"
            value={taxaCartaoPerc || ""}
            onChange={(e) => setTaxaCartaoPerc(Number(e.target.value))}
            placeholder="Ex.: 3"
            disabled={isLoading}
          />
        </div>
        <div className="form-group flex-2">
          <label>Valor Calculado (Taxa)</label>
          <input
            type="text"
            value={formatMoney(taxaCartaoValor)}
            disabled
            className="input-disabled"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Fornecedores</label>
        <input
          type="text"
          value={formatInputBR(fornecedores)}
          onChange={handleMonetarioChange(setFornecedores)}
          placeholder="R$ 0,00"
          disabled={isLoading}
        />
      </div>

      {outrasVariaveis.map((item) => (
        <div key={item.id} className="form-row">
          <div className="form-group flex-2">
            <label>Descrição</label>
            <input
              type="text"
              value={item.nome}
              onChange={(e) =>
                updateOutraVariavel(item.id, "nome", e.target.value)
              }
              disabled={isLoading}
            />
          </div>
          <div className="form-group flex-1">
            <label>Valor</label>
            <input
              type="text"
              value={formatInputBR(item.valor)}
              onChange={(e) => {
                const apenasNumeros = e.target.value.replace(/\D/g, "");
                updateOutraVariavel(
                  item.id,
                  "valor",
                  Number(apenasNumeros) / 100,
                );
              }}
              placeholder="R$ 0,00"
              disabled={isLoading}
            />
          </div>
          <button
            className="btn-delete-item"
            onClick={() => removeOutraVariavel(item.id)}
            disabled={isLoading}
            title="Remover item"
          >
            <Trash2 size={20} />
          </button>
        </div>
      ))}

      <button
        className="btn-add"
        onClick={addOutraVariavel}
        disabled={isLoading}
      >
        <CirclePlus size={18} className="btn-icon-add" strokeWidth={2} />
        <span>Inserir Outra Despesa Variável</span>
      </button>

      <div className="btn-container">
        <div className="btn-wrapper">
          <button
            className="btn-salvar"
            onClick={handleSalvar}
            disabled={isLoading || idDespesaSalva !== null}
          >
            <Save className="btn-icon" size={18} strokeWidth={2} />
            <span>Salvar</span>
          </button>

          <button
            className="btn-editar"
            onClick={handleEditar}
            disabled={isLoading || idDespesaSalva === null}
          >
            <FileEditIcon className="btn-icon" size={18} strokeWidth={2} />
            <span>Editar</span>
          </button>

          <button
            className="btn-excluir"
            onClick={handleExcluir}
            disabled={isLoading || idDespesaSalva === null}
          >
            <Trash2 className="btn-icon" size={18} strokeWidth={2} />
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
