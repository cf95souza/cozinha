# Documento de Redesign Visual — COZINHA+ (Inspirado no Referência Premium)

> **Data:** 22/08/2026
> **Referência Visual:** Screenshots do sistema Referência Premium (concorrente direto)
> **Objetivo:** Refazer a identidade visual do COZINHA+ para competir lado a lado com o Referência Premium em nível de acabamento, limpeza visual e profissionalismo.

---

## 1. Análise Detalhada do Referência Premium (Referência Visual)

### 1.1 Paleta de Cores
O Referência Premium utiliza uma paleta **clean e minimalista**, com poucos acentos vibrantes:

| Elemento            | Cor Observada          | Hex Aproximado |
|---------------------|------------------------|----------------|
| **Background geral**   | Branco puro            | `#FFFFFF`      |
| **Background da borda/frame** | Laranja vibrante (gradiente) | `#FF6B35` → `#FF8C42` |
| **Sidebar (fundo)**    | Branco / off-white     | `#FAFAFA`      |
| **Sidebar item ativo** | Laranja claro (pill)   | `#FFE8DC`      |
| **Texto ativo sidebar**| Laranja/Vermelho       | `#E8461C`      |
| **Texto normal**       | Cinza escuro           | `#1A1A1A`      |
| **Texto secundário**   | Cinza médio            | `#6B7280`      |
| **Logo "Referência Premium"**      | Vermelho-Laranja       | `#E8461C`      |
| **Separadores/Bordas** | Cinza super sutil      | `#E5E7EB`      |
| **Cards**              | Branco com borda sutil | `#FFFFFF` + `#F3F4F6` border |
| **Gráfico - Congelado**| Azul turquesa          | `#06B6D4`      |
| **Gráfico - Resfriado**| Verde                  | `#10B981`      |
| **Gráfico - Temp. Ambiente** | Amarelo          | `#F59E0B`      |
| **Gráfico - Quente**   | Rosa/Vermelho          | `#EF4444`      |
| **Números de destaque**| Preto muito grande     | `#111827`      |
| **Badges (ex: "Unidade")** | Laranja claro      | `#FFF1E6`      |

### 1.2 Tipografia
- **Fonte principal:** Sans-serif moderna, provavelmente **Inter** ou **Nunito Sans**
- **Título da página (H1):** ~28px, `font-weight: 700` (bold), cor preta
- **Subtítulo/descrição:** ~13px, `font-weight: 400`, cor cinza
- **Números de KPI gigantes:** ~48px, `font-weight: 700`, cor preta
- **Texto de tabela:** ~14px, `font-weight: 400-500`
- **Labels/Metadata:** ~12px, `font-weight: 400`, cor cinza claro

### 1.3 Layout Sidebar (Desktop)
- **Largura:** ~220px (mais estreita que nosso sistema atual de 256px)
- **Fundo:** Branco puro, sem borda visível (usa sombra sutil ou separador fino)
- **Logo:** `Referência Premium.` em vermelho-laranja, negrito, no topo esquerdo
- **Itens do menu:**
  - Ícone à esquerda + Texto
  - Sem ícone de Material Symbols — parece usar ícones custom (outline fino)
  - **Item ativo:** Background laranja claro arredondado (pill shape, border-radius ~12px), texto laranja
  - **Item inativo:** Texto cinza, sem background
  - Sem barra lateral de destaque (sem `border-right`)
- **Agrupamento:** Items como "Cadastros" e "Configurações" têm seta de dropdown (chevron)
- **Espaçamento entre itens:** ~8px

### 1.4 Header / Topbar
- **Background:** Branco
- **Lado esquerdo:** Informações do restaurante (Nome + Badge "Unidade" em laranja)
- **Lado direito:** Avatar circular com inicial + Nome do usuário + Cargo + Chevron dropdown
- **Sem barra de busca visível** (possivelmente escondida)
- **Sem ícone de notificação visível**
- **Sem toggle de dark mode** (Referência Premium parece ser apenas Light Mode)
- Layout **muito limpo** — menos é mais

