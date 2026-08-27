# COZINHA+

## Sistema Inteligente de Gestão Operacional de Cozinha

### Versão 1.0 — Especificação do MVP

---

# 1. VISÃO DO PRODUTO

O **COZINHA+** será um sistema de gestão operacional exclusivamente voltado para cozinhas profissionais.

O objetivo é centralizar, simplificar e registrar as principais atividades relacionadas a:

* Recebimento de mercadorias
* Conferência
* Estoque
* Lotes
* Validades
* Etiquetas
* QR Code
* Inventário
* Produção
* Perdas
* Controle de estoque mínimo
* Fornecedores
* Alertas
* Relatórios
* Auditoria

O sistema deverá ser **mobile first**, extremamente simples de utilizar e adequado para colaboradores que trabalham diretamente na cozinha.

A filosofia principal será:

> **Poucos cliques, pouca digitação e máximo controle.**

---

# 2. PRINCÍPIO DO SISTEMA

O sistema deverá acompanhar o produto desde sua entrada até sua saída ou descarte.

## Fluxo principal

**FORNECEDOR**

↓

**RECEBIMENTO**

↓

**CONFERÊNCIA**

↓

**LOTE + VALIDADE**

↓

**ETIQUETA / QR CODE**

↓

**ARMAZENAMENTO**

↓

**ESTOQUE**

↓

**PRODUÇÃO**

↓

**CONSUMO / SAÍDA**

↓

**PERDA**

↓

**INVENTÁRIO**

↓

**RELATÓRIOS**

Todo movimento relevante deverá gerar histórico.

---

# 3. PERFIS DE USUÁRIO

## 3.1 Administrador

Acesso completo.

Pode:

* Criar empresa
* Alterar configurações
* Criar usuários
* Alterar permissões
* Cadastrar produtos
* Cadastrar fornecedores
* Visualizar estoque
* Aprovar recebimentos
* Visualizar relatórios
* Visualizar auditoria
* Configurar etiquetas
* Configurar alertas

---

## 3.2 Gestor

Pode:

* Visualizar dashboard
* Consultar estoque
* Cadastrar produtos
* Gerenciar fornecedores
* Conferir recebimentos
* Gerenciar inventários
* Consultar produção
* Consultar perdas
* Consultar relatórios
* Consultar auditoria

Não pode alterar configurações críticas do sistema nem usuários, salvo se autorizado.

---

## 3.3 Estoquista

Pode:

* Receber mercadorias
* Conferir produtos
* Registrar lotes
* Registrar validade
* Registrar temperatura
* Gerar etiquetas
* Consultar estoque
* Fazer inventário
* Registrar movimentações autorizadas

---

## 3.4 Cozinheiro

Pode:

* Consultar produtos
* Consultar validade
* Ler QR Code
* Consultar localização
* Registrar produção
* Registrar perdas
* Gerar etiquetas, caso autorizado

---

## 3.5 Visualização

Pode apenas consultar informações autorizadas.

---

# 4. LOGIN

Tela inicial:

**COZINHA+**

Campo:

* Usuário

Campo:

* Senha

Opções:

* Entrar
* Esqueci minha senha
* Manter conectado

O sistema deverá identificar automaticamente:

* Usuário
* Empresa
* Unidade
* Perfil
* Permissões

---

# 5. DASHBOARD

O dashboard deverá mudar de acordo com o perfil.

## Para gestores

### Indicadores principais

**Produtos cadastrados**

**Valor estimado do estoque**

**Produtos próximos do vencimento**

**Produtos vencidos**

**Produtos abaixo do estoque mínimo**

**Recebimentos pendentes**

**Recebimentos com divergência**

**Perdas**

**Produções realizadas**

**Inventários pendentes**

---

## Área de alertas

Exemplo:

🔴 4 produtos vencidos

🔴 6 produtos abaixo do estoque mínimo

🟠 9 produtos vencendo nos próximos 3 dias

🟠 2 recebimentos aguardando conferência

🟢 Último inventário concluído

Cada alerta deverá ser clicável.

---

# 6. MENU PRINCIPAL

O menu deverá conter:

