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
