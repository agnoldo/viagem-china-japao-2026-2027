import { readContent } from './read-content';
const c = readContent();
console.log(
  `Conteúdo válido: ${c.days.length} dias, ${c.trip.cities.length} cidades, ${c.places.length} locais. China e Japão incluídos. Versão ${c.trip.contentVersion}.`,
);
