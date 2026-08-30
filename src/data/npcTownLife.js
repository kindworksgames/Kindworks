export const NPC_TOWN_LIFE_CONFIG = Object.freeze({
  schemaVersion: 2,
  residentCount: 35,
  minSpeed: 46,
  maxSpeed: 64,
  arrivalRadius: 3,
  persistEveryGameMinutes: 5,
  conversationHistoryLimit: 80,
  maxOfflineGameMinutes: 3 * 1440,
});

export const NPC_NEEDS_CONFIG = Object.freeze({
  awake: Object.freeze({ hunger: 0.18, social: 0.055, recreation: 0.045, errands: 0.022, rest: 0.035 }),
  asleep: Object.freeze({ hunger: 0.055, social: 0.012, recreation: 0.008, errands: 0.004, rest: -0.22 }),
});

export const NPC_SOCIAL_CONFIG = Object.freeze({
  neglectedThreshold: 60,
  improvingThreshold: 36,
  caredThreshold: 19,
  majorMischiefCooldownGameMinutes: 360,
  communityCareCooldownGameMinutes: 28,
  perNpcMischiefCooldownGameMinutes: 1080,
  perNpcCareCooldownGameMinutes: 180,
  binTipBaseChance: 0.055,
  maxTippedBins: 1,
  protectedCleanupGameMinutes: 240,
  protectedCleanupRadius: 230,
  cleanLitterMultiplier: 0.12,
  caredLitterMultiplier: 0.38,
  improvingLitterMultiplier: 1.25,
  neglectedLitterMultiplier: 3,
  riverRestoredMultiplier: 0.18,
  greenTownMultiplier: 0.45,
  festivalMultiplier: 0.2,
  greetingDistance: 58,
  greetingProbeMinGameMinutes: 4,
  greetingProbeMaxGameMinutes: 10,
  greetingCooldownMinGameMinutes: 55,
  greetingCooldownMaxGameMinutes: 120,
  carryFullMinGameMinutes: 15,
  carryFullMaxGameMinutes: 60,
  carryEmptyMinGameMinutes: 8,
  carryEmptyMaxGameMinutes: 36,
  normalDropRadius: 165,
  maxDropsPerNpcPerDay: 2,
});

export const NPC_ACTIONS = Object.freeze([
  "HOME", "IDLE", "WALKING", "WORKING", "SHOPPING", "DISPOSING", "EATING", "SOCIALISING",
  "RELAXING", "FISHING", "GARDENING", "PLAYING", "SITTING", "RETURNING_HOME", "SLEEPING",
  "MISCHIEF", "HELPING",
]);

export const NPC_PUBLIC_BINS = Object.freeze([
  Object.freeze({ id: "bin-02", nodeId: "public-bin-02", x: 970, y: 1180, label: "Old Market Road bin", district: "Old Market Road", capacity: 12, initialFill: 3, connection: "marketlink1" }),
  Object.freeze({ id: "bin-09", nodeId: "public-bin-09", x: 3260, y: 1120, label: "Commercial Loop bin", district: "Commercial Loop", capacity: 12, initialFill: 6, connection: "biz_market" }),
  Object.freeze({ id: "bin-05", nodeId: "public-bin-05", x: 2200, y: 1340, label: "Willow Commons bin", district: "Willow Commons", capacity: 12, initialFill: 9, connection: "pr5" }),
  Object.freeze({ id: "bin-13", nodeId: "public-bin-13", x: 880, y: 2115, label: "South Meadow bin", district: "South Meadow", capacity: 12, initialFill: 4, connection: "southmeadow0" }),
  Object.freeze({ id: "bin-17", nodeId: "public-bin-17", x: 3980, y: 2440, label: "South Shore bin", district: "South Shore", capacity: 12, initialFill: 7, connection: "harbourmid1" }),
]);

