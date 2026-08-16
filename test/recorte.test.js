import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularRecorte } from '../admin/recorte.js';

const ALVO_W = 600, ALVO_H = 800;

test('foto já em 3:4 preenche o alvo exatamente', () => {
  const r = calcularRecorte(600, 800, ALVO_W, ALVO_H, 50);
  assert.deepEqual(r, { x: 0, y: 0, w: 600, h: 800 });
});

test('foto mais larga que 3:4 é centralizada e sangra nas laterais', () => {
  const r = calcularRecorte(1200, 800, ALVO_W, ALVO_H, 50);
  assert.equal(r.h, 800);
  assert.equal(r.w, 1200);
  assert.equal(r.x, -300);
  assert.equal(r.y, 0);
});

test('em foto mais alta, posY 0 alinha o topo e 100 alinha a base', () => {
  const topo = calcularRecorte(600, 1600, ALVO_W, ALVO_H, 0);
  const base = calcularRecorte(600, 1600, ALVO_W, ALVO_H, 100);
  assert.equal(topo.y, 0);
  assert.equal(base.y, -800);
});

test('posY 50 centraliza verticalmente', () => {
  assert.equal(calcularRecorte(600, 1600, ALVO_W, ALVO_H, 50).y, -400);
});

test('o recorte nunca deixa faixa vazia, em qualquer proporção', () => {
  const proporcoes = [[600, 800], [1200, 800], [600, 1600], [4032, 3024], [3024, 4032], [1000, 1000]];
  for (const [w, h] of proporcoes) {
    for (const posY of [0, 50, 100]) {
      const r = calcularRecorte(w, h, ALVO_W, ALVO_H, posY);
      assert.ok(r.w >= ALVO_W - 0.001, `larga demais: ${w}x${h}`);
      assert.ok(r.h >= ALVO_H - 0.001, `alta demais: ${w}x${h}`);
      assert.ok(r.x <= 0.001 && r.y <= 0.001, `desloca para dentro: ${w}x${h} posY=${posY}`);
      assert.ok(r.x + r.w >= ALVO_W - 0.001, `sobra à direita: ${w}x${h}`);
      assert.ok(r.y + r.h >= ALVO_H - 0.001, `sobra embaixo: ${w}x${h} posY=${posY}`);
    }
  }
});
