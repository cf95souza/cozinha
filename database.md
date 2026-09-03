# Banco de Dados: COZINHA+

Este documento servirá como base para recriação total do banco, contendo todas as estruturas e queries SQL do sistema.

## Estrutura do Banco de Dados
- **SGBD**: PostgreSQL.
- **ORM**: Prisma.

## Tabelas e Relacionamentos (Atualizado: M-026)

O banco agora possui mais de 25 tabelas, estruturando todo o fluxo de um ERP de cozinha e backoffice, incluindo Múltiplas Unidades, Produtos (Enriquecido), Produção, Inventário, Compras, Raio-X de Estoque e o Módulo Financeiro completo.

### Estrutura Base & Usuários
- **`Company`**: Grupos Econômicos / Matriz. Inclui CNPJ, Moeda, Regras de alerta de validade e Fuso horário.
- **`Branch`**: Filiais / Unidades de Negócio Físicas. Contém gestor, endereço e status de soft delete. Relacionado a Company.
- **`User`**: Usuários e perfis de acesso, vinculados a Company e/ou Branch. Contém lógica de lock por login falho e soft delete.

### Cadastros Mestres (Backoffice)
- **`Category`**: Categorias de produtos por Empresa/Filial.
- **`Location`**: Locais de armazenamento dentro de uma Branch (ex: Câmara Fria, Seco). Com limites de temperatura min/max e capacidade.
- **`Supplier`**: Fornecedores. Possui dados como Condições de Pagamento, Prazo de Entrega, Pedido Mínimo, Nota/Avaliação, e CNPJ completo.
- **`Product`**: Catálogo Central de Produtos (Extremamente rico). Inclui controle por temperatura, campos EAN (código de barras), SIF (ANVISA), NCM, classificação Curva ABC (A/B/C), preço de venda e margem, fator de rendimento e controle de validade padrão.

### Estoque e Movimentação
- **`StockBalance`**: Saldo de estoque consolidado e atual em tempo real. Uma linha por `(productId, branchId, locationId)`.
- **`StockMovement`**: Histórico inalterável de auditoria de movimentações físicas (Entrada, Saída, Ajuste, Transferências entre Branches e Locations).
- **`StockSnapshot`**: Tabela essencial para cálculo de **CMV**. Registra fotos/snapshots periódicos do valor financeiro do estoque total de uma filial em uma determinada data.

### Lotes, Validades e Controle de Perdas
- **`Lot`**: Controle estrito de Lote (Rastreio) e Validades. Mantém qtde inicial e qtde atual, validade, e status de qualidade ("NORMAL", etc).
- **`Loss`**: Registro formal de perdas/descarte (Quebra, Vencimento). Opcionalmente vinculado a um Lote e com foto probatória do descarte.
- **`Label`**: Registro das Etiquetas e QR Codes físicos gerados para colagem em insumos manipulados/porcionados.

### Compras e Recebimento
- **`Receiving`**: Cabeçalho de Nota Fiscal ou Recibo de Entrada. O status controla a aprovação do gestor se configurado na `Company`.
- **`ReceivingItem`**: Itens da NF (Entrada). Controla Qtd Solicitada vs Qtd Recebida (Divergências), temperatura na hora do recebimento (avaliação de qualidade), unidade, e Lote gerado.

### Inventário (Contagem Cega)
- **`Inventory`**: Cabeçalho de inventário realizado em uma data. (Status: Pendente, Concluído).
- **`InventoryItem`**: Divergências da contagem (Estoque Teórico vs Físico), registrando as diferenças de contagem e notas.

### Ficha Técnica e Produção
- **`Recipe`**: Ficha Técnica (Receita). Refere-se a um `Product` final (Prato ou Pré-Preparo), seu rendimento esperado (Qtd) e tempo de execução.
- **`RecipeItem`**: Ingredientes requeridos na Receita (Fator/Qtd) que serão consumidos.
- **`Production`**: Ordem de Produção Executada. Compara a quantidade que se esperava render com o que realmente rendeu, registrando % de perdas naturais.
- **`ProductionIngredient`**: Registro real dos insumos que foram retirados do estoque (com baixa de lote) para a panela.

### Vendas e PDV
- **`Sale`**: Registra vendas diretas consolidando saídas financeiras do PDV. Relaciona a forma de pagamento (`paymentType`) e o total pago.
- **`SaleItem`**: Itens vendidos em uma transação (`Sale`). Se o produto tiver receita, aciona baixa nos ingredientes; senão, baixa no produto final.

### Segurança e Auditoria
- **`AuditLog`**: Registro imutável para compliance. Grava Ação, Entidade (Tabela), ID Afetado, Usuário, e o JSON contendo `details` das mudanças realizadas, para histórico.

### Financeiro e Fluxo de Caixa (Fase 16)
- **`FinancialCategory`**: Plano de contas, dividindo as naturezas entre Receita, Despesa e Custo.
- **`Payable` e `Receivable`**: Contas a Pagar e Contas a Receber. Controlam fornecedores, clientes, valores, datas de vencimento e status de liquidação.
- **`FinancialTransaction`**: O Livro-Caixa / Extrato consolidado. Toda movimentação real de liquidação de títulos ou venda no balcão gera um registro aqui, alimentando o Fluxo de Caixa Diário e o DRE.
- **`CashRegister`**: Caixas/PDVs físicos em uma filial.
- **`CashShift`**: Turnos de abertura e fechamento de caixa, gravando o operador, saldos iniciais, finais e diferenças de quebra de caixa.
- **`CashMovement`**: Entradas e retiradas manuais do caixa (Sangria e Suprimento).

## Queries SQL e ORM
O mapeamento completo, os índices (`@@unique`) e as regras de exclusão em cascata (como em Itens de NF e Produção) estão gerenciados centralmente pelo Prisma Schema (`backend/prisma/schema.prisma`). Alterações de schema geram arquivos SQL na pasta `backend/prisma/migrations`.
