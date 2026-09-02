export const WORLD = Object.freeze({ width: 4200, height: 2800 });

export const COLORS = Object.freeze({
  grass: 0x8bc86f,
  grassLight: 0x9fd583,
  grassDark: 0x6eaa58,
  road: 0x535f6d,
  roadEdge: 0xcfd2c9,
  path: 0xd9c29a,
  water: 0x65b9ce,
  waterLight: 0x8bd0df,
  waterDark: 0x4a9db7,
  hedge: 0x4e8f4f,
  tree: 0x4e9a4f,
  trunk: 0x765238,
  wall: 0xf2dfbd,
  ink: 0x294637,
});

export const RIVER_PATH = Object.freeze([
  [2570, -120],
  [2545, 250],
  [2560, 520],
  [2528, 820],
  [2550, 1080],
  [2538, 1360],
  [2560, 1580],
  [2550, 1860],
  [2572, 2160],
  [2580, 2460],
  [2585, 2920],
]);

// Presentation-only river centreline. The protected gameplay river above stays
// unchanged while the approved artwork follows this more natural S-curve.
export const RIVER_VISUAL_PATH = Object.freeze([
  [2555, -120], [2535, 0], [2475, 120], [2450, 240], [2505, 360], [2575, 450], [2560, 530],
  [2500, 620], [2425, 740], [2450, 850], [2525, 930], [2560, 1000],
  [2640, 1100], [2690, 1210], [2660, 1320], [2600, 1430], [2560, 1545],
  [2490, 1640], [2400, 1760], [2385, 1880], [2450, 1990], [2600, 2110],
  [2670, 2220], [2620, 2350], [2500, 2440], [2470, 2570], [2510, 2700], [2555, 2800], [2555, 2920],
]);

