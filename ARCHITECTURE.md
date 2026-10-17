# Arquitetura

Marketplace frontend completo em modo de demonstração. As APIs, sessão, carrinho,
pagamento, pedidos e conta são simulados no navegador com MSW e localStorage.

- `src/app`: inicialização, providers e roteamento.
- `src/pages`: componentes de página.
- `src/features`: funcionalidades organizadas por domínio.
- `src/components/ui`: componentes shadcn/ui, a adicionar conforme a necessidade.
- `src/components/layout`: estrutura visual compartilhada.
- `src/lib`: clientes HTTP, Query, Socket.IO e utilitários.
- `src/hooks`: hooks compartilhados.
- `src/types`: contratos compartilhados.
- `src/mocks`: handlers, fixtures, cenários e persistência simulada.
- `tests/e2e`: testes funcionais Playwright.
- `tests/visual`: baselines visuais Playwright para início e detalhe.
- `public/assets`: imagens, fontes e ícones.
- `references/figma`: telas de referência exportadas.

## Decisões adotadas

Contratos REST e eventos ficam em `src/mocks`; TanStack Query gerencia cache,
cancelamento e reconciliação. Carrinho, sessão e cenários de demonstração usam
localStorage. Valores ETH são comparados em unidades inteiras de 18 casas com
BigInt. Pedidos usam idempotência e cotações expiráveis.

## Catálogo, filtros e favoritos

Os componentes consomem TanStack Query e funções Axios. As fixtures e o banco
simulado vivem exclusivamente em `src/mocks`; MSW intercepta a rede também no
build de demonstração. Nenhum serviço backend é necessário.

TanStack Router valida os parâmetros de URL: `page`, `q`, `collection`, `networks`
(lista separada por vírgula), `minPrice`, `maxPrice`, `category`, `sort` e
`favorites`. Os controles laterais/mobile compartilham um rascunho; Aplicar grava
na URL e reinicia a página. Busca é submetida com Enter/lupa; aba e ordenação
aplicam imediatamente. Respostas fora de ordem são canceladas pelo AbortSignal
do Query transmitido ao Axios. Preços REST são strings decimais e comparados
usando unidades inteiras de 18 casas com BigInt. O slider usa centésimos inteiros.

