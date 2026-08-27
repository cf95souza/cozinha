# 📋 COZINHA+ — Manual de Melhorias e Evolução
## Documento de Instrução Técnica por Módulo

> **Objetivo deste documento:** Servir como guia permanente de evolução do sistema.
> Cada seção é uma unidade de trabalho independente. Pode-se parar e retomar a qualquer momento.
> Cada melhoria contém: O que existe hoje → O que está errado/faltando → O que fazer → Campos/Tabelas afetados.

---

# PARTE 1 — SEGURANÇA E INFRAESTRUTURA

## M-001: Blindagem de Acesso por Filial (CRÍTICO)

### O que existe hoje
O JWT contém `{ id, role, companyId }`. O `branchId` do usuário **não está incluído** no token. Todos os endpoints recebem `branchId` pela query string e confiam cegamente.

### O problema
Qualquer usuário autenticado pode trocar o `branchId` na URL e acessar dados de outra filial. Um Cozinheiro da Filial A consegue ver e alterar estoque da Filial B.

### O que fazer
1. **Alterar `authController.ts` (login):** Incluir `branchId` no payload do JWT.
2. **Alterar `authMiddleware.ts`:** Decodificar `branchId` do token e injetá-lo em `req.user`.
3. **Criar middleware `branchGuard.ts`:** Interceptar toda requisição que contém `branchId` na query/body. Se o user.role **não** for ADMIN, forçar o branchId do token. Admins podem acessar qualquer branch.
4. **Aplicar o middleware** em todas as rotas que filtram por `branchId`.

### Arquivos afetados
- `backend/src/controllers/authController.ts`
- `backend/src/middlewares/authMiddleware.ts`
- `backend/src/middlewares/branchGuard.ts` (NOVO)
- Todos os arquivos em `backend/src/routes/`

---

## M-002: Validação Server-Side com Zod (CRÍTICO)

### O que existe hoje
Apenas o `authController.ts` usa Zod. Todos os outros controllers aceitam `req.body` sem validação. O `updateProduct` por exemplo aceita qualquer campo, incluindo `companyId`, o que permite um usuário trocar o dono do produto.

### O que fazer
1. Criar pasta `backend/src/schemas/` com schemas Zod para cada entidade:
   - `productSchema.ts` (create, update)
   - `receivingSchema.ts`
   - `lossSchema.ts`
   - `inventorySchema.ts`
   - `recipeSchema.ts`
   - `productionSchema.ts`
2. Em cada controller de escrita (POST/PUT), validar `req.body` contra o schema.
3. Retornar erros descritivos em português para o usuário.

### Arquivos afetados
- `backend/src/schemas/` (NOVO — pasta inteira)
- Todos os controllers que fazem POST/PUT

---

## M-003: Soft Delete Global (CRÍTICO)

### O que existe hoje
`deleteProduct` faz `prisma.product.delete()` — exclusão física. O MVP diz na Regra 7: *"O sistema nunca deverá apagar definitivamente registros importantes."*

### O que fazer
1. Adicionar campo `status` (ATIVO / INATIVO) nos models: `Product`, `Supplier`, `Category`, `Location`, `User`.
2. Alterar todos os `delete()` para `update({ status: 'INATIVO' })`.
3. Alterar todos os `findMany()` para filtrar `{ status: 'ATIVO' }` por padrão.
4. Nas telas, os itens inativos não aparecem nos selects/dropdowns, mas podem ser visualizados com um filtro "Mostrar Inativos".

### Tabelas afetadas (schema.prisma)
```
Product    → adicionar: status String @default("ATIVO")
Supplier   → adicionar: status já existe (Boolean), converter para String "ATIVO"/"INATIVO"
Category   → adicionar: status String @default("ATIVO")
Location   → adicionar: status String @default("ATIVO")
User       → adicionar: status String @default("ATIVO")
```

---

## M-004: Proteção do Endpoint de Seed

