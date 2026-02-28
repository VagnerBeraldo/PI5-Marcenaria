import React from "react";

export default function Visualizador({ chapa, pecas, largCorte, escala }) {
  // 1. Expandir e ordenar por ALTURA (Peças mais altas primeiro definem melhor o layout)
  const listaParaPosicionar = [];
  pecas.forEach((peca, pIndex) => {
    const qtd = Number(peca.qtd) || 0;
    for (let i = 0; i < qtd; i++) {
      listaParaPosicionar.push({
        ...peca,
        w: peca.rotacionar ? Number(peca.altura) : Number(peca.largura),
        h: peca.rotacionar ? Number(peca.largura) : Number(peca.altura),
        pIndex,
      });
    }
  });

  // Ordenar decrescente por altura para preencher colunas
  listaParaPosicionar.sort((a, b) => b.h - a.h || b.w - a.w);

  const pecasPosicionadas = [];
  // Começa com a chapa inteira como um espaço livre
  let espaçosLivres = [{ x: 0, y: 0, w: chapa.largura, h: chapa.altura }];
  let areaUtilizada = 0;

  listaParaPosicionar.forEach((peca, index) => {
    let melhorEspaçoIdx = -1;

    // Procura o primeiro espaço onde a peça cabe
    for (let i = 0; i < espaçosLivres.length; i++) {
      const esp = espaçosLivres[i];
      if (peca.w <= esp.w && peca.h <= esp.h) {
        melhorEspaçoIdx = i;
        break;
      }
    }

    if (melhorEspaçoIdx !== -1) {
      const esp = espaçosLivres[melhorEspaçoIdx];

      // Posiciona a peça
      pecasPosicionadas.push({
        id: `${peca.pIndex}-${index}`,
        largura: peca.w,
        altura: peca.h,
        top: esp.y,
        left: esp.x,
        nome: peca.nome,
        erro: false,
      });

      areaUtilizada += peca.w * peca.h;

      // Dividi o retângulo restante de forma a manter tiras verticais longas
      const sobraDireita = {
        x: esp.x + peca.w + largCorte,
        y: esp.y,
        w: esp.w - peca.w - largCorte,
        h: esp.h, // MANTÉM A ALTURA TOTAL DO ESPAÇO ORIGINAL
      };

      const sobraBaixo = {
        x: esp.x,
        y: esp.y + peca.h + largCorte,
        w: peca.w, // LIMITA À LARGURA DA PEÇA
        h: esp.h - peca.h - largCorte,
      };

      // Remove o espaço antigo e adiciona os novos
      espaçosLivres.splice(melhorEspaçoIdx, 1);
      if (sobraDireita.w > 0 && sobraDireita.h > 0)
        espaçosLivres.push(sobraDireita);
      if (sobraBaixo.w > 0 && sobraBaixo.h > 0) espaçosLivres.push(sobraBaixo);

      // Re-ordena para priorizar espaços que preencham a largura primeiro
      espaçosLivres.sort((a, b) => a.x - b.x || a.y - b.y);
    } else {
      // Se não couber, marca erro
      pecasPosicionadas.push({
        ...peca,
        largura: peca.w,
        altura: peca.h,
        erro: true,
      });
    }
  });

  const areaTotalChapa = chapa.largura * chapa.altura;
  const aproveitamento =
    areaTotalChapa > 0
      ? ((areaUtilizada / areaTotalChapa) * 100).toFixed(1)
      : 0;

  return (
    <div className="wrapper-visualizador-impressao">
      {/* 1. Estatísticas no topo */}
      <div className="grade-estatisticas">
        <div className="card-estatistica">
          <span>Aproveitamento</span>
          <p className="valor-cor-primaria cor-azul">{aproveitamento}%</p>
        </div>
        <div className="card-estatistica">
          <span>Área da Chapa</span>
          <p className="valor-cor-primaria">
            {(areaTotalChapa / 1000000).toFixed(2)}m²
          </p>
        </div>
        <div className="card-estatistica">
          <span>Sobras</span>
          <p className="valor-cor-primaria cor-laranja">
            {(100 - aproveitamento).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* 2. Container do Visualizador */}
      <div className="container-visualizador">
        {pecasPosicionadas.some((p) => p.erro) && (
          <div className="alerta-erro">
            ⚠️ Algumas peças não couberam na chapa!
          </div>
        )}

        <div
          className="chapa-madeira"
          style={{
            width: `${chapa.largura * escala}px`,
            height: `${chapa.altura * escala}px`,
          }}
        >
          {pecasPosicionadas.map((p) => {
            if (p.erro) return null;
            return (
              <div
                key={p.id}
                className="peca-no-plano"
                style={{
                  width: `${p.largura * escala}px`,
                  height: `${p.altura * escala}px`,
                  top: `${p.top * escala}px`,
                  left: `${p.left * escala}px`,
                  position: "absolute",
                  backgroundColor: "rgba(139, 69, 19, 0.7)",
                  border: "1px solid #8B4513",
                }}
              >
                <span className="info-medida">
                  {p.largura} x {p.altura}
                </span>
                {p.nome && <span className="info-nome">{p.nome}</span>}
              </div>
            );
          })}

          {espaçosLivres.map(
            (espaco, index) =>
              espaco.w > 50 &&
              espaco.h > 50 && (
                <div
                  key={`sobra-${index}`}
                  className="sobra-disponivel"
                  style={{
                    width: `${espaco.w * escala}px`,
                    height: `${espaco.h * escala}px`,
                    top: `${espaco.y * escala}px`,
                    left: `${espaco.x * escala}px`,
                    position: "absolute",
                    border: "1px dashed rgba(0, 0, 0, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "rgba(0,0,0,0.6)",
                      fontWeight: "bold",
                    }}
                  >
                    {Math.round(espaco.w)} x {Math.round(espaco.h)}
                  </span>
                </div>
              ),
          )}
        </div>
      </div>

      {/* 3. Seção da Tabela */}
      <div className="secao-lista-corte">
        <h3>Lista de Corte Por Peça</h3>
        <div className="tabela-scroll-wrapper">
          <table className="tabela-corte">
            <thead>
              <tr>
                <th>Item</th>
                <th>Nome da Peça</th>
                <th>Medidas (mm)</th>
                <th>Qtd</th>
                <th>Área Total (m²)</th>
              </tr>
            </thead>
            <tbody>
              {pecas.map((peca, index) => {
                const largura = Number(peca.largura) || 0;
                const altura = Number(peca.altura) || 0;
                const qtd = Number(peca.qtd) || 0;
                const areaTotal = ((largura * altura * qtd) / 1000000).toFixed(
                  3,
                );

                return (
                  largura > 0 &&
                  altura > 0 && (
                    <tr key={peca.id}>
                      <td>{index + 1}</td>
                      <td>{peca.nome || "Sem nome"}</td>
                      <td>
                        <strong>
                          {largura} x {altura}
                        </strong>
                      </td>
                      <td>{qtd}</td>
                      <td>{areaTotal} m²</td>
                    </tr>
                  )
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
