# Mapa do roteiro

Base local: Natural Earth, camada de terra 1:110m, domínio público. Fonte: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson ; licença: https://www.naturalearthdata.com/about/terms-of-use/ . A cópia em src/assets/land.json contém somente polígonos, com precisão reduzida a três casas decimais. Não representa limites políticos, ruas ou caminhos navegáveis.

Referências aproximadas WGS84 das cidades: Wikidata P625, consultado em 31/10/2026. Cada `trip.cities[].mapPosition.source` aponta ao item correspondente. São referências cartográficas da cidade, não hotéis, aeroportos ou estações. Não se propagam aos links Apple/AMap/Baidu nem aos locais de embarque.

O mapa deriva seus pontos dos dias e extremos de transportes, as linhas dos transportes não cancelados, e as lacunas do intervalo geral. Não conecta automaticamente dias sucessivos nem inventa trajetos para preencher lacunas. A base e os dados estão no bundle; não há download de mapas/geocodificação em runtime.

Atualização: manter `mapPosition` ao cadastrar uma cidade. Uma cidade sem coordenada continua disponível no roteiro e aparece no aviso de posições ausentes. Alterar dias/transportes atualiza o mapa na publicação seguinte, sem catálogo paralelo.