* 🏠 Início
* 📦 Estoque
* 🚚 Recebimento
* 🏷️ Etiquetas
* ⏰ Validades
* 📋 Inventário
* 👨‍🍳 Produção
* ❌ Perdas
* 🏢 Fornecedores
* 📊 Relatórios
* 👥 Usuários
* ⚙️ Configurações

Para colaboradores, o menu deverá mostrar apenas as funções permitidas.

---

# 7. CADASTRO DE PRODUTOS

Cada produto deverá possuir uma ficha.

## Informações

* Nome
* Código interno
* Categoria
* Subcategoria
* Marca
* Unidade de medida
* Fornecedor principal
* Local de armazenamento
* Estoque mínimo
* Estoque máximo
* Produto controlado
* Necessita temperatura
* Temperatura mínima
* Temperatura máxima
* Validade padrão
* Observações
* Status

---

# 8. UNIDADES DE MEDIDA

O sistema deverá permitir:

* Unidade
* Kg
* g
* L
* ml
* Caixa
* Pacote
* Fardo
* Bandeja
* Litro
* Unidade personalizada

O sistema deverá manter a unidade original e permitir conversões configuráveis quando necessário.

---

# 9. CATEGORIAS

Categorias iniciais:

* Carnes
* Aves
* Peixes
* Frutos do mar
* Laticínios
* Hortifruti
* Congelados
* Secos
* Massas
* Molhos
* Temperos
* Bebidas
* Descartáveis
* Produtos de limpeza
* Outros

O administrador poderá criar novas categorias.

---

# 10. LOCAIS DE ARMAZENAMENTO

O sistema deverá permitir cadastrar:

* Câmara fria
* Câmara congelada
* Freezer
* Geladeira
* Estoque seco
* Depósito
* Prateleiras
* Bancadas
* Outros

Cada produto poderá possuir um local padrão.

Exemplo:

**Filé de frango**

📍 Câmara Fria 01

📍 Prateleira B

---

# 11. RECEBIMENTO

O colaborador deverá acessar:

**RECEBIMENTO → NOVO RECEBIMENTO**

Informações:

* Fornecedor
* Número da nota fiscal
* Data
* Horário
* Responsável
* Observação

Depois adicionará os produtos.

---

# 12. PRODUTO NO RECEBIMENTO

Cada item deverá permitir:

* Produto
* Quantidade solicitada
* Quantidade recebida
* Unidade
* Lote
* Validade original
* Temperatura
* Condição da embalagem
* Marca
* Observações
* Foto

---

# 13. CONFERÊNCIA

O sistema deverá apresentar uma conferência visual.

Exemplo:

**FILÉ DE FRANGO**

Pedido:

20 kg

Recebido:

20 kg

Lote:

458721

Validade:

25/08/2026

Temperatura:

3°C

Embalagem:

Íntegra

Resultado:

* Aprovar
* Aprovar com ressalva
* Recusar

---

# 14. REGRAS AUTOMÁTICAS DE CONFERÊNCIA

O sistema deverá identificar possíveis problemas.

Exemplos:

### Quantidade divergente

Pedido: 20 kg

Recebido: 18 kg

→ ALERTA DE DIVERGÊNCIA

### Temperatura fora do padrão

Produto exige:

0°C–5°C

Recebido:

8°C

→ ALERTA DE TEMPERATURA

### Validade inadequada

Produto recebido próximo do vencimento.

→ ALERTA

### Embalagem danificada

→ Exigir registro de ocorrência/foto, conforme configuração.

---

# 15. STATUS DO RECEBIMENTO

Cada recebimento terá um status:

* Aguardando conferência
* Em conferência
* Aprovado
* Aprovado com ressalva
* Parcialmente aprovado
* Recusado
* Cancelado

---

# 16. FOTOS

O colaborador poderá anexar fotos ao recebimento.

Tipos:

* Nota fiscal
* Produto
* Lote
* Validade
* Embalagem
* Temperatura
* Divergência

As fotos ficarão vinculadas ao registro.

---

# 17. LOTE

Todo produto que exigir rastreabilidade poderá receber um lote.

Informações:

* Número do lote
* Produto
* Fornecedor
* Data de recebimento
* Validade
* Quantidade inicial
* Quantidade atual
* Local
* Status

O sistema deverá permitir consultar:

> **Onde está o lote?**

> **Quando entrou?**

> **De qual fornecedor veio?**

> **Quanto ainda existe?**