### 1.5 Área de Conteúdo
- **Background:** Branco puro ou cinza muito claro `#F9FAFB`
- **Título da página:** Grande, negrito, com indicador colorido (bolinha laranja ao lado)
- **Subtítulo:** "Atualizado hoje às 15:38" em cinza claro
- **Cards de KPI:**
  - Fundo branco, borda cinza sutil (`1px solid #E5E7EB`)
  - Border-radius grande (~16px)
  - Padding generoso (~24px)
  - Sem sombra forte (se houver, é `box-shadow: 0 1px 3px rgba(0,0,0,0.05)`)

### 1.6 Tabelas / Listas
- **Sem bordas de tabela tradicionais** — usa separadores horizontais sutis
- **Cada linha** é uma "row" com bastante respiro vertical (padding ~16px)
- **Numeração colorida:** Bolinha laranja com número branco no início de cada grupo
- **Timeline vertical:** Linha vertical laranja conectando itens do mesmo grupo
- **Subtexto do produto:** Método de conservação (ex: "Congelado", "Resfriado") em cinza abaixo do nome
- **Botão "Exportar relatório":** Outline, com ícone de download
- **Link "Voltar":** Texto laranja com seta `<` à esquerda

### 1.7 Gráficos
- **Donut Chart:** Grande, centralizado, com legenda abaixo
- **Legenda:** Bolinha colorida + Label + Percentual + Número absoluto
- **Barra de progresso horizontal (Níveis de Estoque):** Segmentada por cores (Vermelho/Amarelo/Verde)
- **Botão "Ver detalhes →":** Laranja, pill shape

---

## 2. Modelo de Etiqueta do Referência Premium

A etiqueta do Referência Premium é **impressa em papel térmico** e segue um padrão muito profissional:

### Estrutura da Etiqueta (de cima para baixo):

```
┌──────────────────────────────────────────────┐
│  FILET MIGNON              (Nome, BOLD, Grande)
│                                               │
│  RESFRIADO / DESCONGELANDO        500 g       │
│  ─────────────────────────────────────────── │
│  VAL. ORIGINAL:           15/10/2024          │
│  MANIPULAÇÃO:     09/10/2024 - 12:59:23       │
│  VALIDADE:        11/10/2024 - 12:59:23       │
│  ─────────────────────────────────────────── │
│  MARCA / FORN.:                    SWIFT      │
│  SIF:                               358       │
│  ─────────────────────────────────────────── │
│  RESP.: LUCIANA                               │
│  RESTAURANTE Referência Premium                           │
│  CNPJ: 12.345.678.0001-12  CEP: 05435-030    │
│  RUA PURPURINA, 400                           │
│  SÃO PAULO - SP                              │
│                                    [QR CODE]  │
│  #T154B3                                      │
└──────────────────────────────────────────────┘
```

