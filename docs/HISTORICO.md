# Histórico do site institucional

Este arquivo registra alterações publicadas no site que precisam ser fáceis de localizar no futuro. Para detalhes operacionais do painel administrativo, consulte `docs/PAINEL.md`.

## 20/08/2026 — História da Caroline Georgiutti

### Objetivo

Adicionar ao site a história da fundadora Caroline Georgiutti junto com a foto enviada pelo usuário, preservando o relato em primeira pessoa e mantendo o padrão visual da landing page.

### Implementação

- A nova seção `#historia` fica logo após o hero.
- O menu ganhou o item “História”.
- O layout usa duas colunas no desktop e fluxo vertical no celular.
- A abertura e a frase de destaque ficam sempre visíveis.
- O restante do relato está em um elemento nativo `<details>`, acionado por “Conheça a história completa”. Todo o texto continua presente no HTML para acessibilidade e indexação.
- A foto final é exatamente o PNG anexado pelo usuário, sem geração, retoque ou substituição das fotos existentes das profissionais.

### Arquivos principais

- Texto-fonte: `História da Caroline.txt`
- Conteúdo estruturado: `conteudo.json`, propriedade `historia`
- Foto: `fotos/caroline-historia.png` — 640×640, 555.263 bytes
- Renderização: `build/secoes.js`, função `secaoHistoria`
- Montagem do build: `build.js`, marcador `HISTORIA`
- Layout e responsividade: `template.html`
- Validação: `build/validar.js`
- Cobertura: `test/build.test.js`, `test/conteudo.test.js` e `test/validar.test.js`

### Decisões editoriais

- O sobrenome foi padronizado para “Georgiutti”, conforme o nome já confirmado e usado no restante do site.
- A repetição “conseguir conquistar” foi reduzida para “conseguir”.
- O relato foi mantido integralmente; apenas sua apresentação foi dividida entre abertura, destaque e conteúdo expansível.

### Validação e publicação

- Testes: 70/70 aprovados.
- Build: `node build.js` concluído sem erros.
- Commit da funcionalidade: `07f9464` — `feat: adiciona historia da Caroline ao site`.
- Branch: `main`.
- Deploy Vercel: `dpl_4rDpuEqhdZZwG1Uik1eiq7nFmhU8`, estado `READY`.
- Produção verificada com HTTP 200 em:
  - `https://co-centrodebeleza.com.br`
  - `https://www.co-centrodebeleza.com.br`
  - `https://co-centrodebeleza.vercel.app`
- O HTML publicado foi conferido quanto ao título, ao texto completo e à referência `fotos/caroline-historia.png`.
- A imagem publicada respondeu como `image/png` com 555.263 bytes.

### Limitação da conferência

A inspeção visual automatizada em navegador não foi executada porque não havia navegador integrado conectado na sessão. A entrega foi validada por testes, build, inspeção estrutural do HTML/CSS e respostas HTTP em produção.

### Aprovações

O usuário aprovou separadamente o commit da funcionalidade e sua publicação em produção.