// Code-native transcription of the approved Willowmere overhead reference.
// These values describe authored visual regions; they are deliberately separate
// from the protected house, shop, interaction and save identities below.
export const TOWN_REFERENCE_LAYOUT = Object.freeze({
  river: Object.freeze({
    waterWidth: 188,
    bankWidth: 226,
    bridgeCount: 3,
    treeFree: true,
  }),
  ponds: Object.freeze([
    Object.freeze({ id: "commons-pond", x: 1430, y: 1075, width: 410, height: 270, feature: "fountain" }),
    Object.freeze({ id: "reedbank-pond", x: 2005, y: 2335, width: 440, height: 300, feature: "fishing-dock" }),
  ]),
  playground: Object.freeze({ x: 1768, y: 922, width: 356, height: 304, sandColor: 0xdab46f }),
  beach: Object.freeze({
    sandColor: 0xe8ca7a,
    sandEdgeColor: 0xf4dfa3,
    sandPolygon: Object.freeze([
      Object.freeze([3050, 2520]), Object.freeze([3070, 2325]), Object.freeze([3160, 2180]),
      Object.freeze([3340, 2095]), Object.freeze([3560, 2070]), Object.freeze([3820, 2110]),
      Object.freeze([4025, 2225]), Object.freeze([4120, 2360]), Object.freeze([4120, 2540]),
    ]),
    roundedSandCaps: Object.freeze([
      Object.freeze([3180, 2340, 190]), Object.freeze([3500, 2250, 250]), Object.freeze([3830, 2300, 245]),
    ]),
    shoreline: Object.freeze([
      Object.freeze([3070, 2470]), Object.freeze([3190, 2440]), Object.freeze([3350, 2475]),
      Object.freeze([3510, 2505]), Object.freeze([3690, 2480]), Object.freeze([3880, 2508]), Object.freeze([4100, 2480]),
    ]),
    waterPolygon: Object.freeze([
      Object.freeze([3050, 2460]), Object.freeze([3200, 2430]), Object.freeze([3370, 2470]),
      Object.freeze([3530, 2500]), Object.freeze([3710, 2470]), Object.freeze([3890, 2500]),
      Object.freeze([4120, 2465]), Object.freeze([4120, 2800]), Object.freeze([3050, 2800]),
    ]),
    innerWaterPolygon: Object.freeze([
      Object.freeze([3070, 2495]), Object.freeze([3210, 2470]), Object.freeze([3380, 2508]),
      Object.freeze([3535, 2536]), Object.freeze([3715, 2506]), Object.freeze([3895, 2535]),
      Object.freeze([4100, 2505]), Object.freeze([4100, 2800]), Object.freeze([3070, 2800]),
    ]),
  }),
  pavement: Object.freeze({
    houseWalkWidth: 34,
    // Presentation-only route corrections transcribe the reference paths without
    // changing the protected navigation/path data below.
    visualPathOverrides: Object.freeze({
      "commons-play": Object.freeze([
        Object.freeze([1615, 890]), Object.freeze([1718, 882]),
        Object.freeze([1738, 904]),
        Object.freeze([2148, 1065]), Object.freeze([2185, 1065]),
        Object.freeze([2180, 1225]), Object.freeze([2040, 1305]),
        Object.freeze([1815, 1305]), Object.freeze([1718, 1218]),
        Object.freeze([1650, 1130]),
      ]),
    }),
    commercialAreas: Object.freeze([
      Object.freeze({ id: "old-market-forecourt", x: 160, y: 830, width: 820, height: 410 }),
      Object.freeze({ id: "high-street-forecourt", x: 2725, y: 555, width: 1290, height: 630 }),
      Object.freeze({ id: "cinema-forecourt", x: 3815, y: 205, width: 285, height: 285 }),
      Object.freeze({ id: "south-shore-cafe-forecourt", x: 3415, y: 2045, width: 290, height: 215, transition: "none" }),
    ]),
  }),
  woodland: Object.freeze({
    riverClearCenterX: 2555,
    riverClearHalfWidth: 270,
    interiorTrees: Object.freeze([
      Object.freeze([520, 1190, 1]), Object.freeze([780, 1320, 0.95]), Object.freeze([350, 1430, 1.05]),
      Object.freeze([1160, 770, 0.94]), Object.freeze([1670, 760, 1.05]), Object.freeze([2210, 790, 1]),
      Object.freeze([1130, 1370, 0.98]), Object.freeze([1570, 1390, 1.03]), Object.freeze([2260, 1320, 1]),
      Object.freeze([2880, 250, 1]), Object.freeze([3100, 300, 0.96]), Object.freeze([3350, 310, 1.05]),
      Object.freeze([2830, 1120, 0.92]), Object.freeze([3950, 1120, 1]), Object.freeze([2900, 1990, 1.04]),
      Object.freeze([3230, 1975, 0.92]), Object.freeze([3980, 1985, 1.08]), Object.freeze([2940, 2240, 1]),
      Object.freeze([760, 2170, 0.98]), Object.freeze([950, 2500, 1.05]), Object.freeze([1710, 2520, 1]),
      Object.freeze([2250, 2140, 0.94]), Object.freeze([2250, 2590, 1.04]),
    ]),
  }),
});

export const ROADS = Object.freeze([
  { id: "north-road", width: 76, points: [[130, 530], [520, 530], [920, 530], [1320, 530], [1720, 530], [2120, 530], [2430, 530]] },
  { id: "market-loop", width: 64, points: [[150, 530], [145, 620], [205, 700], [360, 750], [600, 780], [820, 815], [1030, 860], [1050, 970]] },
  { id: "mill-lane", width: 64, points: [[1050, 970], [1050, 1180], [1050, 1370], [1050, 1545]] },
  { id: "willow-lane", width: 76, points: [[130, 1545], [520, 1545], [920, 1545], [1050, 1545], [1320, 1545], [1720, 1545], [2120, 1545], [2430, 1545]] },
  { id: "high-street", width: 76, points: [[2695, 530], [3040, 530], [3400, 530], [3720, 530], [4050, 530]] },
  { id: "commercial-loop", width: 68, points: [[2695, 1000], [2720, 1080], [2740, 1170], [2880, 1195], [3180, 1195], [3500, 1195], [3800, 1195], [4050, 1195], [4100, 1090], [4100, 850], [4100, 650], [4050, 530]] },
  { id: "east-lower-link", width: 64, points: [[4050, 1205], [4100, 1350], [4050, 1545]] },
  { id: "south-shore-road", width: 76, points: [[2695, 1545], [3040, 1545], [3400, 1545], [3720, 1545], [4050, 1545]] },
  { id: "station-road", width: 50, points: [[4050, 530], [4120, 470], [4145, 380], [4130, 300]] },
]);

