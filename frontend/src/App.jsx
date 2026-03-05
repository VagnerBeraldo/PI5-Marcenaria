import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PlanoDeCorte from './pages/PlanoDeCorte';
import MenuMarcenaria from './pages/MenuMarcenaria';
import Despesas from './pages/Despesas';
import PontoDeEquilibrio from './pages/PontoDeEquilibrio';
import './App.css'; 
import CustoDoMaterial from './pages/CustoDoMaterial';

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
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;