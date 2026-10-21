---
name: Clean Utility
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
  on-surface-variant: '#444653'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#440098'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f00d1'
  on-tertiary-container: '#c9aeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-section:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.02em
  card-title:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-default:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-description:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 17px
    letterSpacing: 0em
  label-badge:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  action-link:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: -0.005em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.25rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies uncompromising digital sovereignty, security, and technical precision. Designed for privacy-conscious professionals, developers, journalists, and security-minded users, it projects absolute trustworthiness and local-first execution. Every pixel conveys stability, speed, and privacy: files never leave the user's browser, no remote servers inspect personal artifacts, and no AI models scan or ingest private media.

The visual style merges **Crisp Corporate Modernism** with subtle **Techno-Glassmorphism** accents:
- **Pristine Canvas:** A clinical, high-clarity pure white and slate-neutral baseline creates a clean, distraction-free workspace.
- **Deep Navy & Electric Cyan Accents:** Deep midnight navy anchors the primary banners, while vibrant cyan and cobalt blue accents direct focus to interactive controls and system verification states.
- **Vibrant Functional Categorization:** Distinct tools utilize high-saturation jewel badges (emerald for metadata inspection, coral red for stripping/deletion, royal violet for conversions, and golden amber for upcoming utilities) to allow instantaneous tool recognition across dense catalogs.
- **Privacy First Artifacts:** Dedicated indicator badges, guarantee pills, and verified lock badges signal local-only processing without marketing clutter.
- **Strictly No AI:** Zero generative terminology, sparks, or magic wand motifs are permitted across the application. Video tool sets are explicitly marked as "Coming Soon" with muted, dashed states.

## Colors

The color palette is built around trustworthy, high-contrast, security-focused hues balanced over a structured neutral system:

- **Primary (`#1E40AF` - Royal Cobalt):** Anchor for core navigational states, primary action buttons, tool category banners, and active tab indicators.
- **Secondary (`#06B6D4` - Electric Cyan):** Used for dynamic highlights, glow badges, focus states, and browser-local security guarantees.
- **Tertiary (`#7C3AED` - Refined Violet):** Serves as a secondary tool categorical accent, count badges, and advanced file parsing identifiers.
- **Navy Anchor (`#0A1128` to `#0F172A`):** Deep, confident midnight hues used for hero canvases, high-tier promotional banners, and high-impact headers.
- **Functional Semantics:**
  - **Success / Privacy Verified (`#10B981`):** Indicates 100% in-browser processing, clean verification, and safe states.
  - **Destructive / Stripping (`#EF4444`):** Metadata removal, EXIF deletion, and document truncation.
  - **Warning / Staging (`#F59E0B`):** Upcoming features ("Coming Soon" modules such as Video Tools) and warning notices.
- **Neutral Ladder:**
  - `canvas`: `#F8FAFC` (App background)
  - `surface`: `#FFFFFF` (Card surfaces, input boxes, modal containers)
  - `border-subtle`: `#E2E8F0` (Card borders, dividers, subtle separators)
  - `text-primary`: `#0F172A` (Headings, primary card titles)
  - `text-secondary`: `#64748B` (Descriptions, subtitle metadata)

## Typography

The typography uses **Plus Jakarta Sans** across all levels. Its contemporary geometric curves, wide apertures, and clean vertical metrics provide a professional, approachable, and highly readable experience on high-density displays.

- **Display & Hero Titles:** Heavy weight (`700`-`800`) with tight letter-spacing (`-0.025em` to `-0.03em`) to anchor dark banners, gradient text overlays, and hero messaging.
- **Section Headers:** Crisp `22px` semibold labels matched directly with category icon badges to provide clear visual division between tool segments (e.g., Image Tools vs. PDF Tools).
- **Component & Card Titles:** Set at `15px` bold for rapid scannability within dense utility grids.
- **Card Descriptions:** Restricted to a compact `12px` neutral tone to preserve vertical rhythm and allow 2-line tool summaries without crowding the container.
- **Status & Indicators:** Semibold `11px` uppercase and sentence-case pill labels communicate statuses such as "New", "100% In-Browser", and "Coming Soon".

## Layout & Spacing

The layout adheres to a fixed-width dashboard structure with a dual-pane workspace:

- **Sidebar Navigation:** A persistent `240px` left-hand navigation column housing primary route links, account actions, and a persistent "100% Private" status widget. On tablet and mobile viewports, the sidebar collapses into an overlay drawer.
- **Main Canvas:** Structured on a 12-column responsive grid conforming to a `1440px` maximum width.
- **Tool Grid Density:**
  - **Desktop (>= 1280px):** 6-column grid for standard tool cards (`minmax(180px, 1fr)`).
  - **Laptop (1024px - 1279px):** 4-column grid.
  - **Tablet (768px - 1023px):** 3-column grid.
  - **Mobile (< 768px):** 1-column or 2-column compact grid with horizontal swipe options for quick-action toolbars.
