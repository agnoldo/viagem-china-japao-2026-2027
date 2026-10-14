# Instruções para manutenção

## Objetivo
PWA familiar de consulta para China/Japão em 2027. Viagem de 29/12/2026 a 28/01/2027; seis voos confirmados para os quatro viajantes. Plano parcial: chegada a Daxing em 31/12, 18/01 Tokyo/Haneda, 19/01 início do resort em Echigo-Yuzawa, retorno por Narita em 27/01. Há lacunas na programação. Confiabilidade offline e leitura no iPhone são prioritárias. Um mantenedor edita YAML no Git; os outros viajantes apenas consultam.

## Comunicação
Responder em português, sem enfeites. Linguagem direta. Entregar resultado, verificações e limitações materiais. Não pedir confirmação para decisões técnicas triviais já delegadas.

## Comandos
`npm ci`, `npm run dev`, `npm run lint`, `npm run validate:content`, `npm test`, `npm run build`, `npm run preview`, `npm run test:e2e`. Node 22.12+. Para navegador, `npx playwright install chromium webkit` (Linux pode exigir `--with-deps`).

## Estrutura e separação
`data/` contém os fatos da viagem; `src/content/` contém schemas e validação; `src/features/` contém telas; `src/lib/` contém lógica pura e PWA; `src/sw.ts` contém o SW; `public/icons/` contém assets. Não embutir hotéis, endereços, horários ou atividades concretos nos componentes. Dados novos devem passar por `validateContent` antes de chegar à UI. Não adicionar fetch para arquivos YAML em runtime.

## Edição de conteúdo
- Cidade: adicionar em `trip.yaml > cities`, com ID único, região, país, nomes, datas, status e fuso IANA.
- Região: adicionar em `trip.yaml > regions` e referenciar seu ID na cidade/dia.
- Dia: editar/criar `data/days/YYYY-MM-DD.yaml`. Nome deve coincidir com `date`; `itineraryCoverage: partial` permite mostrar somente os dias registrados, mesmo com limites conhecidos; `complete` exige todos os dias do intervalo.
- Hotel: copiar item de `hotels.yaml`, preencher endereço local real, horários e status, associar `hotelId` nos dias da mesma cidade.
- Local: adicionar em `places.yaml`; aeroportos e estações são entidades próprias, com IDs distintos da cidade.
- Voo/trem: adicionar no arquivo próprio, com cidades obrigatórias, local de aeroporto/estação nullable se desconhecido, datas/horários/fusos independentes e instrução offline. Não substituir estação por nome de cidade.
- Conexões: usar `nextFlightId`, no mesmo aeroporto; duração calculada pelos fusos. `airline` é comercializadora, `operatedBy` é operadora. Não presumir peso da bagagem quando só há número de volumes.
- Atividade: ID único, título, tipo e status obrigatórios. Horário pode ser omitido. `travelBufferMinutes` inclui trajeto e antecedência total até a atividade.
- Alternativa: `trip.alternatives`, status `undecided`, opções `optional`, `cityIds` existentes. Dias apontam para `alternativeId`; não apresentar as duas opções como compromissos confirmados.
- Ao decidir alternativa: atualizar dias, hotéis e transportes; retirar referências de decisão aberta resolvida. Preservar histórico pelo Git.
- Atualizar `contentVersion` com data real da edição. Validar antes do commit.

## Não inventar reservas
Usar `status: example` em demonstrações. Se não há hotel, número, preço, terminal, horário ou compra confirmada, manter informação vazia ou pendente com explicação. Um local desconhecido deve ser null. `booked` fornecido pelo usuário vira `confirmed`, sem preencher nome/endereço/horários de uma reserva incompleta. Datas de check-in/checkout são independentes. Não confirmar disponibilidade de ligação direta pelo fato de um trecho existir no YAML.

## Fusos
China `Asia/Shanghai`; Japão `Asia/Tokyo`; Brasil `America/Sao_Paulo`; Catar `Asia/Qatar`. Nunca usar o fuso do servidor/dispositivo como único critério para o dia da viagem. Preservar a estratégia de cidade-base em `src/lib/time.ts` e os testes de virada de dia. Cada lado do transporte mantém seu horário local.

## Mapas chineses
Manter WGS84, GCJ-02 e BD-09 separados. Nunca presumir equivalência ou enviar WGS84 como coordenada AMap/Baidu. Preferir nome chinês, endereço local, cidade e URL específica de POI validada. Não usar geocodificação em runtime. Apple Maps sempre disponível quando houver dado útil; AMap/Baidu quando configurados. Sem link, endereço e instrução textual precisam continuar funcionando. Adaptadores adicionais em `features/maps/links.ts`; `mapLinks` aceita chaves de provedores sem redesenhar as entidades.

## Privacidade e rede
Sem backend, API própria, autenticação, analytics, CDN, Google Fonts ou APIs externas em runtime. Mapas são links externos voluntários. Não publicar documentos, localizadores de reserva, QR privados, passaportes, cartões informação médica, número de passageiro frequente ou dados tarifários do recibo. `bookingReferenceHint` só aceita null. Documentos privados pertencem ao Apple Notes/iCloud Drive, sem integração.

## Service Worker
O plugin injeta a lista do build em `src/sw.ts`. Não editar `dist/sw.js`. Não ativar novas versões automaticamente ou instalar conteúdos novos em chaves antigas. Manter caches por escopo e hash, cópias `main`/`rescue`, instalação integral antes de ativar e botão explícito de atualização. Não adicionar limpeza global de CacheStorage. Uma mudança de SW/cache exige teste de perda de entrada/cache, instalação interrompida, atualização e rollback em `tests/e2e/`.

## Critérios de aceitação
Executar lint, validação, testes e build. Confirmar todos os dias registrados e ambos os países no bundle, limites conhecidos conferidos e lacunas parciais preservadas e alternativas opcionais somente quando informadas, horários locais, endereços legíveis/copiáveis e nenhuma dependência remota essencial. Testar subpasta e reabertura sem rede com SW real. Manter README e `docs/VALIDATION.md` atualizados. Não declarar teste em iPhone físico com base somente em emulação ou WebKit desktop. Explicar perda total de armazenamento como limite real.

## Publicação
`ci.yml` valida PRs e é reutilizado por `deploy.yml`; somente `main` publica Pages. Preservar `base: './'` ou prefixo configurado via `BASE_PATH`. `HashRouter` evita rotas profundas. Não trocar Pages pelo serviço de outro plugin sem pedido. O segundo endereço é uma publicação estática independente, com instalação/cache próprios.

## Fixtures
`tests/fixtures/full-plan.json` é o roteiro demonstrativo anterior, usado apenas em testes. Nunca importar essa fixture pela UI ou copiá-la para `data/` como plano real. Testes E2E percorrem dinamicamente o conteúdo operacional; testes de regressão verificam limites nulos, lugares desconhecidos e reserva sem detalhes.
