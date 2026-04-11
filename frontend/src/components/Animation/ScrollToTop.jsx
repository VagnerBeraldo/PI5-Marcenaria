import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Tenta resetar o scroll da janela
    window.scrollTo(0, 0);
    
    // Se o seu scroll estiver preso em uma div (ex: app-container), reseta ela também
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}