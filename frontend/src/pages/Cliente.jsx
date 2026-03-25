import React, { useState } from "react";
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from "../components/BotaoVoltar/BotaoVoltar";
import { Save, Trash2, Search, FilePlus, MapPin, FileEdit } from "lucide-react";
import Swal from "sweetalert2";
import api from "../../services/api";
import { useProjeto } from "../hooks/useProjeto";
import "../styles/ContainerVoltarNovo.css";
import "../styles/Cliente.css";

export default function Cliente() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [idClienteSalvo, setIdClienteSalvo] = useState(null);

  // Instanciando o Contexto Global
  const { atualizarContexto, limparContexto } = useProjeto();

  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  // Estados de Endereço
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  // --- BUSCA DE CEP (ViaCEP) ---
  const buscarCep = async () => {

    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: "Digite um CEP com 8 dígitos.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
      return;
    }

    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
      );
      const data = await response.json();

      if (data.erro) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          text: "CEP não encontrado.",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-erro" },
        });
        return;
      }

      setLogradouro(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setEstado(data.uf || "");
      document.getElementById("input-numero").focus();
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: "Falha ao buscar o CEP.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const limparFormulario = () => {
    limparContexto();
    setIdClienteSalvo(null);
    setNome("");
    setEmail("");
    setTelefone("");
    setCep("");
    setLogradouro("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");

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

  const carregarCliente = (cliente) => {
    setIdClienteSalvo(cliente.id_cliente);
    setNome(cliente.nome || "");
    setEmail(cliente.email || "");
    setTelefone(cliente.telefone || "");
    setCep(cliente.cep || "");
    setLogradouro(cliente.logradouro || "");
    setNumero(cliente.numero || "");
    setComplemento(cliente.complemento || "");
    setBairro(cliente.bairro || "");
    setCidade(cliente.cidade || "");
    setEstado(cliente.estado || "");
  };

  // --- CONTEXTO GLOBAL ---
  const carregarAmbienteGlobal = async (cliente) => {
    setIsLoading(true);
    try {
      atualizarContexto({ cliente }); // Salva o cliente na memória global

      // 1. Busca orçamentos deste cliente
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

      // 2. Abre Modal para o usuário escolher o projeto
      Swal.fire({
        title: "Selecionar Projeto",
        text: "Escolha qual projeto deste cliente deseja carregar para a área de trabalho:",
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

              // 3. Busca Plano de Corte vinculado
              try {
                const resPlano = await api.get(
                  `/plano-corte/orcamento/${selectedOrc.id_orcamento}`,
                );
                planoCorte = resPlano.data;
              } catch (e) {
                console.error("Sem plano de corte.", e);
              }

              // 4. Busca Ficha Técnica vinculada
              if (selectedOrc.id_projeto) {
                try {
                  const resCusto = await api.get(
                    `/custos/${selectedOrc.id_projeto}`,
                  );
                  custo = resCusto.data;
                } catch (e) {
                  console.error("Não há ficha técnica", e);
                }
              }

              // 5. Injeta TUDO no Contexto Global
              atualizarContexto({ orcamento: selectedOrc, planoCorte, custo });

              Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Ambiente Global carregado!",
                showConfirmButton: false,
                timer: 3000,
                customClass: { popup: "mensagem-confirmacao" },
              });
              setIsLoading(false);
            };
          });
        },
      });
    } catch (error) {
      console.error("Erro ao carregar ambiente", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- SALVAR CLIENTE ---
  const handleSalvar = async () => {
    if (!nome.trim()) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: "O nome é obrigatório",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
      return;
    }

    setIsSaving(true);
    try {
      // 1. Verificação de Nome Duplicado antes de salvar
      const { data: clientesExistentes } = await api.get("/clientes");
      if (clientesExistentes && clientesExistentes.length > 0) {
        const nomeJaExiste = clientesExistentes.some(
          (c) => c.nome.toLowerCase() === nome.trim().toLowerCase()
        );

        if (nomeJaExiste) {
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            text: "Já existe um cliente com esse nome",
            showConfirmButton: false,
            timer: 4000,
            customClass: { popup: "mensagem-erro" },
          });
          setIsSaving(false);
          return; 
        }
      }

      // 2. Prossegue com o cadastro se o nome for único
      const payload = {
        nome,
        email,
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      };

      const response = await api.post("/clientes", payload);
      setIdClienteSalvo(response.data.id);
      atualizarContexto({
        cliente: { ...payload, id_cliente: response.data.id },
      }); // Atualiza memória se for novo
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Cliente salvo com sucesso.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-confirmacao" },
      });
    } catch (err) {
      console.error("Erro ao salvar", err);
      const detalhesErro = err.response?.data?.detalhes;
      const mensagemAlerta =
        detalhesErro && detalhesErro.length > 0
          ? `Campo inválido: ${detalhesErro[0].path[0]} - ${detalhesErro[0].message}`
          : "Não foi possível salvar o cliente. Verifique os dados.";
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: mensagemAlerta,
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsSaving(false);
    }
  };
  

  // --- EDITAR CLIENTE ---
  const handleEditar = async () => {
    if (!idClienteSalvo) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: "Nenhum cliente selecionado para edição.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
      return;
    }

    if (!nome.trim()) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: "O nome é obrigatório",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verificação de Nome Duplicado
      const { data: clientesExistentes } = await api.get("/clientes");
      if (clientesExistentes && clientesExistentes.length > 0) {
        const nomeJaExiste = clientesExistentes.some(
          (c) => 
            c.nome.toLowerCase() === nome.trim().toLowerCase() &&
            c.id_cliente !== idClienteSalvo
        );

        if (nomeJaExiste) {
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

      // 2. Prossegue com a edição
      const payload = {
        nome,
        email,
        telefone,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      };

      await api.put(`/clientes/${idClienteSalvo}`, payload);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Cliente atualizado com sucesso",
        customClass: { popup: "mensagem-confirmacao" },
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (err) {
      console.error("Erro ao editar", err);
      const detalhesErro = err.response?.data?.detalhes;
      const mensagemAlerta =
        detalhesErro && detalhesErro.length > 0
          ? `Campo inválido: ${detalhesErro[0].path[0]} - ${detalhesErro[0].message}`
          : "Não foi possível editar o cliente. Verifique os dados.";
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: mensagemAlerta,
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };


  // --- BUSCAR CLIENTE ---
  const handleBuscar = async () => {
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
        title: "Buscar Cliente",
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
                <span class="item-badge">${c.cidade || "Sem cidade"} - ${c.estado || ""}</span>
              </div>`,
              )
              .join("");

            document.querySelectorAll(".swal-res-item").forEach(
              (el) =>
                (el.onclick = () => {
                  const selectedCli = data.find(
                    (item) => item.id_cliente === Number(el.dataset.id),
                  );
                  if (selectedCli) {
                    carregarCliente(selectedCli);
                    carregarAmbienteGlobal(selectedCli);
                  }
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
      console.error("Erro ao buscar clientes:", error);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        text: "Não foi possível carregar a lista de clientes.",
        showConfirmButton: false,
        timer: 3000,
        customClass: { popup: "mensagem-erro" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- EXCLUIR CLIENTE ---
  const handleExcluir = async () => {
    if (!idClienteSalvo) return;

    const result = await Swal.fire({
      customClass: { popup: "modal-confirma-exclusao" },
      title: "Excluir Cliente?",
      text: "Todos os orçamentos vinculados podem perder a referência!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--btn-confirmar-exclusao)",
      cancelButtonColor: "var(--btn-cancelar-exclusao)",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/clientes/${idClienteSalvo}`);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Cliente excluído com sucesso!",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-confirmacao" },
        });
        limparFormulario();
      } catch (error) {
        console.error("Erro ao excluir:", error);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          text: "Não foi possível excluir o cliente.",
          showConfirmButton: false,
          timer: 3000,
          customClass: { popup: "mensagem-erro" },
        });
      }
    }
  };

  return (
    <PageTransition className="cliente-container">
      <div className="card-cliente">
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

        <h1 className="titulo-pagina">Cadastro de Cliente</h1>

        {/* --- DADOS PESSOAIS / CONTATO --- */}
        <div className="secao-form">
          <h2 className="subtitulo">Dados Pessoais e Contato</h2>
          <div className="form-row">
            <div className="form-group flex-2 ">
              {" "}
              <label className="titulo-input">Nome Cliente / Empresa *</label>
              <div className="cotainer-nomeCliente">
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo"
                />

                <button
                  type="button"
                  onClick={handleBuscar}
                  className="btn-icone-lupa"
                  disabled={isLoading}
                >
                  <Search size={18} />
                </button>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="titulo-input">Telefone / WhatsApp</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="form-group flex-1">
              <label className="titulo-input">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
        </div>

        {/* --- ENDEREÇO --- */}
        <div className="secao-form">
          <h2 className="subtitulo">Endereço</h2>
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="titulo-input">CEP</label>
              <div className="container-lupa">
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  className="input-lupa-flex"
                />
                <button
                  type="button"
                  className="btn-icone-lupa"
                  onClick={buscarCep}
                  title="Buscar CEP"
                >
                  <MapPin size={20} />
                </button>
              </div>
            </div>
            <div className="form-group flex-2">
              <label className="titulo-input">Logradouro (Rua, Av.) *</label>
              <input
                type="text"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="titulo-input">Número</label>
              <input
                id="input-numero"
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div className="form-group flex-2">
              <label className="titulo-input">Complemento</label>
              <input
                type="text"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                placeholder="Apto, Bloco, Casa..."
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="titulo-input">Bairro</label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
              <label className="titulo-input">Cidade</label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </div>
            <div className="form-group estado-box">
              <label className="titulo-input">UF</label>
              <input
                type="text"
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                maxLength="2"
                placeholder="SP"
              />
            </div>
          </div>
        </div>

        {/* --- BOTÕES DE AÇÃO --- */}
        <div className="btn-containver-acoes">
          <div className="btn-wrapper-acoes">
            <div className="btn-wrapper-flex-acoes">
              <button
                className="btn-salvar"
                onClick={handleSalvar}
                disabled={isLoading || idClienteSalvo !== null}
              >
                {" "}
                <Save size={18} />
                <span>{isSaving ? "Salvar" : "Salvar"}</span>
              </button>
              <button
                className="btn-editar"
                onClick={handleEditar}
                // disabled={isLoading}
                disabled={isLoading || idClienteSalvo === null}
              >
                {" "}
                <FileEdit size={18} />
                <span>Editar</span>
              </button>
            </div>
            <div className="btn-wrapper-flex-acoes">
              <button
                className="btn-buscar"
                onClick={handleBuscar}
                disabled={isLoading}
              >
                {" "}
                <Search size={18} />
                <span>Buscar</span>
              </button>
              <button
                className="btn-excluir"
                onClick={handleExcluir}
                disabled={isLoading || idClienteSalvo === null}
              >
                {" "}
                <Trash2 size={18} />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
