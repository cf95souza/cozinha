# SKILL: Replicação do Redesign Visual COZINHA+ (Estilo Referência Premium)

> **Para:** Agente que vai continuar o redesign das demais páginas.
> **Referência Visual:** Arquivo `REDESIGN_VISUAL.md` na raiz do projeto.

---

## CONTEXTO

O sistema COZINHA+ foi redesenhado para competir com o Referência Premium. Já foram implementados:

1. ✅ **Design System** (`frontend/src/index.css`) — Nova paleta Branco + Laranja `#E8461C`
2. ✅ **Tailwind Config** (`frontend/tailwind.config.js`) — Tokens atualizados, fonte Inter, tamanho `text-kpi` (48px)
3. ✅ **Layout.tsx** (`frontend/src/components/Layout.tsx`) — Sidebar branca com pill shape, header simplificado
4. ✅ **Dashboard.tsx** (`frontend/src/pages/Dashboard.tsx`) — Página piloto com todos os padrões aplicados

**Falta aplicar o visual nas demais páginas listadas abaixo.**

---

## REGRAS DE ESTILO (OBRIGATÓRIAS)

### 1. Header de Página
Toda página deve começar com:
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold text-on-surface">Título da Página</h1>
    <p className="text-sm text-on-surface-variant mt-0.5">Descrição curta</p>
  </div>
  {/* Botões de ação à direita, se houver */}
</div>
```

### 2. Cards / Containers
Padrão único para qualquer card ou container:
```tsx
<div className="bg-surface border border-outline-variant rounded-2xl p-5">
  {/* conteúdo */}
</div>
```
- `rounded-2xl` (16px) — SEMPRE
- `border border-outline-variant` — SEMPRE  
- **SEM sombra** (sem `shadow-*`) ou no máximo `shadow-sm`
- **SEM gradientes** (sem `bg-gradient-to-*`)
- Padding: `p-5` ou `p-6`

### 3. KPIs (Números Grandes)
Para indicadores numéricos importantes:
```tsx
<span className="text-kpi font-extrabold text-on-surface tracking-tight">34.278</span>
<span className="text-xs text-on-surface-variant">descrição do indicador</span>
```
- Classe `text-kpi` = 48px, font-weight 800
- Cor: `text-on-surface` (preto no light, branco no dark)

### 4. Tabelas / Listas
**NÃO usar `<table>` com bordas tradicionais.** Usar `divide-y`:
```tsx
<div className="divide-y divide-outline-variant">
  {items.map(item => (
    <div key={item.id} className="px-5 py-3 hover:bg-surface-container-low transition-colors">
      <p className="font-semibold text-sm text-on-surface">{item.name}</p>
      <p className="text-xs text-on-surface-variant">{item.detail}</p>
    </div>
  ))}
</div>
```
- Cada linha: `px-5 py-3`
- Hover: `hover:bg-surface-container-low`
- Separador: `divide-y divide-outline-variant`
- **Sem linhas verticais, sem cabeçalho com fundo colorido**

### 5. Botões
```tsx
{/* Primário */}
<button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors">
  <span className="material-symbols-outlined text-[18px]">icon_name</span>
  Label
</button>

{/* Outline / Secundário */}
<button className="flex items-center gap-2 px-5 py-2.5 bg-surface text-on-surface rounded-xl text-sm font-semibold border border-outline-variant hover:bg-surface-container transition-colors">
  <span className="material-symbols-outlined text-[18px]">icon_name</span>
  Label
</button>

{/* Link / Texto */}
<button className="text-xs text-primary font-semibold hover:underline">
  Ver detalhes →
</button>
```

### 6. Badges / Tags
```tsx
{/* Badge laranja (padrão) */}
<span className="text-xs bg-primary-container text-primary px-2.5 py-0.5 rounded-full font-semibold">Label</span>

{/* Badge erro */}
<span className="text-xs bg-error-container text-on-error-container px-2.5 py-0.5 rounded-full font-semibold">Label</span>

{/* Badge sucesso */}
<span className="text-xs bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full font-semibold">Label</span>
```

### 7. Inputs / Forms
```tsx
<input className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />

<select className="px-4 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
```

### 8. Section Headers dentro de Cards
```tsx
<div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
  <h3 className="font-semibold text-on-surface text-sm">Título da Seção</h3>
  <span className="text-xs bg-primary-container text-primary px-2 py-0.5 rounded-full font-semibold">Count</span>
</div>
```

### 9. Empty States
```tsx
<div className="p-8 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
  <span className="material-symbols-outlined text-3xl text-secondary">check_circle</span>
  Nenhum item encontrado
