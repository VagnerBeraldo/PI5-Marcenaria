import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Tenta resetar o scroll da janela
    window.scrollTo(0, 0);
    
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}