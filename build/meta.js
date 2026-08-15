import { esc } from './render.js';

const DESCRICAO = 'Salão de beleza com coloração pessoal, visagismo, tratamentos capilares '
  + 'premium, maquiagem e pacotes para noivas. Agende pelo WhatsApp.';

export function metaTags(conteudo, urlBase) {
  const titulo = 'C.O. Centro de Beleza';
  // og:image usa uma arte dedicada (fundo onyx opaco + logo centralizada) em vez
  // de fotos/logo.png: o logo é um PNG 600×600 transparente pensado para ficar
  // sobre o hero quase-preto do site, não para virar card de preview — composto
  // sobre fundo branco (comportamento padrão de WhatsApp/redes ao renderizar
  // transparência) ele sairia claro e desbotado, além de ser cortado ou
  // baleado pela proporção ~1.91:1 esperada por essas plataformas.
  const imagem = `${urlBase}/fotos/og.png`;

  const dados = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: titulo,
    description: DESCRICAO,
    url: urlBase,
    image: imagem,
    priceRange: '$$',
    sameAs: [`https://instagram.com/${conteudo.salao.instagram}`],
    makesOffer: conteudo.categorias.flatMap(c => c.servicos).map(s => ({
      '@type': 'Offer',
      name: s.nome,
      price: s.preco,
      priceCurrency: 'BRL'
    }))
  };

  if (conteudo.salao.endereco) {
    dados.address = { '@type': 'PostalAddress', streetAddress: conteudo.salao.endereco };
  }
  if (conteudo.salao.horarios) dados.openingHours = conteudo.salao.horarios;
  if (conteudo.salao.whatsapp) dados.telephone = '+' + conteudo.salao.whatsapp;

  return `
<meta name="description" content="${esc(DESCRICAO)}">
<link rel="icon" href="fotos/logo.png" type="image/png">
<link rel="apple-touch-icon" href="fotos/logo.png">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(DESCRICAO)}">
<meta property="og:image" content="${esc(imagem)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(urlBase)}">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(dados, null, 2)}</script>`;
}
