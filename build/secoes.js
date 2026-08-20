import { formatarPreco, linkWhatsapp, esc } from './render.js';

function botaoAgendar(c, nome) {
  const url = linkWhatsapp(c.salao.whatsapp, nome);
  if (!url) return `<span class="btn-agendar btn-agendar--inativo">Agendar</span>`;
  return `<a class="btn-agendar" href="${esc(url)}" target="_blank" rel="noopener">Agendar</a>`;
}

function moldura(foto, alt) {
  if (!foto) return '';
  return `<div class="moldura"><img src="${esc(foto)}" alt="${esc(alt)}" loading="lazy" width="600" height="800"></div>`;
}

function preco(valor) {
  if (valor === null || valor === undefined) return '';
  const txt = formatarPreco(valor);
  const [prefixo, valorTxt] = [txt.slice(0, 'a partir de'.length), txt.slice('a partir de '.length)];
  return `<div class="preco"><small>${prefixo}</small><strong>${valorTxt}</strong></div>`;
}

export function secaoHistoria(c) {
  if (!c.historia) return '';

  const h = c.historia;
  const abertura = h.abertura.map(p => `<p>${esc(p)}</p>`).join('');
  const paragrafos = h.paragrafos.map(p => `<p>${esc(p)}</p>`).join('');
  const destaque = h.destaque.map(linha => `<span>${esc(linha)}</span>`).join('');

  return `
  <div class="historia-shell">
    <figure class="historia-visual reveal">
      <div class="historia-foto">
        <img src="${esc(h.foto)}" alt="${esc(h.foto_alt)}" loading="lazy" width="640" height="640">
      </div>
      <figcaption>${esc(h.nome)} · Fundadora</figcaption>
    </figure>
    <div class="historia-conteudo reveal">
      <p class="section-eyebrow">Nossa história</p>
      <h2 class="section-title">${esc(h.titulo)}</h2>
      <div class="historia-abertura">${abertura}</div>
      <blockquote class="historia-destaque">${destaque}</blockquote>
      <details class="historia-completa">
        <summary>
          <span class="historia-abrir">Conheça a história completa</span>
          <span class="historia-fechar">Recolher história</span>
        </summary>
        <div class="historia-texto">${paragrafos}</div>
      </details>
      <p class="historia-assinatura">${esc(h.nome)}</p>
    </div>
  </div>`;
}

export function secaoProfissionais(c) {
  const cards = c.profissionais.map(p => `
    <div class="prof-card${p.foto ? ' tem-foto' : ''}">
      ${moldura(p.foto, p.nome)}
      ${p.foto ? '' : `<div class="prof-initial">${esc(p.nome[0])}</div>`}
      <div class="prof-name">${esc(p.nome)}</div>
      <div class="prof-role">${esc(p.funcao)}</div>
    </div>`).join('');

  return `
  <div class="section-header reveal">
    <p class="section-eyebrow">Nossa equipe</p>
    <h2 class="section-title">Especialistas em<br><em>cada detalhe</em></h2>
    <p class="section-desc">Cada profissional tem seu próprio ambiente e atende com dedicação exclusiva à sua transformação.</p>
  </div>
  <div class="prof-grid reveal">${cards}</div>`;
}

export function secaoServicos(c) {
  const blocos = c.categorias.map(cat => {
    const itens = cat.servicos.map(s => `
      <div class="servico-item${s.foto ? ' tem-foto' : ''}">
        ${moldura(s.foto, s.nome)}
        <div class="servico-body">
          <div class="servico-nome">${esc(s.nome)}</div>
          ${s.detalhe ? `<div class="servico-detalhe">${esc(s.detalhe)}</div>` : ''}
          ${preco(s.preco)}
          ${s.preco_nota ? `<div class="preco-nota">${esc(s.preco_nota)}</div>` : ''}
          ${botaoAgendar(c, s.nome)}
        </div>
      </div>`).join('');
    return `<div class="cat-block reveal">
      <p class="cat-label">${esc(cat.nome)}</p>
      ${cat.nota ? `<p class="cat-nota">${esc(cat.nota)}</p>` : ''}
      <div class="servico-grid">${itens}</div>
    </div>`;
  }).join('');

  return `
  <div class="section-header reveal">
    <p class="section-eyebrow">Cardápio de serviços</p>
    <h2 class="section-title">Tudo que você<br><em>merece</em></h2>
  </div>${blocos}`;
}

export function secaoTratamentos(c) {
  const cards = c.tratamentos.map(t => `
    <div class="trat-card reveal${t.foto ? ' tem-foto' : ''}">
      ${moldura(t.foto, t.nome)}
      <div class="trat-inner">
        <span class="trat-tag">${esc(t.tag)}</span>
        <div class="trat-name">${esc(t.nome)}</div>
        <p class="trat-desc">${esc(t.detalhe)}</p>
        <div class="trat-footer">
          ${preco(t.preco)}
          <div class="trat-sessoes">o pacote<br>${esc(t.avulsa_label)}: ${esc(formatarPreco(t.preco_avulsa))}</div>
        </div>
        ${botaoAgendar(c, t.nome)}
      </div>
    </div>`).join('');

  return `
  <div class="section-header reveal">
    <p class="section-eyebrow">Protocolos exclusivos</p>
    <h2 class="section-title">Tratamentos que<br><em>transformam</em></h2>
    <p class="section-desc">Tecnologia de ponta com marcas premium. Cada protocolo é pensado para a saúde e beleza real dos seus fios.</p>
  </div>
  <div class="trat-grid">${cards}</div>`;
}

export function secaoNoiva(c) {
  const cards = c.noiva.map(n => `
    <div class="noiva-card reveal${n.foto ? ' tem-foto' : ''}">
      ${moldura(n.foto, n.nome)}
      <div class="noiva-inner">
        <p class="noiva-pacote">${esc(n.nome)}</p>
        ${preco(n.preco)}
        <ul class="noiva-items">${n.itens.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
        ${botaoAgendar(c, n.nome)}
      </div>
    </div>`).join('');

  return `
  <div class="section-header reveal">
    <p class="section-eyebrow">Dia da Noiva</p>
    <h2 class="section-title">O seu dia<br><em>mais especial</em></h2>
    <p class="section-desc">Três pacotes pensados para que você viva cada momento com leveza, elegância e a beleza que sempre sonhou.</p>
  </div>
  <div class="noiva-grid">${cards}</div>`;
}

export function secaoCta(c) {
  const url = linkWhatsapp(c.salao.whatsapp, 'um horário');
  const botao = url
    ? `<a href="${esc(url)}" class="btn-dark" target="_blank" rel="noopener">Agendar pelo WhatsApp</a>`
    : `<span class="btn-dark btn-agendar--inativo">Agendar pelo WhatsApp</span>`;
  const contato = c.salao.endereco
    ? `<p class="cta-contato">${esc(c.salao.endereco)}<br>${esc(c.salao.horarios)}</p>`
    : '';
  return `
  <h2 class="cta-title">Pronta para a sua<br>transformação?</h2>
  <p class="cta-sub">Agende pelo WhatsApp e garanta seu horário com a especialista ideal para você.</p>
  ${botao}
  ${contato}`;
}