### O que existe hoje
O endpoint `POST /api/auth/seed` cria um admin com senha `admin123` e retorna a senha no response.

### O que fazer
1. Proteger o endpoint com uma variável de ambiente `SEED_SECRET`.
2. Exigir header `X-Seed-Secret` na requisição.
3. Nunca retornar a senha em texto no response.
4. Idealmente, desabilitar o endpoint em produção (`NODE_ENV=production`).

---

# PARTE 2 — ENRIQUECIMENTO DO CADASTRO (Tabelas e Campos)

## M-005: Cadastro de Empresa — Informações Completas

### O que existe hoje
Model `Company` tem apenas: `id`, `name`, `createdAt`, `updatedAt`. Extremamente pobre.

### Campos que devem ser adicionados
```
Company:
  name          String      (já existe)
  tradeName     String?     // Nome Fantasia
  document      String?     // CNPJ
  stateRegist   String?     // Inscrição Estadual
  phone         String?     // Telefone principal
  email         String?     // Email corporativo
  address       String?     // Endereço completo
  city          String?
  state         String?
  zipCode       String?
  logoUrl       String?     // Logo para etiquetas e relatórios
  currencyCode  String      @default("BRL")  // Moeda padrão
  timezone      String      @default("America/Sao_Paulo")
  expirationAlertDays Int   @default(7)  // Dias para alertar validade
  requireReceivingApproval Boolean @default(true) // Recebimento exige aprovação?
  defaultExpirationDays    Int @default(365) // Validade padrão quando não informada
```

### Tela afetada
- `frontend/src/pages/CompanySettings.tsx` — Expandir formulário com todos os novos campos.

---

## M-006: Cadastro de Filiais — Dados Ricos

### O que existe hoje
Model `Branch` tem apenas: `id`, `name`, `companyId`, timestamps.

### Campos que devem ser adicionados
```
Branch:
  name          String      (já existe)
  tradeName     String?     // Nome fantasia da filial
  document      String?     // CNPJ da filial (se diferente)
  phone         String?
  email         String?
  address       String?
  city          String?
  state         String?
  zipCode       String?
  managerName   String?     // Nome do responsável/gerente
  type          String      @default("RESTAURANTE")  // RESTAURANTE, MERCADO, ATACADO, DEPOSITO
  status        String      @default("ATIVO")
```

O campo `type` é essencial porque o mesmo cliente tem restaurante, mercado e atacado. O sistema pode adaptar o comportamento (ex: no atacado, quantidades são maiores, no restaurante a ficha técnica é mais relevante).

---

## M-007: Cadastro de Produtos — Nivel Profissional (Estilo Referência Premium)

### O que existe hoje
O produto tem campos básicos. Faltam campos essenciais que sistemas como Referência Premium, Saipos e TOTVS usam.

### Campos que devem ser adicionados
```
Product:
  // === Campos que já existem ===
  name, sku, unit, brand, minStock, maxStock, controlled,
  temperatureControlled, minTemperature, maxTemperature,
  costPrice, categoryId, locationId, supplierId, companyId, branchId

  // === NOVOS CAMPOS ===
  status              String    @default("ATIVO")        // Soft delete
  barcode             String?                             // Código de barras EAN do fabricante
  description         String?   @db.Text                  // Descrição detalhada
  photoUrl            String?                             // Foto do produto
  defaultExpirationDays Int?                              // Validade padrão em dias (ex: 30)
  conservationMethod  String?                             // REFRIGERADO, CONGELADO, AMBIENTE, SECO
  sifCode             String?                             // Código SIF (Inspeção Federal) — ANVISA
  ncmCode             String?                             // NCM para notas fiscais futuras
  sellPrice           Float?                              // Preço de venda (para PDV)
  marginPercentage    Float?                              // Margem de lucro % 
  weight              Float?                              // Peso líquido (gramas)
  packageWeight       Float?                              // Peso bruto (com embalagem)
  notes               String?   @db.Text                  // Observações internas
  abcClass            String?                             // Classificação Curva ABC: A, B, C
  isComposite         Boolean   @default(false)           // Se é um produto composto (receita)
  yieldPercentage     Float?                              // Fator de rendimento (ex: 0.85 = 85%)
```

