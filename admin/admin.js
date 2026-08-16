import { calcularRecorte } from './recorte.js';

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
          ? `<img src="${escAttr(foto)}" alt="">`
          : `<div class="vazio">sem foto</div>`}
        <div class="info">
          <div class="nome">${escAttr(item.nome)}</div>
          <div class="preco">${tipo === 'profissional' ? escAttr(item.funcao) : precoTexto(precoAtual(item))}</div>
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

const LARGURA = 600, ALTURA = 800;

// Desenha a imagem num canvas 600x800 usando o mesmo recorte que a
// pessoa viu na tela: cobre a moldura e desloca verticalmente por posY.
function comprimir(file, posY) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = LARGURA;
      canvas.height = ALTURA;
      const ctx = canvas.getContext('2d');

      const { x, y, w, h } = calcularRecorte(img.width, img.height, LARGURA, ALTURA, posY);
      ctx.drawImage(img, x, y, w, h);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      URL.revokeObjectURL(img.src);
      resolve({ dataUrl, base64: dataUrl.split(',')[1] });
    };
    img.onerror = () => reject(new Error('Não consegui ler essa imagem.'));
    img.src = URL.createObjectURL(file);
  });
}

function abrirEdicao(item, tipo) {
  const tela = $('#tela-edicao');
  $('#tela-lista').hidden = true;
  tela.hidden = false;

  const foto = fotoAtual(item);
  let posY = 50;
  let arquivoEscolhido = null;

  tela.innerHTML = `
    <button class="voltar">← Voltar</button>
    <h1>${escAttr(item.nome)}</h1>
    <p class="ajuda">${tipo === 'profissional' ? escAttr(item.funcao) : 'Foto e preço'}</p>
    <div class="recorte" id="recorte">
      ${foto ? `<img src="${escAttr(foto)}" alt="">` : ''}
    </div>
    <p class="dica">${foto ? 'Arraste a foto para enquadrar' : 'Escolha uma foto abaixo'}</p>
    <input class="arquivo" type="file" accept="image/*" id="arquivo">
    ${tipo === 'profissional' ? '' : `
    <div class="campo">
      <label for="preco">Preço (só o número, sem R$)</label>
      <input type="number" id="preco" min="1" step="1" value="${precoAtual(item)}">
    </div>`}
    <button id="btn-ok">Guardar alteração</button>
    <p class="erro" id="erro-edicao" hidden></p>`;

  const recorte = $('#recorte');

  function aplicarPos() {
    const img = recorte.querySelector('img');
    if (img) img.style.objectPosition = `center ${posY}%`;
  }

  let arrastando = false, inicioY = 0, posInicial = 50;
  recorte.addEventListener('pointerdown', e => {
    if (!recorte.querySelector('img')) return;
    arrastando = true; inicioY = e.clientY; posInicial = posY;
    recorte.setPointerCapture(e.pointerId);
  });
  recorte.addEventListener('pointermove', e => {
    if (!arrastando) return;
    const delta = (e.clientY - inicioY) / recorte.offsetHeight * 100;
    posY = Math.min(100, Math.max(0, posInicial - delta));
    aplicarPos();
  });
  recorte.addEventListener('pointerup', () => { arrastando = false; });

  $('#arquivo').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      $('#erro-edicao').textContent = 'Isso não é uma imagem. Escolha uma foto.';
      $('#erro-edicao').hidden = false;
      e.target.value = '';
      return;
    }
    $('#erro-edicao').hidden = true;
    arquivoEscolhido = f;
    posY = 50;
    recorte.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="">`;
    document.querySelector('.dica').textContent = 'Arraste a foto para enquadrar';
    aplicarPos();
  });

  tela.querySelector('.voltar').addEventListener('click', () => {
    tela.hidden = true;
    $('#tela-lista').hidden = false;
    desenharLista();
  });

  $('#btn-ok').addEventListener('click', async () => {
    const alt = estado.alteracoes.get(item.id) ?? {};

    if (arquivoEscolhido) {
      try {
        const { dataUrl, base64 } = await comprimir(arquivoEscolhido, posY);
        alt.foto = { dataUrl, base64, caminho: `fotos/${item.id}.jpg` };
      } catch (e) {
        $('#erro-edicao').textContent = e.message;
        $('#erro-edicao').hidden = false;
        return;
      }
    }

    const campoPreco = $('#preco');
    if (campoPreco) {
      const v = Number(campoPreco.value);
      if (!Number.isFinite(v) || v <= 0) {
        $('#erro-edicao').textContent = 'O preço precisa ser um número maior que zero.';
        $('#erro-edicao').hidden = false;
        return;
      }
      if (v !== item.preco) alt.preco = v;
    }

    if (Object.keys(alt).length > 0) estado.alteracoes.set(item.id, alt);
    tela.hidden = true;
    $('#tela-lista').hidden = false;
    desenharLista();
  });

  aplicarPos();
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
