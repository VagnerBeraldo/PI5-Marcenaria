import React, { useState, useEffect, useMemo } from "react";
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from "../components/BotaoVoltar/BotaoVoltar";
import { CirclePlus, FileEditIcon, Save, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import "../styles/Despesas.css";
import api from "../../services/api";

export default function Despesas() {
  const [isLoading, setIsLoading] = useState(false);
  const [idDespesaSalva, setIdDespesaSalva] = useState(null);

  const [faturamento, setFaturamento] = useState(0);

  const [manutencao, setManutencao] = useState(0);
  const [internet, setInternet] = useState(0);
  const [contador, setContador] = useState(0);
  const [outrasFixas, setOutrasFixas] = useState([]);

  const [energia, setEnergia] = useState(0);
  const [impostoPerc, setImpostoPerc] = useState(0);
  const [taxaCartaoPerc, setTaxaCartaoPerc] = useState(0);
  const [fornecedores, setFornecedores] = useState(0);
  const [outrasVariaveis, setOutrasVariaveis] = useState([]);

  const impostoValor = useMemo(
    () => (faturamento * impostoPerc) / 100,
    [faturamento, impostoPerc],
  );
  const taxaCartaoValor = useMemo(
    () => (faturamento * taxaCartaoPerc) / 100,
    [faturamento, taxaCartaoPerc],
  );

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
      confirmButtonColor: "var(--vermelho-destaque)",
      cancelButtonColor: "var(--btn-cancelar-exclusao)",
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
          payloadBruto.despesasFixas.outrasFixas = novasFixas.map((item) => ({
            ...item,
            nome: item.nome,
            valor: item.valor,
          }));

          await api.put(`/despesas/${idDespesaSalva}`, payloadBruto);

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Item removido com sucesso",
            showConfirmButton: false,
            timer: 3000,
            customClass: { popup: "mensagem-confirmacao" },
          });
        } catch (err) {
          console.error("Erro ao carregar orçamento", err);
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "Não foi possível remover o item",
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
      confirmButtonColor: "var(--vermelho-destaque)",
      cancelButtonColor: "var(--btn-cancelar-exclusao)",
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

          payloadBruto.despesasVariaveis.outrasVariaveis = novasVariaveis.map(
            (item) => ({
              ...item,
              nome: item.nome,
              valor: item.valor,
            }),
          );

          await api.put(`/despesas/${idDespesaSalva}`, payloadBruto);

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Item removido com sucesso",
            showConfirmButton: false,
            timer: 3000,
            customClass: { popup: "mensagem-confirmacao" },
          });
        } catch (err) {
          console.error("Erro ao carregar orçamento", err);
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "Não foi possível remover o item",
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
      } catch (err) {
        if (err.response && err.response.status !== 404) {
          console.error("Erro ao carregar orçamento", err);
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
        nome: item.nome,
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
        nome: item.nome,
        valor: item.valor,
      })),
    },
  });

  const handleSalvar = async () => {
    setIsLoading(true);
    try {
      const payloadBruto = montarPayload();

      const response = await api.post("/despesas", payloadBruto);
      if (response.status === 201) {
        setIdDespesaSalva(response.data.id || 1);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Despesa salva com sucesso",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-confirmacao" },
        });
      }
    } catch (err) {
      console.error("Erro ao carregar orçamento", err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Erro ao salvar despesa",
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

      await api.put(`/despesas/${idDespesaSalva}`, payloadBruto);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Despesa atualizada com sucesso!",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-confirmacao" },
      });
    } catch (err) {
      console.error("Erro ao carregar orçamento", err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Erro ao atualizar despesa",
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
      customClass: { popup: "modal-confirma-exclusao" },
      title: "Exclusão de despesa",
      text: "Excluir as despesas fixas e variáveis?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--btn-confirmar-exclusao)",
      cancelButtonColor: "var(--btn-cancelar-exclusao)",
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
          title: "Despesa excluída com sucesso!",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-confirmacao" },
        });
      } catch (err) {
        console.error("Erro ao carregar orçamento", err);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Erro ao excluir despesa",
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
      <img src="/logo.svg" alt="Logo da Empresa" className="logo-img" />
      <h1 className="nome-fantasia">GR Marcenaria</h1>
      <h1 className="titulo-pagina">Despesas</h1>
      <h2 className="subtitulo">Custos</h2>

      <div className="form-group">
        <label className="titulo-input">Faturamento Bruto</label>
        <input
          type="text"
          value={formatInputBR(faturamento)}
          onChange={handleMonetarioChange(setFaturamento)}
          placeholder="R$ 0,00"
          disabled={isLoading}
        />
      </div>

      <h2 className="subtitulo">Despesas Fixas</h2>
      <div className="form-group">
        <label className="titulo-input">
          Manutenção Preventiva de Máquinas
        </label>
        <input
          type="text"
          value={formatInputBR(manutencao)}
          onChange={handleMonetarioChange(setManutencao)}
          placeholder="R$ 0,00"
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label className="titulo-input">Internet e Telefone</label>
        <input
          type="text"
          value={formatInputBR(internet)}
          onChange={handleMonetarioChange(setInternet)}
          placeholder="R$ 0,00"
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label className="titulo-input">Contador</label>
        <input
          type="text"
          value={formatInputBR(contador)}
          onChange={handleMonetarioChange(setContador)}
          placeholder="R$ 0,00"
          disabled={isLoading}
        />
      </div>

      {outrasFixas.map((item) => (
        <div key={item.id} className="form-row linha-dinamica">
          <div className="form-group flex-2">
            <label className="titulo-input">Descrição</label>
            <input
              type="text"
              value={item.nome}
              onChange={(e) => updateOutraFixa(item.id, "nome", e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group flex-1">
            <label className="titulo-input">Valor</label>
            <div className="wrapper-input-trash">
              <input
                type="text"
                value={formatInputBR(item.valor)}
                onChange={(e) => {
                  const apenasNumeros = e.target.value.replace(/\D/g, "");
                  updateOutraFixa(
                    item.id,
                    "valor",
                    Number(apenasNumeros) / 100,
                  );
                }}
                placeholder="R$ 0,00"
                disabled={isLoading}
              />
              <button
                className="btn-delete-item"
                onClick={() => removeOutraFixa(item.id)}
                disabled={isLoading}
                title="Remover item"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      ))}
      <button className="btn-add" onClick={addOutraFixa} disabled={isLoading}>
        <CirclePlus size={18} className="btn-icon-add" strokeWidth={2} />
        <span>Inserir Outra Despesa Fixa</span>
      </button>

      <h2 className="subtitulo">Despesas Variáveis</h2>
      <div className="form-group">
        <label className="titulo-input">Energia Elétrica</label>
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
          <label className="titulo-input">Imposto (%)</label>
          <input
            type="number"
            value={impostoPerc || ""}
            onChange={(e) => setImpostoPerc(Number(e.target.value))}
            placeholder="Ex.: 10"
            disabled={isLoading}
            min="1"
          />
        </div>
        <div className="form-group flex-2">
          <label className="titulo-input">Valor Calculado (Imposto)</label>
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
          <label className="titulo-input">Taxa de Cartão (%)</label>
          <input
            type="number"
            value={taxaCartaoPerc || ""}
            onChange={(e) => setTaxaCartaoPerc(Number(e.target.value))}
            placeholder="Ex.: 3"
            disabled={isLoading}
            min="1"
          />
        </div>
        <div className="form-group flex-2">
          <label className="titulo-input">Valor Calculado (Taxa)</label>
          <input
            type="text"
            value={formatMoney(taxaCartaoValor)}
            disabled
            className="input-disabled"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="titulo-input">Fornecedores</label>
        <input
          type="text"
          value={formatInputBR(fornecedores)}
          onChange={handleMonetarioChange(setFornecedores)}
          placeholder="R$ 0,00"
          disabled={isLoading}
        />
      </div>

      {outrasVariaveis.map((item) => (
        <div key={item.id} className="form-row linha-dinamica">
          <div className="form-group flex-2">
            <label className="titulo-input">Descrição</label>
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
            <label className="titulo-input">Valor</label>
            <div className="wrapper-input-trash">
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
              <button
                className="btn-delete-item"
                onClick={() => removeOutraVariavel(item.id)}
                disabled={isLoading}
                title="Remover item"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
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

      <div className="btn-containver-acoes">
        <div className="btn-wrapper-acoes layout-tres-botoes">
          <div className="btn-wrapper-flex-acoes">
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
          </div>

          <div className="btn-wrapper-flex-acoes">
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
      </div>
    </PageTransition>
  );
}
