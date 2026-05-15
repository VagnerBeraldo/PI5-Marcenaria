import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ProjetoProvider } from './context/ProjetoProvider';
import ScrollToTop from './components/Animation/ScrollToTop';
import PlanoDeCorte from './pages/PlanoDeCorte';
import MenuMarcenaria from './pages/MenuMarcenaria';
import Despesas from './pages/Despesas';
import PontoDeEquilibrio from './pages/PontoDeEquilibrio';
import CustoDoMaterial from './pages/CustoDoMaterial';
import Orcamento from './pages/Orcamento';
import Cliente from './pages/Cliente';
import Politica from './pages/Politica';
import './App.css'; 

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MenuMarcenaria />} />
        <Route path="/plano-de-corte" element={<PlanoDeCorte />} />
        <Route path="/despesas" element={<Despesas />} />
        <Route path="/ponto-de-equilibrio" element={<PontoDeEquilibrio/>} />
        <Route path="/custo-do-material" element={<CustoDoMaterial/>} />
        <Route path="/orcamentos" element={<Orcamento/>} />
        <Route path="/clientes" element={<Cliente/>} />
        <Route path="/politica" element={<Politica/>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ProjetoProvider> 
      <Router>
        <ScrollToTop />
        <div className="app-container">
          <AnimatedRoutes />
        </div>
      </Router>
    </ProjetoProvider>
  );
}

export default App;