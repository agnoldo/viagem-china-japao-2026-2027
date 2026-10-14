# Verificação do plano atual

Atualização em 14/10/2026 a partir dos dados fornecidos pelo mantenedor.

## Conteúdo

- 2 dias registrados, 3 destinos (Shanghai, Tokyo, Echigo-Yuzawa), 2 locais (Haneda e estação Echigo-Yuzawa).
- Dia 18/01: voo Shanghai → Haneda e pernoite em Tokyo, hospedagem indefinida.
- Dia 19/01: Joetsu Shinkansen e início de resort reservado.
- `booked` normalizado para `confirmed`; nome/endereço/checkout continuam nulos.
- Datas gerais da viagem, aeroporto em Shanghai, estação de Tokyo, horários e destinos posteriores permanecem desconhecidos.
- Nenhum horário de demonstração, hotel fictício, retorno presumido ou alternativa antiga entra no conteúdo publicado.
- A fixture anterior fica isolada em `tests/fixtures/` e não é importada pela aplicação.

## Verificações

Resultado local: 48 testes Vitest e 14 testes Playwright aprovados, além de lint, validação e build.

Lint e TypeScript strict; YAML, schemas e referências; Vitest com fixture completa e plano parcial; build e auditoria de assets locais. Os testes de conteúdo verificam a diferença entre limite geral e data de um dia registrado, reserva confirmada sem nome e local de embarque desconhecido sem perder a validação de IDs reais.

Playwright em Chromium e WebKit com viewport de iPhone: navegação por todos os dias/cidades registrados, detalhes de voo/trem/hotel, endereço japonês, busca local, ausência de dependências externas, reabertura sem rede, recuperação de entradas/caches, atualização interrompida, atualização explícita e rollback. A suíte também verifica o resort sem nome e a cópia desabilitada quando não há nome/endereço real.

## Limites

Não foi realizado teste em iPhone físico. A instalação Home Screen, abertura no iOS real em modo avião, clipboard e comportamento dos aplicativos externos de mapas devem ser verificados nos quatro aparelhos conforme README. URLs de busca não comprovam o endereço exato de um estabelecimento; o resort não gera mapa enquanto seus dados não forem registrados.

Perda total de armazenamento da origem pelo WebKit exige rede para reinstalar. A redundância cobre a perda de uma entrada ou cache enquanto alguma cópia do conteúdo essencial permanece.

## Regressão de atualização WebKit
A inspeção de atualização encontrou entradas ausentes em gravações individuais do cache. A instalação passou a usar lotes atômicos `Cache.addAll`, URLs com versão e releitura completa das duas cópias antes de oferecer o worker. O teste continua exigindo interrupção, reabertura offline, atualização e rollback; não foi removido ou dispensado.
