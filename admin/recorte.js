// Calcula como desenhar uma imagem de imgW x imgH cobrindo uma moldura de
// larguraAlvo x alturaAlvo, deslocada verticalmente por posY (0 = topo,
// 100 = base). Sempre cobre: nunca sobra faixa vazia.
export function calcularRecorte(imgW, imgH, larguraAlvo, alturaAlvo, posY) {
  const escala = Math.max(larguraAlvo / imgW, alturaAlvo / imgH);
  const w = imgW * escala;
  const h = imgH * escala;
  return {
    x: (larguraAlvo - w) / 2,
    // "|| 0" normaliza -0 para 0: com posY=0 e (alturaAlvo - h) negativo,
    // negativo × zero produz -0, que passa em == mas falha em
    // assert.strictEqual (usa Object.is, onde -0 !== 0).
    y: ((alturaAlvo - h) * (posY / 100)) || 0,
    w,
    h
  };
}
