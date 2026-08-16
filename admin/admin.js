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
    bloco.innerHTML = `<h2>${escAttr(grupo)}</h2>`;

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
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Não consegui ler essa imagem.'));
    };
    img.src = URL.createObjectURL(file);
  });
}

// Mesma lógica de comprimir(), mas a partir de uma <img> já carregada na
// tela (foto existente reenquadrada, sem escolher um arquivo novo) em vez
// de um File — é o que faz o arraste sobre uma foto já publicada também
// salvar o reenquadramento, e não só quando se escolhe uma foto nova.
function comprimirDeImagem(img, posY) {
  const canvas = document.createElement('canvas');
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');

  const { x, y, w, h } = calcularRecorte(img.naturalWidth, img.naturalHeight, LARGURA, ALTURA, posY);
  ctx.drawImage(img, x, y, w, h);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  return { dataUrl, base64: dataUrl.split(',')[1] };
}

function abrirEdicao(item, tipo) {
  const tela = $('#tela-edicao');
  $('#tela-lista').hidden = true;
  tela.hidden = false;

  const foto = fotoAtual(item);
  let posY = 50;
  const posYAoAbrir = posY;
  let arquivoEscolhido = null;
  let urlPreviaBlob = null;

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
  function pararArraste() { arrastando = false; }
  recorte.addEventListener('pointerup', pararArraste);
  // Se o navegador assumir o gesto no meio do arraste (ex.: gesto de
  // sistema), "pointerup" pode nunca chegar — sem isto, "arrastando" fica
  // travado em true e a moldura continua seguindo eventos de ponteiro soltos.
  recorte.addEventListener('pointercancel', pararArraste);

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
    if (urlPreviaBlob) URL.revokeObjectURL(urlPreviaBlob);
    urlPreviaBlob = URL.createObjectURL(f);
    recorte.innerHTML = `<img src="${urlPreviaBlob}" alt="">`;
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

    // Recomprime tanto quando uma foto nova foi escolhida quanto quando a
    // foto que já estava na tela foi só reenquadrada (arrastada) — sem a
    // segunda condição, arrastar uma foto existente e salvar não guardava
    // nada: a prévia se movia na tela, mas nada era escrito em alterações.
    const reenquadrado = !arquivoEscolhido && posY !== posYAoAbrir;
    if (arquivoEscolhido) {
      try {
        const { dataUrl, base64 } = await comprimir(arquivoEscolhido, posY);
        alt.foto = { dataUrl, base64, caminho: `fotos/${item.id}.jpg` };
      } catch (e) {
        $('#erro-edicao').textContent = e.message;
        $('#erro-edicao').hidden = false;
        return;
      }
    } else if (reenquadrado) {
      const img = recorte.querySelector('img');
      try {
        const { dataUrl, base64 } = comprimirDeImagem(img, posY);
        alt.foto = { dataUrl, base64, caminho: `fotos/${item.id}.jpg` };
      } catch (e) {
        $('#erro-edicao').textContent = 'Não consegui processar essa foto.';
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
  $('#erro-login').hidden = true;
  // A senha só é validada de verdade no servidor, ao publicar — aqui ela só
  // é guardada. Se o conteúdo já foi carregado (ex.: ela voltou para esta
  // tela porque errou a senha ao publicar), não buscar de novo: um novo
  // fetch traria um objeto diferente do que estado.alteracoes referencia
  // internamente, e ela perderia tudo que ainda não publicou.
  if (!estado.conteudo) {
    estado.conteudo = await (await fetch('/conteudo.json?' + Date.now())).json();
  }
  $('#tela-login').hidden = true;
  $('#tela-lista').hidden = false;
  desenharLista();
}

$('#btn-entrar').addEventListener('click', entrar);
$('#senha').addEventListener('keydown', e => { if (e.key === 'Enter') entrar(); });

// Aplica todas as alterações pendentes (mapa estado.alteracoes) por cima de
// uma cópia de conteudo.json, produzindo o JSON final que vai para o
// commit. Usada tanto para montar o payload de /api/salvar quanto, após o
// sucesso, para atualizar estado.conteudo sem precisar buscar o arquivo de
// novo no servidor.
function aplicarAlteracoes(conteudo) {
  const copia = structuredClone(conteudo);

  const salao = estado.alteracoes.get('__salao');
  if (salao) Object.assign(copia.salao, salao);

  const todos = [
    ...copia.categorias.flatMap(c => c.servicos),
    ...copia.tratamentos, ...copia.noiva, ...copia.profissionais
  ];
  for (const item of todos) {
    const alt = estado.alteracoes.get(item.id);
    if (!alt) continue;
    if (alt.preco !== undefined) item.preco = alt.preco;
    if (alt.foto) item.foto = alt.foto.caminho;
  }
  return copia;
}

// Número de fotos por publicação até o qual o corpo do request fica com
// folga confortável sob o limite de ~4.5MB da Vercel para funções
// serverless, mesmo no cenário pessimista (fotos "pesadas", perto do maior
// arquivo comprimido observado no catálogo real). Ver docs/PAINEL.md e o
// relatório da Task 12 para a conta completa. Usado só para orientar a
// mensagem quando o servidor recusa o lote por tamanho — não é aplicado
// como limite no cliente (não há chunking/retry automático).
const LOTE_FOTOS_RECOMENDADO = 25;

// Aviso em tela cheia usado tanto para erros quanto para o sucesso da
// publicação. Com comContador=true, mostra uma contagem regressiva de 40s
// (tempo aproximado de propagação do build) — é só uma barra de progresso
// visual, não trava nada: o botão "Entendi" fecha o aviso a qualquer momento,
// e faz questão de parar o intervalo (senão ele continua rodando contra um
// nó já removido do DOM).
function mostrarAviso(titulo, texto, comContador) {
  const div = document.createElement('div');
  div.className = 'aviso';
  div.innerHTML = `
    <h2>${titulo}</h2>
    ${comContador ? '<div class="contador">40</div>' : ''}
    <p></p>
    <button>Entendi</button>`;
  // texto pode vir do servidor (dados.erro) — nunca interpolado como HTML.
  div.querySelector('p').textContent = texto ?? 'Erro desconhecido.';

  let intervalo = null;
  if (comContador) {
    const alvo = div.querySelector('.contador');
    let s = 40;
    intervalo = setInterval(() => {
      s -= 1;
      alvo.textContent = s;
      if (s <= 0) { clearInterval(intervalo); alvo.textContent = 'pronto'; }
    }, 1000);
  }

  div.querySelector('button').addEventListener('click', () => {
    if (intervalo) clearInterval(intervalo);
    div.remove();
  });
  document.body.appendChild(div);

  return div;
}

$('#btn-publicar').addEventListener('click', async () => {
  const botao = $('#btn-publicar');
  botao.disabled = true;
  botao.textContent = 'Publicando…';

  // Tira o "retrato" do que vai ser publicado uma única vez, ANTES do
  // fetch, e guarda quais ids foram enviados. #tela-lista continua clicável
  // durante o request (nada bloqueia a UI), então se ela guardar mais uma
  // alteração enquanto o publish está em voo, essa alteração não pode ser
  // nem incluída no corpo já enviado, nem apagada no sucesso — por isso não
  // se chama aplicarAlteracoes() de novo depois, nem se usa .clear().
  const publicado = aplicarAlteracoes(estado.conteudo);
  const enviadas = [...estado.alteracoes.keys()];
  const fotos = enviadas
    .map(id => estado.alteracoes.get(id))
    .filter(alt => alt.foto)
    .map(alt => ({ caminho: alt.foto.caminho, base64: alt.foto.base64 }));

  function falhou(texto) {
    mostrarAviso('Não deu certo', texto, false);
    botao.disabled = false;
    botao.textContent = 'Publicar';
  }

  try {
    const r = await fetch('/api/salvar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: estado.senha, conteudo: publicado, fotos })
    });

    // 413 (lote grande demais) e outras respostas de infraestrutura (ex.:
    // 504 de timeout) nunca chegam a api/salvar.js, então o corpo não é o
    // JSON { ok, erro } que o handler sempre devolve — tentar decodificar
    // isso como JSON lançaria, e cairia no catch genérico de "sem conexão",
    // que é enganoso quando a conexão está ótima e o problema é outro.
    if (r.status === 413) {
      falhou(`O lote está grande demais para publicar de uma vez. Publique em até ${LOTE_FOTOS_RECOMENDADO} fotos por rodada, em duas rodadas, e tente de novo.`);
      return;
    }

    let dados;
    try {
      dados = await r.json();
    } catch {
      falhou(`O servidor respondeu de forma inesperada (código ${r.status}). Tente de novo em instantes.`);
      return;
    }

    // Senha incorreta: nada foi publicado (api/salvar.js recusa antes de
    // tocar no GitHub), então estado.alteracoes continua intacto. Volta
    // para a tela de login, sem mexer nas alterações pendentes, para ela
    // digitar a senha certa e tentar de novo sem perder nada.
    if (r.status === 401) {
      $('#tela-lista').hidden = true;
      $('#tela-login').hidden = false;
      $('#senha').value = '';
      $('#erro-login').textContent = dados.erro || 'Senha incorreta. Tente de novo.';
      $('#erro-login').hidden = false;
      botao.disabled = false;
      botao.textContent = 'Publicar';
      return;
    }

    if (!dados.ok) {
      falhou(dados.erro ?? 'Erro desconhecido.');
      return;
    }

    estado.conteudo = publicado;
    for (const id of enviadas) estado.alteracoes.delete(id);
    desenharLista();
    botao.textContent = 'Publicar';
    mostrarAviso(
      'Publicado!',
      'O site leva cerca de 40 segundos para atualizar. Se você abrir agora, ainda vai ver a versão antiga — espere o contador acabar e recarregue.',
      true
    );
  } catch (e) {
    falhou('Sem conexão. Suas alterações não se perderam: tente publicar de novo.');
  }
});
