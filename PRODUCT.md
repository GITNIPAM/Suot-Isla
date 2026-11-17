# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Multi-page static HTML5, CSS3, and modular Vanilla JavaScript (`index.html`, `catalog.html`, `product.html`, `cart.html`, `checkout.html`, `auth.html`, `account.html`, `admin.html`, `diagrams.html`), architected for direct backend integration (PHP/MySQL) and deployment on FourSys Cloud (Starter Cloud tier).

## Users

1. **Customers (Weekend Beachgoers, Surfers, and Island Travelers):** Browse Philippine coastal apparel and surf gear across 4 Island Series (`Siargao`, `Boracay`, `El Nido`, `La Union`), filter by Category, Island Series, Size, Color, and Price Range, manage a persistent shopping bag, complete checkout with Philippine address and stock validation, receive order confirmation and shipping emails, track deliveries, and request cancellations or returns/refunds.
2. **Administrators & Store Staff (`admin`, `staff`):** Manage the 16-product catalog and variant inventory (Create, Read, Update, Archive/Delete with image file upload and stock adjustments), monitor sales/revenue and low-stock alerts, confirm and pack incoming orders, assign couriers, process customer return/refund requests with automatic restocking, and manage customer and employee role permissions.
3. **Delivery Personnel / Couriers (`courier` / `fulfillment-only`):** View assigned island and domestic dispatches, inspect customer delivery details, and update shipment statuses from pickup to confirmed delivery.

## Product Purpose

**Suot Isla** (*Island-Born Surf & Beachwear*) provides breathable, durable, and sun-ready apparel inspired by Philippine surf towns. As a complete e-commerce web system for the PCU College of Informatics Web System Final Project, it demonstrates the full transactional order lifecycle across Customer, Admin/Staff, Courier, Payment Gateway, and Email Service actors.

## Positioning

Combines *Suot* (Tagalog for "wear" or "attire") and *Isla* (Spanish/Tagalog for "island"), literally translating to **"Island Wear."** Unlike generic fast-fashion storefronts, Suot Isla organizes its 16-item technical and resort catalog around four authentic Philippine coastal destinations (**Siargao**, **Boracay**, **El Nido**, and **La Union**) with real variant matrices (waist sizes, apparel sizes, liter volumes, and coastal colorways) and transparent Philippine island fulfillment tracking.

## Operating Context

- Used by shoppers on mobile and desktop browsers planning beach trips or surf sessions in the Philippines, and by store staff and couriers operating order fulfillment workflows.
- Evaluated live against a 100-point academic rubric covering Brand Name (10 pts), Original Logo (10 pts), Entity Relationship Diagram (10 pts), Use Case Diagram (15 pts), Core Transactional Functionality (25 pts), UI/UX Consistency & Navigation (10 pts), and Delivery (20 pts).

## Capabilities and Constraints

- **16 Products across 4 Island Series & 4 Categories:**
  - **Categories:** `Swim & Surf`, `Resort & Loungewear`, `Beach Towels & Ponchos`, `Island Accessories`
  - **Island Series:** `Siargao Series`, `Boracay Series`, `El Nido Series`, `La Union Series`
- **Dynamic Multi-Faceted Filtering & Search:** Filter simultaneously by Category, Island Series, Size, Color, and Price Range, plus keyword search and sorting.
- **Persistent Cart & Session:** Maintains cart items, selected variants, quantities, and coupon discounts (`ISLA10`, `SURF15`, `FREESHIP`) across page navigation.
- **Structured Checkout & Validation:** Collects billing info, validates Philippine shipping addresses and variant stock, and supports mock payment methods (`GCash`, `Maya`, `Credit/Debit Card`, `Cash on Delivery`).
- **Order Notifications:** Triggers viewable transactional emails for order confirmation, shipping updates, cancellations, and return/refund updates.
- **Returns & Refunds:** Customers submit cancellation or return requests and track status; Admins approve/reject requests, restock items into inventory, and process refunds.
- **Role-Based Access Control (RBAC):** Distinct permission levels for `admin`, `staff`, and `courier` (`fulfillment-only`).

## Brand Commitments

- **Brand Name:** **Suot Isla** — *Island-Born Surf & Beachwear*
- **Logo Design:** Minimalist circular stamp badge featuring a clean line-art rising sun over a curling ocean wave and a subtle woven stitch border, paired with the bold `SUOT ISLA` wordmark.
- **Color Palette:**
  - Deep Lagoon Teal (`#0E6B74`): Primary buttons, navigation headers, and active states.
  - Sun-Bleached Coral (`#F27D63`): Promo tags, sale badges, and low-stock alerts.
  - Warm Sand (`#F4EAD5`): Soft, coastal page backgrounds and surface cards.
  - Palm Leaf Green (`#2E5A44`) & Seafoam Mist (`#A8D5BA`): Delivery status pills and secondary accents.
- **Typography Pairing:**
  - Headings & Wordmark: `Plus Jakarta Sans` (Bold / ExtraBold rounded geometric sans-serif).
  - Body & UI Specs: `DM Sans` (Clean sans-serif), paired with `JetBrains Mono` for SKUs, prices, and order references.

## Evidence on Hand

- Complete 16-product catalog specification with exact product titles, descriptions, categories, Island Series assignments, size options, and colorways provided in the project brief.
- PCU College of Informatics Evaluation Criteria and Use Case Lifecycle specification PDF.

## Product Principles

1. **Coastal Utility Over Ornament:** Every surface balances warm Philippine island craft (woven buri, linen, UPF 50+ surf gear) with immediate e-commerce clarity—variant availability, fabric specs, and shipping fees are visible without hunting.
2. **End-to-End Lifecycle Traceability:** Every action taken by a Customer (placing an order, requesting a return) immediately reflects in the Admin/Staff/Courier portal and dispatches a viewable email notification.
3. **Backend-Ready Structural Honesty:** Every interactive form and state view uses clean semantic HTML and modular data hooks so the backend developer can wire up PHP/MySQL tables on FourSys Cloud without restructuring the DOM.

## Accessibility & Inclusion

- WCAG AA contrast compliance across all coastal surfaces (`>= 4.5:1` for body text, `>= 3:1` for large headings and controls), using deep lagoon-tinted dark ink (`#092C30`) on Warm Sand (`#F4EAD5`) and crisp warm ivory (`#FAF6EE`) on Deep Lagoon Teal (`#0E6B74`).
- Full keyboard focus visibility, semantic landmarks, and responsive layout from 360px mobile viewports to 1440px+ desktop screens.
