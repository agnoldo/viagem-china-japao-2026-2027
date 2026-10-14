# Prints da viagem

Cada pasta é uma categoria da galeria **Posts**. As pastas de países e cidades do roteiro já estão criadas. Os arquivos `.gitkeep` apenas preservam pastas vazias; não aparecem no aplicativo.

## Enviar pelo GitHub

1. Abra [data/posts no GitHub](https://github.com/agnoldo/viagem-china-japao-2026-2027/tree/main/data/posts).
2. Entre na pasta desejada, por exemplo `Beijing` ou `China`.
3. Use **Add file → Upload files**, arraste os prints e conclua em **Commit changes**, na `main`.
4. Aguarde o workflow **Publicar no GitHub Pages** ficar verde na aba **Actions**.
5. Na PWA, abra **Mais → Verificar atualização → Atualizar agora** e aguarde **Offline pronto**. Cada iPhone precisa receber a atualização.

Não é necessário editar YAML nem cadastrar imagens individualmente.

Formatos aceitos: **JPG, JPEG, PNG e WebP**. HEIC, GIF, vídeos, PDFs e links do Instagram não são aceitos. Exporte o print como uma imagem antes de enviar.

## Nomes e ordem

O nome da pasta aparece como título da categoria. O nome do arquivo, sem extensão, vira a legenda; hífens e sublinhados são trocados por espaços. Os arquivos são ordenados pelo nome, com números em ordem numérica.

```text
data/posts/
  China/
    01-internet-e-pagamentos.png
  Beijing/
    01-entrada-da-Cidade-Proibida.jpg
    02-dicas-de-metro.png
  Japão/
    01-envio-de-bagagem.webp
```

As imagens acima são apenas exemplos de nomes; não existem na galeria.

Para criar outra categoria no GitHub, use **Add file → Create new file** e digite, por exemplo, `Hong Kong/.gitkeep` dentro de `data/posts`. Confirme o commit, entre na nova pasta e faça o upload. Não crie subpastas dentro de categorias.

Para retirar um print, exclua seu arquivo e faça o commit. Para trocar a legenda, renomeie o arquivo. Para substituir uma imagem, envie a nova versão com o mesmo nome. A PWA continuará usando sua versão anterior até a atualização explícita.

## Publicação e offline

A publicação converte as imagens para WebP, ajusta a orientação, limita a largura a 1600 px sem ampliar nem recortar e remove metadados EXIF/GPS da cópia publicada. O original permanece no Git e no histórico do repositório.

Cada original pode ter até 20 MB. A imagem processada precisa caber em 1,9 MB e o conjunto processado em 30 MB. Arquivos inválidos ou limites excedidos interrompem a publicação com o caminho do problema em **Actions**; a versão publicada anteriormente permanece disponível. O aplicativo principal mantém seu orçamento separado de 2 MB.

Todas as imagens processadas entram no cache offline, mesmo sem terem sido abertas. O cache mantém uma cópia de recuperação e, durante atualizações, a versão anterior também ocupa espaço. Perda total do armazenamento do site exige conexão para reinstalar.

Este repositório e a galeria são **públicos**. Envie apenas prints que possam ser publicados. Não inclua conversas privadas, documentos, dados de reserva ou dados pessoais. A remoção de metadados da cópia publicada não remove dados visíveis no print nem o arquivo original do histórico do Git.
