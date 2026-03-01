import React from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../components/Animation/PageTransition";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  ClipboardList,
  CircleDollarSignIcon,
  ThumbsUp,
} from "lucide-react";
import "../styles/MenuMarcenaria.css";
import logoMarcenaria from "/logo.svg";

const MenuMarcenaria = () => {
  const navigate = useNavigate();

  return (
    <PageTransition className="menu-container">
      <header className="menu-header">
        <div>
          <img
            src={logoMarcenaria}
            alt="Logo GR Marcenaria"
            className="logo-img"
          />
        </div>
        <h1 className="nome-fantasia">GR Marcenaria</h1>
      </header>

      <div className="grid-main">
        <div
          className="grid-item item-topo-esq"
          onClick={() => navigate("/despesas")}
        >
          <CalendarCheck size={24} />
          <span>Despesas</span>
        </div>

        <div className="grid-item item-topo-centro">
          <ThumbsUp size={24} />
          <span>Ponto de Equilíbrio</span>
        </div>

        <div className="grid-item item-abaixo-1">
          <CircleDollarSignIcon size={24} />
          <span>Precificação</span>
        </div>

        <div className="grid-item item-centro-baixo">
          <ClipboardList size={24} />
          <span>Orçamento</span>
        </div>

        <div className="grid-item item-col-direita">
          <Users size={24} />
          <span>Clientes</span>
        </div>

        <div
          className="grid-item item-base-total"
          onClick={() => navigate("/plano-de-corte")}
        >
          <LayoutDashboard size={24} />
          <span>Plano de Corte</span>
        </div>
      </div>
    </PageTransition>
  );
};

export default MenuMarcenaria;
