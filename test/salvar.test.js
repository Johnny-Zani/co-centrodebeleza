import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/salvar.js';

function resFalso() {
  const r = {};
  r.status = (codigo) => { r.statusCode = codigo; return r; };
  r.json = (corpo) => { r.corpo = corpo; return r; };
  return r;
}

function reqFalso({ method = 'POST', ip = '1.2.3.4', body = {} } = {}) {
  return { method, headers: { 'x-forwarded-for': ip }, body };
}

// fetch falso no mesmo formato usado em test/github.test.js — nenhuma
// chamada de rede é feita.
function fetchFalso(respostas) {
  const fn = async (url) => {
    const chave = Object.keys(respostas).find(k => url.includes(k));
    if (!chave) throw new Error('URL inesperada: ' + url);
    return { ok: true, status: 200, json: async () => respostas[chave] };
  };
  return fn;
}

function comAmbiente(vars, fn) {
  const anteriores = {};
  for (const chave of Object.keys(vars)) anteriores[chave] = process.env[chave];
  return (async () => {
    try {
      for (const [chave, valor] of Object.entries(vars)) {
        if (valor === undefined) delete process.env[chave];
        else process.env[chave] = valor;
      }
      await fn();
    } finally {
      for (const chave of Object.keys(vars)) {
        if (anteriores[chave] === undefined) delete process.env[chave];
        else process.env[chave] = anteriores[chave];
      }
    }
  })();
}

test('405 em método diferente de POST', async () => {
  const res = resFalso();
  await handler(reqFalso({ method: 'GET', ip: '10.0.0.1' }), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.corpo.ok, false);
});

test('401 com senha errada quando ADMIN_SENHA está definido', () => comAmbiente({ ADMIN_SENHA: 'correta' }, async () => {
  const res = resFalso();
  await handler(reqFalso({ ip: '10.0.0.2', body: { senha: 'errada', conteudo: {} } }), res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.corpo.ok, false);
  assert.equal(res.corpo.erro, 'Senha incorreta');
}));

test('401 com qualquer senha quando ADMIN_SENHA não está definido (falha fechada)', () => comAmbiente({ ADMIN_SENHA: undefined }, async () => {
  const res = resFalso();
  await handler(reqFalso({ ip: '10.0.0.3', body: { senha: 'qualquer-coisa', conteudo: {} } }), res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.corpo.ok, false);
}));

