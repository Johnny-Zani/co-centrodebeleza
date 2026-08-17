import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { esc } from '../build/render.js';

execFileSync('node', ['build.js'], { stdio: 'pipe' });
const html = readFileSync('public/index.html', 'utf8');
const conteudo = JSON.parse(readFileSync('conteudo.json', 'utf8'));

test('o build gera public/index.html', () => {
  assert.ok(existsSync('public/index.html'));
});

test('nenhum marcador sobrou no HTML gerado', () => {
  assert.ok(!html.includes('{{'), 'sobrou marcador não substituído');
});

test('todo serviço do JSON aparece no HTML', () => {
  for (const s of conteudo.categorias.flatMap(c => c.servicos)) {
    // Comparado com esc(nome): nomes podem ter caracteres HTML-sensíveis
    // (ex.: apóstrofo em "L'ANZA"), que o build escapa na saída.
    assert.ok(html.includes(esc(s.nome)), `serviço sumiu do HTML: ${s.nome}`);
  }
});

test('todo tratamento, pacote de noiva e profissional aparece no HTML', () => {
  for (const i of [...conteudo.tratamentos, ...conteudo.noiva, ...conteudo.profissionais]) {
    assert.ok(html.includes(esc(i.nome)), `item sumiu do HTML: ${i.nome}`);
  }
});

test('todo preço aparece com "a partir de"', () => {
  // O card separa as duas metades (<small>a partir de</small><strong>R$ …</strong>),
  // então a comparação é por contagem: um prefixo para cada valor exibido.
  const valores = html.split('R$').length - 1;
  const prefixos = html.split('a partir de').length - 1;
  assert.equal(prefixos, valores, 'existe preço sem o prefixo "a partir de"');

  // Contagem balanceada (0 === 0) não pega regressão de preco() virando ''.
  // Piso derivado dos dados: 1 preço por serviço, 2 por tratamento (preco +
  // preco_avulsa), 1 por pacote de noiva.
  const servicos = conteudo.categorias.flatMap(c => c.servicos).length;
  const piso = servicos + conteudo.tratamentos.length * 2 + conteudo.noiva.length;
  assert.ok(valores >= piso, `esperava pelo menos ${piso} preços, achei ${valores}`);
});

test('as fotos são copiadas para public/', () => {
  for (const i of conteudo.categorias.flatMap(c => c.servicos)) {
    if (i.foto) assert.ok(existsSync('public/' + i.foto), `foto não copiada: ${i.foto}`);
  }
});

test('o build falha quando o conteudo.json é inválido', () => {
  assert.throws(() => {
    execFileSync('node', ['build.js'], {
      stdio: 'pipe',
      env: { ...process.env, CONTEUDO: 'test/fixtures/invalido.json' }
    });
  });
});

test('build.js nunca apaga public/ antes de validar — rebuild válido depois do inválido reconstrói do zero', () => {
  // build.js faz rmSync('public') e só depois escreve os arquivos novos. Se
  // essa ordem alguma vez trocasse (destrói antes de validar), o teste
  // acima ("falha quando inválido") continuaria passando — ele só olha o
  // código de saída — mas public/ ficaria vazio/quebrado depois de um build
  // inválido, mesmo com o conteudo.json real são no disco. Este teste
  // reconstrói com o fixture VÁLIDO logo em seguida e confirma que
  // public/index.html volta a ter conteúdo conhecido-bom.
  execFileSync('node', ['build.js'], { stdio: 'pipe' });
  const html = readFileSync('public/index.html', 'utf8');
  assert.ok(html.includes('Maquiagem Glam'), 'public/ não voltou a um estado bom depois do build inválido');
});

test('"$`", "$&" e "$\'" num detalhe não corrompem o HTML gerado', () => {
  // String.prototype.replace() dá significado especial a $&, $`, $' e $$ na
  // STRING DE SUBSTITUIÇÃO. O conteúdo das seções vem de conteudo.json, que a
  // Carol edita pelo admin — um "$&"/"$'"/"$`" nesse texto não pode reinjetar
  // o marcador nem duplicar o resto do template no HTML final.
  //
  // esc() já rodou sobre o detalhe antes desse texto virar "replacement
  // string": "&" e "'" saem como entidades (&amp;, &#39;) e "`" sai como
  // está (esc não mexe em crase). É essa forma escapada que precisa
  // sobreviver intacta — ela é o texto real que chega ao replace().
  execFileSync('node', ['build.js'], {
    stdio: 'pipe',
    env: { ...process.env, CONTEUDO: 'test/fixtures/caracteres-especiais.json' }
  });
  const saida = readFileSync('public/index.html', 'utf8');

  assert.ok(saida.includes('Combo $` completo $&amp; com desconto $&#39; hoje'),
    'o detalhe com "$`"/"$&"/"$\'" saiu corrompido ou incompleto do build');
  assert.ok(!saida.includes('{{'), 'marcador reapareceu na saída (reinjetado via padrão "$")');
  assert.equal((saida.match(/<footer>/g) ?? []).length, 1, 'footer duplicado (template reinjetado via padrão "$")');
});

test('admin/index.html referencia admin.css e admin.js com caminho absoluto', () => {
  // Caminho relativo ("admin.css") quebra em produção: com cleanUrls,
  // acessar /admin (sem barra final) faz o navegador resolver o relativo
  // contra a URL sem o último segmento, virando /admin.css (404) em vez de
  // /admin/admin.css. Reproduzido ao vivo em 17/08 — painel carregava sem
  // CSS nem JS (login não fazia nada).
  const adminHtml = readFileSync('public/admin/index.html', 'utf8');
  assert.ok(adminHtml.includes('href="/admin/admin.css"'), 'admin.css não está com caminho absoluto');
  assert.ok(adminHtml.includes('src="/admin/admin.js"'), 'admin.js não está com caminho absoluto');
});

// Este arquivo é o último a rodar um build com CONTEUDO customizado (o
// teste acima usa a fixture de caracteres especiais) — sem isso, quem
// rodar "npm test" e depois quiser servir public/ localmente para
// conferir visualmente acha um site minúsculo de fixture em vez do real.
// public/ é gitignored e a Vercel sempre builda do zero, então isso nunca
// afeta produção — é só higiene para quem roda o teste localmente.
test('public/ termina a suíte reconstruído com o conteudo.json real', () => {
  execFileSync('node', ['build.js'], { stdio: 'pipe' });
  const html = readFileSync('public/index.html', 'utf8');
  assert.ok(html.includes('Maquiagem Glam'), 'public/ não terminou a suíte com o conteúdo real');
});
