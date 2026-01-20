# CodeForge UI Design System

## Design Philosophy

**"Developer Tool Noir"** - A sophisticated dark theme that feels professional, reduces eye strain, and puts code front and center.

## Color Palette

### Background Colors
```css
--bg-primary: #0a0a0f;      /* Main background */
--bg-secondary: #12121a;    /* Cards, panels */
--bg-tertiary: #1a1a2e;     /* Hover states, inputs */
--bg-elevated: #252538;     /* Modals, dropdowns */
```

### Accent Colors
```css
--accent-primary: #6366f1;   /* Indigo - primary actions */
--accent-secondary: #8b5cf6; /* Purple - secondary actions */
--accent-success: #10b981;   /* Green - positive metrics */
--accent-warning: #f59e0b;   /* Amber - warnings */
--accent-error: #ef4444;     /* Red - errors, baseline */
--accent-cyan: #06b6d4;      /* Cyan - info, links */
```

### Text Colors
```css
--text-primary: #f8fafc;     /* Headings, important text */
--text-secondary: #94a3b8;   /* Body text */
--text-muted: #64748b;       /* Captions, labels */
--text-disabled: #475569;    /* Disabled states */
```

### Border Colors
```css
--border-subtle: rgba(255, 255, 255, 0.06);
--border-default: rgba(255, 255, 255, 0.1);
--border-strong: rgba(255, 255, 255, 0.15);
```

## Typography

### Font Families
```css
--font-ui: 'DM Sans', -apple-system, sans-serif;
--font-code: 'JetBrains Mono', 'Fira Code', monospace;
```

### Font Sizes (TailwindCSS scale)
| Name | Size | Use |
|------|------|-----|
| xs | 0.75rem | Labels, badges |
| sm | 0.875rem | Secondary text |
| base | 1rem | Body text |
| lg | 1.125rem | Card titles |
| xl | 1.25rem | Section headers |
| 2xl | 1.5rem | Page titles |
| 3xl | 1.875rem | Hero text |

### Font Weights
- 400 (normal) - Body text
- 500 (medium) - UI labels, buttons
- 600 (semibold) - Headings
- 700 (bold) - Emphasis, metrics

## Gradients

```css
/* Primary gradient (buttons, highlights) */
--gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);

/* Glow effect */
--gradient-glow: radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), 
                                  rgba(99, 102, 241, 0.15), transparent 40%);

/* Rank gradients */
--gradient-gold: linear-gradient(135deg, #fbbf24, #f59e0b);
--gradient-silver: linear-gradient(135deg, #e2e8f0, #94a3b8);
--gradient-bronze: linear-gradient(135deg, #d97706, #b45309);
```

## Spacing Scale

Use TailwindCSS spacing (4px base):
- `gap-1` (4px) - Tight spacing
- `gap-2` (8px) - Related items
- `gap-3` (12px) - Default spacing
- `gap-4` (16px) - Section spacing
- `gap-6` (24px) - Major sections
- `gap-8` (32px) - Page sections

## Border Radius

```css
--radius-sm: 0.375rem;   /* 6px - small elements */
--radius-md: 0.5rem;     /* 8px - buttons, inputs */
--radius-lg: 0.75rem;    /* 12px - cards */
--radius-xl: 1rem;       /* 16px - large cards */
--radius-2xl: 1.5rem;    /* 24px - modals, panels */
```

## Shadows

```css
/* Subtle shadow */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);

/* Card shadow */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);

/* Elevated shadow */
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);

/* Glow shadow (for accent elements) */
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);
```

## Component Patterns

### Cards
```jsx
<div className="p-6 rounded-2xl border"
  style={{
    background: '#12121a',
    borderColor: 'rgba(255,255,255,0.06)'
  }}>
  {/* Card content */}
</div>
```

### Buttons

**Primary Button**:
```jsx
<button className="px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
  Action
</button>
```

**Secondary Button**:
```jsx
<button className="px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
  style={{ background: '#1a1a2e', color: '#94a3b8' }}>
  Secondary
</button>
```

### Inputs
```jsx
<input className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
  style={{
    background: '#1a1a2e',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#f8fafc'
  }}
  placeholder="Search..."
/>
```

### Badges

**Speedup Badge**:
```jsx
<span className="px-2 py-1 rounded-full text-xs font-medium"
  style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
  234x faster
</span>
```

**Language Badge**:
```jsx
<span className="px-2 py-1 rounded text-xs"
  style={{ background: '#1e3a8a20', color: '#60a5fa' }}>
  Python
</span>
```

### Rank Indicators

```jsx
// Top 3 with special styling
const rankStyles = {
  1: { gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)', emoji: '🥇' },
  2: { gradient: 'linear-gradient(135deg, #e2e8f0, #94a3b8)', emoji: '🥈' },
  3: { gradient: 'linear-gradient(135deg, #d97706, #b45309)', emoji: '🥉' }
};
```

## Animation Guidelines

### Transitions
```css
/* Default transition */
transition: all 0.2s ease;

/* Hover scale */
transform: scale(1.02);

/* Button press */
transform: scale(0.98);
```

### Loading States
- Use skeleton loaders for content
- Pulse animation for loading indicators
- Shimmer effect for search results loading

### Micro-interactions
- Subtle scale on hover (1.02x)
- Color transitions on focus
- Smooth accordion expansions

## Responsive Breakpoints

| Name | Min Width | Use |
|------|-----------|-----|
| sm | 640px | Mobile landscape |
| md | 768px | Tablet |
| lg | 1024px | Laptop |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |

## Page Layouts

### Explore Page
- Hero with stats banner
- 3-column category grid
- 2-column inspirations
- Trending sidebar

### Search Page
- Sticky search bar
- Filter sidebar (collapsible on mobile)
- Results list with infinite scroll

### Leaderboard Page
- Tab navigation
- Visual podium for top 3
- Scrollable list below

### Playground Page
- Split view (50/50)
- Floating "Find Better" button
- Bottom results panel (collapsible)

## Code Display

### Syntax Highlighting Theme

Based on One Dark Pro:
```css
--code-keyword: #c678dd;    /* Purple */
--code-string: #98c379;     /* Green */
--code-number: #d19a66;     /* Orange */
--code-function: #61afef;   /* Blue */
--code-comment: #5c6370;    /* Gray */
--code-operator: #56b6c2;   /* Cyan */
```

### Code Block Styling
```jsx
<pre className="p-4 rounded-xl overflow-x-auto"
  style={{
    background: '#0d0d14',
    fontFamily: 'JetBrains Mono',
    fontSize: '0.875rem',
    lineHeight: 1.6
  }}>
  <code>{highlightedCode}</code>
</pre>
```

## Accessibility

- Minimum contrast ratio 4.5:1 for text
- Focus visible states for all interactive elements
- Keyboard navigation support
- Screen reader friendly labels
- Reduced motion option

## Icon Usage

Use **Lucide React** icons:
```jsx
import { Search, Code2, Trophy, Play, Sparkles } from 'lucide-react';
```

Standard sizes:
- 14px - Inline with text
- 16px - Buttons, badges
- 20px - Navigation
- 24px - Feature icons

## Reference Prototypes

Working UI prototypes available:
- `codeforge-complete-app.jsx` - Full 4-page application
- `codeforge-search-full.jsx` - Detailed search with all features

These files contain production-ready React components demonstrating all patterns.
