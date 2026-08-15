import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { validar } from './build/validar.js';
import { secaoProfissionais, secaoServicos, secaoTratamentos, secaoNoiva, secaoCta } from './build/secoes.js';

const ARQUIVO = process.env.CONTEUDO ?? 'conteudo.json';
const PRODUCAO = process.argv.includes('--producao');

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

const html = readFileSync('template.html', 'utf8')
  .replace('<!--{{META}}-->', '')
  .replace('<!--{{PROFISSIONAIS}}-->', secaoProfissionais(conteudo))
  .replace('<!--{{SERVICOS}}-->', secaoServicos(conteudo))
  .replace('<!--{{TRATAMENTOS}}-->', secaoTratamentos(conteudo))
  .replace('<!--{{NOIVA}}-->', secaoNoiva(conteudo))
  .replace('<!--{{CTA}}-->', secaoCta(conteudo));

rmSync('public', { recursive: true, force: true });
mkdirSync('public', { recursive: true });
writeFileSync('public/index.html', html);
cpSync('fotos', 'public/fotos', { recursive: true });
if (existsSync('admin')) cpSync('admin', 'public/admin', { recursive: true });

console.log('✔ public/index.html gerado');
