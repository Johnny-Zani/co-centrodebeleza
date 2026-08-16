// Formata preço para exibição no painel: "a partir de R$ 1.234,56".
//
// Duplicado de build/render.js:formatarPreco de propósito — o painel roda
// no navegador, fora do build Node, e não importa de build/ (bundler
// nenhum aqui, é ESM puro servido direto). Extraído para este módulo (em
// vez de ficar inline em admin.js) só para poder ser comparado, em
// test/preco.test.js, com a saída de formatarPreco e garantir que as duas
// nunca divergem — mesmo padrão de admin/recorte.js.
const MOEDA = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
});

export function precoTexto(v) {
  return `a partir de R$ ${MOEDA.format(v)}`;
}
