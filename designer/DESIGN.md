---
name: Kinetic Operational Interface
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  section-title:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  card-title:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  metadata:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-margin: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is engineered for high-stakes kitchen environments where clarity equals safety. The brand personality is **command-oriented, precise, and hyper-organized**, blending the reliability of industrial machinery with the elegance of modern enterprise SaaS. 

The aesthetic follows a **Modern Corporate** style with a focus on **Information Density**. It prioritizes high-contrast legibility to ensure traceability and operational agility. The UI uses sharp definition and a disciplined grid to evoke a sense of total control over complex workflows.

## Colors
The palette is rooted in **Strategic Navy** (`#0F172A`) for core navigation and headers to ground the interface in authority. The functional primary is a **Deep Teal** (`#0D9488`), used for primary actions to distinguish operational "go" signals from structural elements.

Status colors follow strict semantic logic:
- **Success (Emerald):** Approved, completed, or safe states.
- **Warning (Amber):** Pending items or expiring stock.
- **Urgent (Orange):** Immediate action required, nearing service deadlines.
- **Danger (Crimson):** Critical failures, temperature alerts, or refused items.
- **Neutral (Slate):** Metadata, inactive states, and structural borders.

## Typography
This design system utilizes **Geist** for its technical, monospaced-adjacent clarity which is ideal for data-heavy operational software. 

- **Display & Titles:** Use tight letter spacing and bold weights to create a strong visual anchor.
- **Body & Data:** Set at 14px to maximize information density without sacrificing legibility on industrial tablets or kitchen displays.
- **Numbers:** Where possible, use tabular lining figures for numerical data in tables and KPI cards to ensure columns align perfectly for quick scanning.

## Layout & Spacing
The layout follows a **12-column fluid grid** for desktop and a **4-column grid** for mobile/tablet kitchen displays. 

A **4px baseline grid** governs all spacing. 
- Use **16px (stack-md)** for standard component spacing.
- Use **24px** for global page margins to maintain a premium, airy feel despite the high density of data.
- Components should favor "Stack" layouts (vertical) for mobile checklists and "Grid" layouts for KPI dashboards.

## Elevation & Depth
To maintain a professional, "high-end hardware" feel, the system uses **low-contrast outlines** and **tonal layers** rather than heavy shadows.

- **Level 0 (Background):** Slate-50 or White.
- **Level 1 (Cards/Surface):** White with a 1px border in Slate-200. No shadow.
- **Level 2 (Hover/Active):** Subtlest possible shadow (Y: 2px, Blur: 4px, 5% Opacity) to indicate interactivity.
- **Level 3 (Modals/Toasts):** Medium-diffusion shadow with a crisp Slate-300 border to separate from the operational background.

## Shapes
The shape language is **Soft (0.25rem)**. This provides a professional, geometric look that feels modern and technological without the "consumer" playfulness of fully rounded corners. 

- **Buttons & Inputs:** 4px (0.25rem) radius.
- **Cards:** 8px (0.5rem) radius.
- **Status Badges:** 2px radius for a sharper, more "label-maker" industrial aesthetic.

## Components

### Buttons
- **Primary:** Deep Teal background, White text. High contrast.
- **Secondary:** Slate-100 background, Slate-900 text.
- **Outline:** Transparent background, 1px Slate-300 border.
- **States:** Hover should darken the background by 10%. Loading states replace text with a centered spinner; button width must remain constant.

### Inputs
- **Style:** 1px Slate-300 border, 14px text.
- **Focus:** 2px Deep Teal ring with 0px offset.
- **Search:** Prefix with a 16px magnifying glass icon in Slate-400.

### Badges/Status
- Small, uppercase, 10px bold text.
- **Attention/Urgent:** Use high-vibrancy Amber or Orange backgrounds with dark text.
- **Critical:** Pulse animation optional for "Critical" temperature or safety alerts.

### Cards
- **KPI Stats:** Large display-size number, metadata label below, and a small colored trend indicator (arrow + percentage) in the top right.
- **Alert Cards:** Thick 4px left-border color-coded to the severity (Danger, Warning).

### Tables
- **Header:** Slate-50 background, uppercase 12px bold metadata text.
- **Rows:** White background, 1px Slate-100 bottom border.
- **Hover:** Row background changes to Slate-50. Action menus (3 dots) appear on the far right.

### Feedback
- **Toasts:** Positioned top-right. Should contain a bold title and one line of body text.
- **Skeleton States:** Use a subtle Slate-100 to Slate-200 pulse for loading tables and KPI cards to reduce perceived latency.