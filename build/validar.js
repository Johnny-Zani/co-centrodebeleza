// Valida o conteudo.json. Puro: recebe o objeto e um verificador de
// existência de arquivo, devolve lista de erros legíveis.
export function validar(conteudo, arquivoExiste) {
  const erros = [];
  const idsVistos = new Set();

  const itens = [
    ...conteudo.profissionais.map(p => ['profissional', p]),
    ...conteudo.categorias.flatMap(c => c.servicos.map(s => ['serviço', s])),
    ...conteudo.tratamentos.map(t => ['tratamento', t]),
    ...conteudo.noiva.map(n => ['pacote de noiva', n])
  ];

  for (const [tipo, item] of itens) {
    if (!item.id) {
      erros.push(`${tipo} "${item.nome ?? '(sem nome)'}" está sem id`);
      continue;
    }
    if (idsVistos.has(item.id)) {
      erros.push(`id "${item.id}" está repetido (${tipo})`);
    }
    idsVistos.add(item.id);

    if (tipo !== 'profissional') {
      if (typeof item.preco !== 'number' || Number.isNaN(item.preco)) {
        erros.push(`${tipo} "${item.id}": preço precisa ser número, veio ${JSON.stringify(item.preco)}`);
      } else if (item.preco <= 0) {
        erros.push(`${tipo} "${item.id}": preço precisa ser maior que zero`);
      }
    }

    if (item.foto !== null && item.foto !== undefined) {
      if (!arquivoExiste(item.foto)) {
        erros.push(`${tipo} "${item.id}": foto "${item.foto}" não existe no disco`);
      }
    }
  }

  const zap = conteudo.salao.whatsapp ?? '';
  if (zap !== '' && !/^\d+$/.test(zap)) {
    erros.push(`salao.whatsapp precisa conter só dígitos (ex.: 5511999999999), veio "${zap}"`);
  }

  return erros;
}
