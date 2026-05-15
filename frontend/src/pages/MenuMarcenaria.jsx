import React from "react";
import { useNavigate, Link } from "react-router-dom";
import PageTransition from "../components/Animation/PageTransition";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  ClipboardList,
  CircleDollarSignIcon,
  Info,
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
          <span>1. Despesas</span>
        </div>

        <div
          className="grid-item item-topo-centro"
          onClick={() => navigate("/ponto-de-equilibrio")}
        >
          <ThumbsUp size={24} />
          <span>2. Ponto de Equilíbrio</span>
        </div>

        <div
          className="grid-item item-col-direita"
          onClick={() => navigate("/clientes")}
        >
          <Users size={24} />
          <span>3. Clientes</span>
        </div>

        <div
          className="grid-item item-base-total"
          onClick={() => navigate("/plano-de-corte")}
        >
          <LayoutDashboard size={24} />
          <span>4. Plano de Corte</span>
        </div>

        <div
          className="grid-item item-abaixo-1"
          onClick={() => navigate("/custo-do-material")}
        >
          <CircleDollarSignIcon size={24} />
          <span>5. Custo do Material</span>
        </div>

        <div
          className="grid-item item-centro-baixo"
          onClick={() => navigate("/orcamentos")}
        >
          <ClipboardList size={24} />
          <span>6. Orçamento</span>
        </div>
      </div>
      <div className="containerPolitica">
        <Link to="/politica" className="linkPolitica">
          <Info size={14} className="iconPolitica" />
          <small>Termo de Uso e Política de Privacidade</small>
        </Link>
      </div>
    </PageTransition>
  );
};

export default MenuMarcenaria;
