// Aplica todas as alterações pendentes (id → { preco?, preco_avulsa?, foto?
// }) por cima de uma cópia de conteudo.json, produzindo o JSON final que vai
// para o commit.
//
// Extraído de admin.js (em vez de ficar como closure sobre "estado") para
// ficar puro e testável sem DOM/browser — mesmo padrão de
// admin/recorte.js. test/alteracoes.test.js garante que o formato que essa
// função produz é exatamente o que build/validar.js:validar() aceita, o
// que nenhum teste checava antes: é o único ponto onde o modelo de dados do
// painel e o modelo de dados do build são comparados um contra o outro.
export function aplicarAlteracoes(conteudo, alteracoes) {
  const copia = structuredClone(conteudo);

  const salao = alteracoes.get('__salao');
  if (salao) Object.assign(copia.salao, salao);

  const todos = [
    ...copia.categorias.flatMap(c => c.servicos),
    ...copia.tratamentos, ...copia.noiva, ...copia.profissionais
  ];
  for (const item of todos) {
    const alt = alteracoes.get(item.id);
    if (!alt) continue;
    if (alt.preco !== undefined) item.preco = alt.preco;
    if (alt.preco_avulsa !== undefined) item.preco_avulsa = alt.preco_avulsa;
    if (alt.foto) item.foto = alt.foto.caminho;
  }
  return copia;
}
