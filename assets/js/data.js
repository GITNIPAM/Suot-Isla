/* ==========================================================================
   Suot Isla — Official 16-Product Catalog, Island Series, Variants & Seed Data
   ========================================================================== */

window.SUOT_ISLA_DATA = {
  islandSeries: [
    {
      id: "Siargao",
      name: "Siargao Series",
      subtitle: "High-Performance Surf & Wave Gear",
      coords: "9.8482° N, 126.0458° E",
      swellTag: "Cloud 9 Reef Break • UPF 50+",
      description: "Engineered for heavy reef breaks, boat transfers, and dawn-to-dusk barrel sessions in General Luna.",
      accent: "#0E6B74"
    },
    {
      id: "Boracay",
      name: "Boracay Series",
      subtitle: "Breezy Resortwear & Golden-Hour Linen",
      coords: "11.9674° N, 121.9248° E",
      swellTag: "White Beach Sunset • Native Weave",
      description: "Breathable linen-cotton blends, hand-dyed batik wraps, and native buri-pandan craft for golden hour.",
      accent: "#F27D63"
    },
    {
      id: "El Nido",
      name: "El Nido Series",
      subtitle: "Lagoon Swimwear & Island-Hopping Essentials",
      coords: "11.1956° N, 119.4180° E",
      swellTag: "Big Lagoon • Quick-Dry Travel",
      description: "Compact, fast-drying swim and deck essentials built for karst limestone lagoons, kayaks, and bangka hops.",
      accent: "#2E5A44"
    },
    {
      id: "La Union",
      name: "La Union Series",
      subtitle: "Laid-Back Coastal Streetwear & Weekend Casuals",
      coords: "16.6631° N, 120.3208° E",
      swellTag: "San Juan Point • Salt-Washed",
      description: "Sun-faded heavyweight tees, camp-collar shirts, and skate-to-surf canvas shorts for north-swell weekends.",
      accent: "#0A535A"
    }
  ],

  categories: [
    "Swim & Surf",
    "Resort & Loungewear",
    "Beach Towels & Ponchos",
    "Island Accessories"
  ],

  colorHexMap: {
    "Lagoon Teal": "#0E6B74",
    "Sunset Coral": "#F27D63",
    "Palm Print": "#2E5A44",
    "Deep Teal": "#09484F",
    "Terracotta": "#C85A3B",
    "Navy": "#1C354D",
    "Sandstone": "#D9C39E",
    "Teal Wave": "#147A84",
    "Charcoal": "#2C3537",
    "Warm Sand": "#E8D7B9",
    "Coconut White": "#F9F6EE",
    "Olive": "#556B45",
    "Oatmeal": "#E2D5BE",
    "White": "#F7F5F0",
    "Sage": "#8FB399",
    "Mango Sunset": "#E88846",
    "Tropical Indigo": "#274469",
    "Natural Straw": "#D8BC8B",
    "Terracotta Trim": "#C45E43",
    "Seafoam Mist": "#A8D5BA",
    "Deep Navy": "#162A3E",
    "Olive Green": "#4E6340",
    "Slate Blue": "#466980",
    "Sand": "#DECBA8",
    "Tropicana Stripe": "#E07A5F",
    "Coastal Beige": "#E5D8C1",
    "Coral": "#F27D63",
    "Seafoam": "#95C9AA",
    "Washed Charcoal": "#394244",
    "Sun-Bleached Coral": "#F27D63",
    "Sky Blue": "#7DB3C8",
    "Cream Print": "#EFE7D6",
    "Teal Print": "#156870",
    "Mustard": "#D69F3A",
    "Washed Teal": "#2B7A80",
    "Brick Red": "#B54836",
    "Burnt Orange": "#CC6237"
  },

  products: [
    // ==================== 1. SIARGAO SERIES ====================
    {
      id: "siargao-cloud9-boardshorts",
      sku: "SI-SRG-001",
      name: "Siargao Cloud 9 Boardshorts",
      series: "Siargao",
      category: "Swim & Surf",
      price: 1690,
      description: "Quick-dry recycled poly-stretch shorts with coconut-shell drawstring tips and scalloped surf hem.",
      fabric: "88% Recycled Ocean Polyester, 12% Elastane (4-Way Stretch)",
      care: "Rinse in fresh water after surf; hang dry in shade.",
      sizes: ["28", "30", "32", "34", "36"],
      colors: ["Lagoon Teal", "Sunset Coral", "Palm Print"],
      stock: 18,
      soldCount: 64,
      badge: "Best Seller",
      silhouette: "shorts"
    },
    {
      id: "siargao-pacific-swell-surf-suit",
      sku: "SI-SRG-002",
      name: "Siargao Pacific Swell Long-Sleeve Surf Suit",
      series: "Siargao",
      category: "Swim & Surf",
      price: 2490,
      description: "Zip-front UPF 50+ women's one-piece surf suit engineered for long reef breaks and tropical glare.",
      fabric: "82% Recycled Nylon, 18% Lycra Xtra Life (UPF 50+)",
      care: "Hand wash cold with mild soap; dry flat.",
      sizes: ["XS", "S", "M", "L"],
      colors: ["Deep Teal", "Terracotta", "Navy"],
      stock: 4,
      soldCount: 49,
      badge: "Low Stock",
      silhouette: "surfsuit"
    },
    {
      id: "siargao-barrel-ride-poncho",
      sku: "SI-SRG-003",
      name: "Siargao Barrel-Ride Microfiber Surf Poncho",
      series: "Siargao",
      category: "Beach Towels & Ponchos",
      price: 1890,
      description: "Sand-repellent hooded changing poncho with oversized kangaroo pocket and snap side vents.",
      fabric: "100% Suede-Touch Recycled Microfiber (320 GSM)",
      care: "Machine wash cold; tumble dry low.",
      sizes: ["Standard", "Tall"],
      colors: ["Sandstone", "Teal Wave", "Charcoal"],
      stock: 14,
      soldCount: 38,
      badge: null,
      silhouette: "poncho"
    },
    {
      id: "siargao-reef-walker-dry-bag",
      sku: "SI-SRG-004",
      name: "Siargao Reef-Walker Dry Bag (15L)",
      series: "Siargao",
      category: "Island Accessories",
      price: 1190,
      description: "Roll-top waterproof floating bag with welded seams for bangka boat rides to outer surf spots.",
      fabric: "500D Ripstop Tarpaulin PVC with Duraflex Buckles",
      care: "Wipe clean with damp cloth; air dry open.",
      sizes: ["15L"],
      colors: ["Sunset Coral", "Lagoon Teal"],
      stock: 22,
      soldCount: 53,
      badge: "Island Essential",
      silhouette: "drybag"
    },

    // ==================== 2. BORACAY SERIES ====================
    {
      id: "boracay-golden-hour-linen-polo",
      sku: "SI-BRC-005",
      name: "Boracay Golden Hour Linen Polo",
      series: "Boracay",
      category: "Resort & Loungewear",
      price: 1790,
      description: "Open-collar breathable resort shirt crafted with carved coconut-shell buttons and side vents.",
      fabric: "70% European Flax Linen, 30% Combed Philippine Cotton",
      care: "Gentle wash cold; steam while damp.",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Warm Sand", "Coconut White", "Olive"],
      stock: 15,
      soldCount: 58,
      badge: "Best Seller",
      silhouette: "shirt"
    },
    {
      id: "boracay-white-beach-linen-trousers",
      sku: "SI-BRC-006",
      name: "Boracay White Beach Linen Trousers",
      series: "Boracay",
      category: "Resort & Loungewear",
      price: 1950,
      description: "Relaxed drawstring coastal pants tailored for barefoot sunset dinners along Station 1.",
      fabric: "70% Breathable Linen, 30% Organic Cotton",
      care: "Cold wash; line dry in coastal breeze.",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Oatmeal", "White", "Sage"],
      stock: 11,
      soldCount: 41,
      badge: null,
      silhouette: "trousers"
    },
    {
      id: "boracay-sunset-batik-sarong",
      sku: "SI-BRC-007",
      name: "Boracay Sunset Hand-Dyed Batik Sarong",
      series: "Boracay",
      category: "Resort & Loungewear",
      price: 990,
      description: "Lightweight artisan rayon beach wrap dress that ties multiple ways from shoreline to resort lounge.",
      fabric: "100% Hand-Batik Viscose Rayon",
      care: "Hand wash separately in cold water.",
      sizes: ["Free Size", "Plus Size"],
      colors: ["Mango Sunset", "Tropical Indigo"],
      stock: 3,
      soldCount: 45,
      badge: "Low Stock",
      silhouette: "sarong"
    },
    {
      id: "boracay-woven-buri-pandan-tote",
      sku: "SI-BRC-008",
      name: "Boracay Woven Buri & Pandan Tote",
      series: "Boracay",
      category: "Island Accessories",
      price: 1450,
      description: "Handcrafted native Aklan palm beach bag featuring a waterproof inner zippered compartment.",
      fabric: "Handwoven Buri & Pandan Leaf with Water-Resistant Nylon Liner",
      care: "Spot clean only; keep away from prolonged damp storage.",
      sizes: ["Medium", "Large"],
      colors: ["Natural Straw", "Terracotta Trim"],
      stock: 9,
      soldCount: 36,
      badge: "Artisan Made",
      silhouette: "tote"
    },

    // ==================== 3. EL NIDO SERIES ====================
    {
      id: "elnido-reef-safe-rash-guard",
      sku: "SI-ELN-009",
      name: "El Nido Reef-Safe Rash Guard",
      series: "El Nido",
      category: "Swim & Surf",
      price: 1590,
      description: "UPF 50+ flatlock-seam surf top designed for full-day snorkeling and sea kayaking through Bacuit Bay.",
      fabric: "84% Recycled Polyester, 16% Spandex (Chlorine & Salt Resistant)",
      care: "Rinse after saltwater immersion; drip dry.",
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["Seafoam Mist", "White", "Deep Navy"],
      stock: 19,
      soldCount: 51,
      badge: "UPF 50+",
      silhouette: "rashguard"
    },
    {
      id: "elnido-big-lagoon-hybrid-shorts",
      sku: "SI-ELN-010",
      name: "El Nido Big Lagoon Hybrid Swim Shorts",
      series: "El Nido",
      category: "Swim & Surf",
      price: 1550,
      description: "Water-to-trail quick-dry shorts equipped with mesh drainage pockets and a zippered security back pocket.",
      fabric: "90% Recycled Poly-Ripstop, 10% Spandex with DWR Finish",
      care: "Machine wash cold; do not use fabric softener.",
      sizes: ["28", "30", "32", "34"],
      colors: ["Olive Green", "Slate Blue", "Sand"],
      stock: 16,
      soldCount: 44,
      badge: null,
      silhouette: "shorts"
    },
    {
      id: "elnido-nacpan-round-beach-throw",
      sku: "SI-ELN-011",
      name: "El Nido Nacpan Round Woven Beach Throw",
      series: "El Nido",
      category: "Beach Towels & Ponchos",
      price: 1650,
      description: "Fringe-trimmed oversized jacquard cotton beach mat built for twin-beach picnics and deck lounging.",
      fabric: "100% Combed Jacquard Turkish-Weave Cotton (420 GSM)",
      care: "Gentle cycle cold in laundry bag to protect fringe.",
      sizes: ["150cm Diameter"],
      colors: ["Tropicana Stripe", "Coastal Beige"],
      stock: 4,
      soldCount: 33,
      badge: "Low Stock",
      silhouette: "throw"
    },
    {
      id: "elnido-waffle-weave-travel-towel",
      sku: "SI-ELN-012",
      name: "El Nido Waffle-Weave Travel Towel",
      series: "El Nido",
      category: "Beach Towels & Ponchos",
      price: 890,
      description: "Compact, ultra-absorbent quick-dry waffle towel with snap hanging loop for island hopping.",
      fabric: "100% Honeycomb Micro-Cotton Blend",
      care: "Machine wash warm; dries 3x faster than standard terry.",
      sizes: ["Medium", "Large"],
      colors: ["Coral", "Seafoam", "Navy"],
      stock: 27,
      soldCount: 62,
      badge: "Packable",
      silhouette: "towel"
    },

    // ==================== 4. LA UNION SERIES ====================
    {
      id: "launion-salt-washed-oversized-tee",
      sku: "SI-LU-013",
      name: "La Union Salt-Washed Oversized Tee",
      series: "La Union",
      category: "Resort & Loungewear",
      price: 1150,
      description: "Sun-faded heavyweight cotton tee featuring drop shoulders and minimalist Suot Isla back wave art.",
      fabric: "100% Heavyweight Ring-Spun Cotton (260 GSM Enzyme Salt-Wash)",
      care: "Turn inside out; wash cold.",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Washed Charcoal", "Sun-Bleached Coral", "Sky Blue"],
      stock: 21,
      soldCount: 73,
      badge: "Best Seller",
      silhouette: "tee"
    },
    {
      id: "launion-sanjuan-camp-collar-shirt",
      sku: "SI-LU-014",
      name: "La Union San Juan Camp-Collar Graphic Shirt",
      series: "La Union",
      category: "Resort & Loungewear",
      price: 1690,
      description: "Relaxed boxy button-down featuring custom-illustrated Philippine palm and point-break wave prints.",
      fabric: "100% Tencel Lyocell Twill",
      care: "Hand wash or delicate cycle cold; hang dry.",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Cream Print", "Teal Print"],
      stock: 12,
      soldCount: 47,
      badge: null,
      silhouette: "shirt"
    },
    {
      id: "launion-dawn-patrol-boardshorts",
      sku: "SI-LU-015",
      name: "La Union Dawn Patrol Canvas Boardshorts",
      series: "La Union",
      category: "Swim & Surf",
      price: 1490,
      description: "Vintage-wash cotton-nylon volley shorts with elastic waist for seamless skate-to-surf days.",
      fabric: "65% Cotton, 35% Recycled Nylon Poplin",
      care: "Machine wash cold; line dry.",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Mustard", "Washed Teal", "Brick Red"],
      stock: 13,
      soldCount: 39,
      badge: null,
      silhouette: "shorts"
    },
    {
      id: "launion-corduroy-surf-cap",
      sku: "SI-LU-016",
      name: "La Union 5-Panel Corduroy Surf Cap",
      series: "La Union",
      category: "Island Accessories",
      price: 790,
      description: "Breathable fine-wale coastal cap finished with an embroidered Suot Isla stamp wave patch.",
      fabric: "100% Cotton Fine-Wale Corduroy with Brass Strap Clasp",
      care: "Spot clean with damp brush.",
      sizes: ["One Size"],
      colors: ["Washed Teal", "Sand", "Burnt Orange"],
      stock: 5,
      soldCount: 55,
      badge: "Low Stock",
      silhouette: "cap"
    }
  ],

  coupons: [
    { code: "ISLA10", type: "percentage", value: 10, minSpend: 1000, label: "10% Off Island Order" },
    { code: "SURF15", type: "percentage", value: 15, minSpend: 2500, label: "15% Off Orders ₱2,500+" },
    { code: "FREESHIP", type: "free_shipping", value: 150, minSpend: 1200, label: "Free Philippine Island Delivery" }
  ],

  users: [
    {
      id: 1,
      name: "Mateo Alonzo",
      email: "mateo.alonzo@student.pcu.edu.ph",
      phone: "+63 917 842 1904",
      role: "customer",
      passwordHash: "$2y$10$SuotIslaHashedDemo981234",
      joinedAt: "2026-09-12"
    },
    {
      id: 2,
      name: "Camille Reyes (Store Admin)",
      email: "admin@suotisla.ph",
      phone: "+63 918 550 0192",
      role: "admin",
      passwordHash: "$2y$10$AdminRoleHashedKey001",
      joinedAt: "2026-08-01"
    },
    {
      id: 3,
      name: "Liam Villanueva (Catalog Staff)",
      email: "staff@suotisla.ph",
      phone: "+63 919 331 4401",
      role: "staff",
      passwordHash: "$2y$10$StaffRoleHashedKey002",
      joinedAt: "2026-08-15"
    },
    {
      id: 4,
      name: "Kuya Jomar Santos (Island Courier)",
      email: "courier@suotisla.ph",
      phone: "+63 920 711 8820",
      role: "courier",
      passwordHash: "$2y$10$CourierRoleHashedKey003",
      joinedAt: "2026-08-20"
    }
  ],

  initialOrders: [
    {
      orderNumber: "SI-2026-1041",
      userId: 1,
      customerName: "Mateo Alonzo",
      customerEmail: "mateo.alonzo@student.pcu.edu.ph",
      customerPhone: "+63 917 842 1904",
      shippingAddress: "Blk 4 Lot 12 Sampaloc I, Dasmariñas City, Cavite 4114",
      paymentMethod: "GCash",
      paymentRef: "GC-994810234",
      paymentStatus: "Paid",
      status: "Delivered",
      courierName: "Kuya Jomar Santos (Island Express)",
      trackingNumber: "ISLA-TRK-88291",
      placedAt: "2026-11-10 09:15",
      subtotal: 2840,
      deliveryFee: 150,
      discount: 284,
      total: 2706,
      items: [
        {
          productId: "siargao-cloud9-boardshorts",
          name: "Siargao Cloud 9 Boardshorts",
          size: "32",
          color: "Lagoon Teal",
          price: 1690,
          qty: 1
        },
        {
          productId: "launion-salt-washed-oversized-tee",
          name: "La Union Salt-Washed Oversized Tee",
          size: "L",
          color: "Sun-Bleached Coral",
          price: 1150,
          qty: 1
        }
      ]
    },
    {
      orderNumber: "SI-2026-1048",
      userId: 1,
      customerName: "Mateo Alonzo",
      customerEmail: "mateo.alonzo@student.pcu.edu.ph",
      customerPhone: "+63 917 842 1904",
      shippingAddress: "Tourism Road, Brgy. Catangnan, General Luna, Surigao del Norte 8419",
      paymentMethod: "Maya",
      paymentRef: "MY-441098212",
      paymentStatus: "Paid",
      status: "Out for Delivery",
      courierName: "Kuya Jomar Santos (Island Express)",
      trackingNumber: "ISLA-TRK-90412",
      placedAt: "2026-11-15 14:40",
      subtotal: 2980,
      deliveryFee: 150,
      discount: 0,
      total: 3130,
      items: [
        {
          productId: "boracay-golden-hour-linen-polo",
          name: "Boracay Golden Hour Linen Polo",
          size: "M",
          color: "Warm Sand",
          price: 1790,
          qty: 1
        },
        {
          productId: "siargao-reef-walker-dry-bag",
          name: "Siargao Reef-Walker Dry Bag (15L)",
          size: "15L",
          color: "Sunset Coral",
          price: 1190,
          qty: 1
        }
      ]
    },
    {
      orderNumber: "SI-2026-1052",
      userId: 1,
      customerName: "Mateo Alonzo",
      customerEmail: "mateo.alonzo@student.pcu.edu.ph",
      customerPhone: "+63 917 842 1904",
      shippingAddress: "Blk 4 Lot 12 Sampaloc I, Dasmariñas City, Cavite 4114",
      paymentMethod: "COD",
      paymentRef: "COD-PENDING",
      paymentStatus: "Pending",
      status: "Pending",
      courierName: "Unassigned",
      trackingNumber: "Pending Dispatch",
      placedAt: "2026-11-16 19:20",
      subtotal: 2480,
      deliveryFee: 150,
      discount: 0,
      total: 2630,
      items: [
        {
          productId: "elnido-reef-safe-rash-guard",
          name: "El Nido Reef-Safe Rash Guard",
          size: "M",
          color: "Seafoam Mist",
          price: 1590,
          qty: 1
        },
        {
          productId: "elnido-waffle-weave-travel-towel",
          name: "El Nido Waffle-Weave Travel Towel",
          size: "Large",
          color: "Coral",
          price: 890,
          qty: 1
        }
      ]
    }
  ],

  initialReturns: [
    {
      returnId: "RET-2026-019",
      orderNumber: "SI-2026-1041",
      customerName: "Mateo Alonzo",
      customerEmail: "mateo.alonzo@student.pcu.edu.ph",
      type: "Return & Refund",
      itemSummary: "Siargao Cloud 9 Boardshorts (Waist 32, Lagoon Teal)",
      productId: "siargao-cloud9-boardshorts",
      qty: 1,
      amount: 1690,
      reason: "Size Exchange / Fit Too Snug",
      notes: "Need to return Waist 32 for refund so I can reorder Waist 34.",
      status: "Pending Review",
      restocked: false,
      refunded: false,
      requestedAt: "2026-11-16 11:05"
    }
  ],

  initialEmails: [
    {
      id: "EM-103",
      to: "mateo.alonzo@student.pcu.edu.ph",
      type: "Order Confirmation",
      orderNumber: "SI-2026-1052",
      subject: "[Suot Isla] Order Confirmed #SI-2026-1052 — Ready for Packing",
      sentAt: "2026-11-16 19:20",
      body: "Mabuhay Mateo! We've received your Suot Isla order #SI-2026-1052 (₱2,630.00 via Cash on Delivery). Our warehouse team is verifying stock and preparing your El Nido Series gear."
    },
    {
      id: "EM-102",
      to: "mateo.alonzo@student.pcu.edu.ph",
      type: "Shipping Update",
      orderNumber: "SI-2026-1048",
      subject: "[Suot Isla] Out for Delivery #SI-2026-1048 (Tracking: ISLA-TRK-90412)",
      sentAt: "2026-11-15 16:05",
      body: "Good news! Courier Kuya Jomar Santos (Island Express) is out for delivery with your order #SI-2026-1048. Please keep your mobile line open."
    },
    {
      id: "EM-101",
      to: "mateo.alonzo@student.pcu.edu.ph",
      type: "Order Confirmation",
      orderNumber: "SI-2026-1041",
      subject: "[Suot Isla] Order Delivered #SI-2026-1041 — See You on the Waves!",
      sentAt: "2026-11-12 15:30",
      body: "Your order #SI-2026-1041 has been delivered and signed for. Need a return or size adjustment? Visit your Suot Isla Customer Dashboard anytime."
    }
  ]
};