### Por que esses campos importam
- **`barcode`**: Leitor de código de barras no recebimento para identificar produto instantaneamente.
- **`defaultExpirationDays`**: Quando o estoquista recebe um frango e não sabe a validade, o sistema auto-preenche com "3 dias" baseado no cadastro.
- **`conservationMethod`**: O Referência Premium usa isso para classificar onde o produto deve ficar (câmara fria, freezer, seco). Útil para alertar se alguém armazena no local errado.
- **`sifCode`**: Exigência ANVISA para carnes e derivados. Diferencial profissional.
- **`sellPrice` + `marginPercentage`**: Essencial para o PDV calcular margem.
- **`abcClass`**: Curva ABC. Produtos Classe A (20% dos itens que representam 80% do custo) precisam de controle rigoroso. Classe C pode ter controle mais simples.
- **`yieldPercentage`**: Fator de rendimento. 1kg de frango cru → 0.85kg limpo. Permite calcular o custo real por kg utilizável.

---

## M-008: Cadastro de Fornecedores — Dados Comerciais

### O que existe hoje
`Supplier`: name, document, contact, phone, email, status, companyId, branchId.

### Campos que devem ser adicionados
```
Supplier:
  // NOVOS
  tradeName       String?     // Nome Fantasia
  address         String?
  city            String?
  state           String?
  zipCode         String?
  website         String?
  paymentTerms    String?     // Condições de pagamento (ex: "30/60/90 dias")
  deliveryDays    String?     // Prazo médio de entrega (ex: "2 dias úteis")
  minimumOrder    Float?      // Pedido mínimo em R$
  notes           String?     @db.Text
  rating          Float?      // Nota de avaliação (1 a 5) — preenchida manualmente pelo gestor
  status          String      @default("ATIVO") // converter de Boolean para String
```

---

## M-009: Locais de Armazenamento — Dados de Controle

### O que existe hoje
`Location`: id, name, companyId, branchId.

### Campos que devem ser adicionados
```
Location:
  // NOVOS
  type              String?     // CAMARA_FRIA, FREEZER, GELADEIRA, SECO, PRATELEIRA, DEPOSITO
  minTemperature    Float?      // Temperatura mínima ideal do local
  maxTemperature    Float?      // Temperatura máxima ideal
  capacity          Float?      // Capacidade em kg ou litros
  status            String      @default("ATIVO")
  notes             String?
```

Com `minTemperature` e `maxTemperature` no local, o sistema pode alertar se um produto que exige 0°C a 5°C foi armazenado em um local que opera a -18°C (freezer). Alertas inteligentes.

---

# PARTE 3 — MÓDULOS EXISTENTES QUE PRECISAM SUBIR DE NÍVEL

## M-010: Tela de Estoque — Reescrever Completamente

### O que existe hoje
`Stock.tsx` — 72 linhas. Uma tabela pura com 4 colunas (Produto, SKU, Local, Quantidade). Sem filtro, sem busca, sem indicadores visuais.

### O que deve ter
1. **Barra de busca** por nome de produto no topo.
2. **Filtros laterais**: Categoria, Local de Armazenamento, Apenas Abaixo do Mínimo, Apenas Controlados.
3. **Indicador visual de nível**: Barra de progresso colorida (verde = ok, amarelo = atenção, vermelho = abaixo do mínimo).
4. **Agrupamento por Local** (colapsável): Câmara Fria 01 → lista de produtos dentro.
5. **Coluna de Valor Estimado** (Qtd × Custo Unitário).
6. **Coluna de Status do Lote** (mostrando se o lote mais antigo está vencido/vencendo).
7. **Badge "Controlado"** para itens marcados como especiais.
8. **Totalização no rodapé**: Total de itens, valor total em estoque.
9. **Botão para exportar** a tabela em CSV/PDF.

