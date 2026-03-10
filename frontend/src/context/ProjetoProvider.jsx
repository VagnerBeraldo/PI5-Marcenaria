import React, { useState } from 'react';
import { ProjetoContext } from './ProjetoContext';

export function ProjetoProvider({ children }) {
  const [contextoGlobal, setContextoGlobal] = useState({
    cliente: null,
    orcamento: null,
    custo: null,
    planoCorte: null,
    nomeProjetoGlobal: "" 
  });

  const atualizarContexto = (novosDados) => {
    setContextoGlobal((prev) => ({ ...prev, ...novosDados }));
  };

  const limparContexto = () => {
    setContextoGlobal({
      cliente: null,
      orcamento: null,
      custo: null,
      planoCorte: null,
      nomeProjetoGlobal: ""
    });
  };

  return (
    <ProjetoContext.Provider value={{ contextoGlobal, atualizarContexto, limparContexto }}>
      {children}
    </ProjetoContext.Provider>
  );
}