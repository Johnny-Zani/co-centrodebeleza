import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validar } from '../build/validar.js';

const existeSempre = () => true;

function conteudoMinimo() {
  return {
    salao: { whatsapp: '', endereco: '', horarios: '', instagram: 'c.ocentrodebeleza' },
    profissionais: [{ id: 'caroline', nome: 'Caroline Giorgiutti', funcao: 'Cabeleireira', foto: null }],
    categorias: [{
      nome: 'Maquiagem',
      servicos: [{ id: 'maquiagem-glam', nome: 'Maquiagem Glam', detalhe: null, preco: 120, foto: null }]
    }],
    tratamentos: [],
    noiva: []
  };
}

test('conteúdo válido não produz erro', () => {
  assert.deepEqual(validar(conteudoMinimo(), existeSempre), []);
});

test('id repetido entre listas diferentes é erro', () => {
  const c = conteudoMinimo();
  c.tratamentos.push({ id: 'maquiagem-glam', nome: 'Colisão', detalhe: null, preco: 10, preco_avulsa: 5, tag: '', foto: null });
  const erros = validar(c, existeSempre);
  assert.equal(erros.length, 1);
  assert.match(erros[0], /maquiagem-glam/);
  assert.match(erros[0], /repetid/i);
});

test('preço que não é número é erro', () => {
  const c = conteudoMinimo();
  c.categorias[0].servicos[0].preco = 'R$ 120';
  assert.match(validar(c, existeSempre)[0], /pre(ç|c)o/i);
});

test('preço zero ou negativo é erro', () => {
  const c = conteudoMinimo();
  c.categorias[0].servicos[0].preco = 0;
  assert.equal(validar(c, existeSempre).length, 1);
});

test('tratamento com preco_avulsa inválido é erro', () => {
  const c = conteudoMinimo();
  c.tratamentos.push({ id: 'trat-1', nome: 'Protocolo X', detalhe: null, preco: 100, preco_avulsa: 'grátis', tag: '', foto: null });
  const erros = validar(c, existeSempre);
  assert.equal(erros.length, 1);
  assert.match(erros[0], /avulso/i);
});

test('tratamento com preco_avulsa zero ou negativo é erro', () => {
  const c = conteudoMinimo();
  c.tratamentos.push({ id: 'trat-2', nome: 'Protocolo Y', detalhe: null, preco: 100, preco_avulsa: 0, tag: '', foto: null });
  const erros = validar(c, existeSempre);
  assert.equal(erros.length, 1);
  assert.match(erros[0], /avulso/i);
});

test('foto apontando para arquivo inexistente é erro', () => {
  const c = conteudoMinimo();
  c.categorias[0].servicos[0].foto = 'fotos/nao-existe.jpg';
  const erros = validar(c, () => false);
  assert.match(erros[0], /nao-existe\.jpg/);
});

test('foto null é válida', () => {
  assert.deepEqual(validar(conteudoMinimo(), () => false), []);
});

test('whatsapp com caracteres não numéricos é erro', () => {
  const c = conteudoMinimo();
  c.salao.whatsapp = '(11) 99999-9999';
  assert.match(validar(c, existeSempre)[0], /whatsapp/i);
});

test('whatsapp vazio é aceito (ainda não temos o número)', () => {
  assert.deepEqual(validar(conteudoMinimo(), existeSempre), []);
});
