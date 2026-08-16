const estado = {
  senha: null,
  conteudo: null,
  alteracoes: new Map()   // id → { preco?, foto? }
};

const $ = s => document.querySelector(s);

// Escapa valores antes de interpolar em atributos value="..." — sem isso,
// um endereço com aspas (ex.: Sala "202") fecharia o atributo cedo e
// corromperia o resto do formulário de edição do salão.
function escAttr(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;');
}

const MOEDA = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
});
const precoTexto = v => `a partir de R$ ${MOEDA.format(v)}`;

// Reúne todos os itens editáveis numa lista plana, preservando o grupo
// a que pertencem — é assim que a tela de lista é montada.
function itensPorGrupo(c) {
  return [
    ...c.categorias.map(cat => ({ grupo: cat.nome, itens: cat.servicos, tipo: 'servico' })),
    { grupo: 'Tratamentos', itens: c.tratamentos, tipo: 'tratamento' },
    { grupo: 'Dia da Noiva', itens: c.noiva, tipo: 'noiva' },
    { grupo: 'Profissionais', itens: c.profissionais, tipo: 'profissional' }
  ];
}

function fotoAtual(item) {
  const alt = estado.alteracoes.get(item.id);
  if (alt?.foto) return alt.foto.dataUrl;
  return item.foto ? '/' + item.foto : null;
}

function precoAtual(item) {
  const alt = estado.alteracoes.get(item.id);
  return alt?.preco ?? item.preco;
}

// Grupo "Dados do salão": whatsapp, endereço e horário não têm a forma de
// item de catálogo (id/preco/foto), então entram sob a chave reservada
// "__salao" no mesmo mapa de alterações, e são desenhados à parte —
// não fazem parte de itensPorGrupo nem contam no resumo de fotos.
function desenharSalao(alvo) {
  const alt = estado.alteracoes.get('__salao') ?? {};
  const zap = alt.whatsapp ?? estado.conteudo.salao.whatsapp;

  const bloco = document.createElement('div');
  bloco.className = 'grupo';
  bloco.innerHTML = '<h2>Dados do salão</h2>';

  const linha = document.createElement('div');
  linha.className = 'linha'
    + (zap ? '' : ' sem-foto')
    + (estado.alteracoes.has('__salao') ? ' alterada' : '');
  linha.innerHTML = `
    <div class="vazio">salão</div>
    <div class="info">
      <div class="nome">WhatsApp, endereço e horário</div>
      <div class="preco">${zap ? 'WhatsApp configurado' : 'WhatsApp ainda não configurado'}</div>
    </div>`;
  linha.addEventListener('click', abrirEdicaoSalao);
  bloco.appendChild(linha);
  alvo.appendChild(bloco);
}

function abrirEdicaoSalao() {
  const tela = $('#tela-edicao');
  $('#tela-lista').hidden = true;
  tela.hidden = false;

  const alt = estado.alteracoes.get('__salao') ?? {};
  const s = estado.conteudo.salao;

  tela.innerHTML = `
    <button class="voltar">← Voltar</button>
    <h1>Dados do salão</h1>
    <p class="ajuda">Aparecem no rodapé e nos botões de agendar.</p>
    <div class="campo">
      <label for="zap">WhatsApp (só números, com 55 e DDD)</label>
      <input type="text" id="zap" inputmode="numeric" value="${escAttr(alt.whatsapp ?? s.whatsapp)}">
    </div>
    <div class="campo">
      <label for="end">Endereço</label>
      <input type="text" id="end" value="${escAttr(alt.endereco ?? s.endereco)}">
    </div>
    <div class="campo">
      <label for="hor">Horário de funcionamento</label>
      <input type="text" id="hor" value="${escAttr(alt.horarios ?? s.horarios)}">
    </div>
    <button id="btn-ok">Guardar alteração</button>
    <p class="erro" id="erro-edicao" hidden></p>`;

  tela.querySelector('.voltar').addEventListener('click', () => {
    tela.hidden = true;
    $('#tela-lista').hidden = false;
    desenharLista();
  });

  $('#btn-ok').addEventListener('click', () => {
    const zap = $('#zap').value.trim();
    if (zap !== '' && !/^\d+$/.test(zap)) {
      $('#erro-edicao').textContent = 'O WhatsApp deve ter só números. Ex.: 5511999999999';
      $('#erro-edicao').hidden = false;
      return;
    }
    estado.alteracoes.set('__salao', {
      whatsapp: zap,
      endereco: $('#end').value.trim(),
      horarios: $('#hor').value.trim()
    });
    tela.hidden = true;
    $('#tela-lista').hidden = false;
    desenharLista();
  });
}

function desenharLista() {
  const alvo = $('#listas');
  alvo.innerHTML = '';
  desenharSalao(alvo);

  for (const { grupo, itens, tipo } of itensPorGrupo(estado.conteudo)) {
    const bloco = document.createElement('div');
    bloco.className = 'grupo';
    bloco.innerHTML = `<h2>${grupo}</h2>`;

    for (const item of itens) {
      const foto = fotoAtual(item);
      const linha = document.createElement('div');
      linha.className = 'linha'
        + (foto ? '' : ' sem-foto')
        + (estado.alteracoes.has(item.id) ? ' alterada' : '');
      linha.innerHTML = `
        ${foto
          ? `<img src="${foto}" alt="">`
          : `<div class="vazio">sem foto</div>`}
        <div class="info">
          <div class="nome">${item.nome}</div>
          <div class="preco">${tipo === 'profissional' ? item.funcao : precoTexto(precoAtual(item))}</div>
        </div>`;
      linha.addEventListener('click', () => abrirEdicao(item, tipo));
      bloco.appendChild(linha);
    }
    alvo.appendChild(bloco);
  }

  const semFoto = itensPorGrupo(estado.conteudo)
    .flatMap(g => g.itens).filter(i => !fotoAtual(i)).length;
  $('#resumo').textContent = semFoto === 0
    ? 'Todos os itens têm foto.'
    : `${semFoto} ${semFoto === 1 ? 'item ainda está' : 'itens ainda estão'} sem foto.`;

  $('#btn-publicar').disabled = estado.alteracoes.size === 0;
}

async function entrar() {
  const senha = $('#senha').value;
  if (!senha) return;
  estado.senha = senha;
  estado.conteudo = await (await fetch('/conteudo.json?' + Date.now())).json();
  $('#tela-login').hidden = true;
  $('#tela-lista').hidden = false;
  desenharLista();
}

$('#btn-entrar').addEventListener('click', entrar);
$('#senha').addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });
