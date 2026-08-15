import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { metaTags } from '../build/meta.js';

const conteudo = JSON.parse(readFileSync('conteudo.json', 'utf8'));
const html = metaTags(conteudo, 'https://co-centrodebeleza.vercel.app');

test('tem meta description', () => {
  assert.match(html, /<meta name="description" content="[^"]{50,160}"/);
});

test('tem Open Graph para preview no WhatsApp', () => {
  for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) {
    assert.ok(html.includes(`property="${p}"`), `faltou ${p}`);
  }
});

test('a imagem do Open Graph é absoluta e aponta para fotos/og.png', () => {
  assert.match(html, /property="og:image" content="https:\/\/[^"]*\/fotos\/og\.png"/);
});

test('a imagem do Open Graph declara largura e altura', () => {
  assert.ok(html.includes('property="og:image:width" content="1200"'));
  assert.ok(html.includes('property="og:image:height" content="630"'));
});

test('tem favicon', () => {
  assert.ok(html.includes('rel="icon"'));
});

test('tem dados estruturados de HairSalon', () => {
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(m, 'faltou o bloco ld+json');
  const dados = JSON.parse(m[1]);
  assert.equal(dados['@type'], 'HairSalon');
  assert.equal(dados.name, 'C.O. Centro de Beleza');
  assert.ok(Array.isArray(dados.makesOffer));
  assert.equal(dados.makesOffer.length, 20);
});

test('endereço, horário e telefone entram nos dados estruturados quando existem', () => {
  const c = structuredClone(conteudo);
  c.salao.endereco = 'Rua Exemplo, 123 — Centro';
  c.salao.horarios = 'Seg a Sáb, 9h às 19h';
  c.salao.whatsapp = '5511999998888';
  const dados = JSON.parse(metaTags(c, 'https://x.com').match(/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(dados.address.streetAddress, 'Rua Exemplo, 123 — Centro');
  assert.equal(dados.openingHours, 'Seg a Sáb, 9h às 19h');
  assert.equal(dados.telephone, '+5511999998888');
});

test('um "</script" dentro de um nome de serviço não fecha o bloco ld+json prematuramente', () => {
  const c = structuredClone(conteudo);
  c.categorias = [{
    nome: 'Teste',
    servicos: [{
      id: 'teste',
      nome: '</script><img onerror=x>',
      detalhe: null,
      preco: 10,
      foto: null
    }]
  }];
  const html = metaTags(c, 'https://x.com');

  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(m, 'o bloco ld+json precisa continuar sendo encontrado inteiro, sem cortar no meio');
  assert.ok(!m[1].includes('</script'), 'o conteúdo serializado não pode conter "</script" literal');

  const dados = JSON.parse(m[1]);
  assert.equal(dados.makesOffer[0].name, '</script><img onerror=x>');
});