- **Rhythm & Gaps:** Component cards utilize a strict `0.75rem` to `1.25rem` (`space-md` to `space-lg`) internal padding, maintaining compact vertical footprints so users can scan 12+ tools above the fold.

## Elevation & Depth

This system avoids heavy drop shadows in favor of precise, low-contrast border definition and subtle atmospheric backdrops:

- **Surface Layer 0 (Canvas):** Crisp `#F8FAFC` base that separates cards effortlessly from background space.
- **Surface Layer 1 (Standard Cards & Tiles):** Pure `#FFFFFF` fill framed by a hairline `1px solid #E2E8F0` border. Hover states introduce a light elevation: `0 4px 12px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -1px rgba(15, 23, 42, 0.03)` with border shifting to `#CBD5E1`.
- **Surface Layer 2 (Promotional Hero Canvas):** Deep navy `#0A1128` gradient featuring atmospheric radial blurs (`rgba(6, 182, 212, 0.15)` and `rgba(124, 58, 237, 0.12)`) simulating clean illuminated glass.
- **Surface Layer 3 (Floating Modals & Dropdowns):** Subtle tinted elevation `0 12px 32px -4px rgba(15, 23, 42, 0.12)` accompanied by `backdrop-filter: blur(8px)`.
- **Special Status Badges:** Soft ambient glow around privacy badges (`box-shadow: 0 0 12px rgba(16, 185, 129, 0.25)`) to reinforce safe, active browser shielding.

## Shapes

The design uses a clean, rounded shape language (`roundedness: 2`):

- **Tool Cards & Content Modules:** Standardized to `0.75rem` (`12px`) corner radius, balancing modern softness with high data density.
- **Category Icon Containers:** Symmetrical rounded squircles (`10px` to `12px` radius) supporting centered glyphs.
- **Pills & Badges:** Fully rounded (`9999px` / pill) for status chips ("New", "6 Tools", "Coming Soon", "100% Private").
- **Buttons & Input Controls:** `0.5rem` (`8px`) to maintain crisp interaction edges and button alignment.
- **Sidebar & Hero Containers:** `1rem` to `1.25rem` (`16px` to `20px`) for major outer envelopes.

## Components

### Buttons
- **Primary Action:** Solid `#1E40AF` cobalt with white text, `0.5rem` radius, subtle transition to `#1D4ED8` on hover. Accompanied by right-facing micro-arrows (`->`) for forward progress.
- **Secondary / Ghost:** White surface with `#E2E8F0` stroke, `#0F172A` text, transitioning to `#F1F5F9` on hover.
- **Hero Inverse:** Semi-transparent glass pill (`rgba(255, 255, 255, 0.1)`) with white border and high-contrast white text for secondary hero actions (e.g., "How It Works").

### Tool Cards
- **Structure:** Vertical flex container with white background, `1px` border stroke, containing:
  1. Header row with colorful squircle icon badge and optional mini "New" tag (`#EF4444` background with white text).
  2. Bold tool title (`15px`).
  3. Two-line descriptive summary (`12px` neutral text).
  4. Bottom-aligned text link button ("Open Tool ->") in primary blue that animates the arrow on card hover.
- **Hover Behavior:** Translates `-2px` on the Y-axis with a refined cyan-tinted border focus.

### Privacy Indicator Badges
- **Local Shield Widget:** Subtle light green container (`#ECFDF5`) framed with `#A7F3D0` stroke, featuring a lock icon, green title ("100% Private"), and secondary caption ("Your files are processed in your browser and kept secure.").
- **Hero Trust Checkmarks:** Inline pill badges with solid green check icons verifying: "No Installation", "Browser Based", "Safe & Private", and "Works on All Devices".

### Categorical Header Strips
- Distinct category headers combining:
  - Rounded colored category icon (e.g., Image Tools blue squircle, PDF Tools magenta squircle).
  - Bold category headline and subtitle.
  - Count pill (e.g., "6 Tools", "14 Tools").
  - "View All ->" solid pill button.

### "Coming Soon" States (Video Tools)
- Muted amber theme (`#FFFBEB` background with `#FDE68A` border).
- Distinct amber badge labeled "Coming Soon".
- Inactive tool items styled with dashed borders, muted grayscale icons, and non-clickable cursor states.

### Inputs & Global Search
- Centered header search input with pill styling (`9999px`), light slate surface (`#F1F5F9`), subtle border, search magnifying glass prefix, and `Ctrl K` keyboard shortcut pill suffix.