### Campos obrigatórios da etiqueta:
1. **Nome do Produto** (topo, negrito, grande)
2. **Método de Conservação + Peso** (ex: RESFRIADO / DESCONGELANDO — 500g)
3. **Validade Original** (data do fabricante)
4. **Manipulação** (data + hora exata em que foi aberto/manipulado)
5. **Validade** (data + hora de vencimento calculada)
6. **Marca / Fornecedor** (ex: SWIFT)
7. **SIF** (Código do Serviço de Inspeção Federal)
8. **Responsável** (quem manipulou)
9. **Dados do Estabelecimento** (Nome, CNPJ, Endereço)
10. **QR Code** (canto inferior direito)
11. **Código de identificação único** (ex: #T154B3)

---

## 3. Diferenças entre COZINHA+ atual e Referência Premium

| Aspecto                | COZINHA+ (Atual)                          | Referência Premium (Referência)                          |
|------------------------|-------------------------------------------|----------------------------------------------|
| **Paleta**             | Azul-escuro / Material Design 3           | Branco + Laranja (minimalista)               |
| **Sidebar**            | Fundo azulado, borda lateral no item ativo| Fundo branco, pill shape laranja             |
| **Cards**              | Sem border-radius grande                  | Border-radius 16px, borda sutil              |
| **Tipografia**         | Geist                                     | Inter/Nunito (mais redonda)                  |
| **Números de KPI**     | Tamanho moderado                          | Gigantes (~48px), impactantes                |
| **Tabelas**            | Tradicionais com bordas                   | Sem bordas, separadores horizontais sutis    |
| **Timeline/Agrupamento**| Inexistente                              | Linha vertical + numeração colorida          |
| **Etiqueta**           | QR Code simples, poucos dados             | Etiqueta profissional com todos os campos    |
| **Dark Mode**          | Sim                                       | Aparentemente não                            |
| **Background Header**  | Com subtítulo genérico                    | Dados contextuais (unidade, restaurante)     |
| **Responsividade Mobile** | Não priorizada                         | Design mobile-first (visto nas fotos)        |

---

## 4. Plano de Mudanças para o COZINHA+

### 4.1 Nova Paleta de Cores (substituir a atual)
```css
:root {
  /* Cores primárias — Laranja COZINHA+ */
  --color-primary: #E8461C;
  --color-primary-hover: #D03A15;
  --color-primary-light: #FFE8DC;
  --color-primary-container: #FFF1E6;
  
  /* Backgrounds */
  --color-background: #FFFFFF;
  --color-surface: #FFFFFF;
  --color-surface-container: #F9FAFB;
  --color-surface-container-high: #F3F4F6;
  
  /* Textos */
  --color-on-surface: #111827;
  --color-on-surface-variant: #6B7280;
  --color-on-background: #111827;
  
  /* Bordas */
  --color-outline: #D1D5DB;
  --color-outline-variant: #E5E7EB;
  
  /* Status */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #06B6D4;
}
```

### 4.2 Sidebar
- Fundo branco puro
- Item ativo: pill shape com background `#FFE8DC`, texto `#E8461C`
- Ícones: usar Material Symbols Outlined (manter)
- Logo: "COZINHA+" em `#E8461C`, bold
- Largura: 220px (reduzir de 256px)
- Dropdown/chevron para agrupamentos ("Cadastros", "Configurações")

### 4.3 Header / Topbar
- Simplificar drasticamente
- Lado esquerdo: Nome do restaurante + Badge "Unidade" em laranja
- Lado direito: Avatar + Nome + Cargo
- Remover subtítulo genérico ("Acompanhe a operação...")
- Manter busca e notificações, mas mais discretos

### 4.4 Cards e KPIs
- Border-radius: 16px
- Borda: `1px solid #E5E7EB`
- Sombra: `0 1px 3px rgba(0,0,0,0.05)`
- Padding: 24px
- Números de KPI: 48px, font-weight 700

### 4.5 Tabelas e Listas
- Sem bordas de tabela
- Separadores horizontais finos e sutis
- Padding vertical generoso
- Numeração com bolinha colorida + timeline vertical (para produção)

### 4.6 Botões
- Primário: Fundo laranja `#E8461C`, texto branco, border-radius 12px
- Secundário/Outline: Borda cinza, texto escuro, border-radius 12px
- "Exportar relatório": Ícone download + texto, estilo outline

### 4.7 Etiqueta (Novo Modelo)
- Redesenhar completamente o componente de impressão
- Incluir todos os campos do modelo Referência Premium
- Adicionar campos de: Método de Conservação, Validade Original, Manipulação, Marca/Fornecedor, SIF, Responsável, Dados do Estabelecimento
- Layout profissional com QR Code no canto inferior direito

---

## 5. Arquivos Afetados pela Mudança

### CSS / Design System
- `frontend/src/index.css` — Nova paleta completa
- `frontend/tailwind.config.js` — Atualizar tokens

### Layout e Navegação
- `frontend/src/components/Layout.tsx` — Sidebar, Header, estrutura geral

### Páginas (estilização)
- `frontend/src/pages/Dashboard.tsx` — Cards de KPI gigantes
- `frontend/src/pages/Stock.tsx` — Tabelas sem borda
- `frontend/src/pages/Production.tsx` — Timeline com numeração
- `frontend/src/pages/Labels.tsx` — Novo modelo de etiqueta

### Componentes Novos (a criar)
- `frontend/src/components/KpiCard.tsx` — Card de KPI padronizado
- `frontend/src/components/LabelPrint.tsx` — Componente de impressão de etiqueta no novo formato

---

> ⚠️ **Nota:** Manter o Dark Mode é um diferencial competitivo sobre o Referência Premium. A paleta escura deve ser ajustada para combinar com a nova identidade laranja.
