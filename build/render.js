const MOEDA = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

// Regra global do projeto: todo valor exibido é "a partir de".
export function formatarPreco(valor) {
  return `a partir de R$ ${MOEDA.format(valor)}`;
}

// Devolve null quando ainda não temos o número do salão, para que o build
// consiga gerar preview antes da reunião sem inventar um telefone.
export function linkWhatsapp(numero, nomeItem) {
  if (!numero) return null;
  const texto = `Olá! Vim pelo site e quero agendar: ${nomeItem}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export function esc(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
