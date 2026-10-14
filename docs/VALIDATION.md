# Verificação da entrega

Data: 14/10/2026. Projeto novo, com dados demonstrativos.

## Verificações locais executadas

- YAML e referências: válidos; 30 dias consecutivos, 11 cidades/regiões (incluindo Belo Horizonte) e 23 locais.
- China: Beijing 4 noites, Xi'an 2, Chengdu 3, Chongqing 2, Zhangjiajie 3, Shanghai 4; total 18.
- Japão: Tokyo e Echigo-Yuzawa presentes; dias de 22 a 26/01 com alternativa explícita Fuji/Osaka e sem hotel presumido.
- ESLint e TypeScript strict da aplicação e do Service Worker.
- Vitest: 40 testes de parsing, schema, referências, datas/horas/fusos, dia automático, opcionais, alternativas, mapas, endereço offline, preferência ausente/bloqueada e versão.
- Build de produção com manifest, ícones locais, SW e conteúdo dos dois países; aproximadamente 573 KiB antes de gzip, abaixo do limite de 2 MB.
- npm audit: nenhuma vulnerabilidade reportada na instalação final.
- Detector mecânico da interface: nenhuma ocorrência.

## Teste de navegador executado

Playwright: 12 testes, seis em Chromium desktop e seis em WebKit com viewport/user agent de iPhone 15 Pro Max. Servidor serve **o build real** em `/offline-check/`, comprovando operação fora da raiz do domínio. O teste usa data fixa anterior à viagem para continuar reprodutível depois dela.

1. Abriu Hoje, Viagem, Logística, Cidades e Mais.
2. Abriu dias chineses e japoneses, hotéis, estação Beijing West, aeroporto Beijing Capital e atração Cidade Proibida.
3. Exibiu endereço chinês grande e acionou a cópia com tratamento de fallback.
4. Verificou links HTTPS de Apple Maps, AMap e Baidu, com parâmetros codificados e abertura externa; nenhuma requisição a domínio externo foi necessária para navegar no roteiro.
5. Verificou endpoints Shanghai/Tokyo com os dois fusos na mesma tela.
6. Instalou o SW, confirmou o cache, desligou a rede no contexto, fechou a página e abriu outra sem rede.
7. Consultou os 30 dias e todas as cidades de China/Japão offline, inclusive após reload.
8. Removeu entradas JavaScript do cache principal, removeu o cache de recuperação inteiro e removeu o principal inteiro, em cenários separados; confirmou reabertura offline e restauração pela cópia remanescente.
9. Simulou publicação de um segundo build completo. Interrompeu download de seu shell com HTTP 503 e confirmou que a versão ativa permanecia navegável offline.
10. Liberou o download, verificou aviso, confirmou que a versão não trocava antes do botão, acionou Atualizar agora e comprovou o shell novo. Republicou a versão anterior e confirmou rollback pelo mesmo mecanismo.
11. Bloqueou localStorage; navegação e verificação offline continuaram funcionais.
12. Simulou falha na reinscrição do SW ao reabrir offline; a auditoria usa o controlador já instalado e não depende do registro ou da promessa ready.
13. Conferiu ausência de rolagem horizontal no viewport mobile.

## Inspeção visual

Capturas desktop de 1440 px e mobile de 430 px, com o exemplo Beijing de 01/01. Sem overflow horizontal. O hotel foi antecipado para antes do programa do dia no mobile. Endereço usa página própria limpa. Capturas locais em `output/playwright/`, ignoradas pelo Git.

## Limites e testes pendentes em aparelhos reais

**Não foi realizado teste em um iPhone físico ou no Safari instalado do usuário.** WebKit automatizado não equivale à instalação da Home Screen. Antes de viajar, seguir o teste completo do README nos quatro aparelhos:

- Compartilhar → Adicionar à Tela de Início; abrir pelo ícone e verificar cache naquele contexto.
- Modo avião e Wi-Fi desligado, encerramento completo e reabertura.
- Todos os dias, cidades, hotéis e endereços disponíveis.
- Copiar endereço no iOS real.
- Abrir os POIs corretos em Apple Maps, AMap e Baidu; repetir sem os apps complementares instalados. O teste automatizado valida geração dos links, não garante o comportamento desses serviços externos.
- Publicar uma mudança real de conteúdo, aceitar atualização e repetir modo avião.
- Confirmar funcionamento do segundo endereço estático e seu cache independente, quando escolhido.

A perda total do armazenamento WebKit não é recuperável offline. A redundância cobre perda de entrada/cache enquanto alguma cópia essencial permanece.

A primeira execução Linux revelou que a auditoria após atualização dependia do registro/ready do WebKit. A correção audita o controlador ativo imediatamente e mantém o registro existente acessível sem rede; o cenário de rejeição de register passou a integrar a suíte.