export const NPC_PALETTES = Object.freeze([
  Object.freeze({ shirt: 0xd65f56, pants: 0x4d6c86, hair: 0x4a3024, skin: 0xe6b88b }),
  Object.freeze({ shirt: 0x638f5f, pants: 0x5a5978, hair: 0x2c2422, skin: 0xc98e67 }),
  Object.freeze({ shirt: 0xd28a4f, pants: 0x475f6c, hair: 0x6b452b, skin: 0xf0c39b }),
  Object.freeze({ shirt: 0x6a82b5, pants: 0x5c544d, hair: 0x292323, skin: 0xb97755 }),
  Object.freeze({ shirt: 0xa96c9c, pants: 0x546e61, hair: 0x5a3629, skin: 0xd8a579 }),
  Object.freeze({ shirt: 0x4f9297, pants: 0x625578, hair: 0x35261f, skin: 0xefc19a }),
]);

const nodes = [];
const links = [];
const add = (id, x, y, kind = "walk", label = "Village path", destination = false) => nodes.push({ id, x, y, kind, label, destination });
const link = (a, b) => links.push([a, b]);
const chain = (ids) => ids.slice(1).forEach((id, index) => link(ids[index], id));

add("trade0", 135, 530); add("trade1", 300, 530); add("trade2", 700, 530); add("trade3", 1100, 530); add("trade4", 1450, 530); add("trade5", 1800, 530); add("trade6", 2150, 530); add("trade7", 2430, 530);
chain(["trade0", "trade1", "trade2", "trade3", "trade4", "trade5", "trade6", "trade7"]);

add("loop0", 150, 620); add("loop1", 220, 700); add("loop2", 460, 760); add("loop3", 760, 805); add("loop4", 1030, 860); add("marketlink0", 1050, 970); add("marketlink1", 1050, 1180); add("marketlink2", 1050, 1370);
chain(["trade0", "loop0", "loop1", "loop2", "loop3", "loop4", "marketlink0", "marketlink1", "marketlink2"]);

add("market1", 305, 1155); add("market2", 555, 1155); add("market3", 805, 1155); add("market4", 955, 1210); add("market5", 1050, 1180);
chain(["market1", "market2", "market3", "market4", "market5"]); link("market5", "marketlink1");

add("willow0", 135, 1545); add("willow1", 330, 1545); add("willow2", 720, 1545); add("willow3", 1050, 1545); add("willow4", 1480, 1545); add("willow5", 1880, 1545); add("willow6", 2200, 1545); add("willow7", 2430, 1545);
chain(["willow0", "willow1", "willow2", "willow3", "willow4", "willow5", "willow6", "willow7"]); link("marketlink2", "willow3");

add("cwest", 1050, 1100, "park", "Willow Commons", true); add("cnw", 1270, 875, "park", "Pond walk", true); add("cn", 1450, 840); add("cne", 1615, 890, "park", "Willow Commons", true); add("cmid", 1710, 990); add("clower", 1650, 1130); add("cs", 1540, 1245, "bench", "Commons benches", true); add("csw", 1380, 1290, "park", "Pond path", true); add("cback", 1220, 1220);
chain(["cwest", "cnw", "cn", "cne", "cmid", "clower", "cs", "csw", "cback", "cwest"]); link("cwest", "marketlink1");
add("pr1", 1775, 850); add("pr2", 1950, 855); add("pr3", 2110, 930); add("ceast", 2185, 1065); add("pr5", 2150, 1200); add("pr6", 2020, 1320); add("pr7", 1840, 1340);
chain(["cne", "pr1", "pr2", "pr3", "ceast", "pr5", "pr6", "pr7", "clower"]);
add("play", 1940, 1110, "playground", "Playground", true); link("play", "pr2"); link("play", "pr6");
add("parkmill", 2250, 910); add("mill", 2390, 930, "mill", "Old Watermill", true); add("river3", 2430, 1000); chain(["pr3", "parkmill", "mill", "river3"]);

add("southmeadowgate", 890, 1545); add("southmeadow0", 890, 2050); add("southmeadow1", 620, 2220, "park", "South Meadow", true); link("southmeadowgate", "willow2"); chain(["southmeadowgate", "southmeadow0", "southmeadow1"]);
add("garden", 1280, 2310, "garden", "Willow Allotments", true); add("allot0", 1670, 1545); add("allot1", 1670, 2050); add("allot2", 1700, 2260); add("allot3", 1850, 2390); add("allot4", 2200, 2440, "park", "Reedbank Wetland", true); chain(["willow4", "allot0", "allot1", "allot2", "allot3", "allot4"]); link("garden", "allot1");
add("dock", 2240, 2600, "dock", "Wetland Landing", true); link("dock", "allot4");
add("orchard", 3060, 280, "orchard", "Community Orchard", true);

