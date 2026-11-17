---
name: Suot Isla
description: Island-Born Surf & Beachwear E-Commerce Design System
colors:
  lagoon-teal: "#0E6B74"
  lagoon-hover: "#0A535A"
  lagoon-active: "#073F45"
  lagoon-ink: "#092C30"
  sun-bleached-coral: "#F27D63"
  coral-deep: "#8C2B16"
  warm-sand: "#F4EAD5"
  sand-light: "#FAF6EE"
  sand-deep: "#E8D9BC"
  palm-green: "#2E5A44"
  seafoam-mist: "#A8D5BA"
  border-subtle: "#D8C8AA"
  border-strong: "#B9A47E"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2.25rem, 1.85rem + 2vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.18
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.55rem, 1.38rem + 0.85vw, 2.05rem)"
    fontWeight: 800
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.1rem, 1.04rem + 0.28vw, 1.25rem)"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(0.95rem, 0.92rem + 0.18vw, 1.03rem)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.lagoon-teal}"
    textColor: "{colors.sand-light}"
    rounded: "{rounded.sm}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.lagoon-hover}"
  button-coral:
    backgroundColor: "{colors.sun-bleached-coral}"
    textColor: "{colors.lagoon-ink}"
    rounded: "{rounded.sm}"
    padding: "12px 22px"
  surface-card:
    backgroundColor: "{colors.sand-light}"
    textColor: "{colors.lagoon-ink}"
    rounded: "{rounded.md}"
    padding: "24px"
---

# Design System: Suot Isla

## Overview

**Creative North Star: "The Philippine Coastal Outfitters Dispatch"**

Suot Isla ("Island Wear") pairs tactile Philippine coastal material warmth with crisp e-commerce and operations clarity. Rather than generic sterile white fast-fashion templates or dark neon SaaS dashboards, every surface is grounded in Warm Sand (`#F4EAD5`), bleached linen (`#FAF6EE`), and Deep Lagoon Teal (`#0E6B74`), accented by Sun-Bleached Coral (`#F27D63`) for low-stock urgency and Palm Leaf Green (`#2E5A44`) on Seafoam Mist (`#A8D5BA`) for island fulfillment tracking.

**Key Characteristics:**
- Warm Sand (`#F4EAD5`) and bleached linen (`#FAF6EE`) structural grounds with zero pure gray (`#666`) or stark `#000`/`#fff` contrast.
- Circular woven-stitch stamp badge emblem featuring a clean horizon sun arc and curling ocean wave.
- Tabular monospace specs (`JetBrains Mono`) for SKUs, PHP (`₱`) prices, tracking numbers, and coordinates.
- Single-elevation discipline: resting cards use a `1px solid #D8C8AA` border without drop shadows; floating drawers and modals use soft lagoon-tinted depth without borders.

## Colors

The palette draws directly from Philippine surf towns—Siargao's reef lagoons, Boracay's coral sunsets, El Nido's limestone shallows, and La Union's sandy point breaks.

### Primary
- **Deep Lagoon Teal** (`#0E6B74`): Primary CTA buttons, sticky navigation header, active filter states, and ERD/Use Case diagram headers.
- **Deep Lagoon Ink** (`#092C30`): High-contrast primary typography, top dispatch bar, admin sidebar, and site footer.

### Secondary
- **Sun-Bleached Coral** (`#F27D63`): Promo tags, low-stock badges (`≤ 5 units`), and high-priority return/cancellation triggers.

### Tertiary
- **Palm Leaf Green** (`#2E5A44`) & **Seafoam Mist** (`#A8D5BA`): Delivery status pills (`Confirmed`, `Packed`, `Out for Delivery`, `Delivered`), stock verification badges, and secondary coastal highlights.

### Neutral
- **Warm Sand** (`#F4EAD5`): Primary page background canvas and table header fills.
- **Bleached Linen** (`#FAF6EE`): Elevated surface cards, filter sidebars, and form containers.
- **Woven Sand Border** (`#D8C8AA`): Subtle 1px structural dividers and card perimeters.

### Named Rules
**The Tinted Shore Rule.** Never use pure gray (`#666`, `#999`) or pure black (`#000`). Every text, border, and surface neutral is tinted with either Deep Lagoon Teal (`#092C30`, `#24494E`) or Warm Sand (`#D8C8AA`).

## Typography

**Display Font:** `Plus Jakarta Sans` (with `-apple-system, BlinkMacSystemFont, sans-serif` fallback)
**Body Font:** `DM Sans` (with system sans-serif fallback)
**Label/Mono Font:** `JetBrains Mono`

**Character:** Rounded geometric display headlines (`Plus Jakarta Sans` 700/800) give the wordmark and section titles a confident coastal stamp authority, while `DM Sans` keeps multi-faceted catalog filters, checkout forms, and admin tables effortless to scan.