> **Qual a validade?**

---

# 18. VALIDADE

O sistema deverá calcular automaticamente o status.

Configuração padrão:

🟢 Normal — mais de 7 dias

🟡 Atenção — 3 a 7 dias

🟠 Urgente — 1 a 2 dias

🔴 Vencido — validade ultrapassada

Esses períodos deverão ser configuráveis.

---

# 19. CENTRAL DE VALIDADES

Tela:

## PRODUTOS POR VALIDADE

Filtros:

* Hoje
* Amanhã
* Próximos 3 dias
* Próximos 7 dias
* Próximos 15 dias
* Vencidos
* Produto
* Categoria
* Local
* Lote

---

# 20. ETIQUETAS

Após o recebimento aprovado, o sistema deverá permitir:

**GERAR ETIQUETA**

Informações configuráveis:

* Nome do estabelecimento
* Produto
* Lote
* Data de recebimento
* Validade
* Data de manipulação
* Validade após manipulação, quando aplicável
* Responsável
* Local
* QR Code

---

# 21. QR CODE

Cada etiqueta poderá possuir um QR Code.

Ao escanear:

## PRODUTO

**Filé de frango**

Lote:

458721

Recebimento:

18/08/2026

Validade:

25/08/2026

Local:

Câmara Fria 01

Status:

🟢 Regular

O usuário também poderá visualizar informações permitidas sobre movimentações e histórico.

---

# 22. MOVIMENTAÇÃO DE ESTOQUE

O sistema deverá registrar:

### Entradas

* Recebimento
* Ajuste autorizado
* Produção

### Saídas

* Produção
* Perda
* Transferência
* Ajuste
* Consumo

Nenhum usuário deverá conseguir alterar silenciosamente o estoque.

Toda alteração deverá gerar um registro.

---

# 23. TRANSFERÊNCIA

Permitir transferir produtos entre locais.

Exemplo:

Câmara Fria 01

↓

Câmara Fria 02

O sistema registra:

* Produto
* Lote
* Quantidade
* Origem
* Destino
* Usuário
* Data
* Horário

---

# 24. ESTOQUE MÍNIMO E MÁXIMO

Cada produto poderá ter:

**Estoque mínimo**

**Estoque máximo**

Exemplo:

Frango

Mínimo: 10 kg

Máximo: 40 kg

Atual: 8 kg

Resultado:

🔴 ABAIXO DO ESTOQUE MÍNIMO

---

# 25. PRODUTOS CONTROLADOS

O gestor poderá marcar determinados produtos como:

⭐ CONTROLADOS

Esses produtos terão acompanhamento especial.

Exemplos:

* Carnes nobres
* Queijos de alto valor
* Ingredientes caros
* Produtos de grande consumo

O sistema deverá destacar esses produtos no dashboard.

---

# 26. INVENTÁRIO

O sistema terá:

### Inventário completo

Todos os produtos.

### Inventário por local

Exemplo:

Somente Câmara Fria.

### Inventário por categoria

Exemplo:

Somente carnes.

### Contagem rápida

Somente produtos selecionados.

---

# 27. CONTAGEM

Para cada produto:

Estoque teórico:

18 kg

Campo:

**Quantidade encontrada**

17,5 kg

Resultado:

**Divergência: -0,5 kg**

O sistema deverá calcular percentual de divergência.

---

# 28. CONTAGEM POR QR CODE

Fluxo:

**CONTAGEM**

↓

**ESCANEAR QR CODE**

↓

Produto identificado

↓

Estoque teórico exibido

↓

Colaborador informa estoque físico

↓

**CONFIRMAR**

↓

Próximo produto

Essa deverá ser uma das funções mais rápidas do sistema.

---

# 29. APROVAÇÃO DE INVENTÁRIO

Após a contagem:

**Aguardando aprovação**

O gestor poderá:

* Aprovar
* Rejeitar
* Solicitar nova contagem

Ajustes de estoque deverão ser registrados na auditoria.

---

# 30. PERDAS

Tela:

**REGISTRAR PERDA**

Campos:

* Produto
* Lote
* Quantidade
* Unidade
* Motivo
* Local
* Responsável
* Foto
* Observação

Motivos iniciais:

