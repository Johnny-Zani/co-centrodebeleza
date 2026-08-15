import { test } from 'node:test';
import assert from 'node:assert/strict';
import { commitarArquivos } from '../api/github.js';

function fetchFalso(respostas) {
  const chamadas = [];
  const fn = async (url, opcoes) => {
    chamadas.push({ url, corpo: opcoes?.body ? JSON.parse(opcoes.body) : null });
    const chave = Object.keys(respostas).find(k => url.includes(k));
    if (!chave) throw new Error('URL inesperada: ' + url);
    return { ok: true, status: 200, json: async () => respostas[chave] };
  };
  fn.chamadas = chamadas;
  return fn;
}

test('cria blobs, árvore, commit e move a ref', async () => {
  const fetch = fetchFalso({
    '/git/ref/heads/': { object: { sha: 'sha-base' } },
    '/git/commits/sha-base': { tree: { sha: 'tree-base' } },
    '/git/blobs': { sha: 'sha-blob' },
    '/git/trees': { sha: 'tree-novo' },
    '/git/commits': { sha: 'commit-novo' },
    '/git/refs/heads/': { object: { sha: 'commit-novo' } }
  });

  const sha = await commitarArquivos({
    token: 't', repo: 'dono/repo', branch: 'main',
    mensagem: 'chore: teste',
    arquivos: [{ caminho: 'conteudo.json', conteudoBase64: 'e30=' }],
    fetch
  });

  assert.equal(sha, 'commit-novo');
  const urls = fetch.chamadas.map(c => c.url);
  assert.ok(urls.some(u => u.includes('/git/blobs')));
  assert.ok(urls.some(u => u.includes('/git/trees')));
  assert.ok(urls.some(u => u.includes('/git/commits')));
});

test('um único commit para vários arquivos', async () => {
  const fetch = fetchFalso({
    '/git/ref/heads/': { object: { sha: 'sha-base' } },
    '/git/commits/sha-base': { tree: { sha: 'tree-base' } },
    '/git/blobs': { sha: 'sha-blob' },
    '/git/trees': { sha: 'tree-novo' },
    '/git/commits': { sha: 'commit-novo' },
    '/git/refs/heads/': { object: { sha: 'commit-novo' } }
  });

  await commitarArquivos({
    token: 't', repo: 'dono/repo', branch: 'main', mensagem: 'm',
    arquivos: [
      { caminho: 'conteudo.json', conteudoBase64: 'e30=' },
      { caminho: 'fotos/a.jpg', conteudoBase64: 'AAAA' },
      { caminho: 'fotos/b.jpg', conteudoBase64: 'BBBB' }
    ],
    fetch
  });

  const criacoesDeCommit = fetch.chamadas.filter(c => c.url.endsWith('/git/commits'));
  assert.equal(criacoesDeCommit.length, 1);
  const arvores = fetch.chamadas.filter(c => c.url.endsWith('/git/trees'));
  assert.equal(arvores[0].corpo.tree.length, 3);

  // A tree precisa herdar os arquivos não alterados via base_tree — sem isso,
  // um publish apaga todo o resto do repositório.
  assert.equal(arvores[0].corpo.base_tree, 'tree-base');
  // O commit precisa apontar para o commit anterior, senão vira um commit órfão.
  assert.deepEqual(criacoesDeCommit[0].corpo.parents, ['sha-base']);
  // A branch precisa realmente ser movida para o novo commit — sem isso,
  // a função devolve sucesso mas nada é publicado.
  const refs = fetch.chamadas.filter(c => c.url.includes('/git/refs/heads/'));
  assert.equal(refs.length, 1);
  assert.equal(refs[0].corpo.sha, 'commit-novo');
});