### Hierarchy
- **Display** (`800`, `clamp(2.25rem, 1.85rem + 2vw, 3.5rem)`, `1.18`): Storefront hero headline.
- **Headline** (`800`, `clamp(1.55rem, 1.38rem + 0.85vw, 2.05rem)`, `1.18`): Page titles and major section headings.
- **Title** (`700`, `clamp(1.1rem, 1.04rem + 0.28vw, 1.25rem)`, `1.25`): Product card titles, modal headers, and Island Series titles.
- **Body** (`400/500`, `clamp(0.95rem, 0.92rem + 0.18vw, 1.03rem)`, `1.6`): Product descriptions, order summaries, and documentation (`65–75ch` max measure).
- **Label / Mono** (`500`, `0.8125rem`, `tabular-nums`): SKUs (`SI-SRG-001`), order numbers (`#SI-2026-1041`), coordinates, and prices.

### Named Rules
**The Self-Sufficient Heading Rule.** Headings never carry small uppercase kicker or eyebrow labels above them; each heading establishes hierarchy through scale, weight, and generous top margin.

## Layout

- **Max Container Width:** `1280px` centered with `24px` (`1.5rem`) horizontal padding on desktop, `16px` (`1rem`) on mobile.
- **Catalog Layout:** `290px` sticky multi-faceted filter sidebar paired with a responsive `repeat(auto-fill, minmax(270px, 1fr))` product grid (`24px` gap).
- **Admin Operations Layout:** `260px` fixed-width dark Lagoon Ink (`#092C30`) role navigation rail paired with a fluid workspace canvas.

## Elevation & Depth

Suot Isla uses a strict single-declaration depth model: resting containers and cards are flat and bounded by a `1px solid #D8C8AA` border, while floating overlays (the Slide-Over Shopping Bag Drawer, Email Notification Outbox Drawer, and Product CRUD Modal) use soft lagoon-tinted ambient shadows without borders.

### Shadow Vocabulary
- **Floating Drawer** (`box-shadow: 0 14px 34px rgba(9, 44, 48, 0.14)`): Toast notifications and floating popovers.
- **Modal Overlay** (`box-shadow: 0 24px 56px rgba(9, 44, 48, 0.22)`): Slide-over drawers and centered CRUD/Return dialog boxes.

### Named Rules
**The No-Ghost-Card Rule.** Declare elevation once—either a `1px` border on resting surface cards or a soft shadow on floating overlays, never both on the same element.

## Shapes

- **Small Controls & Inputs:** `8px` (`--radius-sm`) border radius for buttons, inputs, selects, and size chips.
- **Surface Cards & Tables:** `12px` (`--radius-md`) to `16px` (`--radius-lg`) border radius for product cards, series cards, and data table wrappers.
- **Status Pills & Swatches:** `999px` (`--radius-pill`) reserved strictly for compact status badges, delivery pills, and circular color swatches.

## Components

### Buttons
- **Shape:** Gently rounded corners (`8px` radius).
- **Primary (`.btn-primary`):** Deep Lagoon Teal (`#0E6B74`) background with Bleached Linen (`#FAF6EE`) bold text (`padding: 0.72rem 1.35rem`), shifting to `#0A535A` on hover.
- **Coral Accent (`.btn-coral`):** Sun-Bleached Coral (`#F27D63`) background with Deep Lagoon Ink (`#092C30`) text for high-visibility conversion and demo actions.
- **Outline (`.btn-outline`):** Bleached Linen (`#FAF6EE`) surface with `1px solid #B9A47E` border.

### Chips & Status Pills
- **Delivery Pill (`.pill-delivery`):** Seafoam Mist (`#A8D5BA`) background with deep Palm Leaf Green (`#1B3B2B`) text (`font-weight: 700`).
- **Low-Stock & Promo Pill (`.pill-coral`):** Sun-Bleached Coral (`#F27D63`) background with `#092C30` text.

### Cards / Containers
- **Corner Style:** `12px` (`--radius-md`) on standard surface cards, `16px` (`--radius-lg`) on product and series showcase cards.
- **Background:** Bleached Linen (`#FAF6EE`) over the Warm Sand (`#F4EAD5`) page canvas.
- **Border:** `1px solid #D8C8AA`, shifting to `#0E6B74` on interactive hover.

### Inputs / Fields
- **Style:** `1px solid #B9A47E` stroke on `#FDFBF7` background with `8px` radius and `0.65rem 0.85rem` padding.
- **Focus:** Border shifts to Deep Lagoon Teal (`#0E6B74`) with a `2px` focus-visible ring.

### Navigation
- **Sticky Header:** Deep Lagoon Teal (`#0E6B74`) bar with circular woven-stitch SVG stamp badge, single-line `nowrap` collection links, live Email Outbox drawer trigger, and persistent Shopping Bag drawer button.

## Do's and Don'ts

### Do:
- **Do** pair Deep Lagoon Teal (`#0E6B74`) primary actions with Warm Sand (`#F4EAD5`) and Bleached Linen (`#FAF6EE`) surfaces.
- **Do** use `font-variant-numeric: tabular-nums` on all prices, SKUs, stock counts, and order tables.
- **Do** trigger an entry in the Customer Email Notification Outbox whenever an order is placed, shipped, cancelled, or refunded.

### Don't:
- **Don't** place small uppercase eyebrow/kicker labels above `h1`–`h6` headings.
- **Don't** combine a `1px` border and a `box-shadow` on the same card.
- **Don't** use pure gray (`#666`, `#888`) or stark `#000000` text on coastal sand surfaces.