* Vencimento
* Deterioração
* Quebra
* Contaminação
* Erro de preparo
* Sobra
* Armazenamento
* Temperatura inadequada
* Outro

---

# 31. PRODUÇÃO

Módulo simplificado.

Campos:

* Produto produzido
* Quantidade planejada
* Quantidade produzida
* Responsável
* Data
* Horário inicial
* Horário final
* Observações

O sistema poderá registrar os insumos consumidos.

---

# 32. FICHA TÉCNICA

Cada produção poderá estar vinculada a uma ficha técnica.

Exemplo:

## FRANGO DESFIADO

Ingredientes:

* Frango
* Temperos
* Óleo

Rendimento esperado:

9 kg

Produção realizada:

8,5 kg

O sistema calcula:

**Rendimento real: 94,4%**

---

# 33. FORNECEDORES

Cadastro:

* Nome
* CNPJ
* Contato
* Telefone
* E-mail
* Produtos fornecidos
* Observações
* Status

Histórico:

* Recebimentos
* Divergências
* Recusas
* Produtos
* Lotes

---

# 34. AVALIAÇÃO DE FORNECEDOR

Posteriormente, o sistema poderá calcular indicadores:

* Entregas no prazo
* Produtos recusados
* Divergências
* Problemas de validade
* Problemas de temperatura
* Frequência de ocorrências

Isso permitirá criar um ranking de fornecedores.

---

# 35. RELATÓRIOS

O MVP deverá possuir:

### Estoque atual

### Movimentações

### Recebimentos

### Divergências

### Produtos vencidos

### Produtos próximos do vencimento

### Inventários

### Perdas

### Produção

### Produtos controlados

### Fornecedores

### Auditoria

Os relatórios deverão possuir filtros e opção de exportação.

---

# 36. AUDITORIA

O sistema deverá registrar ações importantes.

Exemplo:

**18/08/2026 — 10:32**

Usuário:

João

Ação:

Aprovou recebimento

Produto:

Filé de frango

Lote:

458721

---

Outro exemplo:

**18/08/2026 — 14:17**

Usuário:

Maria

Ação:

Registrou perda

Produto:

Queijo

Quantidade:

500 g

Motivo:

Deterioração

---

# 37. NOTIFICAÇÕES

O sistema deverá gerar alertas para:

* Produtos vencidos
* Produtos próximos do vencimento
* Estoque abaixo do mínimo
* Recebimentos pendentes
* Divergências
* Inventários pendentes
* Produtos controlados
* Ocorrências

As notificações poderão aparecer:

* No sistema
* No dashboard
* Futuramente por e-mail
* Futuramente por WhatsApp

---

# 38. BUSCA GLOBAL

O usuário deverá conseguir pesquisar:

**Filé de frango**

E encontrar:

* Produto
* Lotes
* Estoque
* Localização
* Validade
* Recebimentos
* Movimentações

A busca deverá ser rápida.

---

# 39. DESIGN DA INTERFACE

O sistema deverá seguir uma filosofia:

## SIMPLES

Poucos elementos por tela.

## VISUAL

Uso de ícones e status.

## RÁPIDO

Poucos cliques.

## MOBILE FIRST

Funcionamento excelente no celular.

## OPERACIONAL

A interface deverá ser pensada para pessoas trabalhando na cozinha, e não para usuários sentados em um escritório.

---

# 40. TELA DE AÇÃO RÁPIDA

Na tela inicial do colaborador:

### O que você quer fazer?

**📦 RECEBER**

**🏷️ ETIQUETAR**

**🔎 CONSULTAR**

**📋 CONTAR**

**👨‍🍳 PRODUZIR**

**❌ REGISTRAR PERDA**

Essa tela deverá ser o principal ponto de acesso para os colaboradores.

---

# 41. REGRAS IMPORTANTES DO SISTEMA

## Regra 1

Produtos recebidos não entram definitivamente no estoque antes da conferência, conforme configuração da empresa.

## Regra 2

Todo lote deverá possuir rastreabilidade.

## Regra 3

Produtos vencidos deverão aparecer em destaque.

## Regra 4

Alterações manuais de estoque deverão exigir justificativa.

## Regra 5

Ajustes relevantes poderão exigir aprovação do gestor.

## Regra 6

Toda alteração crítica deverá entrar na auditoria.

## Regra 7