export const PATHS = Object.freeze([
  { id: "commons-main", width: 26, points: [[1050, 1100], [1145, 965], [1270, 875], [1450, 840], [1615, 890], [1710, 990], [1650, 1130], [1540, 1245], [1380, 1290], [1220, 1220], [1115, 1110], [1050, 1100]] },
  { id: "commons-play", width: 25, points: [[1615, 890], [1775, 850], [1950, 855], [2110, 930], [2185, 1065], [2150, 1200], [2020, 1320], [1840, 1340], [1650, 1130], [1710, 990], [1615, 890]] },
  { id: "mill-walk", width: 25, points: [[2185, 1065], [2325, 1050], [2440, 1010], [2525, 1000]] },
  { id: "south-pond-walk", width: 25, points: [[1670, 1545], [1670, 2050], [1700, 2260], [1850, 2390], [2040, 2460], [2200, 2440]] },
  { id: "harbour-walk", width: 25, points: [[3710, 1545], [3710, 2020], [3740, 2100], [3740, 2260]] },
]);

export const BRIDGES = Object.freeze([
  { id: "north-bridge", title: "North Bridge", x: 2430, y: 530, width: 265, height: 86 },
  { id: "mill-bridge", title: "Mill Bridge", x: 2430, y: 1000, width: 265, height: 82 },
  { id: "willow-bridge", title: "Willow Bridge", x: 2430, y: 1545, width: 265, height: 86 },
]);

export const DISTRICTS = Object.freeze([
  { title: "NORTH COTTAGES", x: 120, y: 150, width: 2250, height: 340 },
  { title: "OLD MARKET", x: 150, y: 820, width: 850, height: 690 },
  { title: "WILLOW COMMONS", x: 1080, y: 700, width: 1320, height: 790 },
  { title: "WILLOW COTTAGES", x: 130, y: 1620, width: 2080, height: 410 },
  { title: "HIGH STREET", x: 2730, y: 560, width: 1280, height: 620 },
  { title: "EAST COTTAGES", x: 2730, y: 1220, width: 1320, height: 820 },
  { title: "SOUTH MEADOW", x: 170, y: 2070, width: 760, height: 570 },
  { title: "WILLOW ALLOTMENTS", x: 1030, y: 2090, width: 620, height: 560 },
  { title: "REEDBANK", x: 1700, y: 2090, width: 680, height: 550 },
  { title: "SOUTH SHORE", x: 3060, y: 2050, width: 1050, height: 710 },
]);

