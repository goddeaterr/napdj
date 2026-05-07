# NAPDJ — Premium DJ School Website

A full-stack TypeScript + React + Vite website for a premium DJ school.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: CSS Modules (zero runtime CSS-in-JS)
- **Animations**: Pure CSS + custom hooks (no heavy deps)
- **Fonts**: Bebas Neue + Barlow (Google Fonts)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (opens at http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
napdj/
├── index.html                    # Entry HTML
├── vite.config.ts                # Vite config
├── tsconfig.json                 # TypeScript config
├── package.json
└── src/
    ├── main.tsx                  # React entry point
    ├── App.tsx                   # Root component
    ├── styles/
    │   └── global.css            # Design system / global styles
    ├── hooks/
    │   ├── useScrollAnimation.ts # Intersection Observer hook
    │   └── useMouseParallax.ts   # Mouse parallax hook
    └── components/
        ├── ParticleCanvas.tsx    # Canvas particle system
        ├── Navbar.tsx            # Fixed navigation
        ├── Hero.tsx              # Hero + stats
        ├── SplitSlider.tsx       # Before/After drag slider
        ├── About.tsx             # About section
        ├── Learning.tsx          # 4-week curriculum cards
        ├── Gallery.tsx           # Rotated image gallery
        ├── Testimonials.tsx      # Student testimonials
        ├── Pricing.tsx           # Pricing card
        ├── DJBuilder.tsx         # Interactive DJ set builder
        └── Footer.tsx            # Footer + contact
```

## Design System

| Token | Value |
|-------|-------|
| Background | `#0B0B0B` |
| Purple | `#9B30FF` |
| Green accent | `#39FF14` |
| Blue accent | `#00C8FF` |
| Display font | Bebas Neue |
| Body font | Barlow / Barlow Condensed |

## Key Features

- **Particle canvas** — 60 interactive particles reacting to mouse movement
- **Split Reality Slider** — drag to reveal before/after DJ transformation
- **Scroll animations** — IntersectionObserver-based staggered reveals
- **DJ Set Builder** — 9 personalized results from style × mood matrix
- **Ambient glow system** — animated radial gradients for atmosphere
- **Fully responsive** — mobile-first with CSS Grid and clamp()
- **CSS Modules** — scoped styles, zero conflicts

## Sections

1. **Hero** — Headline + split slider + stats
2. **About** — Mission + rotating vinyl disc + stat cards
3. **Learning** — 4-week curriculum grid
4. **Gallery** — Rotated overlapping photo grid
5. **Testimonials** — Dark cards with glow borders
6. **Pricing** — Single clean pricing card (€170)
7. **DJ Builder** — Interactive style/mood selector
8. **Footer** — CTA + links + contact