---

## M-011: Relatórios — Expandir para 8 Tipos

### O que existe hoje
`Reports.tsx` — 2 abas (Estoque Atual e Movimentações). Sem filtro de data. Botão "Exportar CSV" não funciona.

### Relatórios que devem ser criados

| # | Relatório | Filtros | Dados |
|---|-----------|---------|-------|
| 1 | Estoque Atual | Categoria, Local | Produto, Qtd, Valor, Min/Max, Status |
| 2 | Movimentações | Data Início/Fim, Tipo, Produto | Extrato completo |
| 3 | Perdas | Data, Motivo, Produto | Custo da perda, motivo, responsável |
| 4 | Validades | Período (hoje, 3d, 7d, 15d, 30d) | Lotes vencendo, produto, local |
| 5 | Recebimentos | Data, Fornecedor, Status | Notas, divergências, valores |
| 6 | Inventário | Data, Status | Divergências encontradas, ajustes |
| 7 | Produção | Data, Receita | Rendimento real vs planejado |
| 8 | CMV (Custo de Mercadoria Vendida) | Período | Estoque Inicial + Compras - Estoque Final |

### Exportação
- Implementar exportação real em **CSV** (gerando arquivo com `Blob` + `URL.createObjectURL`).
- Futuramente, PDF (usando `jspdf` ou `html2canvas`).

---

## M-012: Auditoria — Humanizar para o Gestor

### O que existe hoje
`AuditLog.tsx` — Mostra JSON bruto na coluna de detalhes. Ações em inglês (POST, PUT, DELETE).

### O que fazer
1. **Traduzir ações**: POST → "Criou", PUT → "Editou", DELETE → "Removeu/Inativou".
2. **Traduzir entidades**: `/api/products` → "Produto", `/api/receivings` → "Recebimento".
3. **Detalhes legíveis**: Em vez de JSON, mostrar "Editou o produto Filé de Frango: quantidade de 10 para 15".
4. **Filtros**: Por período (date picker), por usuário (dropdown), por tipo de ação.
5. **Paginação**: Hoje mostra apenas os últimos 100. Adicionar paginação real.

---

## M-013: Busca Global — Expandir para Busca Completa

### O que existe hoje
Busca apenas por nome/SKU de produto e número de lote.

### O que o MVP promete (Seção 38)
A busca deve encontrar: Produto, Lotes, Estoque, Localização, Validade, Recebimentos, Movimentações.

### O que fazer
1. No `SearchController.ts`, adicionar queries para:
   - Fornecedores (por nome)
   - Recebimentos (por número de nota fiscal)
   - Movimentações (por tipo)
2. No frontend, separar os resultados em seções com ícones (🏷️ Produtos, 📦 Lotes, 🚚 Fornecedores, 📄 Notas).
3. Ao clicar em um resultado, navegar para a tela relevante.

---

## M-014: Inventário — Contagem por QR Code

### O que existe hoje
A contagem é feita selecionando produto por dropdown e digitando a quantidade.

### O que o MVP promete (Seção 28)
"Essa deverá ser uma das funções mais rápidas do sistema": Escanear QR → Produto identificado → Estoque teórico exibido → Informar estoque físico → Confirmar → Próximo.

### O que fazer
1. Integrar leitor de câmera/QR Code na tela de inventário (biblioteca `html5-qrcode`).
2. Ao escanear, buscar a etiqueta pelo `qrCode`, preencher produto e estoque teórico automaticamente.
3. O estoquista só precisa digitar a quantidade real e apertar "Próximo".
4. Adicionar modo "Contagem Rápida" — apenas produtos selecionados.
5. Adicionar modo "Contagem por Local" — apenas produtos de uma câmara/prateleira.

---

## M-015: Autenticação — Completar

### O que existe hoje
Login com email/senha. Token de 8h sem refresh. Sem "Esqueci minha Senha". Sem bloqueio.

