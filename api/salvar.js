import { commitarArquivos } from './github.js';

const tentativas = new Map();          // ip → { contagem, ate }
const JANELA_MS = 15 * 60 * 1000;
const LIMITE = 8;

function bloqueado(ip) {
  const t = tentativas.get(ip);
  if (!t) return false;
  if (Date.now() > t.ate) { tentativas.delete(ip); return false; }
  return t.contagem >= LIMITE;
}

function registrarFalha(ip) {
  const t = tentativas.get(ip) ?? { contagem: 0, ate: Date.now() + JANELA_MS };
  t.contagem += 1;
  tentativas.set(ip, t);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, erro: 'Método não permitido' });
  }

  const ip = req.headers['x-forwarded-for'] ?? 'desconhecido';
  if (bloqueado(ip)) {
    return res.status(429).json({ ok: false, erro: 'Muitas tentativas. Tente de novo daqui a pouco.' });
  }

  const { senha, conteudo, fotos } = req.body ?? {};

  if (!senha || senha !== process.env.ADMIN_SENHA) {
    registrarFalha(ip);
    return res.status(401).json({ ok: false, erro: 'Senha incorreta' });
  }

  if (!conteudo || typeof conteudo !== 'object') {
    return res.status(400).json({ ok: false, erro: 'Conteúdo ausente ou inválido' });
  }

  const arquivos = [{
    caminho: 'conteudo.json',
    conteudoBase64: Buffer.from(JSON.stringify(conteudo, null, 2)).toString('base64')
  }];

  if (!Array.isArray(fotos ?? [])) {
    return res.status(400).json({ ok: false, erro: 'Formato de fotos inválido' });
  }

  for (const foto of fotos ?? []) {
    if (!foto || typeof foto.caminho !== 'string' || typeof foto.base64 !== 'string') {
      return res.status(400).json({ ok: false, erro: 'Foto com formato inválido' });
    }
    if (!/^fotos\/[a-z0-9-]+\.jpg$/.test(foto.caminho)) {
      return res.status(400).json({ ok: false, erro: 'Caminho de foto inválido' });
    }
    arquivos.push({ caminho: foto.caminho, conteudoBase64: foto.base64 });
  }

  try {
    const sha = await commitarArquivos({
      token: process.env.GITHUB_TOKEN,
      repo: process.env.GITHUB_REPO,
      branch: process.env.GITHUB_BRANCH ?? 'main',
      mensagem: `conteudo: atualizacao pelo painel (${arquivos.length - 1} foto(s))`,
      arquivos
    });
    return res.status(200).json({ ok: true, sha });
  } catch (e) {
    return res.status(502).json({ ok: false, erro: 'Falha ao publicar: ' + e.message });
  }
}
