import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { validar } from './build/validar.js';
import { secaoProfissionais, secaoServicos, secaoTratamentos, secaoNoiva, secaoCta } from './build/secoes.js';
import { metaTags } from './build/meta.js';

const ARQUIVO = process.env.CONTEUDO ?? 'conteudo.json';
const PRODUCAO = process.argv.includes('--producao');
const URL_BASE = process.env.URL_BASE ?? 'https://co-centrodebeleza.vercel.app';

const conteudo = JSON.parse(readFileSync(ARQUIVO, 'utf8'));

const erros = validar(conteudo, p => existsSync(p));
if (erros.length > 0) {
  console.error('\n✖ conteudo.json inválido:\n');
  for (const e of erros) console.error('  · ' + e);
  console.error('');
  process.exit(1);
}

if (!conteudo.salao.whatsapp) {
  const aviso = 'WhatsApp não configurado: os botões de agendar saem inativos.';
  if (PRODUCAO) {
    console.error('\n✖ ' + aviso + ' Build de produção recusado.\n');
    process.exit(1);
  }
  console.warn('\n⚠  ' + aviso + '\n');
}

// Forma-função no replace: o conteúdo de cada seção vem de conteudo.json,
// que a Carol vai editar pelo admin numa task futura. Se algum texto dela
// tiver "$&", "$'", "$`" ou "$$", o replace normal interpretaria isso como
// padrão de substituição e corromperia o HTML gerado (duplicando o resto do
// template ou reinjetando o marcador). A forma-função trata o retorno como
// string literal, sem interpretar "$".
const html = readFileSync('template.html', 'utf8')
  .replace('<!--{{META}}-->', () => metaTags(conteudo, URL_BASE))
  .replace('<!--{{PROFISSIONAIS}}-->', () => secaoProfissionais(conteudo))
  .replace('<!--{{SERVICOS}}-->', () => secaoServicos(conteudo))
  .replace('<!--{{TRATAMENTOS}}-->', () => secaoTratamentos(conteudo))
  .replace('<!--{{NOIVA}}-->', () => secaoNoiva(conteudo))
  .replace('<!--{{CTA}}-->', () => secaoCta(conteudo));

rmSync('public', { recursive: true, force: true });
mkdirSync('public', { recursive: true });
writeFileSync('public/index.html', html);
cpSync('fotos', 'public/fotos', { recursive: true });
if (existsSync('admin')) cpSync('admin', 'public/admin', { recursive: true });

console.log('✔ public/index.html gerado');
