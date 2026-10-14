import { readContent } from './read-content';
import { preparePosts } from './posts';
const gallery = await preparePosts();
const c = readContent(gallery.categories);
console.log(
  `Conteúdo válido: ${c.days.length} dias, ${c.trip.cities.length} cidades, ${c.places.length} locais, ${c.posts.length} categorias de posts e ${c.posts.reduce((sum, category) => sum + category.images.length, 0)} imagens. China e Japão incluídos. Versão ${c.trip.contentVersion}.`,
);
