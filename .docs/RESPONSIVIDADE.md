# Responsividade — Spid Web App

## Breakpoints

| Nome | Range | CSS Variable |
|------|-------|-------------|
| Mobile | 0 - 640px | `@media (max-width: 640px)` |
| Tablet | 641px - 1024px | `@media (min-width: 641px) and (max-width: 1024px)` |
| Desktop | 1025px+ | Default (sem media query) |

## Hook useMediaQuery

```tsx
import { useMediaQuery } from '@/hooks/useMediaQuery'

function MyComponent() {
  const { isMobile, isTablet, isDesktop, width } = useMediaQuery()
  // isMobile: width <= 640
  // isTablet: 641 <= width <= 1024
  // isDesktop: width > 1024
}
```

- SSR-safe (default: desktop no servidor)
- Usa `useSyncExternalStore` (React 18+)
- Re-renderiza automaticamente ao redimensionar

## Layout Responsivo

### Sidebar
- **Desktop**: sidebar fixa (260px ou 72px colapsada) no lado esquerdo
- **Mobile**: drawer overlay (280px, max 85vw), abre via hamburger no header
- Fecha automaticamente ao navegar
- Backdrop com blur ao abrir
- Body scroll bloqueado quando drawer aberto

### Layout Shell
- **Desktop**: `marginLeft: var(--sidebar-width)`, padding 32px
- **Mobile**: `marginLeft: 0`, padding 16px
- Header mostra hamburger button no mobile + titulo "Spid"

## Classes CSS Responsivas

### Form Grids
```css
.form-grid    /* auto-fit, colapsa para 1 col no mobile */
.form-grid-2  /* 2 cols, 1 col no mobile */
.form-grid-3  /* 3 cols, 2 cols tablet, 1 col mobile */
.form-grid-4  /* 4 cols, 2 cols tablet, 1 col mobile */
```

### Stats Grid
```css
.stats-grid  /* 4 cols desktop, 2 cols tablet/mobile */
```

### Utility Classes
```css
.hide-mobile   /* oculto em mobile */
.show-mobile   /* visivel apenas em mobile */
.mobile-only   /* visivel apenas em mobile */
```

## Componentes Responsivos

### DataTable
- **Desktop**: tabela HTML padrao com sort, search, pagination
- **Mobile**: card view automatico
  - Primeira coluna = titulo do card
  - Segunda coluna = subtitulo
  - Ultima coluna = badge/valor no canto direito
  - Customize com props: `mobileTitle`, `mobileSubtitle`, `mobileVisible`

### PaymentSplit
- **Desktop**: grid horizontal (metodo | valor | conta | parcelas)
- **Mobile**: cada pagamento vira card vertical empilhado

### InstallmentConfig
- **Mobile**: inputs e radio buttons empilhados verticalmente
- Preview table com scroll horizontal

### StatsCard
- Use classe `.stats-grid` no container pai
- Cards ajustam padding automaticamente via CSS

## Padroes de Pagina

### Header Responsivo
```tsx
const { isMobile } = useMediaQuery()

<div style={{
  display: 'flex',
  flexDirection: isMobile ? 'column' : 'row',
  alignItems: isMobile ? 'stretch' : 'center',
  gap: isMobile ? '12px' : '16px',
}}>
  <h1>Titulo</h1>
  <button style={{ width: isMobile ? '100%' : 'auto' }}>Acao</button>
</div>
```

### Formularios
- Use classes `.form-grid-*` para grids automaticos
- Para grids inline, use `isMobile` para condicionar `gridTemplateColumns`
- Inputs: `fontSize: 16px` no mobile (evita zoom iOS)
- Buttons: `minHeight: 44px` (touch target)

### Grids de Items (Vendas/Compras)
- **Desktop**: grid com colunas fixas (produto | unidade | qtd | preco | subtotal | remover)
- **Mobile**: cada item vira card empilhado com campos full-width

## Compatibilidade com APK (Capacitor)

### Safe Areas
Para futuras implementacoes com notch/navigation bar:
```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

### Status Bar
O Capacitor gerencia a status bar. Nao sobrepor conteudo na area da status bar.

### Touch Targets
- Minimo 44x44px em todos os elementos interativos
- Gap minimo de 8px entre elementos clicaveis adjacentes

### Input Zoom Prevention
- `font-size: 16px` em todos os inputs no mobile
- Ja configurado globalmente em `globals.css`

### Performance
- Evitar `position: fixed` excessivo (causa problemas com teclado virtual)
- Usar `position: sticky` quando possivel
- `will-change: transform` apenas em elementos animados
- `-webkit-overflow-scrolling: touch` para scroll suave

## Checklist de Nova Pagina

1. Importar `useMediaQuery` se precisar de logica condicional
2. Usar `.form-grid-*` para formularios
3. Usar `.stats-grid` para grids de cards estatisticos
4. Header: stack vertical no mobile com botoes full-width
5. DataTable: funciona automaticamente (card view mobile)
6. Testar em 390px (iPhone 12 Pro) e 360px (Android medio)
7. Verificar touch targets (44px minimo)
8. Verificar font-size de inputs (16px no mobile)