| Endpoint                 | Contrato                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/nfts`          | Parâmetros acima; retorna `items`, `page`, `pageSize`, `total`, `totalPages`, contagens por coleção/rede; páginas de 9 itens |
| `GET /api/nfts/facets`   | Contagens globais do catálogo por coleção e rede                                                                             |
| `GET /api/session`       | `{ user: { id, name, email } \| null }`                                                                                      |
| `POST /api/session`      | `{ email, password }` → `{ user, token }`; 401 para credenciais inválidas                                                    |
| `DELETE /api/session`    | Revoga a sessão; 204                                                                                                         |
| `GET /api/favorites`     | `{ ids: string[] }`; exige Bearer válido, 401 em expiração                                                                   |
| `PUT /api/favorites/:id` | `{ favorite: boolean }` → `{ ids }`; operação idempotente, erros 401/404/422/503                                             |

O cadastro usa `POST /api/users`: `{ username, email, password, confirmPassword }`
retorna `{ user, token }` com status 201; validação retorna 422 e conflito de
e-mail/nome retorna 409, com mensagens associadas aos campos.

Erros retornam `{ message, fields? }`. O cenário `favorite-error` permite testar atualização
otimista e rollback; `catalog-error` e `slow` permitem testar erro, retry manual
e skeletons sem alternativas de negócio dentro dos componentes.

Chaves do catálogo incluem todos os parâmetros. Consultas privadas incluem o ID
da conta; favoritos usam `['favorites', userId]`. Stale time: catálogo e favoritos
30s, contagens 60s, sessão 30s com revalidação a cada 30s e ao retomar foco quando
obsoleta. Retries automáticos estão desabilitados nessas operações; a interface
oferece nova tentativa. As demais consultas ainda usam o cliente Query padrão.

A mutation de favorito cancela a consulta, guarda snapshot e atualiza o cache de
forma otimista. Em erro restaura o snapshot; em sucesso adota a resposta REST e
reconcilia favoritos/listagem privada. Enquanto a operação está pendente os
corações ficam desabilitados, evitando gravações concorrentes neste estágio.
Logout, expiração e troca de conta limpam os caches privados. Respostas de uma
sessão antiga não atualizam o cache da conta nova. Mudanças de sessão em outra
aba também invalidam o estado local.

O banco MSW em localStorage mantém contas cadastradas, hashes de senha, IDs de
favoritos por usuário e sessões de uma
hora; o cliente guarda apenas o token. A senha de teste é conferida com um hash
SHA-256 no mock, sem persistir senhas em claro. Essa autenticação serve apenas à
demonstração local, sem as garantias de um servidor real. Login/cadastro seguem as
referências fornecidas: modal com alternância no desktop e painel de tela inteira
com marca Kurio no mobile. Google/Facebook e recuperação de senha exibem aviso.
Após autenticar, o ícone da conta abre um menu com identidade, perfil, carteiras e
logout. A busca desktop usa Popover Radix
com fechamento externo, Escape e envio; o input preenche os 48px de altura.

Eventos `nft.updated` atualizam cache do detalhe, catálogo e carrinho; Socket.IO
é acompanhado de consulta de reconciliação ao mock. Banners e artigos usam os assets
exportados; links editoriais auxiliares mostram aviso. Seleções de filtro incluem
um indicador adicional à direita e opção de limpar/todas para melhorar a clareza.

## Detalhe e resumo de carrinho

`/nfts/$nftId` é uma rota carregada sob demanda. O detalhe usa `['nft', id]` e os
relacionados `['nft-related', id]`, com stale time de 30s, cancelamento Axios e
retry manual. `GET /api/nfts/:id` retorna `NftDetail` (galeria, edições, estoque,
metadados e 19 avaliações); 404 representa NFT inexistente.
`GET /api/nfts/:id/related` retorna até 15 itens da mesma categoria, excluindo o atual.
Os favoritos usam o mesmo cache por usuário do catálogo.

A edição selecionada fica no search param `edition`. Edição inexistente informa
o fallback, edição esgotada bloqueia adição, e os controles limitam a quantidade
ao menor valor entre estoque e máximo por pedido. O mock revalida esses limites
em cada adição, retornando 409 se o carrinho exceder a disponibilidade.

`GET /api/cart` retorna itens, quantidade, subtotal, avisos, cupom, desconto,
taxa estimada e total. Cada item inclui token e máximo disponível.
`POST /api/cart/items` recebe `{ nftId, editionId, quantity }`, devolvendo o carrinho
atualizado; erros 401/404/409/422. Quantidades são inteiras e os totais são
calculados com BigInt, mantendo ETH como string decimal. Ainda não é uma cotação
de checkout e não confirma pedidos.

`/carrinho` reutiliza Header, Footer e Carousel. `PATCH /api/cart/items/:nftId/:editionId`
substitui a quantidade; zero remove o item. O mock valida estoque e valores
inteiros. `PUT /api/cart/promotion` aplica `KURIO10` (10%) ou remove com string
vazia, persistindo por dono do carrinho. `GET /api/cart/recommendations` retorna
sugestões. O total é subtotal menos desconto mais taxa fixa estimada de 0.016 ETH
(zero sem itens), usando BigInt. Mutações bloqueiam controles enquanto pendentes
e só atualizam o cache após confirmação da API. A finalização abre `/pagamento`.

O visitante é identificado por `X-Guest-Id`, gerado localmente. Itens persistem no
banco MSW por visitante/usuário; login/cadastro mesclam itens do visitante com a
conta e informam ajustes de estoque. A consulta do carrinho usa
`['cart', userIdOuGuest, guestId]`, stale time de 10s e nenhum retry automático.
Troca/expiração de sessão cancela e limpa as consultas privadas do carrinho.

A versão mobile do detalhe tem imagem, metadados e barra fixa de compra; a
desktop reutiliza Header e Footer. As miniaturas representam quatro
enquadramentos do mesmo asset original, pois não foram fornecidas imagens de
galeria distintas. Galeria ampliada usa Dialog, informações usam Tabs e os
relacionados reutilizam Carousel e NftCard. Ações de compartilhamento abrem os
destinos correspondentes; copiar link informa sucesso somente após Clipboard API.

## Pagamento, pedidos e Socket.IO

`/pagamento?pedido=UUID` é uma rota lazy protegida pela sessão recuperada. Visitantes
recebem acesso ao login sem perder o destino. Formulário e carteira são dados da
API, isolados em `['checkout', userId, ...]`. Logout, troca de conta e expiração
cancelam essas consultas, removem cache privado e desmontam as assinaturas.

| Endpoint                           | Contrato                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/checkout`                | Perfil do colecionador e carteiras cadastradas da conta.                                                                 |
| `PUT /api/checkout/profile`        | Valida e persiste dados; 422 inclui `fields`.                                                                            |
| `POST /api/wallets`                | Cadastra nome, endereço, rede e ENS; valida endereço e duplicidade.                                                      |
| `POST /api/wallets/:id/connection` | `{ provider, connect }`; conexão, recusa ou desconexão simulada.                                                         |
| `POST /api/checkout/quote`         | `{ walletId, provider }`; cotação com validade de 120s, estoque, cupom e totais em strings ETH.                          |
| `POST /api/orders`                 | `{ quoteId, profile }` com `Idempotency-Key`; revalida sessão, conexão, cotação, disponibilidade e conteúdo do carrinho. |
| `GET /api/orders/attempt/:key`     | Recupera o pedido da mesma tentativa após timeout/refresh.                                                               |
| `GET /api/orders/:id`              | Estado/recibo somente da conta autenticada.                                                                              |

