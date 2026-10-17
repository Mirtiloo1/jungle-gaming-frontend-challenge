# Jungle Gaming — Frontend Challenge

Marketplace Kurio em desenvolvimento. A home inclui catálogo integrado à API
simulada, filtros combinados, busca, ordenação, paginação e favoritos por conta.
Login/cadastro usam modais responsivos. A tela de detalhes inclui galeria,
edições, quantidade, avaliações, relacionados e adição ao carrinho. A página de
carrinho permite alterar quantidades, remover itens e aplicar cupom. Pagamento e
recibo usam API simulada, com carteiras, cotação, pedidos idempotentes e atualização
via Socket.IO. Perfil e carteiras permitem edição persistida, avatar e alteração
de senha. Preço e disponibilidade dos NFTs são reconciliados em tempo real com
fallback de consulta ao mock.

## Requisitos

- Node.js 22.12 ou superior (recomendado Node 22 LTS).
- npm e um navegador compatível com Playwright.

## Instalação

```sh
npm ci
npx playwright install chromium
```

As variáveis disponíveis estão em `.env.example`. Para personalizar, copie para
`.env.local`. O modo `mocks` já possui configuração versionada em `.env.mocks`.
Nenhuma variável `VITE_` deve conter segredos: seu conteúdo fica público no bundle.
Os mocks são ativados por padrão, inclusive no build. Defina
`VITE_ENABLE_MOCKS=false` apenas ao conectar uma API externa compatível.

## Como experimentar catálogo e favoritos

- Use `npm run dev` ou `npm run dev:mocks`.
- Escolha coleção, redes e preço; clique em **Aplicar** (também no painel mobile).
- A busca é enviada com Enter ou pelo botão de lupa. Abas e ordenação aplicam
  imediatamente. Qualquer mudança aplicada reinicia a página.
- **Limpar filtros** restaura a listagem completa de 36 NFTs.
- Clique no coração e entre com `ana@kurio.test` ou `bruno@kurio.test`.
  A senha fictícia de ambas as contas é `Kurio123!`.
- Depois do login, clique no coração para salvar ou remover um NFT. **Meus
  favoritos** mostra somente os itens da conta atual. O ícone de usuário abre o
  menu com nome/e-mail, **Meu perfil**, **Carteiras** e **Sair da conta**.
- Use **Criar conta** no modal desktop ou **Crie uma conta** no mobile para
  cadastrar uma conta fictícia. Nome de usuário: 3–24 caracteres; senha: ao menos
  8 caracteres com letras e números, com confirmação igual. E-mail/nome já usados
  retornam conflito. A nova conta permanece após refresh e permite novo login.
- O campo da busca desktop abre em um popover e fecha ao clicar fora, pressionar
  Escape ou enviar a busca. O campo mobile permanece no topo da página.
- Login social e recuperação de senha exibem aviso de indisponibilidade; nenhuma
  autenticação externa ou envio de e-mail é realizado.
- A URL guarda busca, filtros, aba, ordenação, modo favoritos e página; refresh e
  histórico restauram a consulta. Contagens laterais representam o catálogo completo.
- A sessão simulada dura uma hora. Favoritos e sessões persistem no navegador,
  sem armazenar as senhas digitadas.

## Detalhes e carrinho

Clique na imagem/nome de um card ou abra `/nfts/nft-001` diretamente. Troque as
miniaturas no desktop, amplie a imagem e consulte detalhes/avaliações. A edição
`1/1` está esgotada; `1/10` aceita até 2 unidades e `1/50` até 5. A edição aberta
aceita até 10 unidades. Preços e limites são retornados pela API simulada.

Comprar adiciona a edição/quantidade ao carrinho e abre um resumo, sem confirmar
pagamento. O ícone de carrinho abre `/carrinho`, com contador real. O resumo
também oferece o link **Ver carrinho**.
O visitante mantém os itens após refresh. Ao entrar, o carrinho do visitante é
mesclado à conta; se exceder estoque/limite, a quantidade é ajustada com aviso.
Na página, altere quantidades ou remova itens. O cupom fictício `KURIO10` aplica
10% ao subtotal e persiste por visitante/conta. `KURIOEXPIRED` simula um código
expirado. A taxa de rede é uma estimativa
fixa de `0.016 ETH` para carrinhos com itens. Todos os cálculos usam precisão
inteira. **Conectar e finalizar** abre `/pagamento`, protegido por login.