// Stable property identities copied from the protected HTML. Keep these explicit:
// the legacy layout is not numerically ordered after house 8, and lawn, resident,
// gift and House Rescue ownership all depend on the authored house number.
export const HOUSES = Object.freeze([
  { id: "house-1", x: 208, y: 215, width: 195, height: 145, roof: 0xb95746, gate: "south", yard: { x: 150, y: 150, width: 310, height: 340 }, architectureKit: "starter-cottage" },
  { id: "house-2", x: 598, y: 215, width: 195, height: 145, roof: 0xd08b4f, gate: "south", yard: { x: 540, y: 150, width: 310, height: 340 }, architectureKit: "bay-cottage" },
  { id: "house-3", x: 988, y: 215, width: 195, height: 145, roof: 0x627e96, gate: "south", yard: { x: 930, y: 150, width: 310, height: 340 }, architectureKit: "cross-gable" },
  { id: "house-4", x: 1378, y: 215, width: 195, height: 145, roof: 0xb95746, gate: "south", yard: { x: 1320, y: 150, width: 310, height: 340 }, architectureKit: "two-storey" },
  { id: "house-5", x: 1768, y: 215, width: 195, height: 145, roof: 0xd08b4f, gate: "south", yard: { x: 1710, y: 150, width: 310, height: 340 }, architectureKit: "grand-veranda" },
  { id: "house-6", x: 2158, y: 215, width: 195, height: 145, roof: 0x627e96, gate: "south", yard: { x: 2100, y: 150, width: 310, height: 340 }, architectureKit: "bay-cottage" },
  { id: "house-13", x: 2790, y: 1280, width: 190, height: 140, roof: 0xd78363, gate: "south", yard: { x: 2735, y: 1230, width: 300, height: 290 }, architectureKit: "starter-cottage" },
  { id: "house-14", x: 3120, y: 1280, width: 190, height: 140, roof: 0x6f91aa, gate: "south", yard: { x: 3065, y: 1230, width: 300, height: 290 }, architectureKit: "two-storey" },
  { id: "house-15", x: 3450, y: 1280, width: 190, height: 140, roof: 0x9b79a9, gate: "south", yard: { x: 3395, y: 1230, width: 300, height: 290 }, architectureKit: "grand-veranda" },
  { id: "house-16", x: 3780, y: 1280, width: 190, height: 140, roof: 0x78a16c, gate: "south", yard: { x: 3725, y: 1230, width: 300, height: 290 }, architectureKit: "bay-cottage" },
  { id: "house-7", x: 208, y: 1680, width: 195, height: 145, roof: 0xd08b4f, gate: "north", yard: { x: 150, y: 1600, width: 310, height: 410 }, architectureKit: "cross-gable" },
  { id: "house-8", x: 598, y: 1680, width: 195, height: 145, roof: 0xb95746, gate: "north", yard: { x: 540, y: 1600, width: 310, height: 410 }, architectureKit: "starter-cottage" },
  { id: "house-11", x: 988, y: 1680, width: 195, height: 145, roof: 0xd08b4f, gate: "north", yard: { x: 930, y: 1600, width: 310, height: 410 }, architectureKit: "bay-cottage" },
  { id: "house-12", x: 1378, y: 1680, width: 195, height: 145, roof: 0xb95746, gate: "north", yard: { x: 1320, y: 1600, width: 310, height: 410 }, architectureKit: "cross-gable" },
  { id: "house-9", x: 1768, y: 1680, width: 195, height: 145, roof: 0x627e96, gate: "north", yard: { x: 1710, y: 1600, width: 310, height: 410 }, architectureKit: "two-storey" },
  { id: "house-10", x: 2790, y: 1680, width: 190, height: 140, roof: 0xb95746, gate: "north", yard: { x: 2735, y: 1600, width: 300, height: 410 }, architectureKit: "grand-veranda" },
  { id: "house-17", x: 3120, y: 1680, width: 190, height: 140, roof: 0xd2a04f, gate: "north", yard: { x: 3065, y: 1600, width: 300, height: 410 }, architectureKit: "cross-gable" },
  { id: "house-18", x: 3450, y: 1680, width: 190, height: 140, roof: 0xc96b73, gate: "north", yard: { x: 3395, y: 1600, width: 300, height: 410 }, architectureKit: "two-storey" },
  // House 19 is reserved but unauthored; the nineteenth physical property is home20.
  { id: "house-20", x: 3780, y: 1680, width: 190, height: 140, roof: 0x6489a6, gate: "north", yard: { x: 3725, y: 1600, width: 300, height: 410 }, architectureKit: "starter-cottage" },
].map((house) => Object.freeze({ ...house, yard: Object.freeze(house.yard) })));

export const SHOPS = Object.freeze([
  { title: "Corner Café", icon: "☕", x: 190, y: 890, width: 230, height: 210, color: 0xd99a59 },
  { title: "Village Grocer", icon: "🥕", x: 440, y: 890, width: 230, height: 210, color: 0x7f9f63 },
  { title: "Little Bakery", icon: "🥖", x: 690, y: 890, width: 230, height: 210, color: 0xcf806b },
  { title: "Riverside Kitchen", icon: "🍽️", x: 2780, y: 600, width: 240, height: 160, color: 0xc97858 },
  { title: "The Willow Arms", icon: "🍺", x: 3060, y: 600, width: 240, height: 160, color: 0x7b7658 },
  { title: "Morning Mug Coffee", icon: "☕", x: 3340, y: 600, width: 240, height: 160, color: 0x63a0a0 },
  { title: "Harbour General", icon: "🏪", x: 3650, y: 720, width: 240, height: 170, color: 0x62a99e },
  { title: "Riverstone Restaurant", icon: "🍽️", x: 2780, y: 905, width: 240, height: 190, color: 0x9a765f },
  { title: "Fresh Market", icon: "🛍️", x: 3060, y: 905, width: 250, height: 190, color: 0x79a25f },
  { title: "Paws & Wonders", icon: "🐾", x: 3345, y: 905, width: 240, height: 190, color: 0x6f9b79 },
  { title: "South Shore Café", icon: "🏖️", x: 3430, y: 2070, width: 260, height: 170, color: 0x63a8ad },
  { title: "KindWorks Cinema", icon: "🎬", x: 3840, y: 245, width: 250, height: 190, color: 0x513b61 },
]);