O pedido é persistido como pendente, depois confirmado/recusado pela simulação.
Status terminais não são reprocessados. A confirmação subtrai somente quantidades
do snapshot; falhas não removem itens. Carteira, perfil e resumo são copiados no
pedido e não recalculados para o recibo. O explorador é uma visualização local.

A tentativa guarda chave e corpo por usuário em `kurio.checkout-attempt.USER` antes
do envio. A API responde o mesmo pedido para chave/corpo iguais; conteúdo diferente
gera 409. Não há retry automático na mutation. Após timeout, a interface consulta
a tentativa antes de permitir reenvio com a mesma chave. Pedido na URL sobrevive
a refresh. Falhas de cotação exigem novo diálogo de revisão antes de outro envio.

`socket.io-client` usa transporte WebSocket, interceptado por MSW `ws.link` com
`@mswjs/socket.io-binding`. O cliente emite `order.subscribe` autenticado e recebe
`order.updated` com usuário, identificador, versão e pedido. O mock resolve pedidos
pendentes e emite sua transição; duplicatas e versões antigas são ignoradas, assim
como mensagens de outra sessão. Reconexão invalida a consulta REST, e uma consulta
a cada 1.5s enquanto pendente oferece reconciliação/fallback. Listeners e socket
são liberados ao sair do pedido. O binding simula o protocolo, sem servidor Socket.IO
externo, rooms ou transporte HTTP-polling. Eventos `nft.updated` atualizam preço,
disponibilidade e carrinhos abertos; versões antigas são descartadas pelo cliente
e a consulta ao mock mantém a interface atualizada se o canal não entregar evento.

Desvios de UX do desenho: indicação e ENS são opcionais; o endereço registrado é
selecionado via carteira, e novos endereços são validados no diálogo. Dados do
colecionador são expansíveis em mobile; revisão e recibo também funcionam nele.
O painel Modo demonstração permite reproduzir falhas sem comandos no console.

## Conta e carteiras

`/perfil` e `/perfil/carteiras` são rotas lazy privadas. Desktop usa a sidebar do
layout; mobile usa identidade, abas e botão de salvar fixo com safe area. Os
formulários conservam rascunhos em falhas e associam mensagens aos campos.

`GET/PUT /api/profile` consulta e salva perfil/avatar/senha em uma operação
validada. Conflitos de e-mail/usuário retornam 409 e erros de campo 422. Senha atual
é comparada por hash antes de salvar; troca válida revoga outras sessões. Avatar
é convertido em WebP de 256px no browser; o mock rejeita formatos de data URL e
tamanhos incompatíveis, sem armazenar SVG ou URLs arbitrárias.

`GET /api/wallets` retorna carteiras e preferência de secundária. `POST /api/wallets`
cadastra, `PUT /api/wallets/:id` atualiza e `PUT /api/wallets/preferences` salva a
preferência. Formatos de rede e duplicidade são validados; edição desconecta a
carteira e é bloqueada enquanto um pedido a utiliza. Cotações incluem endereço e
rede para impedir confirmar com destino modificado após a revisão. Formulários e
pagamento usam a mesma base de carteiras/perfil, sem duplicar fixtures na UI.

Consultas da conta usam `['checkout', userId, 'profile'/'wallets']`, stale time de
30s e retry manual. Mutations não têm retry automático; atualizam a sessão e
invalidam consultas da mesma conta. Os dados privados seguem a limpeza da sessão
implementada para checkout. Contas de demonstração podem ser editadas; overrides
por ID permitem persistir nome/e-mail/hash sem alterar fixtures estáticas.
