# Relatório de Auditoria de Segurança (AppSec)

Com base nas diretrizes recebidas no arquivo de instruções de auditoria de segurança, realizei uma auditoria aprofundada na arquitetura, backend (Express + Prisma) e middlewares do projeto COZINHA+.

O sistema possui uma estrutura multi-tenant (múltiplas empresas e filiais), o que torna o isolamento de dados crítico. Foram encontradas falhas graves de segurança que permitem **acesso indevido a dados de outras empresas** e **modificações não autorizadas**.

---

## 🚨 Vulnerabilidades Encontradas

### 1. Broken Object Level Authorization (BOLA / IDOR) Múltiplo
**Severidade:** CRÍTICA 🔴
**Localização:** `productController.ts`, `categoryController.ts`, `locationController.ts`, `receivingController.ts`
**Descrição:** Os métodos de `update` e `delete` (ex: `updateProduct`, `deleteCategory`) recebem o `id` do recurso na URL e realizam a alteração/exclusão direta no Prisma, **sem validar se o recurso pertence à empresa (`companyId`) do usuário autenticado**.
**Impacto:** Qualquer usuário autenticado pode alterar ou excluir categorias, locais e produtos de **qualquer outra empresa** do sistema, bastando adivinhar ou enumerar os IDs.
**Correção Recomendada:** Adicionar a checagem de `companyId` no `where` ou validar o recurso antes da alteração, garantindo que o tenant atual é dono do recurso.

### 2. Bypass de Isolamento de Filial (Tenant) pelo Perfil ADMIN
**Severidade:** ALTA 🟠
**Localização:** `middlewares/branchGuard.ts` e Controllers em geral.
**Descrição:** O `branchGuard` possui a seguinte regra de bypass: `if (req.user.role === 'ADMIN') return next();`. Isso significa que o Admin pode ler/escrever livremente informando qualquer `branchId`. Como os controllers confiam no `branchId` fornecido na query/body sem validar a qual empresa ele pertence, um Admin da *Empresa A* pode enviar requisições contendo um `branchId` pertencente à *Empresa B* e acessar os dados da Empresa B.
**Impacto:** Quebra de isolamento (Cross-Tenant Data Leak) para usuários com perfil de Admin.
**Correção Recomendada:** Os controllers precisam validar se o `branchId` informado (mesmo por Admins) pertence ao `companyId` do token.

### 3. Falha Lógica na Validação do Refresh Token
**Severidade:** ALTA 🟠
**Localização:** `authController.ts` -> `refresh()`
**Descrição:** A rota de refresh aceita o `refreshToken`, decodifica o JWT e assina um novo token de acesso de 8 horas. No entanto, ela **não consulta o banco de dados** para verificar se o usuário ainda existe ou se o status dele mudou para `INATIVO`.
**Impacto:** Se um funcionário for demitido e inativado no sistema, ele poderá continuar renovando seu token de acesso indefinidamente (enquanto durar o Refresh Token de 30 dias), mantendo acesso ativo.
**Correção Recomendada:** Após decodificar o token, buscar o usuário no banco, verificar se ele continua `ATIVO` e gerar o payload baseado nos dados frescos.

### 4. Ausência de Validação Rigorosa de Dados de Entrada (Server-side)
**Severidade:** MÉDIA 🟡
**Localização:** `categoryController.ts`, `locationController.ts`, `receivingController.ts`
**Descrição:** Diferente do `productController` (que usa Zod), os demais recebem dados brutos de `req.body` e repassam diretamente para a criação ou atualização no Prisma.
**Impacto:** Permite Mass Assignment (sobrescrever campos não previstos caso injetados) e não protege contra tipos de dados inconsistentes enviados por clientes mal-intencionados.
**Correção Recomendada:** Criar esquemas `zod` e aplicá-los para validar o body nestas requisições.

---

## 🛠️ Plano de Ação (Refletido no fase.md)

As correções devem ser implementadas na seguinte ordem:
1. Fechar imediatamente a brecha de **IDOR** em todas as rotas de deleção e atualização.
2. Corrigir o **Isolamento de Tenant** para administradores (`branchGuard`).
3. Mitigar a persistência não autorizada corrigindo o **Refresh Token**.
4. Aumentar a resiliência a injeção de dados via **Zod**.
