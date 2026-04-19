# Brand Color System

The PHDesign application has modernized its aesthetics from a generic grayscale template to a bespoke **Teal & Pink** brand system. This document outlines the rationale, values, and semantic variables used for consistency across our components.

## Philosophy
The visual branding embraces a "weird but professional" aesthetic:
*   **Abyss & Ocean**: Relying on deep, luxurious teals rather than standard grays. It feels oceanic, expansive, and high-end.
*   **High Contrast Accent**: We contrast this serene teal depth with a vibrant, energetic pink, drawing attention to interactive elements, CTAs, and semantic badges.

## Tailwind Constants

We register the semantic palette in `tailwind.config.mjs` directly, under `theme.extend.colors.brand`:

### Teal Scale
*   `brand-teal-light`: `#A1E4ED` (Primary light mode background, soft and oceanic).
*   `brand-teal-dark`: `#0A191E` (Primary dark mode background, deeply saturated and abyss-like. Also acts as text color for light mode).
*   `brand-teal-lightAccent`: `#E0F7FA` (Used for text and borders in dark mode, maintaining the cool color temperature vs harsh white).

### Pink Scale
*   `brand-pink`: `#C2185B` (Deep, professional pink. Used for primary CTAs and active states in light mode).
*   `brand-pink-light`: `#F48FB1` (Lighter, energetic pink. Used for CTAs and interactive outlines in dark mode to ensure high contrast against the abyss teal).

## Usage Guidelines

1. **Backgrounds**: Do NOT use `bg-white` or generic `bg-stone-*` scales for main application canvasses. Stick to `bg-brand-teal-light` and `bg-brand-teal-dark`. Cards and modals can use `bg-white` in light mode for separation, but should border against `brand-teal-dark/10`.
2. **Typography**: Do NOT use `text-stone-*`. Use `text-brand-teal-dark` in light mode and `text-brand-teal-lightAccent` in dark mode. Scale opacity rather than switching colors for hierarchical typography (e.g. `text-brand-teal-dark/70` for subtitles).
3. **Interactive Accents**: Use the `brand-pink` scale for CTAs, active tab borders, hover indicators, and decorative accents (like the dynamic scroll indicators).
