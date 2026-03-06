import React, { useState, useMemo } from 'react';
import PageTransition from "../components/Animation/PageTransition";
import BotaoVoltar from '../components/BotaoVoltar/BotaoVoltar';
import { FileEditIcon, Save, Trash2, Search, FilePlus, CirclePlus, CircleMinus } from 'lucide-react';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import { z } from 'zod';
import '../styles/CustoDoMaterial.css';
import api from '../../services/api';

// Schema de Validação
const materialItemSchema = z.object({
  material: z.string().trim().min(1, "O material não pode estar vazio."),
  quantidade: z.coerce.number().positive("Quantidade inválida."),
  unidade_medida: z.string().trim().min(1, "Unidade inválida."),
  valor_unitario: z.coerce.number().min(0, "Valor inválido.")
});

const projetoSchema = z.object({
  nome_projeto: z.string().trim().min(1, "O nome do projeto é obrigatório."),
  mao_de_obra: z.coerce.number().min(0).optional(),
  instalacao: z.coerce.number().min(0).optional(),
  materiais: z.array(materialItemSchema).min(1, "Adicione pelo menos um material.")
});

export default function CustoDoMaterial() {
  const [isLoading, setIsLoading] = useState(false);
  const [idProjetoSalvo, setIdProjetoSalvo] = useState(null);

  // Estados do Mestre
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [maoDeObra, setMaoDeObra] = useState(0);
  const [instalacao, setInstalacao] = useState(0);

  // Estado dos Detalhes (Tabela Dinâmica)
  const [materiais, setMateriais] = useState([
    { id: Date.now(), material: '', quantidade: '', unidade_medida: '', valor_unitario: 0 }
  ]);

  // Cálculos dinâmicos
  const subtotalMateriais = useMemo(() => {
    return materiais.reduce((acc, item) => acc + ((Number(item.quantidade) || 0) * (item.valor_unitario || 0)), 0);
  }, [materiais]);

  const custoTotal = useMemo(() => subtotalMateriais + maoDeObra + instalacao, [subtotalMateriais, maoDeObra, instalacao]);

  const formatMoney = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatInputBR = (valor) => (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Funções da Tabela
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

  // Atalho TAB na última linha
  const handleKeyDownTab = (e, index) => {
    if (e.key === 'Tab' && !e.shiftKey && index === materiais.length - 1) {
      adicionarLinha();
    }
  };

  const montarPayload = () => ({
    nome_projeto: DOMPurify.sanitize(nomeProjeto),
    mao_de_obra: maoDeObra,
    instalacao: instalacao,
    materiais: materiais.map(m => ({
      material: DOMPurify.sanitize(m.material),
      quantidade: Number(m.quantidade) || 0, // Força a conversão para número
      unidade_medida: DOMPurify.sanitize(m.unidade_medida),
      valor_unitario: Number(m.valor_unitario) || 0 // Força a conversão para número
    }))
  });

  const limparFormulario = () => {
    setIdProjetoSalvo(null);
    setNomeProjeto('');
    setMaoDeObra(0);
    setInstalacao(0);
    setMateriais([{ id: Date.now(), material: '', quantidade: '', unidade_medida: '', valor_unitario: 0 }]);
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
        Swal.fire({ title: 'Aviso', text: 'Nenhum projeto encontrado.', icon: 'info', customClass: { popup: 'modal-pesquisa' }});
        return;
      }

      Swal.fire({ 
        title: 'Pesquisar Projetos',
        customClass: { popup: 'modal-pesquisa' },
        html: `
          <input type="text" id="swal-search" class="swal2-input input-pesquisa" placeholder="Digite o nome do projeto...">
          <div id="swal-results" class="lista-resultados"></div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Fechar',
        didOpen: () => {
          const input = document.getElementById('swal-search');
          const list = document.getElementById('swal-results');
          
          const render = (val) => {
            const filtered = dadosNormalizados.filter(p => p.nome_projeto.toLowerCase().includes(val.toLowerCase()));
            
            if (filtered.length === 0) {
              list.innerHTML = '<div class="item-vazio">Nenhum projeto encontrado.</div>';
              return;
            }

            list.innerHTML = filtered.map(p => `
              <div class="swal-res-item item-resultado" data-id="${p.id_projeto}">
                <span class="item-titulo">${p.nome_projeto}</span>
                <span class="item-badge">${p.materiais.length} ${p.materiais.length === 1 ? 'item' : 'itens'}</span>
              </div>`).join('');
            
            document.querySelectorAll('.swal-res-item').forEach(el => el.onclick = () => {
              const proj = dadosNormalizados.find(x => x.id_projeto == el.dataset.id);
              setIdProjetoSalvo(proj.id_projeto);
              setNomeProjeto(proj.nome_projeto);
              setMaoDeObra(Number(proj.mao_de_obra));
              setInstalacao(Number(proj.instalacao));
              setMateriais(proj.materiais.map(m => ({ ...m, id: m.id_item })));
              Swal.close();
            });
          };
          
          render('');
          input.focus(); // Foca automaticamente no campo ao abrir
          input.oninput = (e) => render(e.target.value);        
        }
      });
    } catch (e) { 
      console.error('Falha ao buscar dados', e); 
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Falha ao buscar dados.', showConfirmButton: false, timer: 3000, customClass: { popup: 'mensagem-erro' } }); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleBuscarPlanoDeCorte = async () => {
    setIsLoading(true); // Certifique-se de ter esse state ou remova esta linha
    try {
      const response = await api.get('/planos-corte');
      
      const planosNormalizados = response.data.map(plano => ({
        ...plano,
        chapas: typeof plano.chapas === 'string' ? JSON.parse(plano.chapas) : plano.chapas
      }));

      if (!planosNormalizados.length) {
        Swal.fire({ title: 'Aviso', text: 'Nenhum plano de corte encontrado.', icon: 'info', customClass: { popup: 'modal-pesquisa' }});
        return;
      }

      Swal.fire({
        title: 'Importar Plano de Corte',
        customClass: { popup: 'modal-pesquisa' },
        html: `
          <input type="text" id="swal-search-plano" class="swal2-input input-pesquisa" placeholder="Buscar projeto...">
          <div id="swal-results-plano" class="lista-resultados"></div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Fechar',
        didOpen: () => {
          const input = document.getElementById('swal-search-plano');
          const list = document.getElementById('swal-results-plano');
          
          const render = (val) => {
            const filtered = planosNormalizados.filter(p => p.nome_servico.toLowerCase().includes(val.toLowerCase()));
            
            if (filtered.length === 0) {
              list.innerHTML = '<div class="item-vazio">Nenhum plano encontrado.</div>';
              return;
            }

            list.innerHTML = filtered.map(p => `
              <div class="swal-res-item item-resultado" data-id="${p.id_plano}">
                <span class="item-titulo">${p.nome_servico}</span>
                <span class="item-badge">${p.chapas.length} ${p.chapas.length === 1 ? 'chapa' : 'chapas'}</span>
              </div>`).join('');
            
            document.querySelectorAll('.swal-res-item').forEach(el => el.onclick = () => {
              const plano = planosNormalizados.find(x => x.id_plano == el.dataset.id);
              
              // 1. Atualiza o Nome do Projeto
              setNomeProjeto(plano.nome_servico); // Ajuste para o nome exato do seu state
              
              // 2. Atualiza a quantidade de chapas na sua lista de materiais
              setMateriais(prevMateriais => {
                const novoMaterial = {
                  id: Date.now(),
                  material: 'Chapa de MDF',
                  quantidade: plano.chapas.length,
                  unidade_medida: 'un',
                  valor_unitario: 0 // Deixa zerado para o usuário preencher o preço
                };

                // Se a lista tiver apenas 1 item e ele estiver vazio, substitui ele
                if (prevMateriais.length === 1 && prevMateriais[0].material === '') {
                  return [{ ...novoMaterial, id: prevMateriais[0].id }];
                }
                
                // Senão, adiciona o material na próxima linha vazia
                return [...prevMateriais, novoMaterial];
              }); 
              
              Swal.close();
            });
          };
          
          render('');
          input.focus();
          input.oninput = (e) => render(e.target.value);        
        }
      });
    } catch (error) {
      console.error('Erro ao importar plano:', error);
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Falha ao buscar planos.', showConfirmButton: false, timer: 3000, customClass: { popup: 'mensagem-erro' } });
    } finally {
      setIsLoading(false);
    }
  };


  const handleSalvar = async () => {
    setIsLoading(true);
    try {
      const payload = montarPayload();
      const validacao = projetoSchema.safeParse(payload);
      if (!validacao.success) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: validacao.error.issues[0].message, showConfirmButton: false, timer: 3000, customClass: { popup: 'mensagem-erro' } });
        setIsLoading(false); return;
      }
      
      const { data } = await api.post('/custos', validacao.data);
      setIdProjetoSalvo(data.id);
      
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Projeto salvo com sucesso!', showConfirmButton: false, timer: 2500, customClass: { popup: 'mensagem-confirmacao' } });
      limparFormulario();
    } catch (e) { 
      console.error('Falha ao salvar dados', e); 
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Falha ao salvar o projeto.', showConfirmButton: false, timer: 3000, customClass: { popup: 'mensagem-erro' } }); 
      limparFormulario();  
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleEditar = async () => {
    setIsLoading(true);
    try {
      const payload = montarPayload();
      const validacao = projetoSchema.safeParse(payload);
      if (!validacao.success) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: validacao.error.issues[0].message, showConfirmButton: false, timer: 3000, customClass: { popup: 'mensagem-erro' } });
        setIsLoading(false); return;
      }
      
      await api.put(`/custos/${idProjetoSalvo}`, validacao.data);
      
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Atualizado com sucesso!', showConfirmButton: false, timer: 3000, customClass: { popup: 'mensagem-confirmacao' } });
    } catch (e) { 
      console.error('Falha ao atualizar', e); 
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Falha ao atualizar.', showConfirmButton: false, timer: 3000, customClass: { popup: 'mensagem-erro' } }); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleExcluir = async () => {
    if (!idProjetoSalvo) return;
    
    const result = await Swal.fire({
      title: 'Excluir registro?',
      text: "Deseja remover este projeto?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c', 
      cancelButtonColor: '#27ae60',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        await api.delete(`/custos/${idProjetoSalvo}`);
        limparFormulario();
        
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registro excluído com sucesso!', showConfirmButton: false, timer: 2500, customClass: { popup: 'mensagem-confirmacao' } });
      } catch (error) {
        console.error("Erro ao excluir:", error);
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Erro ao excluir o registro.', showConfirmButton: false, timer: 3000, customClass: { popup: 'mensagem-erro' } });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <PageTransition className="financeiro-container">
      <div className="header-actions">
        <BotaoVoltar />
        <button className="btn-novo-topo" onClick={limparFormulario} title="Iniciar novo projeto">
          <FilePlus size={18} strokeWidth={2} />
          <span>Novo</span>
        </button>
      </div>
      
      <div className="logo-wrapper"><img src="/logo.svg" alt="Logo" className="logo" /></div>
      <h1 className="nomefantasia">GR Marcenaria</h1>
      <h1 className="title-center">Custo do Material</h1>

      <div className="form-group highlight">
        <label>Nome do Projeto</label>
        <div className='cotainer-nomeProjeto'>
        <input type="text" className='nomeProjeto' value={nomeProjeto} onChange={e => setNomeProjeto(e.target.value)} disabled={isLoading} placeholder="Ex: Cozinha Completa" />
      <button type="button" onClick={handleBuscarPlanoDeCorte} className="btn-icone-lupa">
  <Search size={18} />
</button>
</div>
      </div>

      <h3 className="section-title">Itens da Ficha Técnica</h3>
      <div className="tabela-materiais">
        <div className="tabela-header">
          <span className="col-mat">Material</span>
          <span className="col-qtd">Qtd</span>
          <span className="col-un">Un</span>
          <span className="col-val">Valor Un.</span>
          <span className="col-sub">Subtotal</span>
          <span className="col-del"></span>
        </div>
        
        {materiais.map((item, index) => (
          <div key={item.id} className="tabela-row">
            <input className="col-mat" type="text" value={item.material} onChange={e => atualizarItem(item.id, 'material', e.target.value)} placeholder="MDF Branco 15mm" />
            <input className="col-qtd" type="number" value={item.quantidade} onChange={e => atualizarItem(item.id, 'quantidade', e.target.value)} />
            <input className="col-un" type="text" value={item.unidade_medida} onChange={e => atualizarItem(item.id, 'unidade_medida', e.target.value)} placeholder="chapa" />
            <input 
              className="col-val" 
              type="text" 
              value={formatInputBR(item.valor_unitario)} 
              onChange={e => {
                const val = Number(e.target.value.replace(/\D/g, '')) / 100;
                atualizarItem(item.id, 'valor_unitario', val);
              }}
              onKeyDown={(e) => handleKeyDownTab(e, index)}
            />
            <span className="col-sub">{formatMoney((Number(item.quantidade) || 0) * item.valor_unitario)}</span>
            <button className="btn-del-row" onClick={() => removerLinha(item.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <button className="btn-add-row" onClick={adicionarLinha}><CirclePlus size={16} strokeWidth={2} /> Adicionar Material</button>

      <div className="form-row" style={{ marginTop: '20px' }}>
        <div className="form-group flex-1">
          <label>Mão de Obra</label>
          <input type="text" value={formatInputBR(maoDeObra)} onChange={e => setMaoDeObra(Number(e.target.value.replace(/\D/g, '')) / 100)} />
        </div>
        <div className="form-group flex-1">
          <label>Instalação</label>
          <input type="text" value={formatInputBR(instalacao)} onChange={e => setInstalacao(Number(e.target.value.replace(/\D/g, '')) / 100)} />
        </div>
      </div>

      <div className="total-box">
        <span>Custo Total do Projeto:</span>
        <strong>{formatMoney(custoTotal)}</strong>
      </div>

      <div className='btn-container-custo'>
        <div className='btn-wrapper-custo'>
          <div className='btn-wrapper-flex-custo'>
          <button className="btn-salvar-custo" onClick={handleSalvar} disabled={isLoading || idProjetoSalvo !== null}><Save size={18} strokeWidth={2}/><span>Salvar</span></button>
          <button className="btn-editar-custo" onClick={handleEditar} disabled={isLoading || idProjetoSalvo === null}><FileEditIcon size={18} strokeWidth={2}/><span>Editar</span></button>
          </div>
          <div  className='btn-wrapper-flex-custo'>
          <button className="btn-buscar-custo" onClick={handleBuscar} ><Search size={18} strokeWidth={2}/><span>Buscar</span></button>
          <button className="btn-excluir-custo" onClick={handleExcluir} ><CircleMinus size={18} strokeWidth={2}/><span>Excluir</span></button>
            </div>
        </div>
      </div>
    </PageTransition>
  );
}