## Pagamento e recibo

1. Adicione um NFT, abra o carrinho e clique em **Conectar e finalizar**.
2. Entre com uma conta fictícia. O carrinho do visitante é preservado.
3. Selecione uma carteira cadastrada e WalletConnect, MetaMask ou Coinbase Wallet.
   **Trocar carteira** também permite cadastrar um endereço fictício válido.
4. Clique em **Conectar carteira**, revise os dados do colecionador e clique em
   **Confirmar compra**. No mobile, os dados ficam no painel expansível.
5. Confira a cotação no diálogo e clique em **Confirmar pagamento**.
6. Aguarde a confirmação da API. O recibo preserva itens, quantidades, valores,
   taxas, carteira e transação do pedido. Nenhum valor real é movimentado.

Em **Modo demonstração**, escolha o cenário antes da próxima tentativa:

| Cenário                          | Comportamento                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| Pagamento aprovado               | Confirma e remove somente os itens/quantidades comprados.                                           |
| Pagamento recusado               | Exibe recusa, preserva carrinho e oferece nova tentativa.                                           |
| Timeout após envio               | O pedido é criado, a resposta demora mais que 3s e a interface recupera a mesma tentativa pela API. |
| Confirmação demorada             | Pedido fica pendente por 7s; recarregue para verificar retomada.                                    |
| Conexão de carteira recusada     | Recusa a próxima conexão; desconecte primeiro caso já esteja conectada.                             |
| Taxa alterada antes de confirmar | Atualiza a taxa para 0.020 ETH, recusa a cotação antiga e exige nova revisão.                       |
| Falha temporária de serviço      | Retorna 503; volte para aprovado e use Tentar novamente.                                            |
| Preço e estoque em tempo real    | Atualiza Emerald Ape #042 para 1.29 ETH e uma unidade disponível nas páginas abertas.               |

As opções correspondem às chaves `default`, `payment-declined`, `order-timeout`,
`order-pending`, `wallet-rejected`, `quote-changed`, `checkout-error` e
`nft-updated` em
`kurio.mock-scenario`. O painel só existe quando os mocks estão ativos. Pedidos
terminais não mudam ao trocar de cenário; uma nova tentativa deve ser iniciada.
O explorador do recibo é local e simulado, sem link para uma transação real.

## Perfil e carteiras

Após entrar, abra o ícone de conta e escolha **Meu perfil** (`/perfil`) ou
**Carteiras** (`/perfil/carteiras`). Ambas aceitam acesso direto e retomam o login
na mesma rota. No mobile, use as abas Perfil, Carteiras, Atividade e Favoritos.

- Perfil: nome, usuário, e-mail, ENS opcional, apelido da carteira principal,
  upload/remoção de avatar e alteração de senha. Avatar aceita PNG/JPG/WebP até
  5 MB, recortado e otimizado localmente em 256px antes do envio. Clique em Salvar
  para persistir as alterações. Erros de validação/conflito mantêm o formulário.
- Para trocar a senha, preencha senha atual, nova senha e confirmação. Uma senha
  incorreta impede toda a atualização. Somente hashes são persistidos; sessões
  anteriores da conta são revogadas e a atual permanece ativa.
- Carteiras: escolha a principal ou uma secundária para editar; **Adicionar**
  abre um modal para cadastrar outra. Endereços são validados conforme Ethereum/Polygon/Solana,
  duplicatas na mesma rede são recusadas, e edições exigem reconexão no pagamento.
  Uma carteira usada em pedido pendente não pode ser alterada até sua conclusão.
- **Atividade** (`/perfil/atividade`) mostra os pedidos da conta, seus status e
  acesso ao recibo. Pedidos pendentes são atualizados automaticamente.
- **Lista de interesse** (`/perfil/favoritos`) mostra os NFTs favoritados dentro
  da conta, com paginação e remoção pelo coração.
- **Sair** pede confirmação; cancelar mantém a sessão ativa.
- Dados são isolados por conta e permanecem após refresh. Ofertas, Arquivos
  baixados e Suporte continuam exibindo um aviso de demonstração.

