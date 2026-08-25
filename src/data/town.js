export const WORLD = Object.freeze({ width: 4200, height: 2800 });

export const COLORS = Object.freeze({
  grass: 0x8bc86f,
  grassLight: 0x9fd583,
  grassDark: 0x6eaa58,
  road: 0x8a8d8b,
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

export const HOUSES = Object.freeze([
  [208, 215, 195, 145, 0xb95746], [598, 215, 195, 145, 0xd08b4f], [988, 215, 195, 145, 0x627e96],
  [1378, 215, 195, 145, 0xb95746], [1768, 215, 195, 145, 0xd08b4f], [2158, 215, 195, 145, 0x627e96],
  [208, 1680, 195, 145, 0xd08b4f], [598, 1680, 195, 145, 0xb95746], [988, 1680, 195, 145, 0xd08b4f],
  [1378, 1680, 195, 145, 0xb95746], [1768, 1680, 195, 145, 0x627e96],
  [2790, 1280, 190, 140, 0xd78363], [3120, 1280, 190, 140, 0x6f91aa], [3450, 1280, 190, 140, 0x9b79a9], [3780, 1280, 190, 140, 0x78a16c],
  [2790, 1680, 190, 140, 0xb95746], [3120, 1680, 190, 140, 0xd2a04f], [3450, 1680, 190, 140, 0xc96b73], [3780, 1680, 190, 140, 0x6489a6],
].map(([x, y, width, height, roof], index) => ({ id: `house-${index + 1}`, x, y, width, height, roof })));

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