add("shop1", 305, 1120, "cafe", "Corner Café", true); link("shop1", "market1");
add("shop2", 555, 1120, "shop", "Village Grocer", true); link("shop2", "market2");
add("shop3", 805, 1120, "bakery", "Little Bakery", true); link("shop3", "market3");
add("square", 555, 1370, "square", "Old Market Court", true); link("square", "market2");

add("bridge-north", 2560, 530, "bridge", "North Bridge"); add("high0", 2695, 530); add("high1", 2960, 530); add("high2", 3260, 530); add("high3", 3560, 530); add("high4", 3820, 530); add("high5", 4050, 530);
chain(["trade7", "bridge-north", "high0", "high1", "high2", "high3", "high4", "high5"]); link("orchard", "high2");
add("station0", 4120, 470); add("station1", 4130, 300, "cinema", "KindWorks Cinema", true); link("high5", "station0"); link("station0", "station1");

add("bridge-riverside", 2560, 1000, "bridge", "Mill Bridge"); add("rpar0", 2695, 1000); add("rparbend1", 2720, 1080); add("rparbend2", 2740, 1170); add("rpar1", 2880, 1195); add("rpar2", 3180, 1195); add("rpar3", 3500, 1195); add("rpar4", 3800, 1195); add("rpar5", 4050, 1195); add("eastlink0", 4100, 1090); add("eastlink1", 4100, 850); add("eastlink2", 4100, 650); add("eastlower", 4100, 1350);
chain(["river3", "bridge-riverside", "rpar0", "rparbend1", "rparbend2", "rpar1", "rpar2", "rpar3", "rpar4", "rpar5", "eastlink0", "eastlink1", "eastlink2", "high5"]);

add("bridge-south", 2560, 1545, "bridge", "Willow Bridge"); add("shore0", 2695, 1545); add("shore1", 3020, 1545); add("shore2", 3350, 1545); add("shore3", 3680, 1545); add("shore4", 4050, 1545); chain(["willow7", "bridge-south", "shore0", "shore1", "shore2", "shore3", "shore4"]); chain(["rpar5", "eastlower", "shore4"]); link("eastlower", "eastlink0");

add("harbour0", 3710, 2020); add("harbour1", 3740, 2100, "harbour", "South Harbour", true); add("harbourmid1", 3740, 2260); add("harbour2", 3590, 2500, "beach", "South Shore", true); link("shore3", "harbour0"); chain(["harbour0", "harbour1", "harbourmid1", "harbour2"]);

add("eastplaza1", 2900, 840); add("eastplaza2", 3180, 840); add("eastplaza3", 3460, 840); add("eastplazaside", 3620, 870);
chain(["eastplaza1", "eastplaza2", "eastplaza3", "eastplazaside"]);
add("biz_restaurant1", 2900, 790, "restaurant", "Riverside Kitchen", true); link("biz_restaurant1", "eastplaza1");
add("biz_pub1", 3180, 790, "pub", "The Willow Arms", true); link("biz_pub1", "eastplaza2");
add("biz_coffee2", 3460, 790, "cafe", "Morning Mug Coffee", true); link("biz_coffee2", "eastplaza3");
add("biz_takeaway", 3770, 920, "shop", "Harbour General", true); link("biz_takeaway", "eastplazaside"); link("biz_takeaway", "rpar4");
add("biz_restaurant2", 2900, 1125, "restaurant", "Riverstone Restaurant", true); link("biz_restaurant2", "rpar1");
add("biz_market", 3180, 1125, "market", "Fresh Market", true); link("biz_market", "rpar2");
add("biz_arcade", 3460, 1125, "shop", "Paws & Wonders", true); link("biz_arcade", "rpar3");
add("biz_news", 4010, 450, "cinema", "KindWorks Cinema", true); link("biz_news", "station1");
add("biz_beachcafe", 3710, 2140, "cafe", "South Shore Café", true); link("biz_beachcafe", "harbour1");