test('400 para foto fora de fotos/ (path traversal)', () => comAmbiente({ ADMIN_SENHA: 'correta' }, async () => {
  const res = resFalso();
  await handler(reqFalso({
    ip: '10.0.0.4',
    body: { senha: 'correta', conteudo: {}, fotos: [{ caminho: 'fotos/../conteudo.json', base64: 'AAAA' }] }
  }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.corpo.ok, false);
}));

test('400 para caminho absoluto', () => comAmbiente({ ADMIN_SENHA: 'correta' }, async () => {
  const res = resFalso();
  await handler(reqFalso({
    ip: '10.0.0.5',
    body: { senha: 'correta', conteudo: {}, fotos: [{ caminho: '/etc/passwd', base64: 'AAAA' }] }
  }), res);
  assert.equal(res.statusCode, 400);
}));

test('400 para subpasta dentro de fotos/', () => comAmbiente({ ADMIN_SENHA: 'correta' }, async () => {
  const res = resFalso();
  await handler(reqFalso({
    ip: '10.0.0.6',
    body: { senha: 'correta', conteudo: {}, fotos: [{ caminho: 'fotos/a/b.jpg', base64: 'AAAA' }] }
  }), res);
  assert.equal(res.statusCode, 400);
}));

test('400 para extensão diferente de .jpg — protege fotos/logo.png e fotos/og.png de serem sobrescritos por engano', () => comAmbiente({ ADMIN_SENHA: 'correta' }, async () => {
  const res = resFalso();
  await handler(reqFalso({
    ip: '10.0.0.7',
    body: { senha: 'correta', conteudo: {}, fotos: [{ caminho: 'fotos/logo.png', base64: 'AAAA' }] }
  }), res);
  assert.equal(res.statusCode, 400);
}));

test('400 para caminho com quebra de linha no final (o "$" do regex não casa antes de \\n em JS, diferente de Python/Ruby)', () => comAmbiente({ ADMIN_SENHA: 'correta' }, async () => {
  const res = resFalso();
  await handler(reqFalso({
    ip: '10.0.0.8',
    body: { senha: 'correta', conteudo: {}, fotos: [{ caminho: 'fotos/a.jpg\n', base64: 'AAAA' }] }
  }), res);
  assert.equal(res.statusCode, 400);
}));

test('a mensagem de erro de caminho inválido não ecoa o valor recebido (evita XSS refletido no painel)', () => comAmbiente({ ADMIN_SENHA: 'correta' }, async () => {
  const res = resFalso();
  const malicioso = 'fotos/<img src=x onerror=alert(1)>.jpg';
  await handler(reqFalso({
    ip: '10.0.0.9',
    body: { senha: 'correta', conteudo: {}, fotos: [{ caminho: malicioso, base64: 'AAAA' }] }
  }), res);
  assert.equal(res.statusCode, 400);
  assert.ok(!res.corpo.erro.includes(malicioso));
  assert.ok(!res.corpo.erro.includes('<img'));
}));

test('400 quando fotos não é um array', () => comAmbiente({ ADMIN_SENHA: 'correta' }, async () => {
  const res = resFalso();
  await handler(reqFalso({ ip: '10.0.0.10', body: { senha: 'correta', conteudo: {}, fotos: 5 } }), res);
  assert.equal(res.statusCode, 400);

  const res2 = resFalso();
  await handler(reqFalso({ ip: '10.0.0.10', body: { senha: 'correta', conteudo: {}, fotos: {} } }), res2);
  assert.equal(res2.statusCode, 400);
}));

test('400 quando um item de fotos é null', () => comAmbiente({ ADMIN_SENHA: 'correta' }, async () => {
  const res = resFalso();
  await handler(reqFalso({ ip: '10.0.0.11', body: { senha: 'correta', conteudo: {}, fotos: [null] } }), res);
  assert.equal(res.statusCode, 400);
}));

test('400 quando caminho é um array (bypass do regex por coerção string)', () => comAmbiente({ ADMIN_SENHA: 'correta' }, async () => {
  const res = resFalso();
  await handler(reqFalso({
    ip: '10.0.0.12',
    body: { senha: 'correta', conteudo: {}, fotos: [{ caminho: ['fotos/a.jpg'], base64: 'AAAA' }] }
  }), res);
  assert.equal(res.statusCode, 400);
}));

test('aceita fotos/bruna-vital.jpg e publica com sucesso', () => comAmbiente({
  ADMIN_SENHA: 'correta',
  GITHUB_TOKEN: 't',
  GITHUB_REPO: 'dono/repo',
  GITHUB_BRANCH: 'main'
}, async () => {
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = fetchFalso({
    '/git/ref/heads/': { object: { sha: 'sha-base' } },
    '/git/commits/sha-base': { tree: { sha: 'tree-base' } },
    '/git/blobs': { sha: 'sha-blob' },
    '/git/trees': { sha: 'tree-novo' },
    '/git/commits': { sha: 'commit-novo' },
    '/git/refs/heads/': { object: { sha: 'commit-novo' } }
  });
  try {
    const res = resFalso();
    await handler(reqFalso({
      ip: '10.0.0.13',
      body: { senha: 'correta', conteudo: { ok: true }, fotos: [{ caminho: 'fotos/bruna-vital.jpg', base64: 'AAAA' }] }
    }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.corpo.ok, true);
    assert.equal(res.corpo.sha, 'commit-novo');
  } finally {
    globalThis.fetch = fetchOriginal;
  }
}));