Para testar falhas de gravação, configure `profile-error` ou `wallet-error` em
`kurio.mock-scenario` após abrir o formulário. Remova o cenário para tentar de novo.

## Cenários reproduzíveis

No console do navegador, configure um cenário antes da próxima operação:

```js
localStorage.setItem('kurio.mock-scenario', 'favorite-error')
```

Valores: `default`, `favorite-error` (503 na gravação, com rollback),
`catalog-error` (503 na listagem), `detail-error` (503 no detalhe) e `slow`
(latência de 1200ms na listagem/detalhe).
Recarregue para testar falha/carregamento do catálogo. Remova o cenário e clique
em **Tentar novamente** para recuperar:

```js
localStorage.removeItem('kurio.mock-scenario')
```

Reset completo do catálogo/favoritos/sessão simulados:

```js
localStorage.removeItem('kurio.mock-database.v1')
localStorage.removeItem('kurio.session-token')
localStorage.removeItem('kurio.guest-id')
localStorage.removeItem('kurio.mock-scenario')
Object.keys(localStorage)
  .filter((key) => key.startsWith('kurio.checkout-attempt.'))
  .forEach((key) => localStorage.removeItem(key))
location.reload()
```

## Comandos

```sh
npm run dev
npm run dev:mocks
npm run build
npm run build:mocks
npm run preview
npm run typecheck
npm run lint
npm run format:check
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:report
npm run test:visual
npm run audit:lighthouse
```

Desenvolvimento: `http://localhost:5173`. Preview: `http://localhost:4173`.
O Playwright inicia automaticamente um build com mocks e o preview.
`tests/e2e/catalog.spec.ts` cobre filtros, busca, preço, ordenação, paginação,
histórico, favoritos, persistência, rollback, troca de conta e recuperação de erro.
`tests/e2e/auth-interface.spec.ts` cobre cadastro/login, validação e conflito,
menu da conta, exibição de senha, foco e fechamento da busca.
`tests/e2e/nft-detail.spec.ts` cobre acesso direto/refresh, galeria, estoque,
quantidades, favoritos sincronizados, abas, relacionados, carrinho, recuperação e
atualização de preço/estoque sem refresh.
`tests/e2e/cart.spec.ts` cobre estado vazio, alteração/remoção, limites, totais,
persistência, cupons, falha de atualização, revalidação por estoque/preço,
diálogo de finalização e responsividade.
`tests/e2e/checkout.spec.ts` cobre compra, revisão, validação, conexão/recusa,
pagamento recusado, clique repetido, timeout, retomada por refresh e recibo.
`tests/e2e/account.spec.ts` cobre edição persistida, conflitos, avatar, senha,
carteiras, favoritos, histórico de compras, confirmação de saída, integração com
pagamento e isolamento entre contas.
Cada teste usa um contexto de navegador isolado. `tests/visual` mantém baselines
de início e detalhe do NFT nas larguras desktop e mobile; tablet é pulado
intencionalmente nessa suíte. A auditoria executa três coletas mobile e três
desktop para a raiz e o detalhe. O Chrome precisa estar disponível (use
`CHROME_PATH` se a detecção automática não encontrar o executável).

## Componentes shadcn/ui

O CLI, as dependências básicas, os aliases e `components.json` estão preparados.
Carousel e Button já foram adicionados. Para adicionar outros quando necessário:

```sh
npm run shadcn -- add button
```

Os tokens visuais estão em `src/styles/globals.css`; a fonte original permanece
pendente de confirmação.

## Entrega

O projeto está preparado para execução local, build com mocks, testes funcionais,
regressão visual e auditorias Lighthouse. A publicação depende apenas da escolha
da plataforma e das credenciais do repositório de entrega.

Consulte `ARCHITECTURE.md` para a organização das pastas.

## Dependências de desenvolvimento

A instalação inicial apontou 23 alertas no `npm audit` (2 baixos, 4 moderados e
17 altos), nas árvores de ferramentas de desenvolvimento, incluindo shadcn CLI e
Lighthouse CI. Não foram aplicados downgrades ou overrides forçados. Reavaliar as
versões dessas ferramentas antes da entrega; executar `npm audit` para o estado
atual dos avisos.
