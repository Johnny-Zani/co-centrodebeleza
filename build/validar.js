// Valida o conteudo.json. Puro: recebe o objeto e um verificador de
// existência de arquivo, devolve lista de erros legíveis.
export function validar(conteudo, arquivoExiste) {
  // Guarda de forma: sem isso, um conteudo.json com "salao" ausente ou
  // "categorias"/"tratamentos"/etc. no formato errado faz o .map()/
  // .flatMap() logo abaixo lançar um TypeError puro — o build ainda sai
  // com código de saída != 0 (a propriedade de segurança se mantém), mas
  // quem está olhando vê um stack trace em vez de uma mensagem legível
  // como as outras deste arquivo.
  const errosDeForma = [];
  if (!conteudo || typeof conteudo !== 'object') {
    return ['conteudo.json precisa ser um objeto'];
  }
  if (!conteudo.salao || typeof conteudo.salao !== 'object') {
    errosDeForma.push('conteudo.json.salao precisa ser um objeto');
  }
  if (conteudo.historia !== undefined) {
    if (!conteudo.historia || typeof conteudo.historia !== 'object') {
      errosDeForma.push('conteudo.json.historia precisa ser um objeto');
    } else {
      if (!Array.isArray(conteudo.historia.abertura)) {
        errosDeForma.push('conteudo.json.historia.abertura precisa ser uma lista');
      }
      if (!Array.isArray(conteudo.historia.paragrafos)) {
        errosDeForma.push('conteudo.json.historia.paragrafos precisa ser uma lista');
      }
      if (!Array.isArray(conteudo.historia.destaque)) {
        errosDeForma.push('conteudo.json.historia.destaque precisa ser uma lista');
      }
    }
  }
  if (!Array.isArray(conteudo.profissionais)) {
    errosDeForma.push('conteudo.json.profissionais precisa ser uma lista');
  }
  if (!Array.isArray(conteudo.categorias)) {
    errosDeForma.push('conteudo.json.categorias precisa ser uma lista');
  } else {
    conteudo.categorias.forEach((c, i) => {
      if (!c || typeof c !== 'object' || !Array.isArray(c.servicos)) {
        errosDeForma.push(`conteudo.json.categorias[${i}] precisa ter uma lista "servicos"`);
      }
    });
  }
  if (!Array.isArray(conteudo.tratamentos)) {
    errosDeForma.push('conteudo.json.tratamentos precisa ser uma lista');
  }
  if (!Array.isArray(conteudo.noiva)) {
    errosDeForma.push('conteudo.json.noiva precisa ser uma lista');
  }
  if (errosDeForma.length > 0) return errosDeForma;

  const erros = [];
  const idsVistos = new Set();

  if (conteudo.historia) {
    const h = conteudo.historia;
    for (const campo of ['titulo', 'nome', 'foto', 'foto_alt']) {
      if (typeof h[campo] !== 'string' || h[campo].trim() === '') {
        erros.push(`historia.${campo} precisa ser um texto preenchido`);
      }
    }
    for (const campo of ['abertura', 'paragrafos', 'destaque']) {
      if (h[campo].some(texto => typeof texto !== 'string' || texto.trim() === '')) {
        erros.push(`historia.${campo} precisa conter apenas textos preenchidos`);
      }
    }
    if (typeof h.foto === 'string' && h.foto && !arquivoExiste(h.foto)) {
      erros.push(`historia: foto "${h.foto}" não existe no disco`);
    }
  }

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

    // O id vira nome de arquivo (fotos/<id>.jpg) tanto em admin/admin.js
    // quanto em api/salvar.js (regex ^fotos\/[a-z0-9-]+\.jpg$) — mas nada
    // impedia um id fora desse formato entrar aqui. Sem esta checagem, um
    // id como "depilacao_rosto" ou "noiva-Luxo" passa no build e só quebra
    // depois, na hora de salvar a foto, com um erro que a Carol não
    // consegue agir.
    if (!/^[a-z0-9-]+$/.test(item.id)) {
      erros.push(`${tipo} "${item.id}": id só pode ter letras minúsculas, números e hífen`);
    }

    if (tipo !== 'profissional') {
      if (typeof item.preco !== 'number' || Number.isNaN(item.preco)) {
        erros.push(`${tipo} "${item.id}": preço precisa ser número, veio ${JSON.stringify(item.preco)}`);
      } else if (item.preco <= 0) {
        erros.push(`${tipo} "${item.id}": preço precisa ser maior que zero`);
      }
    }

    // Só tratamento tem preco_avulsa (a sessão avulsa do pacote). Sem essa
    // checagem, um valor ausente ou digitado errado publica "a partir de
    // R$ NaN" no site com o build passando.
    if (tipo === 'tratamento') {
      if (typeof item.preco_avulsa !== 'number' || Number.isNaN(item.preco_avulsa)) {
        erros.push(`${tipo} "${item.id}": preço avulso precisa ser número, veio ${JSON.stringify(item.preco_avulsa)}`);
      } else if (item.preco_avulsa <= 0) {
        erros.push(`${tipo} "${item.id}": preço avulso precisa ser maior que zero`);
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