export const NPC_HOME_DEFINITIONS = Object.freeze([
  ["home01", 300, 490, "trade1", "Morningbell Cottage", "West Gate, North Road"],
  ["home02", 700, 490, "trade2", "Hawthorn House", "North Road"],
  ["home03", 1100, 490, "trade3", "Market View Cottage", "North Road"],
  ["home04", 1450, 490, "trade4", "Blossom End", "North Road"],
  ["home05", 1800, 490, "trade5", "Garden Gate House", "North Road"],
  ["home06", 2150, 490, "trade6", "Millstone Cottage", "North Road"],
  ["home07", 310, 1620, "willow1", "Meadowgate House", "Willow Road"],
  ["home08", 700, 1620, "willow2", "Willowbank Cottage", "Willow Road"],
  ["home11", 1090, 1620, "willow3", "Allotment View", "Willow Road"],
  ["home12", 1480, 1620, "willow4", "Foxglove Cottage", "Willow Road"],
  ["home09", 1870, 1620, "willow5", "Reedbank House", "Willow Road"],
  ["home13", 2885, 1500, "shore1", "Bridge End Cottage", "South Bank"],
  ["home14", 3215, 1500, "shore2", "Riverside View", "South Bank"],
  ["home15", 3545, 1500, "shore3", "Harbour Lights House", "South Bank"],
  ["home16", 3875, 1500, "shore4", "Shoreward Cottage", "South Bank"],
  ["home10", 2885, 1620, "shore1", "Riverstone Cottage", "South Shore"],
  ["home17", 3215, 1620, "shore2", "Lantern House", "South Shore"],
  ["home18", 3545, 1620, "shore3", "Sea Glass Cottage", "South Shore"],
  ["home20", 3875, 1620, "shore4", "Meadowlight House", "South Shore"],
].map((home) => Object.freeze(home)));

for (const [id, x, y, connection, label] of NPC_HOME_DEFINITIONS) {
  add(id, x, y, "home", label, true);
  link(id, connection);
}

for (const bin of NPC_PUBLIC_BINS) {
  add(bin.nodeId, bin.x, bin.y, "public-bin", bin.label, true);
  link(bin.nodeId, bin.connection);
}

export const NPC_NAVIGATION_NODES = Object.freeze(nodes.map((node) => Object.freeze(node)));
export const NPC_NAVIGATION_LINKS = Object.freeze(links.map((edge) => Object.freeze(edge)));

