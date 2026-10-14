# Verificação do plano atual

Atualização em 14/10/2026 a partir dos dados fornecidos pelo mantenedor.

## Conteúdo

- 24 dias registrados, 11 cidades, 34 locais e 8 hospedagens (3 confirmadas, 5 propostas ainda sem nome). Limites confirmados: 29/12/2026 a 28/01/2027; programação parcial preservada.
- Seis voos do bilhete confirmados para os quatro viajantes: QR7251, QR774, QR892, QR809, QR785, QR4834. Horários locais e durações conferidos entre Brasil, Doha, China e Japão.
- Conexões calculadas: GRU 9h35, DOH 4h25 na ida; DOH 45 minutos e GRU 1h45 na volta. Trocas de terminal em GRU 2→3 e 3→2.
- Beijing Daxing (PKX), Haneda (HND) e Narita (NRT) são aeroportos distintos. Economy, 2 volumes por passageiro, peso desconhecido. Operação LATAM nos trechos domésticos.
- Recibo integral, número de passageiro frequente e códigos tarifários não armazenados.
- Pan Pacific Beijing: 4 noites, de 31/12/2026 a 04/01/2027; check-in a partir das 15h e checkout até 12h, fuso Asia/Shanghai. Endereço/telefone da reserva correspondem ao [site oficial](https://www.panpacific.com/zh/hotels-and-resorts/pp-beijing/the-hotel.html), usado para nome e endereço em chinês.
- Hotel associado somente às quatro noites; 04/01 tem checkout sem pernoite presumido. Transfer de Daxing não definido; continuação proposta por trem para Xi’an. Valores, política financeira e contato privado excluídos.
- Dia 18/01: voo Shanghai → Haneda e pernoite confirmado no Ueno Woo Hotel, dois quartos Double Room, sem refeições. Check-in 15h–21h; checkout até 11h de 19/01. Endereço/telefone conferidos no [site do hotel](https://ueno-woo-hotel.mydirectstay.com/contact-us.html). Nome da hóspede, valores e dados de pagamento não publicados.
- Dia 19/01: Joetsu Shinkansen e início de resort reservado.
- No resort de Echigo-Yuzawa, `booked` foi normalizado para `confirmed`; nome/endereço/checkout continuam nulos.
- Aeroporto em Shanghai, estação de Tokyo, horários de 18–19/01 e programação dos dias sem registro permanecem desconhecidos.
- Nenhum horário de demonstração, hotel fictício, retorno presumido ou alternativa antiga entra no conteúdo publicado.
- A fixture anterior fica isolada em `tests/fixtures/` e não é importada pela aplicação.

## Verificações

Resultado local: 90 testes Vitest e 40 testes Playwright aprovados, além de lint, validação e build. Fallback web exercitado em Chromium e WebKit, na mesma janela, com iPadOS e standalone simulados. URLs nativas AMap/Baidu, detecção de iOS/iPadOS, fallback de 1,5 s, cancelamento ao ocultar/sair, cliques repetidos/modificados e preservação do Apple Maps cobertos por testes. Standalone simulado não equivale a instalação na Tela de Início; handoff para apps nativos em iPhone físico continua pendente.

Lint e TypeScript strict; YAML, schemas e referências; Vitest com fixture completa e plano parcial; build e auditoria de assets locais. Os testes de conteúdo verificam a diferença entre limite geral e data de um dia registrado, reserva confirmada sem nome e local de embarque desconhecido sem perder a validação de IDs reais.

Playwright em Chromium e WebKit com viewport de iPhone: navegação por todos os dias/cidades registrados, detalhes de voo/trem/hotel, endereços japonês e chinês, busca local, ausência de dependências externas, reabertura sem rede, recuperação de entradas/caches, atualização interrompida, atualização explícita e rollback. A suíte verifica os dados dos voos e conexões em modo offline, além do resort sem nome e a cópia desabilitada quando não há nome/endereço real.

## Calendário

Visão mensal em Viagem com alternância para lista; 31 datas dentro dos limites gerais e 24 dias registrados, preservando as sete lacunas de 20–26/01. Janeiro é o mês inicial por conter a maior parte da viagem. Sem duplicação de dados ou mudanças nas reservas.

Cobertura: virada de ano, alinhamento dos dias da semana, fevereiro bissexto, limites gerais nulos, seleção persistida na URL, resumo de lacunas sem links inválidos, voo planejado junto a hotel confirmado, noites em trânsito, troca de mês, navegação para os detalhes, reabertura offline em subpasta e ausência de overflow em 320 px. Inspeção visual em desktop e mobile; abreviações e legenda mantêm os nomes legíveis em telas estreitas. Chromium e WebKit simulados, sem teste em iPhone físico.

## Posts

Menu com seis destinos, galeria por pasta/categoria, opção Todos, contagem, categoria vazia, legenda derivada do arquivo e leitura com ampliação. Dez categorias criadas para países/cidades; três prints enviados pelo mantenedor estão em `data/posts/Japão`. Nenhuma imagem demonstrativa foi inserida no conteúdo operacional.

Pipeline de build com Sharp para JPG/JPEG/PNG/WebP: orientação, compressão WebP, largura máxima 1600 px sem recorte/ampliação, remoção de metadados na cópia publicada, nomes de assets por hash e validação do catálogo antes da UI. Originais ficam fora do bundle e permanecem no Git. Orçamentos separados: aplicação 2 MB; galeria 30 MB; imagem otimizada 1,9 MB; origem 20 MB.

Vitest cobre ordenação/categorias vazias, legendas, deduplicação, redução sem recorte, metadados, troca de URL ao substituir uma imagem, formatos inválidos/corrompidos e validação de URLs/IDs. E2E Chromium/WebKit cobre filtro, retorno ao filtro ou Todos, ampliação, URL inválida, reabertura offline de imagens nunca visitadas, recuperação de cache de imagem, 320 px e atualização interrompida/ativação explícita/rollback entre o catálogo operacional e o catálogo isolado de teste. Imagens demonstrativas existem somente em `.qa-builds/`, nunca em `data/` ou no `dist/` publicado. Inspeção visual desktop/mobile aprovada. Upload pelo GitHub documentado em `data/posts/README.md`; sem backend de upload ou dependência do Instagram.

## Swipe de Posts

A página de leitura permite swipe horizontal entre os prints do filtro atual, botões Anterior/Próxima, contador e setas do teclado quando a imagem está focada. Não há retorno circular ao chegar às extremidades. Cada troca substitui a URL atual; Voltar aos posts preserva a categoria ou Todos.

Gestos verticais, curtos, multitoque, cancelamento, ampliação para tamanho original e zoom da página não devem trocar o print. `touch-action: pan-y pinch-zoom` conserva rolagem vertical e pinça no modo ajustado; a imagem ampliada permite pan nativo. Referência: [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action).

E2E cobre direção, escopo da categoria/Todos, limites, botões, teclado, cancelamento/multitoque/rolagem, zoom do visualizador, navegação offline, persistência ao recarregar e largura de 320 px. Os eventos de toque são simulados no DOM em Chromium/WebKit; não comprovam o gesto físico em iPhone ou no PWA instalado. Verificar swipe, pinça e rolagem no aparelho permanece parte da validação manual.

## Regressão de upload

A publicação dos primeiros prints foi bloqueada por testes que presumiam galeria operacional vazia. Os testes agora derivam categorias, quantidade, IDs e assets dos arquivos enviados, sem exigir zero imagens ou categorias específicas vazias. A cobertura verifica também abertura de imagem real, preservação do catálogo durante instalação interrompida e retorno ao catálogo correto após rollback. Novos uploads não exigem editar testes.

## Limites

Não foi realizado teste em iPhone físico. A instalação Home Screen, abertura no iOS real em modo avião, clipboard e comportamento dos aplicativos externos de mapas devem ser verificados nos quatro aparelhos conforme README. URLs de busca não comprovam o endereço exato de um estabelecimento; o resort não gera mapa enquanto seus dados não forem registrados.

Perda total de armazenamento da origem pelo WebKit exige rede para reinstalar. A redundância cobre a perda de uma entrada ou cache enquanto alguma cópia do conteúdo essencial permanece.

## Regressão de atualização WebKit
A inspeção de atualização encontrou entradas ausentes em gravações individuais do cache. A instalação passou a usar lotes atômicos `Cache.addAll`, URLs com versão e releitura completa das duas cópias antes de oferecer o worker. O teste continua exigindo interrupção, reabertura offline, atualização e rollback; não foi removido ou dispensado.

## Estado da publicação

Repositório público novamente por solicitação do mantenedor. GitHub Pages reativado com build por GitHub Actions; `deploy.yml` publica a `main` após aprovação do job de validação.
