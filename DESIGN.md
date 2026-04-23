---
name: Agricultural Marketplace (Jordleie) Design System
colors:
  surface: '#f8faf5'
  surface-dim: '#d9dbd6'
  surface-bright: '#f8faf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f0'
  surface-container: '#edeeea'
  surface-container-high: '#e7e9e4'
  surface-container-highest: '#e1e3df'
  on-surface: '#191c1a'
  on-surface-variant: '#434843'
  inverse-surface: '#2e312e'
  inverse-on-surface: '#f0f1ed'
  outline: '#737973'
  outline-variant: '#c3c8c1'
  surface-tint: '#4d6453'
  primary: '#061b0e'
  on-primary: '#ffffff'
  primary-container: '#1b3022'
  on-primary-container: '#819986'
  inverse-primary: '#b4cdb8'
  secondary: '#99462a'
  on-secondary: '#ffffff'
  secondary-container: '#fe9572'
  on-secondary-container: '#762c12'
  tertiary: '#171815'
  on-tertiary: '#ffffff'
  tertiary-container: '#2c2c29'
  on-tertiary-container: '#95938f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d0e9d4'
  primary-fixed-dim: '#b4cdb8'
  on-primary-fixed: '#0b2013'
  on-primary-fixed-variant: '#364c3c'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59e'
  on-secondary-fixed: '#390b00'
  on-secondary-fixed-variant: '#7a2f15'
  tertiary-fixed: '#e5e2dd'
  tertiary-fixed-dim: '#c9c6c2'
  on-tertiary-fixed: '#1c1c19'
  on-tertiary-fixed-variant: '#474743'
  background: '#f8faf5'
  on-background: '#191c1a'
  surface-variant: '#e1e3df'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-bold:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-padding: 80px
---

# Design system: Agricultural Marketplace (Jordleie)

Use this document as the canonical visual direction for Jordleie. The YAML
front matter defines implementation tokens, while the guidance below defines
the product's brand feel, component behavior, layout rules, and Norwegian
content conventions.

## Overview

Jordleie uses a modern, professional, and approachable visual language for the
Norwegian agricultural sector. The system balances trust and tradition through
earthy colors and watercolor illustrations with innovation and efficiency
through crisp typography, generous whitespace, and structured layouts.

The design bridges traditional land ownership and modern digital efficiency.
It avoids the clinical, tech-heavy feel common in SaaS products and instead
uses a modern agricultural aesthetic that feels grounded, fertile, and
enduring.

## Brand and style

The audience includes generational landowners, farmers, and modern
agricultural entrepreneurs. The interface must feel high-end and professional
without becoming cold or inaccessible.

Use these brand principles across product screens and marketing surfaces:

- **Corporate and modern:** Use precise alignment, strong hierarchy, and
  generous whitespace to communicate credibility.
- **Warm and accessible:** Use soft surfaces, rounded shapes, and natural
  accents to make the marketplace feel approachable.
- **Norwegian agricultural heritage:** Use watercolor textures as atmospheric
  backgrounds, empty-state illustrations, image masks, or subtle page-header
  treatments.
- **Tech meets farm:** Pair organic illustration edges with crisp, structured
  UI components so the product feels both local and efficient.

## Color system

The palette is rooted in the Norwegian landscape. Implementation must use the
tokens in the YAML front matter, while brand and marketing work can reference
the semantic aliases below for clarity.

| Role | Alias | Values | Usage |
| --- | --- | --- | --- |
| Primary brand | Deep forest green | `#061B0E`, `#1B3022` | Navigation, headers, primary headings, brand-heavy components, and stability cues. |
| Accent | Terracotta earth | `#99462A`, `#D2691E`, `#A0522D` | Primary calls to action, active states, and warm emphasis. |
| Background | Parchment white | `#F5F2ED`, `#F8FAF5` | Page backgrounds and broad organic surfaces. |
| Surface | Linen surface | `#FAF9F6`, `#FFFFFF` | Cards, form sections, and high-legibility containers. |
| Secondary text | Stone grey | `#78716C`, `#434843` | Supporting copy, metadata, helper text, and subtle borders. |
| Dividers | Surface tint | `#E7E5E4`, `#E1E3DF` | Hover states, separators, and tonal layering. |
| Success | Success green | `#2E7D32` | Positive confirmations and active statuses. |
| Error | Muted red | `#BA1A1A` | Validation errors and destructive states. |

Reserve terracotta for important actions. It draws attention naturally against
the green and parchment palette without feeling aggressive. Use muted amber for
warning states so functional colors remain consistent with the earthy system.

## Typography

Jordleie uses **Manrope** because it balances geometric modernism with
humanistic warmth. It supports Norwegian characters such as æ, ø, and å with
clear proportions, which is essential for headings, forms, and long property
descriptions.

Apply typography with a strict hierarchy:

- **Headings:** Use Bold or ExtraBold weights from `700` to `800`, tight
  tracking, and the headline tokens from the front matter.
- **Body text:** Use `16px` to `18px` text with a `1.6` line height. Regular
  weight works for dense product UI; Medium can be used in marketing sections
  where the copy needs more presence.
- **Navigation:** Use SemiBold or Bold labels around `14px`. Small caps can be
  used sparingly when the header needs a more structured, editorial feel.
- **Labels and metadata:** Use increased letter spacing and compact sizes so
  small text stays readable in cards, forms, and property facts.

## Layout and spacing

The product follows a fixed-grid philosophy on desktop to create a consistent,
professional dashboard feel. Center content in a `1280px` max-width container
with a 12-column grid and `24px` gutters.

Use the `8px` spacing unit as the base for layout rhythm:

- **Sections:** Separate large sections with `80px` vertical spacing. Landing
  sections can use `py-24` when watercolor treatments need more breathing room.
- **Components:** Use `8px` or `16px` gaps for related elements inside a card.
  Use `32px` gaps for separate groups or section-level structure.
- **Cards:** Use generous internal padding such as `p-8` or `p-10` so property
  information never feels cramped.
- **Mobile:** Collapse to a fluid single-column layout with `16px` side margins
  and flexible containers for long Norwegian words.

## Elevation and depth

The interface must feel premium and practical, not game-like or overly glossy.
Use ambient shadows and tonal layering instead of heavy shadows.

Use these elevation levels consistently:

1. **Level 0 surface:** Use the parchment or cream background for full-page
   surfaces.
2. **Level 1 cards and containers:** Use white or linen surfaces with a soft,
   diffused shadow such as `0 4px 20px` at roughly `4%` forest-green opacity.
3. **Level 2 hover and active states:** Increase depth slightly with a shadow
   such as `0 8px 30px` at roughly `8%` opacity.
4. **Level 3 modals and dropdowns:** Pair a sharp, low-opacity border with a
   deeper soft shadow to separate overlays from the page.

Watercolor underlays can sit behind Level 1 cards to create physical layering
without compromising the clarity of the interface.

## Shapes and iconography

The shape language is rounded and practical. Standard buttons, input fields,
and small cards use an `8px` radius. Larger containers, land-listing cards, and
feature sections can use `16px` or `24px` radii.

Use iconography with rounded terminals and thin strokes that visually match
Manrope. Avoid sharp, overly geometric icons unless they support a specific
functional need. The contrast between structured rounded UI and organic
watercolor edges is part of the product's visual signature.

## Component styling

Core components must feel calm, scannable, and trustworthy. Use the patterns
below as defaults unless a screen has a clear reason to vary them.

- **Primary buttons:** Use solid terracotta for key calls to action. Forest
  green is also acceptable when the action is brand-heavy rather than
  conversion-focused. Use white text and the standard rounded radius.
- **Secondary buttons:** Use a forest-green outline with a subtle cream fill on
  hover. A `1.5px` border gives the control enough weight without competing
  with primary actions.
- **Tertiary buttons:** Use text-only styling with a `2px` underline on hover.
- **Button interaction:** Use `300ms` transitions for color and shadow changes.
  A subtle `98%` scale-down on click gives feedback without feeling playful.
- **Input fields:** Use a white or linen background with a subtle `1px` muted
  green-grey border. On focus, strengthen the border to `2px` in forest green.
- **Cards:** Use the Level 1 surface treatment, soft border, and `24px` or
  larger internal padding. Images inside cards use a smaller `4px` radius so
  they feel slightly crisper than their containers.
- **Chips and badges:** Use desaturated forest-green backgrounds with dark green
  text for natural category tags such as `Dyrket mark` and `Beite`.
- **Lists:** Display property details in clean rows with subtle `1px` cream or
  surface-tint dividers so dense data remains scannable.
- **Top navigation:** Keep the top navigation sticky or docked with an `80px`
  height on desktop. Mark the active location with a terracotta underline.
- **Heritage accents:** Use watercolor masks for thumbnails, page headers, or
  empty states. Keep these accents behind or beside structured UI so they add
  warmth without reducing readability.

## Visual hierarchy and illustration

Visual hierarchy depends on whitespace, contrast, and the relationship between
illustration and interface. The product must feel spacious enough for complex
property data while still giving the agricultural theme room to appear.

Use thin-stroke icons, restrained accents, and meaningful illustrations rather
than generic decorative assets. Watercolor images work best when paired with
structured cards, clear headings, and strong calls to action.

## Norwegian language and content

The design must support Norwegian copy naturally. Long compound words require
flexible container widths, generous line height, and careful button labels.

Use professional but inviting terminology. For example, prefer `Bli utleier`
over generic labels like `Start nå` when speaking to landowners. Keep labels
clear, local, and specific to agricultural rental flows.
