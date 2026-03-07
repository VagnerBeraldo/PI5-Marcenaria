import React, { useState } from "react";
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from "../components/BotaoVoltar/BotaoVoltar";
import { Save, Trash2, Search, FilePlus, MapPin } from "lucide-react";
import Swal from "sweetalert2";
import api from "../../services/api";
import "../styles/Cliente.css";

export default function Cliente() {
  const [isLoading, setIsLoading] = useState(false);
  const [idClienteSalvo, setIdClienteSalvo] = useState(null);

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
      Swal.fire({ icon: "warning", title: "CEP Inválido", text: "Digite um CEP com 8 dígitos." });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        Swal.fire({ icon: "error", title: "Erro", text: "CEP não encontrado." });
        return;
      }

      setLogradouro(data.logradouro || "");
      setBairro(data.bairro || "");
      setCidade(data.localidade || "");
      setEstado(data.uf || "");
      document.getElementById("input-numero").focus(); 
      } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      Swal.fire({ icon: "error", title: "Erro", text: "Falha ao buscar o CEP." });
    } finally {
      setIsLoading(false);
    }
  };

  const limparFormulario = () => {
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

  // --- SALVAR CLIENTE ---
  const handleSalvar = async () => {
    if (!nome.trim() || !logradouro.trim()) {
      Swal.fire({ icon: "warning", title: "Atenção", text: "Nome e Logradouro são obrigatórios." });
      return;
    }

    setIsLoading(true);
    try {
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
        estado
      };

      if (idClienteSalvo) {
        await api.put(`/clientes/${idClienteSalvo}`, payload);
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Cliente atualizado!", showConfirmButton: false, timer: 3000 });
      } else {
        const response = await api.post("/clientes", payload);
        setIdClienteSalvo(response.data.id);
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Cliente salvo!", showConfirmButton: false, timer: 3000 });
      }
    } catch (error) {
      console.error("Erro ao salvar cliente:", error.response?.data || error);
      const detalhesErro = error.response?.data?.detalhes;
      const mensagemAlerta = detalhesErro && detalhesErro.length > 0 
        ? `Campo inválido: ${detalhesErro[0].path[0]} - ${detalhesErro[0].message}`
        : 'Não foi possível salvar o cliente. Verifique os dados.';
      Swal.fire({ icon: "error", title: "Erro", text: mensagemAlerta });
    } finally {
      setIsLoading(false);
    }
  };

  // --- BUSCAR CLIENTE (Lupa) ---
  const handleBuscarCliente = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/clientes');
      if (!data || data.length === 0) {
        Swal.fire({ title: 'Aviso', text: 'Nenhum cliente cadastrado.', icon: 'info' });
        return;
      }

      Swal.fire({
        title: 'Buscar Cliente',
        customClass: { popup: 'modal-pesquisa' },
        html: `<input type="text" id="swal-search-cli" class="swal2-input input-pesquisa" placeholder="Buscar por nome..."><div id="swal-results-cli" class="lista-resultados"></div>`,
        showConfirmButton: false, 
        showCancelButton: true, 
        cancelButtonText: 'Fechar',
        didOpen: () => {
          const input = document.getElementById('swal-search-cli');
          const list = document.getElementById('swal-results-cli');

          const render = (val) => {
            const filtered = data.filter(c => (c.nome || '').toLowerCase().includes(val.toLowerCase()));
            list.innerHTML = filtered.map(c => `
              <div class="swal-res-item item-resultado" data-id="${c.id_cliente}">
                <span class="item-titulo">${c.nome}</span>
                <span class="item-badge">${c.cidade || 'Sem cidade'} - ${c.estado || ''}</span>
              </div>`).join('');

            document.querySelectorAll('.swal-res-item').forEach(el => el.onclick = () => {
              const selectedCli = data.find(item => item.id_cliente === Number(el.dataset.id));
              if (selectedCli) carregarCliente(selectedCli);
              Swal.close();
            });
          };
          render('');
          input.focus();
          input.oninput = (e) => render(e.target.value);
        }
      });
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível carregar a lista de clientes.' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- EXCLUIR CLIENTE ---
  const handleExcluir = async () => {
    if (!idClienteSalvo) return;

    const result = await Swal.fire({
      title: 'Excluir Cliente?',
      text: "Todos os orçamentos vinculados podem perder a referência!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/clientes/${idClienteSalvo}`);
        Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Cliente excluído!", showConfirmButton: false, timer: 3000 });
        limparFormulario();
      } catch (error) {
        console.error("Erro ao excluir:", error);
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível excluir o cliente.' });
      }
    }
  };

  return (
    <PageTransition className="cliente-container">
      <div className="card-cliente">
        <div className="header-actions">
          <BotaoVoltar />
          <button className="btn-novo-topo" onClick={limparFormulario}>
            <FilePlus size={18} /><span>Novo</span>
          </button>
        </div>
          <img src="/logo.svg" alt="Logo" className="logo-img" />
          <h1 className="nome-fantasia">GR Marcenaria</h1>  
        
        <h1 className="titulo-pagina">Cadastro de Cliente</h1>

        {/* --- DADOS PESSOAIS / CONTATO --- */}
        <div className="secao-form">
          <h2 className="subtitulo">Dados Pessoais e Contato</h2>
          <div className="form-row">
            <div className="form-group flex-2 "> {/*  highlight */}
              <label className="titulo-input">Nome Completo / Empresa *</label>
              <input 
                type="text" 
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
                placeholder="Ex: Zezinho da Silva ou Empresa XPTO"
              />
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
                <button type="button" className="btn-icone-lupa" onClick={buscarCep} title="Buscar CEP">
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
        <div className='btn-container-acoes'>
          <button className="btn-acao-salvar" onClick={handleSalvar} disabled={isLoading}>
            <Save size={18}/><span>{isLoading ? 'Salvando...' : 'Salvar'}</span>
          </button>
          
          <button className="btn-acao-buscar" onClick={handleBuscarCliente} disabled={isLoading}>
            <Search size={18}/><span>Buscar</span>
          </button>
          
            <button className="btn-acao-excluir" onClick={handleExcluir}>
              <Trash2 size={18}/><span>Excluir</span>
            </button>
        </div>

      </div>
    </PageTransition>
  );
}