O sistema nunca deverá apagar definitivamente registros importantes.

## Regra 8

O histórico deverá preservar usuário, data e horário.

---

# 42. BANCO DE DADOS — ESTRUTURA INICIAL

Entidades principais:

### USERS

* id
* name
* username
* password_hash
* role_id
* company_id
* status
* created_at

### COMPANIES

* id
* name
* document
* logo
* status

### UNITS

* id
* company_id
* name
* address
* status

### ROLES

* id
* name
* permissions

### PRODUCTS

* id
* company_id
* name
* category_id
* unit
* brand
* supplier_id
* minimum_stock
* maximum_stock
* controlled
* temperature_controlled
* status

### CATEGORIES

* id
* company_id
* name

### STORAGE_LOCATIONS

* id
* unit_id
* name
* type

### SUPPLIERS

* id
* company_id
* name
* document
* contact
* status

### RECEIVINGS

* id
* supplier_id
* invoice
* date
* user_id
* status

### RECEIVING_ITEMS

* id
* receiving_id
* product_id
* quantity_ordered
* quantity_received
* lot
* expiration_date
* temperature
* status

### LOTS

* id
* product_id
* lot_number
* expiration_date
* initial_quantity
* current_quantity
* location_id

### STOCK_MOVEMENTS

* id
* product_id
* lot_id
* type
* quantity
* origin
* destination
* user_id
* date

### INVENTORIES

* id
* unit_id
* user_id
* date
* status

### INVENTORY_ITEMS

* id
* inventory_id
* product_id
* theoretical_quantity
* physical_quantity
* difference

### LOSSES

* id
* product_id
* lot_id
* quantity
* reason
* user_id
* date
* photo

### PRODUCTIONS

* id
* product_id
* planned_quantity
* produced_quantity
* user_id
* started_at
* finished_at

### RECIPES

* id
* product_id
* yield
* instructions

### RECIPE_ITEMS

* id
* recipe_id
* ingredient_id
* quantity

### LABELS

* id
* product_id
* lot_id
* qr_code
* generated_by
* generated_at

### AUDIT_LOGS

* id
* user_id
* action
* entity
* entity_id
* old_value
* new_value
* date

---

# 43. ARQUITETURA DO SISTEMA

O sistema será implantado no modelo **Single-Tenant (Instância Dedicada)**.
Isso significa que cada cliente (restaurante, mercado, etc.) terá sua própria VPS, banco de dados e servidor isolados. Não haverá compartilhamento de infraestrutura entre clientes diferentes.

Contudo, o sistema possuirá suporte nativo à **Multiunidade** para as lojas de um MESMO cliente.

Estrutura:

**CLIENTE (VPS ÚNICA)**

↓

**EMPRESA**

↓

**FILIAIS (LOJAS FÍSICAS)**

↓

**USUÁRIOS / ESTOQUE / PDV POR FILIAL**

Essa arquitetura garante segurança máxima dos dados de cada cliente e evita que problemas de lentidão em um cliente afetem outros.

---

# 44. MVP — O QUE SERÁ DESENVOLVIDO PRIMEIRO

A primeira versão não deverá tentar fazer tudo.

## FASE 1

### Autenticação

* Login
* Senha
* Recuperação de senha
* Perfis

### Cadastro

* Empresas
* Unidades
* Usuários
* Produtos
* Categorias
* Fornecedores
* Locais

### Estoque

* Entrada
* Saída
* Transferência
* Saldo

### Recebimento

* Cadastro
* Conferência
* Lote
* Validade
* Temperatura
* Fotos
* Divergências

### Etiquetas

* Geração
* QR Code
* Consulta

### Validades

* Dashboard
* Alertas
* Filtros

### Inventário

* Contagem
* Divergência
* Aprovação

### Perdas

* Registro
* Motivos
* Histórico

### Auditoria

* Histórico das ações

---

# 45. FASE 2

Depois do MVP:

* Produção
* Fichas técnicas
* Rendimento
* Consumo
* Sugestão de compra
* Avaliação de fornecedores
* Indicadores avançados
* Relatórios financeiros do estoque
* Notificações externas

---

# 46. FASE 3

Evolução:

* **Gestão Multiunidade**: Controle centralizado de todas as filiais do cliente.
* **Dashboard Matriz**: Visão consolidada de caixa e estoque de todas as lojas.
* **Transferências entre Lojas**: Envio e recebimento de mercadorias entre filiais.
* **PDV Nativo**: Frente de caixa própria do COZINHA+, perfeitamente integrada às Fichas Técnicas para baixa de estoque automática no ato da venda.
* **Preparação para App**: Base para aplicativo mobile (iOS/Android).

---

# 47. DIFERENCIAL DO COZINHA+

A proposta não será:

> "Mais um sistema de estoque."

Será:

> **"A operação da sua cozinha inteira, rastreada em poucos cliques."**

O diferencial estará em:

* Simplicidade
* Mobile first
* QR Code
* Rastreabilidade por lote
* Validade automática
* Conferência inteligente
* Controle de perdas
* Inventário rápido
* Auditoria
* Alertas
* Localização física
* Histórico completo

---

# 48. FLUXO COMPLETO DE UM PRODUTO

Exemplo real:

## 1. RECEBIMENTO

20 kg de frango chegam.

↓

## 2. CONFERÊNCIA

Quantidade:

20 kg

Temperatura:

3°C

Embalagem:

Íntegra

↓

## 3. APROVAÇÃO

Recebimento aprovado.

↓

## 4. LOTE

458721

↓

## 5. VALIDADE

25/08/2026

↓

## 6. ETIQUETA

QR Code gerado.

↓

## 7. ARMAZENAMENTO

Câmara Fria 01.

↓

## 8. PRODUÇÃO

5 kg utilizados.

↓

## 9. ESTOQUE

15 kg restantes.

↓

## 10. PERDA

500 g descartados.

↓

## 11. INVENTÁRIO

14,5 kg encontrados.

↓

## 12. AUDITORIA

Todo o histórico permanece registrado.

---

# 49. EXPERIÊNCIA DO COLABORADOR

O colaborador não deverá precisar entender:

* banco de dados
* lote
* movimentação
* rastreabilidade
* inventário
* auditoria

Ele simplesmente fará:

**Receber**

→ **Conferir**

→ **Confirmar**

→ **Etiquetar**

→ **Guardar**

→ **Produzir**

→ **Registrar perda**

→ **Contar**

O sistema fará a parte complexa por trás.

---

# 50. VISÃO DO PRODUTO FINAL

O COZINHA+ deverá ser uma plataforma em que:

### O COLABORADOR

**trabalha.**

### O GESTOR

**controla.**

### O SISTEMA

**rastreia.**

### O DASHBOARD

**informa.**

### A AUDITORIA

**protege.**

---

# 51. PRIMEIRA VERSÃO DA NAVEGAÇÃO

```text
LOGIN
  ↓
INÍCIO
  │
  ├── RECEBER
  │     ├── Novo recebimento
  │     ├── Em conferência
  │     ├── Aprovados
  │     └── Divergências
  │
  ├── ESTOQUE
  │     ├── Produtos
  │     ├── Saldo
  │     ├── Movimentações
  │     └── Locais
  │
  ├── VALIDADES
  │     ├── Vencidos
  │     ├── Hoje
  │     └── Próximos
  │
  ├── ETIQUETAS
  │     ├── Gerar
  │     └── Histórico
  │
  ├── INVENTÁRIO
  │     ├── Novo
  │     ├── Em andamento
  │     └── Histórico
  │
  ├── PRODUÇÃO
  │     ├── Nova produção
  │     ├── Em andamento
  │     └── Histórico
  │
  ├── PERDAS
  │     ├── Registrar
  │     └── Histórico
  │
  ├── FORNECEDORES
  │
  ├── RELATÓRIOS
  │
  └── CONFIGURAÇÕES
```

# 52. CONCLUSÃO

O **COZINHA+** será construído com duas características aparentemente opostas:

**Extremamente simples para o colaborador.**

**Extremamente completo para o gestor.**

O colaborador verá botões grandes e ações rápidas.

O gestor terá acesso a:

* Estoque
* Lotes
* Validades
* Recebimentos
* Inventários
* Perdas
* Produção
* Fornecedores
* Indicadores
* Auditoria

A complexidade ficará **dentro do sistema**, e não nas mãos do funcionário.

Essa será a principal filosofia de desenvolvimento do produto.
