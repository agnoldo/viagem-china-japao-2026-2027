# Verificação do plano atual

Atualização em 01/11/2026 a partir dos dados fornecidos pelo mantenedor.

## Conteúdo

- 28 dias registrados, 10 cidades, 33 locais e 7 hospedagens (5 confirmadas, 2 propostas ainda sem nome). Limites confirmados: 29/12/2026 a 28/01/2027; programação parcial preservada.
- Seis voos do bilhete confirmados para os quatro viajantes: QR7251, QR774, QR892, QR809, QR785, QR4834. Horários locais e durações conferidos entre Brasil, Doha, China e Japão.
- Conexões calculadas: GRU 9h35, DOH 4h25 na ida; DOH 45 minutos e GRU 1h45 na volta. Trocas de terminal em GRU 2→3 e 3→2.
- Beijing Daxing (PKX), Haneda (HND) e Narita (NRT) são aeroportos distintos. Economy, 2 volumes por passageiro, peso desconhecido. Operação LATAM nos trechos domésticos.
- Recibo integral, número de passageiro frequente e códigos tarifários não armazenados.
- Pan Pacific Beijing: 5 noites, de 31/12/2026 a 05/01/2027; check-in a partir das 15h e checkout até 12h, fuso Asia/Shanghai. Endereço/telefone da reserva correspondem ao [site oficial](https://www.panpacific.com/zh/hotels-and-resorts/pp-beijing/the-hotel.html), usado para nome e endereço em chinês.
- Hotel associado somente às cinco noites; 05/01 tem checkout sem pernoite presumido. Transfer de Daxing não definido; continuação confirmada por voo 3U8894 para Chengdu em 05/01, PEK T2 11h40 → CTU T1 14h40. Valores, política financeira e contato privado excluídos.
- Dia 18/01: voo Shanghai → Haneda e pernoite confirmado no Ueno Woo Hotel, dois quartos Double Room, sem refeições. Check-in 15h–21h; checkout até 11h de 19/01. Endereço/telefone conferidos no [site do hotel](https://ueno-woo-hotel.mydirectstay.com/contact-us.html). Nome da hóspede, valores e dados de pagamento não publicados.
- Dia 19/01: Joetsu Shinkansen e início de resort reservado.
- Purpose Resort Echigo-Yuzawa Kura confirmado de 19 a 21/01: duas noites, apartamento de dois quartos, quatro camas, sem refeições. Check-in 15h até meia-noite (fim preservado nas notas porque atravessa o dia); checkout até 10h. Endereço local conferido em https://www.purposeresort.com/echigoyuzawa/.
- Hotel Regina Kawaguchiko confirmado de 21 a 23/01: duas noites, quarto quádruplo com vista para o Fuji, não fumantes; café da manhã para quatro em 22 e 23/01, 7h–10h. Check-in 15h–20h; checkout 7h–11h. Comprovantes privados lidos localmente; PDFs, códigos, hóspedes e valores não incorporados.
- Dias 20–23 registrados; retorno a Tokyo em 23/01 sem transporte ou hotel confirmado. Compromissos de 23 e 24 preservados sem inventar detalhes. Passeios na região do Fuji pendentes.
- Aeroporto em Shanghai, estação de Tokyo, horários de 18–19/01 e programação dos dias sem registro permanecem desconhecidos.
- Nenhum horário de demonstração, hotel fictício, retorno presumido ou alternativa antiga entra no conteúdo publicado.
- A fixture anterior fica isolada em `tests/fixtures/` e não é importada pela aplicação.

## Verificações

Resultado local: 94 testes Vitest e 44 testes Playwright aprovados, além de lint, validação e build. Fallback web exercitado em Chromium e WebKit, na mesma janela, com iPadOS e standalone simulados. URLs nativas AMap/Baidu, detecção de iOS/iPadOS, fallback de 1,5 s, cancelamento ao ocultar/sair, cliques repetidos/modificados e preservação do Apple Maps cobertos por testes. Standalone simulado não equivale a instalação na Tela de Início; handoff para apps nativos em iPhone físico continua pendente.

Lint e TypeScript strict; YAML, schemas e referências; Vitest com fixture completa e plano parcial; build e auditoria de assets locais. Os testes de conteúdo verificam a diferença entre limite geral e data de um dia registrado, reserva confirmada sem nome e local de embarque desconhecido sem perder a validação de IDs reais.

Playwright em Chromium e WebKit com viewport de iPhone: navegação por todos os dias/cidades registrados, detalhes de voo/trem/hotel, endereços japonês e chinês, busca local, ausência de dependências externas, reabertura sem rede, recuperação de entradas/caches, atualização interrompida, atualização explícita e rollback. A suíte verifica os dados dos voos e conexões em modo offline, além do resort sem nome e a cópia desabilitada quando não há nome/endereço real.

## Calendário

Visão mensal em Viagem com alternância para lista; 31 datas dentro dos limites gerais e 28 dias registrados, preservando as três lacunas de 24–26/01. Os meses são mostrados juntos em ordem cronológica; a seleção inicial prioriza o mês com mais dias da viagem. Sem duplicação de dados ou mudanças nas reservas.

Cobertura: virada de ano, alinhamento dos dias da semana, fevereiro bissexto, limites gerais nulos, seleção persistida na URL, resumo de lacunas sem links inválidos, voo planejado junto a hotel confirmado, noites em trânsito, troca de mês, navegação para os detalhes, reabertura offline em subpasta e ausência de overflow em 320 px. Inspeção visual em desktop e mobile; abreviações e legenda mantêm os nomes legíveis em telas estreitas. Chromium e WebKit simulados, sem teste em iPhone físico.

## Posts

Menu com seis destinos, galeria por pasta/categoria, opção Todos, contagem, categoria vazia, nome acessível derivado do arquivo e visualizador em tela cheia sobre a galeria. Dez categorias criadas para países/cidades; três prints enviados pelo mantenedor estão em `data/posts/Japão`. Nenhuma imagem demonstrativa foi inserida no conteúdo operacional.

Pipeline de build com Sharp para JPG/JPEG/PNG/WebP: orientação, compressão WebP, largura máxima 1600 px sem recorte/ampliação, remoção de metadados na cópia publicada, nomes de assets por hash e validação do catálogo antes da UI. Originais ficam fora do bundle e permanecem no Git. Orçamentos separados: aplicação 2 MB; galeria 30 MB; imagem otimizada 1,9 MB; origem 20 MB.

Vitest cobre ordenação/categorias vazias, legendas, deduplicação, redução sem recorte, metadados, troca de URL ao substituir uma imagem, formatos inválidos/corrompidos e validação de URLs/IDs. E2E Chromium/WebKit cobre filtro, retorno ao filtro ou Todos, ampliação, URL inválida, reabertura offline de imagens nunca visitadas, recuperação de cache de imagem, 320 px e atualização interrompida/ativação explícita/rollback entre o catálogo operacional e o catálogo isolado de teste. Imagens demonstrativas existem somente em `.qa-builds/`, nunca em `data/` ou no `dist/` publicado. Inspeção visual desktop/mobile aprovada. Upload pelo GitHub documentado em `data/posts/README.md`; sem backend de upload ou dependência do Instagram.

## Visualizador de Posts

Miniaturas sem legendas visuais, filtro por categoria/Todos e visualizador nativo `dialog` em tela cheia. Não abre página específica nem altera a URL. A imagem fica inteira, sem recorte, com fechar, contador e setas discretos. Swipe e teclado percorrem os prints do filtro, sem navegação circular.

Fechar ou Escape retorna o foco à miniatura e preserva a rolagem/categoria. O diálogo bloqueia a interação com os menus ao fundo e restaura a rolagem do documento ao fechar. Tab percorre os controles do visualizador; ao desativar uma seta na extremidade, o foco permanece em um controle habilitado para conservar a navegação pelo teclado. Rotas antigas `/posts/imagem/:id` redirecionam para a galeria, preservando o filtro quando presente.

E2E cobre dimensões de tela cheia, foco/Tab/Escape, restauração de rolagem, URL inalterada, singletons, filtros, swipe, botões, teclado, limites, eventos verticais/curtos/cancelados/multitoque, guarda de zoom da página, abertura e navegação offline e largura de 320 px. Toques e zoom são simulados no DOM em Chromium/WebKit; não comprovam gesto físico ou pinça no PWA instalado em iPhone. Validação manual no aparelho continua pendente.

## Regressão de upload

A publicação dos primeiros prints foi bloqueada por testes que presumiam galeria operacional vazia. Os testes agora derivam categorias, quantidade, IDs e assets dos arquivos enviados, sem exigir zero imagens ou categorias específicas vazias. A cobertura verifica também abertura de imagem real, preservação do catálogo durante instalação interrompida e retorno ao catálogo correto após rollback. Novos uploads não exigem editar testes.

## Limites

Não foi realizado teste em iPhone físico. A instalação Home Screen, abertura no iOS real em modo avião, clipboard e comportamento dos aplicativos externos de mapas devem ser verificados nos quatro aparelhos conforme README. URLs de busca não comprovam o endereço exato de um estabelecimento; o resort não gera mapa enquanto seus dados não forem registrados.

Perda total de armazenamento da origem pelo WebKit exige rede para reinstalar. A redundância cobre a perda de uma entrada ou cache enquanto alguma cópia do conteúdo essencial permanece.

## Regressão de atualização WebKit
A inspeção de atualização encontrou entradas ausentes em gravações individuais do cache. A instalação passou a usar lotes atômicos `Cache.addAll`, URLs com versão e releitura completa das duas cópias antes de oferecer o worker. O teste continua exigindo interrupção, reabertura offline, atualização e rollback; não foi removido ou dispensado.

## Estado da publicação

Repositório público novamente por solicitação do mantenedor. GitHub Pages reativado com build por GitHub Actions; `deploy.yml` publica a `main` após aprovação do job de validação.

## Exclusão de indexação — 31/10/2026

HTML com meta robots noindex e arquivo robots.txt local; regra para a raiz do domínio fornecida em docs/robots-domain-root.txt. O build confere a presença dessas instruções. Robots na subpasta do Pages não controla rastreamento; configuração da raiz depende do site raiz. Não é controle de acesso nem garantia de exclusão de bots/índices existentes.

## Mapa de Viagem — 31/10/2026

Base geográfica local Natural Earth; 11 referências urbanas WGS84 com fontes Wikidata, independentes dos links de navegação e locais de embarque. Pontos derivados dos dias/extremos de transportes; linhas só dos transportes não cancelados. Datas compartilhadas com calendário, três lacunas preservadas, hospedagem e status vindos do conteúdo validado. Testes cobrem atualização dos dias, conexões sem dia-base, exclusão de cancelados, projeção/rótulos, navegação data/calendário, lacunas, trânsito, todo o percurso e reabertura offline em subpasta/320 px, sem rede externa essencial. Não testado em iPhone físico.

## Calendário reunido — 31/10/2026

Dezembro/2026 e janeiro/2027 aparecem juntos em ordem cronológica, sem alternância mensal. Todos os 31 dias da viagem permanecem selecionáveis; três lacunas preservadas. Semanas completas fora do período são omitidas, com alinhamento dos dias da semana preservado. A seleção continua na URL e no mapa. Verificação E2E inclui os dois títulos/31 datas, resumo, trânsito, lacunas e reabertura offline/320 px.

## TripAdvisor — 31/10/2026

Links de atrações conferidos no TripAdvisor para os oito destinos CN/JP, incluindo Yuzawa-machi em Niigata. URLs HTTPS opcionais validadas no conteúdo; sem carregamento externo até o clique. E2E percorre todos os links cadastrados e confere destino, abertura em nova aba e disponibilidade do link após reabrir offline.

## Reserva de Shanghai — 31/10/2026

Novotel Shanghai Atlantis confirmado de 14 a 18/01, associado somente aos quatro pernoites de 14–17/01. Dia 18 mantém Ueno Woo Hotel em Tokyo. Junior Suite com vista para o Huangpu e happy hour para duas pessoas 17h30–20h registrados como benefício, sem atividade diária automática. Endereço chinês, telefone e horários gerais conferidos na [Accor](https://all.accor.com/hotel/3019/index.en.shtml); condições específicas da reserva não fornecidas. Coordenadas mantidas desconhecidas, mapas por nome/endereço. Links Booking com identificadores de sessão não publicados.

## Alteração do roteiro em 01/11/2026

Xi’an removido do conteúdo operacional, incluindo hotel, locais e trens. Beijing confirmado por cinco noites (31/12–05/01); voo Beijing–Chengdu de 05/01 agora confirmado: 3U8894, PEK T2 11h40 → CTU T1 14h40. Chengdu 05–08/01, Chongqing 08–11/01, Zhangjiajie 11–14/01 e Shanghai 14–18/01. Dia extra de Chongqing flexível; Dazu/Wulong opcionais. Calendário, mapa e telas derivam dos mesmos dados.

Verificações desta alteração: lint, validação de conteúdo, 95 testes unitários e build aprovados; 46 testes E2E Chromium/WebKit aprovados, incluindo subpasta, reabertura offline, recuperação de cache, atualização explícita e rollback. WebKit com perfil iPhone é emulação; não houve teste em iPhone físico. Perda total do armazenamento exige nova preparação com internet.

## Hospedagem de Chengdu

Kaiman Top Floor High Altitude Hotel (Taikoo Li Branch), confirmado em 05–08/01/2027. Associado às noites de 05, 06 e 07/01; checkout em 08/01 mantém hospedagem pendente em Chongqing. Endereço e horários gerais (14h/12h) conferidos na [Traveloka](https://www.traveloka.com/en-en/hotel/china/kaiman-top-floor-high-altitude-hotel-taikoo-li-branch-9000005950175); endereço também na Trip.com. Nome chinês, telefone e coordenadas não validados. Data de cancelamento publicada a pedido explícito da família, sem presumir horário ou fuso. Sem parâmetros de sessão, valores ou códigos privados.

Voo doméstico confirmado em 05/01/2027: Sichuan Airlines 3U8894, Beijing Capital (PEK) T2 11h40 → Chengdu Shuangliu (CTU) T1 14h40, Asia/Shanghai, 3 horas, quatro viajantes. Comprovante recomenda antecedência de 3 horas (08h40 no aeroporto); checkout antecipado e transfer ainda sem horário. Despachada: 20 kg por pessoa, sem quantidade de volumes informada; mão: 1 volume até 8 kg. Franquia em notas para não presumir peso por volume. PDF, PNR, bilhetes e dados pessoais não publicados.

## Zhangjiajie — 02/11/2026

Confirmação privada consultada: Wyndham ZhangJiajie Wulingyuan Hotel, 11–14/01/2027, três noites em dois quartos Cozy Queen Room, café da manhã para quatro em 12–14/01. Endereço local, telefone e horários 14h/12h transcritos do comprovante. Associação somente às noites 11, 12 e 13; dia 14 mantém hotel de Shanghai. Nenhum PDF, nome de hóspede, código, PIN ou valor publicado. Coordenadas desconhecidas mantidas nulas.

Dia 11: trem cedo, depósito a confirmar, Tianmen com acesso de inverno a reconfirmar, 72 Qilou e check-in noturno estimado. Dia 12: Yuanjiajie e Tianzi. Dia 13: Glass Bridge/Grand Canyon e Golden Whip Stream opcional, condicionado a tempo, gelo e últimos ônibus. Sem reservas de trem, motoristas, ingressos ou guarda-volumes; horários são planejamento. Fontes de planejamento: [acesso a Tianmen](https://www.tianmenmount.com/news/yin-tian-men-shan-suo-dao-zheng-ti-sheng-ji-gai-zao-shi-gong-zi-2026-nian-10-yue?lang=en), [circuitos do parque](https://www.discoverzhangjiajie.org/en/guidebook/routes/index.html) e [ponte/cânion](https://visitzhangjiajie.com/experiences/glass-bridge-bungee.html).

Verificação desta atualização: lint, validação de conteúdo, 95 testes unitários e build aprovados. E2E completo: 45/46 aprovados; o teste WebKit de instalação interrompida/atualização/rollback teve timeout na aquisição inicial do controlador SW e passou na repetição isolada (1 teste). Subpasta, reabertura offline, recuperação de cache e ambos os países verificados. Não houve alteração de SW/cache nem teste em iPhone físico. Perda total de armazenamento continua exigindo rede para reinstalar.

## Echigo-Yuzawa e Fujikawaguchiko — 02/11/2026

Comprovantes privados confirmam Purpose Resort Echigo-Yuzawa Kura em 19–21/01 e Hotel Regina Kawaguchiko em 21–23/01, duas noites cada. Datas de checkout não geram noite extra: Yuzawa nas noites de 19 e 20; Regina nas noites de 21 e 22. Dias 20–23 adicionados; dia 23 tem base Tokyo e hospedagem pendente. Os compromissos informados de 23 e 24 não receberam atividades ou horários inventados. Deslocamentos de 21 e 23 constam como atividades planejadas, sem modal, ligação direta ou bilhete presumido. Coordenada urbana de Fujikawaguchiko separada dos endereços de navegação; coordenadas dos hotéis mantidas nulas.

Lint, validação, 96 testes unitários e build aprovados. E2E: 42/46 passaram na execução completa; quatro falhas eram expectativas antigas de resort sem nome/checkout e foram corrigidas. Os quatro testes afetados passaram na repetição em Chromium e WebKit, incluindo todos os dias/cidades offline, dados do Regina, endereços locais e hospedagem pendente. Calendário, mapa, subpasta, recuperação de cache, atualização e rollback passaram na execução completa. WebKit com perfil iPhone é emulação; sem teste em iPhone físico. Perda total do armazenamento exige reinstalação com internet. Sem alteração no SW ou publicação nesta atualização.
