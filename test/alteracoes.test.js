import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { aplicarAlteracoes } from '../admin/alteracoes.js';
import { validar } from '../build/validar.js';

const conteudo = JSON.parse(readFileSync('conteudo.json', 'utf8'));

// O único lugar onde o modelo de dados do painel (aplicarAlteracoes) e o
// modelo de dados do build (validar) são checados um contra o outro. Usa o
// conteudo.json real e um Map de alterações sintético do mesmo formato que
// admin.js produz: preço, preço avulso (tratamento) e foto (com um caminho
// que existe de verdade em fotos/, para que a checagem de arquivoExiste do
// validar não precise ser stubada).
test('aplicarAlteracoes produz um conteúdo que validar() aceita', () => {
  const alteracoes = new Map();
  alteracoes.set('maquiagem-glam', {
    preco: 135,
    foto: { caminho: 'fotos/maquiagem-glam.jpg' }
  });
  alteracoes.set('protocolo-ozonio', { preco_avulsa: 95 });

  const resultado = aplicarAlteracoes(conteudo, alteracoes);

  const glam = resultado.categorias.flatMap(c => c.servicos).find(s => s.id === 'maquiagem-glam');
  assert.equal(glam.preco, 135);
  assert.equal(glam.foto, 'fotos/maquiagem-glam.jpg');

  const ozonio = resultado.tratamentos.find(t => t.id === 'protocolo-ozonio');
  assert.equal(ozonio.preco_avulsa, 95);

  assert.deepEqual(validar(resultado, p => existsSync(p)), []);
});

test('aplicarAlteracoes aplica alterações do salão sob a chave "__salao"', () => {
  const alteracoes = new Map();
  alteracoes.set('__salao', { whatsapp: '5511999999999', endereco: 'Rua X, 123', horarios: 'Seg a Sáb, 9h-19h' });

  const resultado = aplicarAlteracoes(conteudo, alteracoes);

  assert.equal(resultado.salao.whatsapp, '5511999999999');
  assert.deepEqual(validar(resultado, p => existsSync(p)), []);
});

test('aplicarAlteracoes não muta o conteúdo original (trabalha sobre uma cópia)', () => {
  const alteracoes = new Map([['maquiagem-glam', { preco: 999 }]]);
  aplicarAlteracoes(conteudo, alteracoes);
  const glamOriginal = conteudo.categorias.flatMap(c => c.servicos).find(s => s.id === 'maquiagem-glam');
  assert.notEqual(glamOriginal.preco, 999);
});
