
import React from 'react';
import { LayoutDashboard, CalendarCheck, Users, ClipboardList, CircleDollarSignIcon, ThumbsUp } from 'lucide-react';
import '../styles/MenuMarcenaria.css';
import logoMarcenaria from '/logo.svg';

const MenuMarcenaria = () => {
  return (
    <nav className="menu-container">
      <header className="menu-header">
        <div className="logo-box">
          <img 
            src={logoMarcenaria} 
            alt="Logo GR Marcenaria" 
            className="logo-img" 
          />
        </div>
        <h1 className="nome-fantasia">GR Marcenaria</h1>
      </header>

      <div className="grid-main">
        {/* Retângulo 1: Topo Esquerda (2 linhas) */}
        <div className="grid-item item-topo-esq">
          <CalendarCheck size={24} />
          <span>Despesas</span>
        </div>

        {/* Retângulo 2: Topo Centro (1 linha) */}
        <div className="grid-item item-topo-centro">
          <ThumbsUp size={24} />
          <span>Ponto de Equilíbrio</span>
        </div>

        {/* Retângulo 3: Abaixo do 1 (1 linha) */}
        <div className="grid-item item-abaixo-1">
          <CircleDollarSignIcon size={24} />
          <span>Precificação</span>
        </div>

        {/* Retângulo 4: Centro (2 linhas, abaixo do 2) */}
        <div className="grid-item item-centro-baixo">
          <ClipboardList size={24} />
          <span>Orçamento</span>
        </div>

        {/* Retângulo 5: Direita (3 linhas verticais) */}
        <div className="grid-item item-col-direita">
          <Users size={24} />
          <span>Clientes</span>
        </div>

        {/* Retângulo 6: Base (Ocupa todas as colunas) */}
        <div className="grid-item item-base-total">
          <LayoutDashboard size={24} />
          <span>Plano de Corte</span>
        </div>
      </div>
    </nav>
  );
};

export default MenuMarcenaria;