</div>
```

### 10. Grid Layout
```tsx
{/* 4 colunas para KPIs */}
<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

{/* 3 colunas para cards de detalhe */}
<section className="grid grid-cols-1 lg:grid-cols-3 gap-5">

{/* 2+1 para gráficos */}
<section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
  <div className="lg:col-span-2">...</div>
  <div>...</div>
</section>
```

### 11. Ícones
- Usar **Material Symbols Outlined** (já importado no CSS)
- Tamanho padrão: `text-[18px]` ou `text-[20px]`
- Item ativo: `style={{ fontVariationSettings: "'FILL' 1" }}`
- Item inativo: `style={{ fontVariationSettings: "'FILL' 0" }}`

### 12. Cores de Status
| Status      | Background              | Text                        |
|-------------|------------------------|-----------------------------|
| Sucesso     | `bg-secondary-container` | `text-on-secondary-container` |
| Erro/Perigo | `bg-error-container`     | `text-on-error-container`    |
| Alerta      | `bg-tertiary-container`  | `text-on-tertiary-container` |
| Info/Neutro | `bg-primary-container`   | `text-primary`               |
| Neutro      | `bg-surface-container`   | `text-on-surface-variant`    |

---

## PÁGINAS QUE PRECISAM SER ATUALIZADAS

Aplique os padrões acima nestas páginas (em ordem de prioridade):

1. **`Stock.tsx`** — Estoque / Controlados (tabela sem bordas, KPIs no topo)
2. **`Production.tsx`** — Produção (timeline vertical + numeração colorida)
3. **`Labels.tsx`** — Etiquetas (novo modelo de impressão — ver seção abaixo)
4. **`Receivings.tsx`** — Recebimento (cards limpos)
5. **`Losses.tsx`** — Perdas (lista com divide-y)
6. **`Inventory.tsx`** — Inventário (lista com divide-y)
7. **`Products.tsx`** — Produtos (tabela sem bordas)
8. **`Categories.tsx`** — Categorias (lista simples)
9. **`Locations.tsx`** — Locais de Estoque (lista simples)
10. **`Suppliers.tsx`** — Fornecedores (cards ou lista)
11. **`Users.tsx`** — Equipe e Acessos (lista)
12. **`Reports.tsx`** — Relatórios (layout de filtros + resultado)
13. **`Transfers.tsx`** — Transferências (formulário + lista)
14. **`POS.tsx`** — PDV (interface específica)
15. **`Suggestions.tsx`** — Sugestão de Compras
16. **`ExpirationControl.tsx`** — Validades
17. **`Recipes.tsx`** — Fichas Técnicas

---

## MODELO DE ETIQUETA (NOVO)

A etiqueta deve seguir o formato do Referência Premium (veja `REDESIGN_VISUAL.md` seção 2):

```
┌──────────────────────────────────────────────┐
│  NOME DO PRODUTO              (Bold, 16px)   │
│                                               │
│  MÉTODO / CONSERVAÇÃO           PESO (g/kg)   │
│  ─────────────────────────────────────────── │
│  VAL. ORIGINAL:           DD/MM/AAAA          │
│  MANIPULAÇÃO:     DD/MM/AAAA - HH:MM:SS      │
│  VALIDADE:        DD/MM/AAAA - HH:MM:SS      │
│  ─────────────────────────────────────────── │
│  MARCA / FORN.:                    NOME       │
│  SIF:                              CÓDIGO     │
│  ─────────────────────────────────────────── │
│  RESP.: NOME DO RESPONSÁVEL                  │
│  NOME DO RESTAURANTE                         │
│  CNPJ: XX.XXX.XXX/XXXX-XX  CEP: XXXXX-XXX   │
│  ENDEREÇO                                     │
│  CIDADE - UF                                 │
│                                    [QR CODE]  │
│  #CÓDIGO_ÚNICO                               │
└──────────────────────────────────────────────┘
```

Use CSS `@media print` para formatação de impressão e esconda elementos não-necessários.

---

## CHECKLIST DE VALIDAÇÃO

Antes de considerar uma página pronta, verifique:

- [ ] Header com título `text-2xl font-bold` + subtítulo
- [ ] Cards com `rounded-2xl border border-outline-variant`
- [ ] **ZERO** gradientes e sombras pesadas
- [ ] Botão primário laranja `bg-primary`
- [ ] Tabelas usando `divide-y` ao invés de `<table>` com bordas
- [ ] Inputs com `rounded-xl` e `focus:ring-primary/20`
- [ ] Badges com `rounded-full` e cores de status corretas
- [ ] Funciona no Dark Mode (testar toggle)
- [ ] Responsivo (testar em tela pequena)
