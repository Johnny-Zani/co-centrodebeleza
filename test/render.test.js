import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatarPreco, linkWhatsapp, esc } from '../build/render.js';

test('preço sai no formato brasileiro com "a partir de"', () => {
  assert.equal(formatarPreco(100), 'a partir de R$ 100,00');
  assert.equal(formatarPreco(45), 'a partir de R$ 45,00');
});

test('preço acima de mil usa ponto de milhar', () => {
  assert.equal(formatarPreco(1200), 'a partir de R$ 1.200,00');
  assert.equal(formatarPreco(1600), 'a partir de R$ 1.600,00');
});

test('link do whatsapp leva o nome do serviço na mensagem', () => {
  const url = linkWhatsapp('5511999999999', 'Maquiagem Glam');
  assert.ok(url.startsWith('https://wa.me/5511999999999?text='));
  assert.match(decodeURIComponent(url), /Maquiagem Glam/);
});

test('link do whatsapp escapa caracteres especiais do nome', () => {
  const url = linkWhatsapp('5511999999999', "Protocolo L'ANZA Keratin");
  assert.ok(!url.includes(' '));
  assert.match(decodeURIComponent(url), /L'ANZA/);
});

test('sem número, não há link', () => {
  assert.equal(linkWhatsapp('', 'Maquiagem Glam'), null);
});

test('esc neutraliza HTML', () => {
  assert.equal(esc('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(esc('Ozônio & Cor'), 'Ozônio &amp; Cor');
  assert.equal(esc(null), '');
});