const profiles = [
  ["Maya", "Café keeper", "shop1", 6.2, 7.5, 16.5, 22.4, ["cnw", "square", "cs"]],
  ["Leo", "Fisher", "dock", 5.6, 6.5, 14.5, 21.8, ["dock", "csw", "mill"]],
  ["Ava", "Grocer assistant", "shop2", 6.7, 8, 17, 22.6, ["square", "cne", "play"]],
  ["Noah", "Orchard keeper", "orchard", 5.9, 7, 15.5, 21.9, ["orchard", "garden", "allot4"]],
  ["Mia", "Community gardener", "garden", 6, 7.2, 15.2, 22, ["garden", "cnw", "orchard"]],
  ["Sam", "Baker", "shop3", 4.9, 5.8, 14, 21.2, ["square", "cs", "cnw"]],
  ["Lily", "Civic assistant", "square", 6.8, 8.2, 17.2, 22.8, ["square", "cne", "cs"]],
  ["Ben", "Mill worker", "mill", 6, 7, 15.8, 22, ["mill", "csw", "dock"]],
  ["Sofia", "Orchard keeper", "orchard", 5.8, 7, 15, 21.9, ["orchard", "garden", "cnw"]],
  ["Max", "Mill carpenter", "mill", 6.1, 7.3, 16, 22.1, ["mill", "square", "dock"]],
  ["Ella", "Market trader", "square", 6.4, 7.8, 16.8, 22.5, ["square", "shop1", "cne"]],
  ["Theo", "Delivery helper", "square", 6.3, 7.5, 16.3, 22.3, ["square", "dock", "shop2"]],
  ["Ruby", "Park caretaker", "cnw", 6.5, 7.8, 16, 22.5, ["cnw", "cs", "play"]],
  ["Finn", "Dockhand", "dock", 5.7, 6.8, 15, 21.7, ["dock", "csw", "square"]],
  ["Grace", "Playgroup helper", "play", 7, 9, 15.5, 22.7, ["play", "cne", "square"]],
  ["Oliver", "Restaurant chef", "biz_restaurant1", 7.2, 10.5, 21.5, 23.6, ["rpar1", "square", "biz_pub1"]],
  ["Chloe", "Bar manager", "biz_pub1", 9, 14.5, 23.3, 1.2, ["biz_coffee2", "rpar2", "square"]],
  ["Jack", "Barista", "biz_coffee2", 5.8, 6.4, 15, 22.2, ["rpar1", "harbour1", "square"]],
  ["Amelia", "Harbour shopkeeper", "biz_takeaway", 6.3, 7, 21, 22.8, ["harbour1", "shore4", "biz_pub1"]],
  ["Henry", "Cinema manager", "biz_news", 8, 9.2, 18, 23.2, ["rpar0", "square", "cnw"]],
  ["Isla", "Restaurant server", "biz_restaurant2", 8, 11, 21.8, 23.4, ["biz_coffee2", "rpar3", "harbour1"]],
  ["Oscar", "Market grocer", "biz_market", 6, 7.5, 18.5, 22, ["rpar3", "square", "orchard"]],
  ["Evie", "Pet shop keeper", "biz_arcade", 7.5, 8.5, 19, 22.8, ["southmeadow1", "rpar4", "shore4"]],
  ["George", "Beach café cook", "biz_beachcafe", 6.5, 7.5, 19.8, 22.8, ["harbour1", "harbour2", "shore4"]],
  ["Freya", "Cinema projectionist", "station1", 8.2, 9.5, 18.5, 23.3, ["biz_news", "high4", "square"]],
  ["Arthur", "Cinema usher", "biz_news", 9, 10, 19, 23.8, ["station1", "biz_coffee2", "square"]],
  ["Poppy", "Harbour worker", "harbour1", 5.8, 6.8, 15.5, 22, ["harbour2", "biz_beachcafe", "dock"]],
  ["Charlie", "Restaurant host", "biz_restaurant1", 8.2, 10.8, 21.8, 23.7, ["biz_pub1", "rpar2", "square"]],
  ["Rosie", "Market florist", "biz_market", 6.5, 8, 17.5, 22.5, ["garden", "rpar3", "cnw"]],
  ["Alfie", "Delivery rider", "rpar2", 6, 7, 16.5, 22.4, ["high2", "harbour1", "square"]],
  ["Millie", "Café server", "biz_beachcafe", 7, 8, 19, 22.8, ["harbour2", "shore3", "biz_arcade"]],
  ["Hugo", "Restaurant chef", "biz_restaurant2", 7.5, 10.5, 22, 23.8, ["rpar4", "biz_pub1", "harbour1"]],
  ["Ivy", "Community nurse", "square", 6.4, 8, 17, 22.5, ["rpar1", "cnw", "biz_coffee2"]],
  ["Louis", "Cinema host", "station1", 10, 11, 21.5, 0.2, ["biz_news", "rpar4", "biz_pub1"]],
  ["Nora", "Freelance artist", "biz_coffee2", 8.5, 10, 16, 23.2, ["harbour2", "rpar2", "cnw"]],
];

const traits = [
  [.99, .92, .70], [.94, .55, .88], [.98, .78, .72], [.96, .48, .82], [.995, .72, .92], [.97, .74, .64], [.99, .88, .62],
  [.95, .52, .76], [.985, .67, .90], [.91, .61, .75], [.97, .95, .58], [.90, .80, .70], [.995, .83, .91], [.93, .58, .80],
  [.99, .96, .95], [.97, .65, .55], [.94, .95, .70], [.985, .86, .68], [.93, .78, .62], [.96, .70, .64], [.98, .94, .72],
  [.96, .82, .62], [.98, .90, .82], [.97, .76, .86], [.99, .70, .66], [.95, .78, .58], [.94, .67, .84], [.98, .96, .60],
  [.99, .91, .83], [.89, .72, .78], [.985, .94, .88], [.96, .58, .60], [.995, .88, .72], [.97, .62, .74], [.91, .82, .96],
];

