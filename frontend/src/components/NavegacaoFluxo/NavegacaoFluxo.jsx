import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./NavegacaoFluxo.css";

const NavegacaoFluxo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Definição do Array de Fluxo Linear
  const fluxo = [
    { path: "/despesas", label: "Despesas" },
    { path: "/clientes", label: "Clientes" },
    { path: "/plano-de-corte", label: "Plano de Corte" },
    { path: "/custo-do-material", label: "Custo do Material" },
    { path: "/orcamentos", label: "Orçamento" },
  ];

  const indexAtual = fluxo.findIndex((item) => item.path === location.pathname);

  // Se a página atual não fizer parte do fluxo sequencial, não renderiza o componente
  if (indexAtual === -1) return null;

  const anterior = fluxo[indexAtual - 1];
  const proximo = fluxo[indexAtual + 1];

  return (
    <div className="navegacao-fluxo-container">
      <div className="fluxo-content">
        {anterior && (
          <button 
            className="btn-fluxo btn-fluxo-voltar" 
            onClick={() => navigate(anterior.path)}
          >
            <ChevronLeft size={20} />
            <span>{anterior.label}</span>
          </button>
        )}
        
        {proximo && (
          <button 
            className="btn-fluxo btn-fluxo-avancar" 
            onClick={() => navigate(proximo.path)}
          >
            <span>{proximo.label}</span>
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NavegacaoFluxo;