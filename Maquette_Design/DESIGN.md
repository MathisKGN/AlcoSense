---
name: Alcohol Intelligence System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#b90538'
  on-secondary: '#ffffff'
  secondary-container: '#dc2c4f'
  on-secondary-container: '#fffbff'
  tertiary: '#494bd6'
  on-tertiary: '#ffffff'
  tertiary-container: '#9699ff'
  on-tertiary-container: '#1d17b2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffdadb'
  secondary-fixed-dim: '#ffb2b7'
  on-secondary-fixed: '#40000d'
  on-secondary-fixed-variant: '#92002a'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-bac:
    fontFamily: Inter
    fontSize: 120px
    fontWeight: '100'
    lineHeight: 120px
    letterSpacing: -0.05em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-point:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '300'
    lineHeight: 28px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  container-padding: 2rem
  stack-gap: 1.5rem
  element-margin: 0.75rem
  glass-padding: 1.5rem
---

## Brand & Style
The design system is centered on a "Biometric Elegance" philosophy. It balances the gravity of health and safety with the sophisticated aesthetic of high-end consumer technology. The objective is to provide a calm, clinical, yet luxurious environment that removes the stigma of alcohol tracking, replacing it with a sense of informed empowerment.

The style is **Minimalist Glassmorphism**. It utilizes expansive whitespace, blurred translucent layers, and high-fidelity typography to create a sense of depth and lightness. The interface should feel like a premium glass instrument—precise, transparent, and frictionless. Every interaction must evoke a feeling of "Apple-like" refinement: smooth transitions, restrained color usage, and an uncompromising focus on the primary data point (Blood Alcohol Content).

## Colors
The palette is rooted in a "Studio White" environment. We use neutral tones to define structure and reserve vibrant colors exclusively for status communication.

- **Primary (Emerald):** Representing the "Safe" zone. A sophisticated, slightly desaturated green that feels healthy rather than neon.
- **Secondary (Coral Red):** Representing the "Danger/Limit" zone. A refined red with pinkish undertones to avoid sounding "alarmist" while still maintaining urgency.
- **Surface Neutrals:** A range of soft grays (from pure white to slate) used to create subtle hierarchy within the glass layers.
- **Background:** A very light, cool-toned off-white (#F9FAFB) that allows white glass cards to pop via shadows and blurs.

## Typography
The typography strategy relies on **extreme weight contrast**. We use "Inter" for its systematic clarity and neutral character. 

For the primary BAC readout, use the `display-bac` style with a weight of 100 (Thin). This creates a sophisticated, instrument-like feel that doesn't overwhelm the screen despite its large size. In contrast, all functional labels and navigation items use `label-sm` with a Semibold weight (600) and slight tracking for maximum legibility. 

Body text should be kept to a minimum, ensuring the "Safe" or "Danger" status headlines remain the focal point of the information architecture.

## Layout & Spacing
This design system utilizes a **Fixed Grid** approach with generous inner-container breathing room. 

- **Desktop/Tablet:** A centered 12-column grid with a max-width of 1024px.
- **Mobile:** A single-column layout with 24px (1.5rem) side margins.
- **Spacing Logic:** We employ an 8px base unit. To maintain a premium feel, "Over-spacing" is encouraged. Interaction points (buttons, inputs) should never be crowded. 

The layout relies on "Safe Areas"—significant padding at the top and bottom of the screen to ensure the core BAC metric is always vertically centered or placed in the "optimal optical zone" (top-third of the screen).

## Elevation & Depth
Depth is the defining characteristic of this design system. We use a three-tier elevation model:

1.  **The Base (Level 0):** A solid, light neutral background.
2.  **The Glass Layer (Level 1):** Primary cards use a backdrop-filter (blur: 24px) with a semi-transparent white fill (opacity: 70%). A 1px solid white border at 40% opacity provides a crisp "glass edge" highlight.
3.  **The Interaction Layer (Level 2):** Active elements or modals use a soft, long ambient shadow (32px blur, 5% opacity, neutral tint) to appear as if they are floating significantly above the base.

Avoid heavy black shadows. Instead, use "shadow-tinting" where the shadow inherits a microscopic amount of the primary color to keep the UI looking clean and integrated.

## Shapes
The shape language is defined by **large-scale radii**. Standard UI cards and containers use a 24px - 32px corner radius, creating a soft, organic appearance that feels friendly and modern.

Buttons and selection chips use a "Full Pill" (rounded-full) approach. This reinforces the "biometric" feel—reminiscent of pills, droplets, or medical capsules—aligning with the health-tech nature of the product. Small elements like checkboxes or input fields should maintain a minimum of 12px radius to ensure they don't appear "sharp" against the larger containers.

## Components
- **The Glass Card:** The primary container. Must have `backdrop-filter: blur(20px)`, a thin 1px white border, and 32px padding.
- **Control Buttons:** Large, pill-shaped buttons. The primary action (e.g., "Calculate") should use a subtle vertical gradient of the Primary Emerald. Secondary actions use the ghost-glass style.
- **Segmented Pickers:** Used for Gender or Drink Type. These should look like a single glass track with a floating white "pill" that slides behind the text to indicate the selection.
- **Value Steppers:** For "Number of Drinks." Use Thin typography for the value, flanked by large, circular (+) and (-) buttons with minimal icons.
- **Health Indicators:** Small, glowing "status dots" next to BAC numbers. These should use a CSS "pulse" animation to signify active calculation or real-time monitoring.
- **Inputs:** Simple bottom-border lines or fully encapsulated glass pills. Avoid the standard "box" look to maintain the minimalist aesthetic.