### O que fazer
1. **Refresh Token**: Criar um token de refresh (validade 30 dias) e um endpoint `/api/auth/refresh`.
2. **"Esqueci minha Senha"**: Endpoint que gera um token temporário. Por enquanto (sem email), exibir o link de reset no log do servidor para o admin copiar e enviar manualmente.
3. **Bloqueio por Tentativas**: Após 5 tentativas falhas, bloquear o email por 15 minutos.
4. **Alterar Senha**: Tela para o próprio usuário trocar sua senha.

---

# PARTE 4 — FUNCIONALIDADES NOVAS

## M-016: Histórico Individual por Produto (Raio-X)

### O que é
Uma tela de "ficha completa" de um produto. Ao clicar em um produto no Estoque ou no Cadastro, abre uma página mostrando TUDO sobre ele:
- Saldo atual em cada local/filial
- Gráfico de variação do estoque nos últimos 30 dias
- Últimas 20 movimentações (entradas, saídas, perdas, transferências)
- Lotes ativos (com validade e quantidade restante)
- Lotes vencidos/consumidos (histórico)
- Receitas que usam esse produto como ingrediente
- Fornecedores que já entregaram esse produto
- Recebimentos recentes com esse produto

### Onde
- Nova página `ProductDetail.tsx`
- Nova rota `/produto/:id`
- Backend: novo endpoint `GET /api/products/:id/history`

---

## M-017: Sugestão Automática de Compra

### O que é
Quando um produto cai abaixo do `minStock`, o sistema gera automaticamente uma **Lista de Compras Sugerida** com:
- Nome do produto
- Fornecedor principal
- Quantidade atual
- Quantidade para atingir o `maxStock`
- Custo estimado da reposição (quantidade × custo unitário)

### Onde
- Nova seção no Dashboard ou nova página `PurchaseSuggestion.tsx`
- Backend: endpoint `GET /api/suggestions/purchase?branchId=X`

---

## M-018: Curva ABC Automática

### O que é
Classificação automática dos produtos em A, B e C baseado no valor de estoque (Qtd × Custo):
- **A**: 20% dos itens que representam ~80% do valor. Controle máximo.
- **B**: Itens intermediários. Controle moderado.
- **C**: Itens de baixo impacto. Controle simplificado.

### Onde
- Nova aba no Relatório ou nova página `ABCCurve.tsx`
- Backend: calcular automaticamente baseado nos `StockBalance` × `costPrice`

---

## M-019: Cálculo de CMV (Custo de Mercadoria Vendida)

### O que é
O indicador mais importante para um restaurante/mercado. Fórmula:
```
CMV = Estoque Inicial + Compras do Período - Estoque Final
CMV% = (CMV / Faturamento) × 100
```
Referência do mercado: 25% a 35%.

### Como calcular
- **Estoque Inicial**: Snapshot do valor total em estoque no início do período (criar tabela `StockSnapshot`).
- **Compras**: Soma dos recebimentos aprovados no período.
- **Estoque Final**: Valor total atual.
- **Faturamento**: Soma das vendas no PDV (quando implementado).

### Onde
- Nova aba no Relatório: "CMV Mensal"
- Novo model no schema: `StockSnapshot` (foto do estoque em uma data)

---

## M-020: Alertas Clicáveis no Dashboard

### O que existe hoje
Os alertas no sino de notificação mostram "X lotes vencidos" e "X abaixo do mínimo" mas não são clicáveis.

### O que fazer
1. Ao clicar em "4 lotes vencidos" → Navegar para `/validades?filter=vencidos`
2. Ao clicar em "3 abaixo do mínimo" → Navegar para `/estoque?filter=abaixo_minimo`
3. Adicionar novos alertas:
   - Recebimentos aguardando conferência → `/recebimentos?status=AGUARDANDO`
   - Inventários pendentes → `/inventario?status=PENDENTE`
   - Produções com rendimento abaixo de 80% → `/producao`

