const API = 'https://api.github.com';

// Commit em lote via Git Data API: um commit para N arquivos.
export async function commitarArquivos({ token, repo, branch, mensagem, arquivos, fetch: f = fetch }) {
  const cabecalho = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'co-centrodebeleza-admin'
  };

  const pedir = async (caminho, opcoes = {}) => {
    const r = await f(`${API}/repos/${repo}${caminho}`, { headers: cabecalho, ...opcoes });
    if (!r.ok) throw new Error(`GitHub ${r.status} em ${caminho}`);
    return r.json();
  };

  const ref = await pedir(`/git/ref/heads/${branch}`);
  const shaBase = ref.object.sha;
  const commitBase = await pedir(`/git/commits/${shaBase}`);

  const blobs = [];
  for (const a of arquivos) {
    const blob = await pedir('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: a.conteudoBase64, encoding: 'base64' })
    });
    blobs.push({ path: a.caminho, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const arvore = await pedir('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: commitBase.tree.sha, tree: blobs })
  });

  const commit = await pedir('/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: mensagem, tree: arvore.sha, parents: [shaBase] })
  });

  await pedir(`/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha })
  });

  return commit.sha;
}
