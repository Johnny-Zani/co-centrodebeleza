import { test } from 'node:test';
import assert from 'node:assert/strict';
import { precoTexto } from '../admin/preco.js';
import { formatarPreco } from '../build/render.js';

// admin/preco.js é uma cópia deliberada de build/render.js:formatarPreco —
// o painel roda no navegador, fora do build Node, e não importa de build/.
// Nada garantia que as duas ficassem em acordo depois de uma alteração numa
// só; este teste é essa garantia.
test('precoTexto (admin) concorda com formatarPreco (build) para os mesmos valores', () => {
  for (const v of [100, 1200, 45, 1600]) {
    assert.equal(precoTexto(v), formatarPreco(v));
  }
});
