import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validar } from '../build/validar.js';

const conteudo = JSON.parse(readFileSync('conteudo.json', 'utf8'));

test('conteudo.json passa na validação', () => {
  assert.deepEqual(validar(conteudo, p => existsSync(p)), []);
});

test('a história da Caroline tem texto completo e foto', () => {
  assert.equal(conteudo.historia.nome, 'Caroline Georgiutti');
  assert.ok(conteudo.historia.abertura.length >= 2);
  assert.ok(conteudo.historia.paragrafos.length >= 10);
  assert.ok(existsSync(conteudo.historia.foto));
});

test('tem 28 serviços em 6 categorias', () => {
  assert.equal(conteudo.categorias.length, 6);
  assert.equal(conteudo.categorias.flatMap(c => c.servicos).length, 28);
});

test('tem 5 tratamentos, 3 pacotes de noiva e 5 profissionais', () => {
  assert.equal(conteudo.tratamentos.length, 5);
  assert.equal(conteudo.noiva.length, 3);
  assert.equal(conteudo.profissionais.length, 5);
});

test('28 serviços com foto, 5 tratamentos com foto, 5 profissionais com foto, 3 pacotes com foto', () => {
  const comFoto = l => l.filter(i => i.foto !== null).length;
  assert.equal(comFoto(conteudo.categorias.flatMap(c => c.servicos)), 28);
  assert.equal(comFoto(conteudo.tratamentos), 5);
  assert.equal(comFoto(conteudo.profissionais), 5);
  assert.equal(comFoto(conteudo.noiva), 3);
});
