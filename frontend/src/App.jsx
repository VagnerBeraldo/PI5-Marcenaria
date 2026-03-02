import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PlanoDeCorte from './pages/PlanoDeCorte';
import MenuMarcenaria from './pages/MenuMarcenaria';
import Despesas from './pages/Despesas';
import './App.css'; 

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MenuMarcenaria />} />
        <Route path="/plano-de-corte" element={<PlanoDeCorte />} />
        <Route path="/despesas" element={<Despesas />} />
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