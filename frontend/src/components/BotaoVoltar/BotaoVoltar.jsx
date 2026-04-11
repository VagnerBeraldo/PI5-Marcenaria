import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import "./BotaoVoltar.css"; 

export default function BotaoVoltar() {
  const navigate = useNavigate();

  return (
    <button
      className="btn-voltar"
      onClick={() => navigate("/")}
    >
      <ChevronLeft size={20} />
    </button>
  );
}