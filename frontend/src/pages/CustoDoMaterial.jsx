import React, { useState, useMemo, useEffect } from 'react';
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from '../components/BotaoVoltar/BotaoVoltar';
import { FileEditIcon, Save, Trash2, Search, FilePlus, CirclePlus, CircleMinus } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/CustoDoMaterial.css';
import api from '../../services/api';
import { useProjeto } from "../hooks/useProjeto"; 

export default function CustoDoMaterial() {
  const [isLoading, setIsLoading] = useState(false);
  const [idProjetoSalvo, setIdProjetoSalvo] = useState(null);

  const { contextoGlobal, atualizarContexto } = useProjeto();

  const [nomeProjeto, setNomeProjeto] = useState('');
  const [maoDeObra, setMaoDeObra] = useState(0);
  const [instalacao, setInstalacao] = useState(0);

  const [materiais, setMateriais] = useState([
    { id: Date.now(), material: '', quantidade: '', unidade_medida: '', valor_unitario: 0 }
  ]);

  useEffect(() => {
    if (contextoGlobal?.custo) {
      const proj = contextoGlobal.custo;
      setIdProjetoSalvo(proj.id_projeto);
      setNomeProjeto(proj.nome_projeto);
      setMaoDeObra(Number(proj.mao_de_obra));
      setInstalacao(Number(proj.instalacao));

      const materiaisParsed = typeof proj.materiais === 'string' ? JSON.parse(proj.materiais) : (proj.materiais || []);
      const materiaisCarregados = materiaisParsed.length > 0 
        ? materiaisParsed.map(m => ({ ...m, id: m.id_item || Date.now() + Math.random() }))
        : [{ id: Date.now(), material: '', quantidade: '', unidade_medida: '', valor_unitario: 0 }];

      setMateriais(materiaisCarregados);
    } 
  }, [contextoGlobal?.custo]);


useEffect(() => {
    const sincronizarEBuscarPlano = async () => {
      if (contextoGlobal.nomeProjetoGlobal && contextoGlobal.nomeProjetoGlobal !== nomeProjeto) {
        const novoNome = contextoGlobal.nomeProjetoGlobal;
        setNomeProjeto(novoNome);

        try {
          const response = await api.get('/planos-corte');
          const planoEncontrado = response.data.find(p => p.nome_servico === novoNome);
          
          if (planoEncontrado) {
            // 1. Converte as chapas que vieram do banco
            const chapas = typeof planoEncontrado.chapas === 'string' 
              ? JSON.parse(planoEncontrado.chapas) 
              : (planoEncontrado.chapas || []);
            
            atualizarContexto({
              orcamento: {
                id_orcamento: planoEncontrado.id_orcamento,
                nome_projeto: novoNome
              },
              // Importante: Guardar o plano no contexto para o useEffect não rodar em loop
              planoCorte: planoEncontrado 
            });

            // 2. Lógica de Agrupamento por Nome do Material
            const grupos = {};
            chapas.forEach((c) => {
              // Se c.material existir, usa ele. Se não, usa o nome genérico.
              const nomeMaterial = c.material && c.material.trim() !== "" 
                ? c.material 
                : 'Chapa de MDF (Sem descrição)';
                
              grupos[nomeMaterial] = (grupos[nomeMaterial] || 0) + 1;
            });

            // 3. Transforma o agrupamento no formato da tabela de materiais
            const materiaisAgrupados = Object.entries(grupos).map(([nome, qtd], idx) => ({
              id: Date.now() + idx,
              material: nome,
              quantidade: qtd,
              unidade_medida: 'chapa',
              valor_unitario: 0
            }));

            setMateriais(materiaisAgrupados.length > 0 
              ? materiaisAgrupados 
              : [{ id: Date.now(), material: '', quantidade: '', unidade_medida: '', valor_unitario: 0 }]
            );
          }
        } catch (err) {
          console.error("Erro ao carregar orçamento", err);
        }
      }
    };

    sincronizarEBuscarPlano();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextoGlobal.nomeProjetoGlobal, nomeProjeto]);

  
  const subtotalMateriais = useMemo(() => {
    return materiais.reduce((acc, item) => acc + ((Number(item.quantidade) || 0) * (item.valor_unitario || 0)), 0);
  }, [materiais]);

  const custoTotal = useMemo(() => subtotalMateriais + maoDeObra + instalacao, [subtotalMateriais, maoDeObra, instalacao]);

  const formatMoney = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatInputBR = (valor) => (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const adicionarLinha = () => {
    setMateriais([...materiais, { id: Date.now(), material: '', quantidade: '', unidade_medida: '', valor_unitario: 0 }]);
  };

  const removerLinha = (id) => {
    if (materiais.length === 1) return;
    setMateriais(materiais.filter(m => m.id !== id));
  };

  const atualizarItem = (id, campo, valor) => {
    setMateriais(materiais.map(m => m.id === id ? { ...m, [campo]: valor } : m));
  };

  const handleKeyDownTab = (e, index) => {
    if (e.key === 'Tab' && !e.shiftKey && index === materiais.length - 1) {
      adicionarLinha();
    }
  };

  const montarPayload = () => ({
    id_orcamento: contextoGlobal?.orcamento?.id_orcamento || contextoGlobal?.orcamento?.id || null,
    nome_projeto: nomeProjeto,
    mao_de_obra: maoDeObra,
    instalacao: instalacao,
    materiais: materiais.map(m => ({
      material: m.material,
      quantidade: Number(m.quantidade) || 0,
      unidade_medida: m.unidade_medida,
      valor_unitario: Number(m.valor_unitario) || 0 
    }))
  });

  const limparFormulario = () => {
    setIdProjetoSalvo(null);
    setNomeProjeto('');
    setMaoDeObra(0);
    setInstalacao(0);
    setMateriais([{ id: Date.now(), material: '', quantidade: '', unidade_medida: '', valor_unitario: 0 }]);
    atualizarContexto({ nomeProjetoGlobal: '', custo: null });
  };

  const handleBuscar = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/custos');
      const dadosNormalizados = response.data.map(projeto => ({
        ...projeto,
        materiais: typeof projeto.materiais === 'string' ? JSON.parse(projeto.materiais) : projeto.materiais
      }));

      if (!dadosNormalizados.length) {
        Swal.fire({ title: 'Aviso', text: 'Nenhum projeto encontrado.', icon: 'info' });
        return;
      }

      Swal.fire({ 
        title: 'Pesquisar Projetos',
        customClass: { popup: 'modal-pesquisa' },
        html: `<input type="text" id="swal-search" class="swal2-input input-pesquisa" placeholder="Digite o nome..."><div id="swal-results" class="lista-resultados"></div>`,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Fechar',
        didOpen: () => {
          const input = document.getElementById('swal-search');
          const list = document.getElementById('swal-results');
          const render = (val) => {
            const filtered = dadosNormalizados.filter(p => (p.nome_projeto || "").toLowerCase().includes(val.toLowerCase()));
            list.innerHTML = filtered.map(p => `
              <div class="swal-res-item item-resultado" data-id="${p.id_projeto}">
                <span class="item-titulo">${p.nome_projeto}</span>
              </div>`).join('');
            
            document.querySelectorAll('.swal-res-item').forEach(el => el.onclick = async () => {
              const proj = dadosNormalizados.find(x => x.id_projeto == el.dataset.id);
              setIdProjetoSalvo(proj.id_projeto);
              setNomeProjeto(proj.nome_projeto);
              setMaoDeObra(Number(proj.mao_de_obra));
              setInstalacao(Number(proj.instalacao));
              setMateriais(proj.materiais.map(m => ({ ...m, id: m.id_item })));
              atualizarContexto({ nomeProjetoGlobal: proj.nome_projeto, custo: proj });
              Swal.close();
            });
          };
          render('');
          input.focus();
          input.oninput = (e) => render(e.target.value);        
        }
      });
    } catch (err) { console.error("Erro ao carregar orçamento", err); } finally { setIsLoading(false); }
  };

  const handleBuscarPlanoDeCorte = async () => {
    setIsLoading(true); 
    try {
      const response = await api.get('/planos-corte');
      const planos = response.data;
      if (!planos.length) {
        Swal.fire({ title: 'Aviso', text: 'Nenhum plano encontrado.', icon: 'info' });
        return;
      }

      Swal.fire({
        title: 'Importar Plano de Corte',
        customClass: { popup: 'modal-pesquisa' },
        html: `<input type="text" id="swal-search-plano" class="swal2-input input-pesquisa" placeholder="Buscar projeto..."><div id="swal-results-plano" class="lista-resultados"></div>`,
        showConfirmButton: false,
        showCancelButton: true,
        didOpen: () => {
          const input = document.getElementById('swal-search-plano');
          const list = document.getElementById('swal-results-plano');
          const render = (val) => {
            const filtered = planos.filter(p => (p.nome_servico || "").toLowerCase().includes(val.toLowerCase()));
            list.innerHTML = filtered.map(p => `
              <div class="swal-res-item item-resultado" data-id="${p.id_plano}">
                <span class="item-titulo">${p.nome_servico || `ID: ${p.id_plano}`}</span>
              </div>`).join('');
            
            document.querySelectorAll('.swal-res-item').forEach(el => el.onclick = () => {
              const plano = planos.find(x => x.id_plano == el.dataset.id);
              const chapas = typeof plano.chapas === 'string' ? JSON.parse(plano.chapas) : (plano.chapas || []);
              setNomeProjeto(plano.nome_servico); 
              
              atualizarContexto({ 
                nomeProjetoGlobal: plano.nome_servico,
                orcamento: { 
                  id_orcamento: plano.id_orcamento, 
                  nome_projeto: plano.nome_servico 
                }
              });

              // Agrupa chapas pelo nome/material
              const grupos = {};
              chapas.forEach((c) => {
                const nome = c.material?.trim() ? c.material : 'Chapa de MDF (Sem descrição)';
                grupos[nome] = (grupos[nome] || 0) + 1;
              });

              const materiaisAgrupados = Object.entries(grupos).map(([mat, qtd], idx) => ({
                id: Date.now() + idx,
                quantidade: qtd,
                material: mat,
                unidade_medida: 'chapa',
                valor_unitario: 0
              }));

              setMateriais(materiaisAgrupados.length > 0 ? materiaisAgrupados : [{ id: Date.now(), material: '', quantidade: '', unidade_medida: '', valor_unitario: 0 }]); 
              Swal.close();
            });
          };
          render('');
          input.oninput = (e) => render(e.target.value);        
          input.focus();
        }
      });
    } catch (err) { console.error("Erro ao carregar orçamento", err); } finally { setIsLoading(false); }
  };

  const handleSalvar = async () => {
    if (!nomeProjeto.trim()) {
      Swal.fire({ icon: 'warning', title: 'O nome do projeto é obrigatório.' });
      return;
    }
    setIsLoading(true);
    try {
      const payload = montarPayload();
      const { data } = await api.post('/custos', payload);
      // console.log("Resposta integral do servidor:", data);
      setIdProjetoSalvo(data.id_projeto);

      atualizarContexto({ 
        nomeProjetoGlobal: nomeProjeto, 
        orcamento: {
          id_orcamento: data.id_orcamento || payload.id_orcamento,
          nome_projeto: nomeProjeto
        },
        custo: { ...payload, id_projeto: data.id || data.id_projeto } 
      });

      Swal.fire({ icon: 'success', title: 'Projeto salvo!', timer: 2000, showConfirmButton: false });
      
    } catch (err) { 
      console.error("Erro ao carregar orçamento", err); 
      Swal.fire({ icon: 'error', title: 'Erro ao salvar.' }); 
    } finally { setIsLoading(false); }
  };
  
  const handleEditar = async () => {
    if (!idProjetoSalvo) return;
    setIsLoading(true);
    try {
      const payload = montarPayload();
      await api.put(`/custos/${idProjetoSalvo}`, payload);
      Swal.fire({ icon: 'success', title: 'Atualizado!', timer: 2000, showConfirmButton: false });
    } catch (err) { console.error("Erro ao carregar orçamento", err); } finally { setIsLoading(false); }
  };

  const handleExcluir = async () => {
    if (!idProjetoSalvo) return;
    const result = await Swal.fire({ title: 'Excluir?', text: "Deseja remover este projeto?", icon: 'warning', showCancelButton: true });
    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        await api.delete(`/custos/${idProjetoSalvo}`);
        limparFormulario();
        Swal.fire({ icon: 'success', title: 'Excluído!', timer: 2000, showConfirmButton: false });
      } catch (err) { console.error("Erro ao carregar orçamento", err); } finally { setIsLoading(false); }
    }
  };
  
  return (
    <PageTransition className="financeiro-container">
      <div className="header-actions">
        <BotaoVoltar />
        <button className="btn-novo-topo" onClick={limparFormulario}><FilePlus size={18} /><span>Novo</span></button>
      </div>
      <img src="/logo.svg" alt="Logo" className="logo-img" />
      <h1 className="nome-fantasia">GR Marcenaria</h1>
      <h1 className="titulo-pagina">Custo do Material</h1>
      <div className="form-group highlight">
        <h2 className="subtitulo">Nome do Projeto</h2>
        <div className='cotainer-nomeProjeto'>
          <input type="text" className='nomeProjeto' value={nomeProjeto} onChange={e => { setNomeProjeto(e.target.value); atualizarContexto({ nomeProjetoGlobal: e.target.value }); }} disabled={isLoading} />
          <button type="button" onClick={handleBuscarPlanoDeCorte} className="btn-icone-lupa"><Search size={18} /></button>
        </div>
      </div>
      <h2 className="subtitulo">Itens da Ficha Técnica</h2>
      <div className="tabela-materiais">
        <div className="tabela-header">
          <span className="col-mat">Material</span><span className="col-qtd">Qtd</span><span className="col-un">Un</span><span className="col-val">Valor Un.</span><span className="col-sub">Subtotal</span><span className="col-del"></span>
        </div>
        {materiais.map((item, index) => (
          <div key={item.id} className="tabela-row">
            <input className="col-mat" type="text" value={item.material} onChange={e => atualizarItem(item.id, 'material', e.target.value)} />
            <input className="col-qtd" type="number" value={item.quantidade} onChange={e => atualizarItem(item.id, 'quantidade', e.target.value)} />
            <input className="col-un" type="text" value={item.unidade_medida} onChange={e => atualizarItem(item.id, 'unidade_medida', e.target.value)} />
            <input className="col-val" type="text" value={formatInputBR(item.valor_unitario)} onChange={e => atualizarItem(item.id, 'valor_unitario', Number(e.target.value.replace(/\D/g, '')) / 100)} onKeyDown={(e) => handleKeyDownTab(e, index)} />
            <span className="col-sub">{formatMoney((Number(item.quantidade) || 0) * item.valor_unitario)}</span>
            <button className="btn-del-row" onClick={() => removerLinha(item.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <button className="btn-add-row" onClick={adicionarLinha}><CirclePlus size={16} /> Adicionar Material</button>
      <div className="form-row" style={{ marginTop: '20px' }}>
        <div className="form-group flex-1"><label className="titulo-input">Mão de Obra</label><input type="text" value={formatInputBR(maoDeObra)} onChange={e => setMaoDeObra(Number(e.target.value.replace(/\D/g, '')) / 100)} /></div>
        <div className="form-group flex-1"><label className="titulo-input">Instalação</label><input type="text" value={formatInputBR(instalacao)} onChange={e => setInstalacao(Number(e.target.value.replace(/\D/g, '')) / 100)} /></div>
      </div>
      <div className="total-box"><span>Custo Total:</span><strong>{formatMoney(custoTotal)}</strong></div>
      <div className='btn-container-custo'>
        <div className='btn-wrapper-custo'>
          <div className='btn-wrapper-flex-custo'>
            <button className="btn-salvar-custo" onClick={handleSalvar} disabled={isLoading || idProjetoSalvo !== null}><Save size={18} /><span>Salvar</span></button>
            <button className="btn-editar-custo" onClick={handleEditar} disabled={isLoading || idProjetoSalvo === null}><FileEditIcon size={18} /><span>Editar</span></button>
          </div>
          <div className='btn-wrapper-flex-custo'>
            <button className="btn-buscar-custo" onClick={handleBuscar}><Search size={18} /><span>Buscar</span></button>
            <button className="btn-excluir-custo" onClick={handleExcluir}><CircleMinus size={18} /><span>Excluir</span></button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}