export const NPC_FRIEND_PAIRS = Object.freeze([
  ["Alfie", "Evie"], ["Alfie", "Louis"], ["Alfie", "Oscar"], ["Alfie", "Poppy"], ["Alfie", "Theo"],
  ["Amelia", "Chloe"], ["Amelia", "George"], ["Amelia", "Hugo"], ["Amelia", "Poppy"],
  ["Arthur", "Freya"], ["Arthur", "Henry"], ["Arthur", "Louis"], ["Arthur", "Nora"],
  ["Ava", "Grace"], ["Ava", "Lily"], ["Ava", "Maya"], ["Ben", "Finn"], ["Ben", "Leo"], ["Ben", "Max"], ["Ben", "Noah"],
  ["Charlie", "Hugo"], ["Charlie", "Isla"], ["Charlie", "Oliver"], ["Chloe", "Evie"], ["Chloe", "Jack"], ["Chloe", "Oliver"],
  ["Ella", "Lily"], ["Ella", "Maya"], ["Ella", "Sam"], ["Ella", "Theo"], ["Evie", "Millie"], ["Evie", "Nora"],
  ["Finn", "Leo"], ["Finn", "Max"], ["Freya", "Henry"], ["Freya", "Ivy"], ["Freya", "Louis"],
  ["George", "Hugo"], ["George", "Millie"], ["George", "Poppy"], ["Grace", "Ivy"], ["Grace", "Maya"], ["Grace", "Ruby"],
  ["Henry", "Jack"], ["Henry", "Oscar"], ["Hugo", "Isla"], ["Isla", "Millie"], ["Ivy", "Rosie"], ["Jack", "Millie"],
  ["Jack", "Nora"], ["Leo", "Mia"], ["Lily", "Ruby"], ["Louis", "Nora"], ["Max", "Noah"], ["Max", "Theo"],
  ["Mia", "Rosie"], ["Mia", "Ruby"], ["Mia", "Sofia"], ["Millie", "Nora"], ["Noah", "Sofia"], ["Oliver", "Hugo"],
  ["Oscar", "Rosie"], ["Poppy", "Millie"], ["Rosie", "Sofia"], ["Sam", "Maya"], ["Sam", "Theo"], ["Sofia", "Ruby"],
].map((pair) => Object.freeze(pair)));

const friendNames = new Map(profiles.map(([name]) => [name, new Set()]));
for (const [a, b] of NPC_FRIEND_PAIRS) {
  friendNames.get(a)?.add(b);
  friendNames.get(b)?.add(a);
}

const baseHomeIds = NPC_HOME_DEFINITIONS.map(([id]) => id).filter((id) => id !== "home20");
export const NPC_RESIDENTS = Object.freeze(profiles.map(([name, role, workNodeId, wake, workStart, workEnd, sleep, preferred], index) => Object.freeze({
  id: `npc-${String(index + 1).padStart(2, "0")}`,
  name,
  role,
  homeNodeId: baseHomeIds[index % baseHomeIds.length],
  workNodeId,
  wake,
  workStart,
  workEnd,
  sleep,
  preferred: Object.freeze(preferred),
  tidiness: traits[index][0],
  sociability: traits[index][1],
  recreation: traits[index][2],
  friendNames: Object.freeze([...friendNames.get(name)]),
  speed: NPC_TOWN_LIFE_CONFIG.minSpeed + ((index * 7) % 18),
  palette: NPC_PALETTES[index % NPC_PALETTES.length],
})));

export const NPC_INDOOR_NODE_KINDS = Object.freeze(new Set(["home", "cafe", "shop", "bakery", "restaurant", "pub", "market", "cinema"]));
