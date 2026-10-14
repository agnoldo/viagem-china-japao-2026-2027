# China e Japão · Nossa viagem

[Abrir a aplicação](https://agnoldo.github.io/viagem-china-japao-2026-2027/) · [Repositório](https://github.com/agnoldo/viagem-china-japao-2026-2027)

PWA familiar de consulta, offline-first, para a viagem de **29/12/2026 a 27/01/2027**. Quatro viajantes, quatro iPhones, um mantenedor dos dados. O roteiro da China tem 18 noites; o Japão mantém a neve e as alternativas Fuji/Osaka em aberto.

**O conteúdo inicial é demonstrativo. Não há reservas confirmadas.** Horários, aeroportos e estações de exemplo não comprovam disponibilidade, ligação direta ou compra. Hotéis são placeholders sem nomes de estabelecimentos inventados. Os dias ainda não planejados permanecem vazios e navegáveis.

## Arquitetura e decisões

- React + Vite + TypeScript strict, React Router com `HashRouter`, CSS local e ícones SVG empacotados.
- YAML em `data/`, schemas Zod e referências validados antes de o conteúdo chegar aos componentes. Todos os arquivos são importados de forma eager no build, sem download posterior de dias ou países.
- Manifest e Service Worker com `vite-plugin-pwa` em `injectManifest`. A política de cache própria permite recuperação redundante e atualização por consentimento no aplicativo.
- Nenhum backend, autenticação, API de conteúdo, banco remoto, analytics, CDN, fonte remota ou imagem externa. A rede só é necessária para instalar/atualizar e abrir mapas externos.
- Tipografia do sistema do iPhone; ícones PNG locais. Sem fotos: o pacote offline completo tem aproximadamente 575 KiB, antes de gzip, com limite automático de 2 MB. A cópia redundante usa aproximadamente o dobro; durante uma atualização há também caches da versão anterior.
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

Use o nome local real quando conhecido. Defina datas dentro da viagem. China usa `Asia/Shanghai`, Japão `Asia/Tokyo`, Brasil `America/Sao_Paulo`. O status de uma cidade não confirma hotéis ou bilhetes.

### Adicionar ou editar um dia

Todos os 30 dias já existem. Edite `data/days/YYYY-MM-DD.yaml`. O nome do arquivo deve coincidir com `date`. Se ampliar a viagem, altere suas datas e crie os dias adicionais sem lacunas.

```yaml
date: '2027-01-23'
cityId: tokyo
regionId: japan
summary: Programação a definir
status: undecided
alternativeId: japan-after-echigo
notes: A cidade-base depende da decisão final.
activities: []
```

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
  placeId: tokyo-walk
  travelBufferMinutes: 30
  notes: Horário demonstrativo; validar antes de usar.
```

Horário é opcional: omita para programação ainda aberta. Tipos: `flight`, `train`, `transfer`, `metro`, `bus`, `taxi`, `walk`, `attraction`, `meal`, `hotel`, `free-time`, `note`. Pode referenciar `placeId`, `hotelId` ou `transportId` existente. Evite agendas noturnas atravessando meia-noite na mesma atividade: divida pelos dias correspondentes.

O próximo compromisso exclui `optional` e `cancelled`, e ignora itens sem horário. Exemplos com horário aparecem com o rótulo Exemplo. Sem próximos horários, a tela mostra uma referência do roteiro e explica a ausência de compromisso seguinte.

`travelBufferMinutes` é a margem **total até a atividade**, já incluindo o trajeto e a antecedência necessária. A hora de saída subtrai essa margem do horário local da atividade e informa se cair no dia anterior. Sem dados reais, não trate essa margem como tempo de rota calculado.

### Adicionar local, aeroporto ou estação

Copie uma entidade de `places.yaml`. Preencha `id`, `cityId`, categoria, nomes, endereço, sistemas de coordenadas e configuração de mapas. Categorias: `attraction`, `airport`, `station`, `region`, `other`.

A estação possui ID próprio, nome padrão e nome local, independente do ID da cidade. `beijing-west` e `beijing` representam entidades distintas. Nenhuma geocodificação é executada.

Quando o endereço de rua não é conhecido, `address.local` fica `null`; o nome local e a busca continuam disponíveis. Não invente uma rua. Confirme o acesso correto antes de usar o resultado de um mapa.

### Adicionar hotel

Copie um item de `hotels.yaml`, associe uma cidade e complete o endereço local real. `checkIn` e `checkOut` são `HH:mm` ou `null`; `phone` é público ou `null`. Use `status: example` para dados demonstrativos, `undecided` para pendência e `confirmed` somente após confirmação real. Associe o `hotelId` nos dias da estadia.

Os placeholders atuais têm endereço vazio e não geram buscas enganosas por hotéis fictícios. A página permanece consultável até o preenchimento.

### Adicionar voo ou trem

Copie o exemplo do arquivo correspondente. Cada endpoint deve ter `cityId`, `placeId`, `date`, `time` (ou `null`), `timezone` e `terminal` (ou `null`). Voo exige `airportCode` e `airportName`; trem exige `station` com nomes padrão e local. Os `placeId` precisam apontar para aeroportos ou estações cadastrados.

Cada lado mantém seu horário e fuso: no exemplo Shanghai → Tokyo, `10:20 Asia/Shanghai` e `14:30 Asia/Tokyo` são dados independentes. A UI não os converte para o horário brasileiro. Datas/horas incompatíveis com chegada posterior à partida são rejeitadas.

Número do voo, trem, companhia e classe permanecem `null` enquanto não conhecidos. `recommendedArrivalMinutes` é a antecedência na estação; o trajeto até ela é adicional. `offlineInstructions` é obrigatório.

O retorno demonstrativo de Tokyo usa a data final do roteiro como referência; a data real de chegada ao Brasil e suas conexões ainda precisam ser corrigidas pelo bilhete. O roteiro acaba na saída do Japão.

### Deslocamentos

`transfers.yaml` aceita `flight`, `train`, `metro`, `bus`, `taxi`, `walk`, `private`, `airport-shuttle`, `station-shuttle`. Preencha endpoints com `placeId`, `durationMinutes` (ou `null`), `safetyBufferMinutes`, `notes` e `offlineInstructions`. Endereços e mapas são resolvidos pelos locais de origem e destino. Um trecho demonstrativo não comprova que há trem direto entre as estações.

### Alternativas Fuji/Osaka

`trip.alternatives` contém `japan-after-echigo` com status `undecided`. Suas opções têm status `optional`, listas de `cityIds` e notas próprias. Os dias de 22 a 26/01 apontam para `alternativeId`; Tokyo serve como referência de retorno, sem hotel atribuído. As alternativas aparecem na timeline, nos dias e nas cidades envolvidas.

Ao decidir, registre a opção escolhida nos dias e confirme hotéis/transportes. Remova `alternativeId` desses dias e retire a alternativa de `trip.alternatives` se não houver mais decisão aberta. Pode preservar a opção descartada na história do Git. Não promova automaticamente as duas opções para confirmado.

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

Antes do início, mostra preparação e o primeiro dia. Depois do último dia no fuso de Tokyo, mostra viagem encerrada e o último dia. Calendário e setas permitem consulta manual; “Voltar ao dia automático” desfaz a consulta. A hora é recalculada a cada 30 segundos e ao voltar à tela. A data de chegada numa cidade pode precisar de seleção manual durante voos, conexões ou alteração do roteiro.

Atividades com horário são ordenadas por relógio local; itens sem horário ficam no fim. Em um dia de troca de fuso, mantenha os trechos em sequência coerente e confira os fusos exibidos. O exemplo Japan chega e segue de trem sem inventar horário de conexão.

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
7. Reabra pelo ícone; consulte os 30 dias, China e Japão, cidades e endereços. Não basta deixar uma aba já carregada aberta.
8. Reative a rede, publique uma alteração de teste e use Verificar atualização. Aguarde o aviso e toque Atualizar agora. Verifique a versão e repita o teste offline.
9. Repita nos quatro iPhones. Registre o resultado em `docs/VALIDATION.md`.

HTTPS ou localhost são necessários para Service Worker e clipboard. WebKit pode remover armazenamento por pressão de espaço ou políticas do sistema. Nenhuma PWA pode garantir abertura se **todo** o armazenamento de sua origem for removido. Verifique antes de sair; mantenha espaço livre e uma cópia independente das informações essenciais.

## Cache, atualização e rollback

`src/sw.ts` recebe a lista completa de assets do build. Instala cada arquivo em dois caches da mesma versão, `main` e `rescue`, isolados pelo escopo. Uma instalação só termina se todos os downloads e gravações terminarem. Não existe `skipWaiting` automático em atualização.

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

O site e o repositório são potencialmente públicos. Inclua somente informações operacionais adequadas à publicação. Não coloque passaportes, cartões, dados médicos/bancários, documentos, QR privados, vouchers ou códigos que deem acesso às reservas. `bookingReferenceHint` só aceita `null`, evitando publicação acidental de localizadores nesse campo.

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
- [ ] Confirmar resort de neve e escolher Fuji ou Osaka.
- [ ] Revisar os 30 dias e os fusos Shanghai/Tokyo.
- [ ] Testar Apple Maps, AMap e Baidu nos aparelhos; conferir cada POI real.
- [ ] Abrir a PWA nos quatro iPhones e instalar na Tela de Início.
- [ ] Verificar cache, fechar, ativar modo avião com Wi-Fi desligado e reabrir pelo ícone.
- [ ] Navegar em todos os dias e cidades e copiar/exibir endereços locais.
- [ ] Testar uma atualização e revalidar o offline.
- [ ] Guardar documentos e reservas privadas no iCloud Drive ou Apple Notes, disponíveis offline.
- [ ] Confirmar endereço reserva e instalar o cache dele separadamente.
- [ ] Registrar os testes físicos em `docs/VALIDATION.md`.