export const LANDMARKS = Object.freeze([
  { title: "Community Orchard", icon: "🍎", x: 3070, y: 300 },
  { title: "Old Watermill", icon: "⚙️", x: 2355, y: 900 },
  { title: "Commons Playground", icon: "🛝", x: 1940, y: 1090 },
  { title: "Willow Allotments", icon: "🌱", x: 1340, y: 2250 },
  { title: "Reedbank Wetland", icon: "🦆", x: 2040, y: 2240 },
  { title: "South Harbour", icon: "⚓", x: 3740, y: 2440 },
]);

export const PLAYER_START = Object.freeze({ x: 1050, y: 1545 });

export const LITTLE_BAKERY = Object.freeze({
  id: "shop-03",
  title: "Little Bakery",
  door: Object.freeze({ x: 805, y: 1120 }),
  approach: Object.freeze({ x: 805, y: 1142 }),
  interactionRadius: 92,
});

export const CORNER_CAFE = Object.freeze({
  id: "shop-01",
  title: "Corner Café",
  door: Object.freeze({ x: 305, y: 1120 }),
  approach: Object.freeze({ x: 305, y: 1142 }),
  interactionRadius: 92,
});

export const MORNING_MUG = Object.freeze({
  id: "shop-06",
  title: "Morning Mug Coffee",
  door: Object.freeze({ x: 3460, y: 780 }),
  approach: Object.freeze({ x: 3460, y: 805 }),
  interactionRadius: 92,
});

export const RIVERSIDE_KITCHEN = Object.freeze({
  id: "shop-04",
  title: "Riverside Kitchen",
  door: Object.freeze({ x: 2900, y: 780 }),
  approach: Object.freeze({ x: 2900, y: 805 }),
  interactionRadius: 92,
});

export const SOUTH_SHORE_SCOOPS = Object.freeze({
  id: "shop-12",
  title: "South Shore Scoops",
  door: Object.freeze({ x: 3560, y: 2240 }),
  approach: Object.freeze({ x: 3560, y: 2265 }),
  interactionRadius: 92,
});

export const KINDWORKS_CINEMA = Object.freeze({
  id: "shop-13",
  title: "KindWorks Cinema",
  door: Object.freeze({ x: 3965, y: 462 }),
  approach: Object.freeze({ x: 3965, y: 486 }),
  interactionRadius: 94,
  restorationMilestoneId: "station",
});

export const RIVER_CLEAROUT = Object.freeze({
  id: "river-clearout",
  title: "River Clear-Out",
  marker: Object.freeze({ x: 2380, y: 1190 }),
  approach: Object.freeze({ x: 2365, y: 1240 }),
  interactionRadius: 105,
});

export const BEACH_CLEANUP = Object.freeze({
  id: "south-shore",
  title: "South Shore Beach",
  marker: Object.freeze({ x: 3220, y: 2380 }),
  approach: Object.freeze({ x: 3220, y: 2320 }),
  interactionRadius: 118,
});

export const PLAYGROUND_POWERWASH = Object.freeze({
  id: "commons-playground",
  title: "Commons Playground",
  marker: Object.freeze({ x: 1940, y: 1090 }),
  approach: Object.freeze({ x: 1940, y: 1180 }),
  interactionRadius: 118,
});

export const COLLISION_RECTS = Object.freeze([
  // The river is blocked between bridge openings.
  { x: 2445, y: 0, width: 235, height: 480 },
  { x: 2445, y: 580, width: 235, height: 370 },
  { x: 2445, y: 1050, width: 235, height: 445 },
  { x: 2445, y: 1595, width: 235, height: 1205 },
  // Pond, wetland and deep harbour water.
  { x: 1240, y: 955, width: 380, height: 245 },
  { x: 1810, y: 2210, width: 390, height: 270 },
  { x: 3060, y: 2510, width: 1050, height: 290 },
]);
