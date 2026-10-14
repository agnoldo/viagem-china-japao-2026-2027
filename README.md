# China e Japão 2027

[Abrir a aplicação](https://agnoldo.github.io/viagem-china-japao-2026-2027/) · [Repositório](https://github.com/agnoldo/viagem-china-japao-2026-2027)

PWA familiar de consulta, offline-first, para China e Japão em 2027. Quatro viajantes, quatro iPhones, um mantenedor dos dados.

Repositório público, com publicação no GitHub Pages por GitHub Actions após aprovação das verificações.

## Plano atual

- **29–31/12/2026:** Belo Horizonte (CNF) → Guarulhos (GRU) → Doha (DOH) → Beijing Daxing (PKX). Voos QR7251, QR774 e QR892 confirmados para os quatro viajantes.
- **31/12/2026–04/01/2027:** Pan Pacific Beijing confirmado, 4 noites para a família. Check-in a partir das 15h; checkout até 12h, no fuso `Asia/Shanghai`. Nome e endereço em chinês conferidos no [site oficial](https://www.panpacific.com/zh/hotels-and-resorts/pp-beijing/the-hotel.html) pela correspondência de endereço e telefone. Transfer de Daxing ainda indefinido; trem para Xi’an proposto em 04/01.
- **China, proposta de roteiro:** Beijing 31/12–04/01 → Xi’an 04–06/01 → Chengdu 06–09/01 → Chongqing 09–11/01 → Zhangjiajie 11–14/01 → Shanghai 14–18/01. Inclui quatro trens planejados, voo doméstico Zhangjiajie–Shanghai e passeios com horários sugeridos. Hotéis após Beijing ainda sem nome ou reserva.
- **18/01/2027:** Shanghai → Tokyo Haneda; pernoite confirmado no Ueno Woo Hotel, 1 noite em 2 quartos Double Room, sem refeições. Check-in 15h–21h; checkout em 19/01 até 11h. Endereço e telefone conferidos no [site do hotel](https://ueno-woo-hotel.mydirectstay.com/contact-us.html). Voo ainda planejado, sem aeroporto de origem ou horários registrados.
- **19/01/2027:** Tokyo → Echigo-Yuzawa pelo Joetsu Shinkansen; início da hospedagem em resort reservado, ainda sem nome registrado.
- **27–28/01/2027:** Tokyo Narita (NRT), terminal 2 → Doha → Guarulhos → Belo Horizonte. Voos QR809, QR785 e QR4834 confirmados para os quatro viajantes.
- **Conexões:** ida GRU 9h35 (terminal 2 → 3), DOH 4h25; volta DOH **45 minutos**, GRU 1h45 (terminal 3 → 2). A conexão curta recebe destaque; confirmar orientações com Qatar e LATAM.
- Limites da viagem: **29/12/2026 a 28/01/2027**, com **24 dias registrados**. `itineraryCoverage: partial` preserva as lacunas sem inventar estadias ou atividades.
- Estação de embarque em Tokyo, nome/endereço/checkout do resort, horários dos transportes de 18–19/01 e programação japonesa de 20–26/01 permanecem **não informados**.
- Bilhete: cabine Economy e 2 volumes despachados por passageiro, peso não informado. Os dois voos domésticos são comercializados pela Qatar e operados pela LATAM. Número de passageiro frequente, dados tarifários e recibo integral não são publicados.

A informação `booked` recebida foi normalizada para `confirmed`, status já usado no projeto. Isso confirma a reserva informada, não preenche os detalhes ausentes. Nenhum horário ou estabelecimento foi inventado.

A atualização foi limitada à China do arquivo `roteiro-completo-proposto-china-japao-2027.yaml`. Os passeios de Beijing constam como locais propostos, sem horários atribuídos aos dias 01–03/01, que vieram vazios no arquivo. Propostas japonesas adicionais do arquivo não foram incorporadas nesta atualização.

O roteiro demonstrativo anterior está apenas em `tests/fixtures/full-plan.json`, para regressões de datas, alternativas e mapas chineses. Não entra no bundle da PWA. O histórico completo permanece no Git.

## Arquitetura e decisões

- React + Vite + TypeScript strict, React Router com `HashRouter`, CSS local e ícones SVG empacotados.
- YAML em `data/`, schemas Zod e referências validados antes de o conteúdo chegar aos componentes. Todos os arquivos operacionais em `data/` são importados de forma eager no build, sem download posterior de dias ou países.
- Manifest e Service Worker com `vite-plugin-pwa` em `injectManifest`. A política de cache própria permite recuperação redundante e atualização por consentimento no aplicativo.
- Nenhum backend, autenticação, API de conteúdo, banco remoto, analytics, CDN, fonte remota ou imagem externa. A rede só é necessária para instalar/atualizar e abrir mapas externos.
- Tipografia do sistema do iPhone; ícones PNG locais. Sem fotos: o pacote offline completo tem aproximadamente 604 KiB, antes de gzip, com limite automático de 2 MB. A cópia redundante usa aproximadamente o dobro; durante uma atualização há também caches da versão anterior.
- `base: './'` por padrão: funciona na raiz e em subpastas, incluindo repositórios GitHub Pages. `BASE_PATH=/repositorio/ npm run build` permite prefixo explícito. Use o mesmo prefixo no preview se escolher um base absoluto. Hashes evitam 404 nas páginas internas.
- `localStorage` serve apenas para último dia consultado; ausência, bloqueio ou corrupção não impedem a consulta. A abertura de Hoje usa sempre o dia automático; Mais oferece a última consulta.

## Requisitos e instalação

Node.js 22.12+ e npm. Versão recomendada em `.nvmrc`. Dependências fixadas em `package-lock.json`.

```bash
npm ci
npm run dev
```

Servidor local: endereço impresso pelo Vite. O modo dev não instala Service Worker; use o build para verificar offline.

## Comandos

| Comando | Função |
| --- | --- |
| `npm run format` | Formatar código e YAML com Prettier |
| `npm run dev` | Desenvolvimento com recarga |
| `npm run lint` | ESLint, TypeScript da aplicação e do SW |
| `npm run validate:content` | YAML, schemas, IDs e referências |
| `npm test` | Testes de comportamento com Vitest |
| `npm run build` | Validação, TypeScript, build PWA e auditoria dos assets |
| `npm run preview` | Publicação local do build em `dist/` |
| `npx playwright install chromium webkit` | Navegadores para testes |
| `npm run test:e2e` | Navegação e offline em Chromium/WebKit, incluindo iPhone simulado |

Em Linux, a instalação dos navegadores pode precisar de `npx playwright install --with-deps chromium webkit`. Não instale navegadores para usuários finais; isto serve apenas para QA.

## Estrutura

```text
src/app/                  Shell, rotas e navegação
src/components/           Componentes comuns e status
src/features/today/       Dia, próxima atividade e saída
src/features/itinerary/   Timeline e alternativas
src/features/cities/      Diretório e agregadores
src/features/logistics/   Voos, trens, hotéis e locais
src/features/maps/        Links externos e endereço grande
src/content/              Schemas, validação, importação e índices
src/lib/                  Fusos, preferências, cache e PWA
src/styles/               CSS responsivo
src/sw.ts                 Service Worker
public/icons/             Ícones instaláveis, locais
data/trip.yaml            Viagem, regiões, cidades, alternativas e informações úteis
data/places.yaml          Atrações, aeroportos e estações
data/hotels.yaml          Hospedagens
data/flights.yaml         Voos
data/trains.yaml          Trens
data/transfers.yaml       Outros trechos
data/days/YYYY-MM-DD.yaml Um arquivo por dia
scripts/                  Validação e auditoria do build
tests/                    Testes unitários e testes de navegador em e2e/
docs/VALIDATION.md         Evidências e limites da verificação
.github/workflows/        Validação e publicação
```

Regiões, cidades e alternativas ficam em `trip.yaml` para reduzir arquivos pequenos e manter a visão geral editável. Os componentes contêm textos de interface; datas, lugares, compromissos e instruções da viagem pertencem a `data/`.

## Como editar o conteúdo

Edite YAML em UTF-8. Use aspas em datas e horários. Não duplique chaves. Há exemplos completos válidos em todos os arquivos; copie uma entidade equivalente e troque seu ID. IDs são únicos no projeto, inclusive IDs de atividades e opções. Os schemas são estritos: campos desconhecidos provocam erro.

Depois de qualquer mudança:

```bash
npm run validate:content
npm run lint
npm test
npm run build
npm run preview
```

Atualize `contentVersion` em `trip.yaml` com a data real da edição, sem usar datas futuras. O SW detecta mudança de bytes do build mesmo se o mantenedor esquecer de alterar essa data, mas o texto exibido depende dela.

### Adicionar uma cidade ou região

Em `trip.yaml`, adicione uma região em `regions` se necessário e uma cidade em `cities`:

```yaml
id: nova-cidade
regionId: japan
country: JP
name:
  default: Nova cidade
  local: null
aliases: []
timezone: Asia/Tokyo
startDate: '2027-01-22'
endDate: '2027-01-24'
status: optional
notes: Possibilidade em avaliação.
```

Use o nome local real quando conhecido. Defina datas dentro da viagem. China usa `Asia/Shanghai`, Japão `Asia/Tokyo`, Brasil `America/Sao_Paulo` e Catar `Asia/Qatar`. O status de uma cidade não confirma hotéis ou bilhetes.

### Adicionar ou editar um dia

Edite ou crie `data/days/YYYY-MM-DD.yaml`. O nome do arquivo deve coincidir com `date`. `trip.startDate` e `trip.endDate` podem ser `null`: nesse caso só os dias registrados aparecem. `itineraryCoverage: partial` também permite lacunas com limites conhecidos; `complete` exige todos os dias do intervalo. Não completar lacunas com informações presumidas.

```yaml
date: '2027-01-23'
cityId: tokyo
regionId: japan
summary: Programação a definir
status: undecided
notes: Exemplo de estrutura; não faz parte do plano publicado.
activities: []
```

`overnightInTransit: true` indica noite em voo/conexão: a tela mostra “Noite em trânsito” sem pendência ou link de hospedagem. Aplicado a 29/12, 30/12 e 27/01. O padrão é `false`; omitir hotel sem essa opção continua significando hospedagem a definir. Não combinar `overnightInTransit: true` com `hotelId` da noite.

`hotelId` é opcional. Não associe um hotel de outra cidade. Ao confirmar uma alternativa, atualize os dias, hotéis e deslocamentos correspondentes; não deixe a base de referência Tokyo parecer uma estadia comprada.

### Adicionar atividades

Dentro de `activities`:

```yaml
- id: tokyo-20270123-example-walk
  title: Passeio de exemplo
  type: walk
  status: example
  time: '10:00'
  endTime: '11:30'
  timezone: Asia/Tokyo
  travelBufferMinutes: 30
  notes: Horário demonstrativo; validar antes de usar.
```

Horário é opcional: omita para programação ainda aberta. Tipos: `flight`, `train`, `transfer`, `metro`, `bus`, `taxi`, `walk`, `attraction`, `meal`, `hotel`, `free-time`, `note`. Pode referenciar `placeId`, `hotelId` ou `transportId` existente. Evite agendas noturnas atravessando meia-noite na mesma atividade: divida pelos dias correspondentes.

O próximo compromisso exclui `optional` e `cancelled`, e ignora itens sem horário. Exemplos com horário aparecem com o rótulo Exemplo. Sem próximos horários, a tela mostra uma referência do roteiro e explica a ausência de compromisso seguinte.

`travelBufferMinutes` é a margem **total até a atividade**, já incluindo o trajeto e a antecedência necessária. A hora de saída subtrai essa margem do horário local da atividade e informa se cair no dia anterior. Sem dados reais, não trate essa margem como tempo de rota calculado.

### Adicionar local, aeroporto ou estação

Copie uma entidade de `places.yaml`. Preencha `id`, `cityId`, categoria, nomes, endereço, sistemas de coordenadas e configuração de mapas. Categorias: `attraction`, `airport`, `station`, `region`, `other`.

A estação possui ID próprio, nome padrão e nome local, independente do ID da cidade. `echigo-yuzawa-station` e `echigo-yuzawa` representam entidades distintas. Nenhuma geocodificação é executada.

Quando o endereço de rua não é conhecido, `address.local` fica `null`; o nome local e a busca continuam disponíveis. Não invente uma rua. Confirme o acesso correto antes de usar o resultado de um mapa.

### Adicionar hotel

Copie um item de `hotels.yaml`, associe uma cidade e complete o endereço local real. `name.default` e `name.local` podem ser `null`; `checkInDate` e `checkOutDate` são datas ou `null`; `checkIn` e `checkOut` são horários `HH:mm` ou `null`; `checkInUntil` é o fim opcional da janela de check-in, também `HH:mm` ou `null`; `phone` é público ou `null`. Use `status: example` para dados demonstrativos, `undecided` para pendência e `confirmed` somente após confirmação real. Associe o `hotelId` nos dias da estadia.

A reserva de Beijing ocupa as noites de 31/12, 01/01, 02/01 e 03/01. Em 04/01 há atividade de checkout, sem associar o hotel à noite seguinte. O horário de check-in indica disponibilidade, sem agendar chegada às 15h após o voo das 14h45. Valores, condições de cancelamento e endereço privado de contato não entram na publicação.

O resort atual tem reserva informada, mas nome e endereço vazios. A UI indica “Resort · nome a registrar”; esse rótulo não é o nome de um estabelecimento. Sem nome/endereço real, mapa e cópia não inventam um destino. A data de check-in não preenche automaticamente o checkout ou dias adicionais.

### Adicionar voo ou trem

Copie o exemplo do arquivo correspondente. Cada endpoint deve ter `cityId`, `placeId`, `date`, `time` (ou `null`), `timezone` e `terminal` (ou `null`). Cada lado exige uma cidade. `placeId: null` representa aeroporto/estação ainda desconhecido; não use ID fictício. Voo com local cadastrado exige `airportCode` e `airportName`; trem com local cadastrado exige `station` com nomes padrão e local. Um ID não nulo deve apontar para aeroporto/estação existente da mesma cidade. `airportCode`, `airportName` e `station` podem ser `null` quando esse local não está definido.

Cada lado mantém seu horário e fuso: Shanghai usa `Asia/Shanghai` e Tokyo usa `Asia/Tokyo`. Os seis voos do bilhete têm horários locais confirmados. Os horários de Shanghai → Haneda e do trem permanecem `null`; não copiar horários da antiga demonstração. A UI não os converte para o horário brasileiro. Datas/horas incompatíveis com chegada posterior à partida são rejeitadas.

`airline` identifica a companhia comercializadora; `operatedBy`, a operadora. `cabin`, `baggage.pieces` e `baggage.weightKg` preservam apenas o que foi informado. `durationMinutes` deve corresponder ao tempo decorrido entre fusos. `travelerIds` referencia os viajantes que seguem o voo. `nextFlightId` encadeia conexões no mesmo aeroporto, sem ciclos ou partida anterior à chegada. O intervalo exibido é calculado; não certifica tempo mínimo de conexão. Número do voo, trem, companhia e classe permanecem `null` enquanto não conhecidos. `recommendedArrivalMinutes` pode ser `null` enquanto a antecedência não foi definida; quando preenchido, é a antecedência na estação; o trajeto até ela é adicional. `offlineInstructions` é obrigatório.

Não há voo de retorno registrado no plano atual. Não crie um retorno ou preencha `endDate` a partir da última data conhecida do roteiro.

### Deslocamentos

`transfers.yaml` aceita `flight`, `train`, `metro`, `bus`, `taxi`, `walk`, `private`, `airport-shuttle`, `station-shuttle`. Preencha endpoints com `placeId`, `durationMinutes` (ou `null`), `safetyBufferMinutes`, `notes` e `offlineInstructions`. Endereços e mapas são resolvidos pelos locais de origem e destino. Um trecho demonstrativo não comprova que há trem direto entre as estações.

### Representar alternativas

`trip.alternatives` aceita decisões abertas com status `undecided`, opções `optional`, listas de `cityIds` existentes e notas próprias. Datas podem ficar `null`. Dias relacionados podem apontar para `alternativeId`. Nunca apresentar duas opções como compromissos simultaneamente confirmados.

O plano atual tem `alternatives: []`: os destinos posteriores à neve não foram registrados. As antigas possibilidades Fuji/Osaka permanecem somente na fixture demonstrativa e no histórico. Se voltarem ao planejamento, adicione cidades/opções explicitamente e relacione os dias conhecidos; não presuma estadias em Tokyo após o pernoite informado.

### Status

| Valor | Uso |
| --- | --- |
| `confirmed` | Informação realmente confirmada pelo mantenedor |
| `planned` | Roteiro-base, sujeito a ajustes |
| `optional` | Possibilidade sem compromisso |
| `example` | Demonstração que deve ser substituída |
| `undecided` | Decisão ou informação em aberto |
| `cancelled` | Cancelado, mantido como referência |

## Dia automático e fusos

Para cada dia, a aplicação calcula a data de agora no fuso IANA da cidade-base daquele dia. Seleciona o dia cuja data coincide. Se dois dias coincidirem na fronteira entre fusos, usa o mais adiantado no calendário. Se houver lacuna momentânea por troca de país, usa o próximo dia. Esta regra privilegia o destino previsto; não tenta rastrear localização do usuário.

Com limites gerais conhecidos, antes do início mostra preparação e depois do fim mostra histórico. Com limites desconhecidos, exibe “Plano parcial” e o dia registrado mais próximo; nunca chama o primeiro registro de data de saída ou o último de fim da viagem. Calendário e setas permitem consulta manual; “Voltar ao dia automático” desfaz a consulta. A hora é recalculada a cada 30 segundos e ao voltar à tela. A data de chegada numa cidade pode precisar de seleção manual durante voos, conexões ou alteração do roteiro.

Atividades com horário são ordenadas por relógio local; itens sem horário ficam no fim. Em um dia de troca de fuso, mantenha os trechos em sequência coerente e confira os fusos exibidos. No plano atual há pernoite entre o voo de 18/01 e o trem de 19/01. As conexões Qatar são calculadas a partir dos horários do bilhete, inclusive quando atravessam meia-noite.

## Mapas

`buildMapLinks(place, provider)` em `src/features/maps/links.ts` é pura e testável. O retorno informa `status`, `url`, `address`, `addressAvailable` e `coordinateAvailable`. Link vazio não quebra a página. Endereço e instrução textual continuam locais.

Ordem de preferência: URL HTTPS explícita em `mapLinks`, busca configurada por nome/cidade e, quando aplicável, coordenada do sistema correto. Apple Maps é a opção principal; na China há AMap e Baidu, no Japão Google Maps é secundário. Links abrem em outra aba/contexto, mantendo o roteiro disponível.

```yaml
mapLinks:
  apple: null
  amap: null
  baidu: null
mapSearch:
  apple: null
  amapKeyword: 故宫博物院
  amapCity: 北京
  baiduKeyword: 故宫博物院
  baiduCity: 北京
```

Use links específicos de POI depois de verificar o destino. É possível acrescentar chaves em `mapLinks` sem alterar o schema principal; um novo provedor requer apenas o adaptador de links e sua opção na UI. Não armazene tokens privados em URLs.

### WGS84, GCJ-02 e BD-09

O modelo mantém três pares independentes, com `lat` e `lon` nulos juntos ou preenchidos juntos:

- **WGS84**: coordenadas GPS usuais; fallback de coordenadas Apple.
- **GCJ-02**: sistema usado pelo fallback de coordenadas AMap na China.
- **BD-09**: fallback de coordenadas Baidu, acompanhado de `coord_type=bd09ll`.

Não copiar a mesma coordenada entre sistemas presumindo equivalência. A aplicação não faz conversão automática. Para a China, prefira nome em chinês, endereço, cidade e URL/POI oficial. Nenhuma coordenada WGS84 é enviada como GCJ-02 ou BD-09.

Formatos consultados: [Apple Map Links](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html), [AMap URI search](https://developer.amap.com/api/uri-api/guide/search/search), [Baidu URI API](https://lbsyun.baidu.com/index.php?title=uri).

### Limitações offline

Não há mapas interativos ou turn-by-turn offline. Provedores externos podem não abrir, precisar de aplicativo, estar bloqueados ou encontrar o POI errado. Volte à PWA e abra Endereço local; mostre a tela ao motorista ou funcionário. Teste os links nos iPhones reais, com e sem cada aplicativo instalado.

## Instalar no iPhone e testar em modo avião

Use o endereço HTTPS publicado. `localhost` só funciona no próprio computador; não aponta para o Mac quando digitado no iPhone.

1. No Safari do iPhone, abra a publicação com internet estável.
2. Aguarde “Offline pronto”; em **Mais → Verificar offline**, confirme todos os arquivos.
3. Toque em Compartilhar → Adicionar à Tela de Início → Adicionar.
4. Abra pelo novo ícone e use Verificar offline novamente. A instalação pode ter armazenamento diferente da aba do Safari.
5. Visite Hoje, Viagem, Logística, Cidades e Mais; abra hotel, estação, aeroporto e atração; confira o endereço grande e Copiar.
6. Ative modo avião **e desligue o Wi-Fi**. Feche completamente a PWA pelo seletor de apps.
7. Reabra pelo ícone; consulte todos os dias registrados, cidades e endereços de ambos os países. Não basta deixar uma aba já carregada aberta.
8. Reative a rede, publique uma alteração de teste e use Verificar atualização. Aguarde o aviso e toque Atualizar agora. Verifique a versão e repita o teste offline.
9. Repita nos quatro iPhones. Registre o resultado em `docs/VALIDATION.md`.

HTTPS ou localhost são necessários para Service Worker e clipboard. WebKit pode remover armazenamento por pressão de espaço ou políticas do sistema. Nenhuma PWA pode garantir abertura se **todo** o armazenamento de sua origem for removido. Verifique antes de sair; mantenha espaço livre e uma cópia independente das informações essenciais.

## Cache, atualização e rollback

`src/sw.ts` recebe a lista completa de assets do build. Instala lotes atômicos completos em dois caches da mesma versão, `main` e `rescue`, isolados pelo escopo. Cada entrada usa uma chave com o hash da versão. Downloads de instalação ignoram o cache HTTP; `Cache.addAll` grava cada lote atomicamente, e o instalador relê as duas cópias antes de concluir. Uma instalação só termina se todos os downloads, gravações e verificações terminarem. Não existe `skipWaiting` automático em atualização.

A versão ativa continua servindo o pacote anterior enquanto a próxima prepara o cache. Quando o worker novo está instalado, a UI oferece **Atualizar agora**. O botão envia `SKIP_WAITING`; a troca de controlador recarrega a aplicação com a versão inteira nova. Se um download falhar, o worker falha na instalação e a versão ativa continua utilizável.

Uma entrada ausente em `main` é reconstruída de `rescue`. **Verificar offline** audita a lista inteira e restaura qualquer cópia ausente a partir da outra. A perda de um cache inteiro é recuperável se o outro permanecer. Perder as duas cópias de um asset exige rede/reinstalação; uma resposta de outra versão não é gravada sob a chave antiga.

Para atualizar: edite YAML/código, atualize `contentVersion`, valide e faça push em `main`. Para rollback: reverta o commit no Git e publique novamente. A versão anterior volta a ser oferecida pelo mesmo fluxo; não force limpeza global de caches. O SW mantém a versão corrente e uma anterior por escopo; não usa caches de sites vizinhos.

Em desenvolvimento, prefira uma janela/perfil separado do preview e da produção. Desative a opção “Update on reload” do DevTools ao testar o comportamento real de atualização.

## GitHub Actions e GitHub Pages

`ci.yml` valida pull requests e é reutilizado por `deploy.yml`. Executa `npm ci`, lint, validação YAML/referências, testes, build e testes Chromium/WebKit em subpasta. Pull requests não publicam. `deploy.yml` só publica `main`, inclusive em execução manual. A implantação exige o job de validação aprovado.

Para criar outro repositório:

```bash
git init -b main
git add .
git commit -m "Implementa PWA familiar offline"
gh repo create SEU_USUARIO/SEU_REPOSITORIO --public --source=. --remote=origin
git push -u origin main
```

No GitHub: Settings → Pages → Build and deployment → Source: **GitHub Actions**. Habilite Actions se o repositório estiver com execução desativada. A URL de projeto é `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`. Consulte a URL literal no job Publicar. As permissões `pages: write` e `id-token: write` pertencem somente ao job de publicação; o ambiente é `github-pages`.

O `base` relativo funciona em nomes diferentes de repositório, sem caminhos absolutos para assets ou SW. Não configure redirecionamento de hash; páginas internas usam `/#/hoje/...` ou `/REPOSITORIO/#/hoje/...`. [Documentação de workflows Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Domínio próprio

Configure Custom domain em Settings → Pages, valide o domínio e siga os registros DNS indicados pelo GitHub. Ative Enforce HTTPS após emissão do certificado. Com `base: './'`, o mesmo build continua válido na raiz ou em subpasta. Mudança de domínio cria outra origem: reinstale e recache nos quatro aparelhos antes da viagem. Nunca dependa de cache instalado no endereço antigo para abrir o novo.

## Segundo endereço estático de emergência

O endereço reserva é uma implantação independente, sem failover automático. Use um provedor estático acessível aos viajantes ou um domínio separado configurado antes da viagem.

1. Execute `npm ci && npm run build` no mesmo commit aprovado.
2. Publique **o conteúdo inteiro de `dist/`**, incluindo `sw.js`, manifest, `assets/` e `icons/`, em hospedagem HTTPS sem autenticação.
3. Sirva JS com MIME JavaScript, CSS como CSS, manifest como manifest/JSON. Evite cache prolongado de `index.html` e `sw.js`; assets com hash podem ter cache longo.
4. Preserve a estrutura de pastas e a barra final na URL base. Se usar prefixo absoluto, faça build específico com `BASE_PATH` correspondente.
5. Teste o segundo endereço nos quatro iPhones. Instale/prepare o cache dele separadamente e guarde o link e capturas dos dados essenciais.
6. Registre o endereço escolhido em um canal privado e no checklist familiar. Não foi configurado um segundo provedor nesta entrega.

Estar em outro domínio não garante acesso na China; teste disponibilidade antes e durante a viagem. A operação normal deve usar a versão instalada, sem exigir acesso contínuo a nenhum dos dois endereços.

## Privacidade

O site e o repositório são potencialmente públicos. Inclua somente informações operacionais adequadas à publicação. Não coloque passaportes, cartões, dados médicos/bancários, documentos, QR privados, vouchers, números de passageiro frequente, dados tarifários ou códigos que deem acesso às reservas. `bookingReferenceHint` só aceita `null`, evitando publicação acidental de localizadores nesse campo.

PWA: roteiro, endereços, horários e instruções públicos. Apple Notes: anotações e contatos privados. iCloud Drive: documentos, ingressos e comprovantes. Nenhuma integração ou sincronização é implementada. Os outros três viajantes apenas consultam.

## Troubleshooting

| Sintoma | Ação |
| --- | --- |
| Dev não funciona offline | Use `npm run build` e `npm run preview`; SW é de produção |
| Página sem assets em subpasta | Publique `dist/` inteiro, preserve caminhos e barra final; confira `BASE_PATH` |
| Dados não mudaram após push | Aguarde Actions; Mais → Verificar atualização → Atualizar agora |
| Falha na atualização sem rede | Continue com a versão ativa; tente quando houver rede estável |
| “Verificar offline” sem controlador | Aguarde instalação e recarregue a publicação com rede |
| Uma cópia de cache removida | Mais → Verificar offline restaura a redundância a partir da outra |
| Duas cópias do mesmo asset ausentes | Com rede estável, reinstale o armazenamento offline da origem pelo navegador e reabra; teste antes de sair |
| Safari tem cache, Home Screen não | Abra e verifique dentro do ícone instalado, com internet |
| Data automática inesperada em trânsito | Selecione manualmente o dia; confira a cidade-base e o fuso no YAML |
| Mapa vazio/não abriu | Volte ao roteiro; use endereço local e outro provedor |
| Hotel não abre mapa | Preencha endereço/local real; o placeholder não gera um hotel fictício |
| Clipboard falhou | Selecione o texto da tela e use Copiar no sistema |
| YAML falha | Leia o caminho da entidade no erro; confira aspas, IDs e chaves duplicadas |

## Checklist antes da viagem

- [ ] Substituir todos os dados `example` ou remover demonstrações que não serão usadas.
- [ ] Confirmar hotéis e preencher endereços locais e telefones públicos.
- [ ] Confirmar voos, datas de chegada, aeroportos e terminais.
- [ ] Confirmar trens, estações, classe, conexões e antecedências.
- [ ] Registrar nome, endereço e checkout do resort reservado; definir os destinos posteriores.
- [ ] Completar a programação dos dias em aberto; revisar os fusos de todos os trechos.
- [ ] Testar Apple Maps, AMap e Baidu nos aparelhos; conferir cada POI real.
- [ ] Abrir a PWA nos quatro iPhones e instalar na Tela de Início.
- [ ] Verificar cache, fechar, ativar modo avião com Wi-Fi desligado e reabrir pelo ícone.
- [ ] Navegar em todos os dias e cidades e copiar/exibir endereços locais.
- [ ] Testar uma atualização e revalidar o offline.
- [ ] Guardar documentos e reservas privadas no iCloud Drive ou Apple Notes, disponíveis offline.
- [ ] Confirmar endereço reserva e instalar o cache dele separadamente.
- [ ] Registrar os testes físicos em `docs/VALIDATION.md`.
