import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validar } from '../build/validar.js';

const conteudo = JSON.parse(readFileSync('conteudo.json', 'utf8'));

test('conteudo.json passa na validação', () => {
  assert.deepEqual(validar(conteudo, p => existsSync(p)), []);
});

test('tem 20 serviços em 4 categorias', () => {
  assert.equal(conteudo.categorias.length, 4);
  assert.equal(conteudo.categorias.flatMap(c => c.servicos).length, 20);
});

test('tem 5 tratamentos, 3 pacotes de noiva e 5 profissionais', () => {
  assert.equal(conteudo.tratamentos.length, 5);
  assert.equal(conteudo.noiva.length, 3);
  assert.equal(conteudo.profissionais.length, 5);
});

test('17 serviços, 5 tratamentos e 5 profissionais já têm foto', () => {
  const comFoto = l => l.filter(i => i.foto !== null).length;
  assert.equal(comFoto(conteudo.categorias.flatMap(c => c.servicos)), 17);
  assert.equal(comFoto(conteudo.tratamentos), 5);
  assert.equal(comFoto(conteudo.profissionais), 5);
  assert.equal(comFoto(conteudo.noiva), 0);
});
