# Design System: Maimon's Games
**Project ID:** games-maimons-dev

## 1. Visual Theme & Atmosphere

Maimon's Games should feel like a **calm playroom for curious minds**. It is playful, but not noisy; polished, but not corporate. The experience should invite quick exploration while still feeling trustworthy and carefully made.

The overall mood should balance:

- **Mental clarity:** browsing games should feel easy, organized, and low-friction.
- **Playful confidence:** color and motion should hint at fun without turning chaotic.

The site should read as **lightweight, thoughtful, and quietly premium**. Decorative moments can exist, but they should stay atmospheric and never compete with the games themselves.

## 2. Color Palette & Roles

### Core Foundations
- **Cloudwashed Paper** (`#F5F7FB`) – The primary light canvas. Keeps the page bright without looking sterile.
- **White Signal Card** (`#FFFFFF`) – Card and control background on light mode.
- **Midnight Control Plane** (`#0B1220`) – Main dark-mode canvas and atmospheric backdrop.
- **Graphite Frame** (`#1E293B`) – Dark surface for elevated panels, chips, and card interiors.

### Brand & Navigation
- **Tidal Teal** (`#0F766E`) – Primary accent for important actions, active filters, and focus states.
- **Signal Sky** (`#0EA5E9`) – Secondary accent for glow, gradients, and supportive highlights.
- **Aurora Mint** (`#D9F99D`) – Gentle success accent and playful bright note for small highlights.

### Typography & Structure
- **Deep Ink** (`#0F172A`) – Main text on light surfaces.
- **Slate Readout** (`#334155`) – Secondary copy and supporting descriptions.
- **Fog Annotation** (`#64748B`) – Muted labels, metadata, and inactive UI.
- **Mist Line** (`#D7DEE8`) – Borders, dividers, and low-noise structure.

### Gameplay Categories
- **Logic Teal** (`#0F766E`) – Strategy-heavy and cerebral games.
- **Puzzle Amber** (`#D97706`) – Mechanical and tactile puzzle experiences.
- **Deduction Red** (`#DC2626`) – Tense, inference-based games.
- **Word Mint** (`#16A34A`) – Language and vocabulary play.
- **Spatial Sky** (`#0EA5E9`) – Layout, movement, and spatial reasoning games.
- **Arcade Rose** (`#DB2777`) – Faster, more energetic arcade titles.
- **Utility Blue** (`#2563EB`) – Randomizers, helpers, and decision tools.

## 3. Typography Rules

**Display / Navigation Font:** `Space Grotesk`  
Use for hero headings, section labels, filter rows, and card titles.

**Primary UI Font:** `IBM Plex Sans`  
Use for descriptions, button labels, helper copy, and general interface text.

**Meta / Readout Font:** `IBM Plex Mono`  
Use for compact metadata, counts, labels, and any machine-like utility language.

### Hierarchy & Weights
- **Hero Titles:** bold (`700`) with tight tracking and confident scale.
- **Card Titles:** semi-bold (`600-700`) and compact.
- **Body Copy:** regular (`400`) with comfortable line-height around `1.55`.
- **Meta Copy:** medium (`500`) in mono where structure should feel precise.

## 4. Component Stylings

### Buttons & Pills
- **Shape:** soft engineered corners with a subtle pill influence.
- **Primary state:** Tidal Teal (`#0F766E`) or category accent with clear contrast.
- **Secondary state:** surface-toned backgrounds with Mist Line borders.
- **Hover behavior:** crisp border emphasis, small lift, and restrained glow.

### Cards & Panels
- **Corner style:** generous roundness (`18-24px`) that feels tactile and friendly.
- **Surface:** layered cards with visible borders and soft depth.
- **Depth:** whisper-soft shadows on light mode; flatter contrast-led separation on dark mode.
- **Accent use:** category color appears as a controlled top edge, icon tint, or tag treatment.

### Filters & Navigation
- Top controls should feel like a **mission strip for discovery**: compact, readable, and always understandable at a glance.
- Active states should feel intentional through tint, border, and tone rather than loud fills.

## 5. Layout Principles

- Keep the outer frame generous and breathable.
- Let the hero create atmosphere, then transition quickly into the playable catalog.
- Use a responsive card grid that feels editorial rather than cramped.
- Preserve strong tap targets and spacing on mobile without losing the premium feel.

## 6. Motion & Interaction

- Motion should be quick and composed, typically `160-220ms`.
- Cards may lift subtly; pills may tint and sharpen.
- Background effects should stay soft and ambient.

## 7. Implementation Notes

- Prefer semantic CSS variables shared across light and dark themes.
- Use category accents as guidance, not decoration overload.
- When adding new surfaces, ask: “Does this make browsing feel calmer, clearer, and more inviting?”