---

## M-021: Modo Escuro

### O que existe hoje
O CSS tem variáveis de dark mode definidas em `App.css`, mas não existe toggle na interface.

### O que fazer
1. Adicionar botão de toggle no menu lateral ou header (ícone sol/lua).
2. Salvar preferência no `localStorage`.
3. Alternar classe `dark` no `<html>`.

---

## M-022: Configurações da Empresa (Expandir)

### O que deve ter
1. **Logo da empresa** (upload) — para etiquetas e relatórios.
2. **Dias de alerta de validade** (configurável, hoje é fixo em 7).
3. **Moeda e formato de data.**
4. **Regra de recebimento**: precisa de aprovação do gestor ou entra automaticamente.
5. **Fuso horário.**
6. **Dados fiscais** (CNPJ, IE, endereço).

---

# PARTE 5 — POLIMENTO E EXPERIÊNCIA DO USUÁRIO

## M-023: Paginação em Todas as Listagens

### O que existe hoje
Nenhuma tela tem paginação. Se o restaurante tiver 500 produtos, carrega tudo de uma vez.

### O que fazer
Implementar paginação backend (`skip`/`take` no Prisma) + frontend (componente de paginação) em:
- Produtos, Estoque, Movimentações, Relatórios, Auditoria, Lotes, Recebimentos, Perdas.

---

## M-024: Feedback Visual (Toast Notifications)

### O que existe hoje
`alert()` nativo do navegador para feedback. Feio e bloqueia a tela.

### O que fazer
Implementar sistema de Toast Notifications (biblioteca `react-hot-toast` ou similar):
- Sucesso (verde): "Produto salvo com sucesso"
- Erro (vermelho): "Estoque insuficiente para produção"
- Aviso (amarelo): "3 lotes vencendo amanhã"

---

## M-025: Loading States e Empty States

### O que existe hoje
Algumas telas mostram "Carregando..." sem animação. Outras não tratam o estado vazio.

### O que fazer
1. Criar componente `LoadingSkeleton` (placeholder animado).
2. Criar componente `EmptyState` com ilustração e mensagem contextual (ex: "Nenhum produto cadastrado. Comece adicionando seu primeiro produto!").

---

## M-026: Atualizar Documentação do Projeto

### `database.md`
Está completamente desatualizado. Reescrever com todas as 16+ tabelas atuais, seus campos e relacionamentos.

### `documentacao.md`
Congelado na Fase 0. Adicionar:
- Histórico de decisões técnicas (troca de uuid para crypto, unificação do PrismaClient, etc.)
- Registro de cada fase concluída.
- Decisões de negócio (cancels de fornecedores e notificações externas).

---

# RESUMO DE PRIORIDADES

| Prioridade | IDs | Descrição Resumida |
|---|---|---|
| 🔴 Crítico | M-001, M-002, M-003, M-004 | Segurança, validação, soft delete |
| 🟠 Alto | M-005, M-006, M-007, M-008, M-009 | Enriquecer tabelas (Empresa, Filial, Produto, Fornecedor, Local) |
| 🟠 Alto | M-010, M-011, M-012 | Reescrever Estoque, Relatórios e Auditoria |
| 🟢 Médio | M-013, M-014, M-015 | Busca Global, Inventário QR, Auth completo |
| 🟢 Médio | M-016, M-017, M-018, M-019 | Raio-X Produto, Sugestão Compra, Curva ABC, CMV |
| 🔵 Polimento | M-020 a M-026 | Alertas, Dark Mode, Paginação, Toasts, Docs |

---

> **NOTA FINAL:** Cada melhoria acima (M-001 a M-026) é uma unidade atômica de trabalho.
> Pode-se executar qualquer uma delas independentemente, em qualquer ordem, e parar a qualquer momento.
> Ao retomar, basta ler a seção correspondente para saber exatamente o que já existe, o que está errado e o que precisa ser feito.
