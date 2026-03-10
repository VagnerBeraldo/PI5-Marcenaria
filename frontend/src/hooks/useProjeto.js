import { useContext } from 'react';
import { ProjetoContext } from '../context/ProjetoContext';

export const useProjeto = () => {
  const context = useContext(ProjetoContext);
  
  if (!context) {
    throw new Error("useProjeto deve ser usado dentro de um ProjetoProvider");
  }
  
  return context;
};