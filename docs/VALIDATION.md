# Verificação do plano atual

Atualização em 14/10/2026 a partir dos dados fornecidos pelo mantenedor.

## Conteúdo

- 11 dias registrados, 7 cidades, 7 locais e 3 hospedagens. Limites confirmados: 29/12/2026 a 28/01/2027; programação parcial preservada.
- Seis voos do bilhete confirmados para os quatro viajantes: QR7251, QR774, QR892, QR809, QR785, QR4834. Horários locais e durações conferidos entre Brasil, Doha, China e Japão.
- Conexões calculadas: GRU 9h35, DOH 4h25 na ida; DOH 45 minutos e GRU 1h45 na volta. Trocas de terminal em GRU 2→3 e 3→2.
- Beijing Daxing (PKX), Haneda (HND) e Narita (NRT) são aeroportos distintos. Economy, 2 volumes por passageiro, peso desconhecido. Operação LATAM nos trechos domésticos.
- Recibo integral, número de passageiro frequente e códigos tarifários não armazenados.
- Pan Pacific Beijing: 4 noites, de 31/12/2026 a 04/01/2027; check-in a partir das 15h e checkout até 12h, fuso Asia/Shanghai. Endereço/telefone da reserva correspondem ao [site oficial](https://www.panpacific.com/zh/hotels-and-resorts/pp-beijing/the-hotel.html), usado para nome e endereço em chinês.
- Hotel associado somente às quatro noites; 04/01 tem checkout sem pernoite presumido. Transfer de Daxing e continuação não definidos. Valores, política financeira e contato privado excluídos.
- Dia 18/01: voo Shanghai → Haneda e pernoite confirmado no Ueno Woo Hotel, dois quartos Double Room, sem refeições. Check-in 15h–21h; checkout até 11h de 19/01. Endereço/telefone conferidos no [site do hotel](https://ueno-woo-hotel.mydirectstay.com/contact-us.html). Nome da hóspede, valores e dados de pagamento não publicados.
- Dia 19/01: Joetsu Shinkansen e início de resort reservado.
- No resort de Echigo-Yuzawa, `booked` foi normalizado para `confirmed`; nome/endereço/checkout continuam nulos.
- Aeroporto em Shanghai, estação de Tokyo, horários de 18–19/01 e programação dos dias sem registro permanecem desconhecidos.
- Nenhum horário de demonstração, hotel fictício, retorno presumido ou alternativa antiga entra no conteúdo publicado.
- A fixture anterior fica isolada em `tests/fixtures/` e não é importada pela aplicação.

## Verificações

Resultado local: 57 testes Vitest e 16 testes Playwright aprovados, além de lint, validação e build. Preview local atualizado e conferido visualmente. A opção `overnightInTransit` distingue noites em voo/conexão de hospedagem pendente. Aplicada a 29/12/2026, 30/12/2026 e 27/01/2027; impede hotel simultâneo e mantém os demais pernoites.

Lint e TypeScript strict; YAML, schemas e referências; Vitest com fixture completa e plano parcial; build e auditoria de assets locais. Os testes de conteúdo verificam a diferença entre limite geral e data de um dia registrado, reserva confirmada sem nome e local de embarque desconhecido sem perder a validação de IDs reais.

Playwright em Chromium e WebKit com viewport de iPhone: navegação por todos os dias/cidades registrados, detalhes de voo/trem/hotel, endereços japonês e chinês, busca local, ausência de dependências externas, reabertura sem rede, recuperação de entradas/caches, atualização interrompida, atualização explícita e rollback. A suíte verifica os dados dos voos e conexões em modo offline, além do resort sem nome e a cópia desabilitada quando não há nome/endereço real.

## Limites

Não foi realizado teste em iPhone físico. A instalação Home Screen, abertura no iOS real em modo avião, clipboard e comportamento dos aplicativos externos de mapas devem ser verificados nos quatro aparelhos conforme README. URLs de busca não comprovam o endereço exato de um estabelecimento; o resort não gera mapa enquanto seus dados não forem registrados.

Perda total de armazenamento da origem pelo WebKit exige rede para reinstalar. A redundância cobre a perda de uma entrada ou cache enquanto alguma cópia do conteúdo essencial permanece.

## Regressão de atualização WebKit
A inspeção de atualização encontrou entradas ausentes em gravações individuais do cache. A instalação passou a usar lotes atômicos `Cache.addAll`, URLs com versão e releitura completa das duas cópias antes de oferecer o worker. O teste continua exigindo interrupção, reabertura offline, atualização e rollback; não foi removido ou dispensado.

## Estado da publicação

Repositório público novamente por solicitação do mantenedor. GitHub Pages reativado com build por GitHub Actions; `deploy.yml` publica a `main` após aprovação do job de validação.
