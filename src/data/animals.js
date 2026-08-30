import { absoluteWorldMinute } from "./farming.js";
import { RIVER_SECTIONS } from "./livingEnvironment.js";
import { RIVER_PATH, WORLD } from "./town.js";
import { TOWN_LOGICAL_GEOMETRY } from "./townGeometry.js";

export const ANIMAL_STATE_SCHEMA_VERSION = 2;

export const COMPANION_CARE_CONFIG = Object.freeze({
  releaseThreshold: 50, warningThreshold: 65, dailyDecay: 6, affectionGain: 10,
  treatGain: 16, affectionCooldownMinutes: 120, offlineFloor: 50, offlineGraceDays: 1,
});

export const ADOPTION_RULES = Object.freeze({
  common: Object.freeze({ trustMultiplier: 0.004, failedRequestBonus: 0.08, failureTrustGain: 12, guaranteedAfterFailures: 3 }),
  rare: Object.freeze({ trustMultiplier: 0.001, failedRequestBonus: 0.03, failureTrustGain: 5, guaranteedAfterFailures: 5 }),
});

export const SOUTH_MEADOW = Object.freeze({
  id: "south-meadow", label: "South Meadow",
  bounds: Object.freeze({ x: 205, y: 2110, width: 690, height: 485 }),
  route: Object.freeze([[250,2340],[430,2170],[620,2250],[860,2340],[680,2460],[600,2580],[380,2540],[320,2390]].map(([x,y]) => Object.freeze({ x, y }))),
});

export const WILDLIFE_ROTATION = Object.freeze({ baseVisible: 3, maxVisible: 4, slotDurationMinutes: 240, slotStaggerMinutes: 80, transitionSeconds: 0.7 });
export const ANIMAL_RELOCATION_CONFIG = Object.freeze({ triggerDistance: 520, fadeOutSeconds: 0.22, fadeInSeconds: 0.28 });
export const ANIMAL_VISUAL_FIDELITY_VERSION = "v44-reference-master";
// Deprecated compatibility exports. Production rendering resolves the semantic
// character.animal.reference-sheet entry through VisualRegistry.
export const ANIMAL_REFERENCE_TEXTURE_KEY = "animal-reference-master-v44";
export const ANIMAL_REFERENCE_SHEET_PATH = "/assets/animals/reference-master-v44.png";
export const ANIMAL_REFERENCE_FRAMES = Object.freeze({
  dog:0, cat:1, raccoon:2, fox:3, wolf:4, baby_pig:5,
  deer:6, squirrel:7, hedgehog:8, songbird:9, cow:10, sheep:11,
  goat:12, chicken:13, goose:14, rabbit:15, owl:16, duck:17,
  beaver:18, sea_otter:19, capybara:20, butterfly:21, bee:22, pigeon:23,
  crow:24, macaw:25, turtle:26, frog:27, snail:28, pony:29,
  "dog_labrador":30, "dog_spaniel":31, "dog_dachshund":32, "dog_corgi":33,
  "dog_border-collie":34, "dog_husky":35, chinchilla:36, meerkat:37,
  fennec_fox:38, baby_triceratops:39, mouse:40, donkey:41, fish:42,
});

export function animalReferenceFrame(definition) {
  const key = definition?.shopPet && definition.species === "dog" && definition.breedId
    ? `dog_${definition.breedId}`
    : definition?.species;
  return Number.isInteger(ANIMAL_REFERENCE_FRAMES[key]) ? ANIMAL_REFERENCE_FRAMES[key] : null;
}

const diets = {
  cat: [["river-minnows","fresh-sardines","river-trout","reedbank-roach","lily-perch","prepared-meat","chicken-pieces"],["fresh-sardines","lily-perch","prepared-meat"]],
  dog: [["fresh-sardines","river-trout","chicken-pieces","beef-strips","prepared-meat"],["chicken-pieces","beef-strips"]],
  rabbit: [["allotment-carrot","fresh-greens","orchard-apple"],["allotment-carrot","fresh-greens"]], hedgehog: [["mealworms","wild-berries"],["mealworms"]],
  duck: [["fresh-greens","pond-pellets","river-minnows","reedbank-roach","mixed-seeds"],["pond-pellets"]], raccoon: [["wild-berries","orchard-apple","river-minnows","reedbank-roach","lily-perch"],["wild-berries"]],
  fox: [["river-minnows","fresh-sardines","river-trout","lily-perch","golden-tench","chicken-pieces","prepared-meat"],["river-trout","lily-perch","chicken-pieces"]], crow: [["mixed-seeds","sunflower-seeds","mealworms","wild-berries"],["mixed-seeds"]],
  songbird: [["mixed-seeds","sunflower-seeds","wild-berries","mealworms"],["sunflower-seeds"]], wolf: [["fresh-sardines","river-trout","chicken-pieces","beef-strips"],["beef-strips","river-trout"]],
  sea_otter: [["river-minnows","fresh-sardines","river-trout","reedbank-roach","lily-perch","golden-tench"],["fresh-sardines","river-trout","golden-tench"]], beaver: [["fresh-greens","orchard-apple","allotment-carrot","wild-berries"],["fresh-greens","orchard-apple"]],
  capybara: [["fresh-greens","allotment-carrot","orchard-apple","wild-berries"],["fresh-greens","allotment-carrot"]], baby_pig: [["orchard-apple","allotment-carrot","fresh-greens","wild-berries"],["orchard-apple"]],
  sheep: [["fresh-greens","allotment-carrot"],["fresh-greens"]], goat: [["fresh-greens","allotment-carrot","orchard-apple"],["fresh-greens"]], donkey: [["fresh-greens","allotment-carrot","orchard-apple"],["allotment-carrot"]],
  cow: [["fresh-greens","allotment-carrot"],["fresh-greens"]], chicken: [["mixed-seeds","sunflower-seeds","mealworms"],["mixed-seeds"]], goose: [["fresh-greens","pond-pellets","mixed-seeds"],["fresh-greens"]],
  frog: [["mealworms","river-minnows"],["mealworms"]], squirrel: [["sunflower-seeds","mixed-seeds","wild-berries","orchard-apple"],["sunflower-seeds"]], deer: [["fresh-greens","orchard-apple","allotment-carrot"],["orchard-apple","fresh-greens"]],
  owl: [["mealworms","river-minnows"],["mealworms"]], bee: [["wild-berries"],["wild-berries"]], butterfly: [["wild-berries"],["wild-berries"]], mouse: [["mixed-seeds","sunflower-seeds","wild-berries"],["mixed-seeds"]],
  snail: [["fresh-greens","allotment-carrot"],["fresh-greens"]], fish: [["pond-pellets","mealworms"],["pond-pellets"]], pigeon: [["mixed-seeds","sunflower-seeds"],["mixed-seeds"]],
  turtle: [["pond-pellets","fresh-greens","river-minnows","reedbank-roach"],["pond-pellets"]], pony: [["allotment-carrot","orchard-apple","fresh-greens"],["allotment-carrot","orchard-apple"]],
  chinchilla: [["fresh-greens","orchard-apple","wild-berries"],["fresh-greens"]], meerkat: [["mealworms","wild-berries"],["mealworms"]], fennec_fox: [["chicken-pieces","prepared-meat","wild-berries"],["prepared-meat"]],
  macaw: [["mixed-seeds","sunflower-seeds","wild-berries"],["sunflower-seeds"]], baby_triceratops: [["fresh-greens","allotment-carrot","orchard-apple","wild-berries"],["fresh-greens","orchard-apple"]],
};

const species = {
  cat: ["Cat","🐈",.64,27,"all","cottages, cafés and the market","a little fish","strolling and grooming","feline","small"],
  dog: ["Dog","🐕",.68,34,"day","the commons and cottage lanes","a crunchy biscuit","trotting, sniffing and wagging","canine","medium"],
  rabbit: ["Rabbit","🐇",.48,31,"day","gardens, orchard and meadows","a garden carrot","soft, springy hops","small-mammal","small"],
  hedgehog: ["Hedgehog","🦔",.44,17,"night","gardens and allotments after dark","a small insect snack","slow evening snuffles","small-mammal","tiny"],
  duck: ["Duck","🦆",.46,23,"day","the river, wetland and harbour","a handful of peas","paddling and waddling","water-bird","small"],
  raccoon: ["Raccoon","🦝",.27,24,"night","woodland and quiet market corners","sweet orchard fruit","curious waddles and careful investigating","small-mammal","medium"],
  fox: ["Fox","🦊",.24,38,"crepuscular","woodland edge and the far meadows","a calm offering of food","cautious trots and curled rests","canine","medium"],
  crow: ["Crow","🐦‍⬛",.30,72,"day","rooftops, market and commons","a shiny seed mix","short flights and clever hops","bird","small"],
  songbird: ["Songbird","🐦",.20,82,"day","trees, gardens and riverside","wildflower seeds","perching and bright little flights","bird","tiny"],
  wolf: ["Wolf","🐺",.12,44,"crepuscular","remote woodland trails and far meadows","a carefully placed meaty treat","quiet patrols and watchful pauses","canine","large",true],
  sea_otter: ["Sea otter","🦦",.10,31,"day","the lower river, reedbank wetland and harbour","a favourite shellfish snack","playful paddles, dives and floating rests","river-mammal","medium",true],
  beaver: ["Beaver","🦫",.09,27,"day","the upper Willow River, wooded banks and quiet reeds","crisp greens or orchard fruit","steady paddles, tail splashes and careful bank patrols","river-mammal","medium",true],
  capybara: ["Capybara","🐹",.08,24,"day","the lower river shallows and sunny reed banks","fresh greens and crunchy carrots","calm swims, shoreline walks and peaceful rests","river-mammal","large",true],
  baby_pig: ["Baby pig","🐷",.15,25,"day","orchard edges, gardens and quiet market lanes","a crisp orchard apple","tiny trots, happy snuffles and muddy naps","farm","small",true],
  sheep: ["Sheep","🐑",.58,20,"day","the southern meadow and allotment edge","a crunchy carrot","gentle steps and woolly little bounces","farm","large"],
  goat: ["Goat","🐐",.52,28,"day","the farm paths and woodland yard","a carrot top","sure-footed trots and curious head tilts","farm","medium"],
  donkey: ["Donkey","🫏",.42,25,"day","the meadow tracks and harbour approach","a crisp carrot","steady walks and friendly ear flicks","farm","large"],
  cow: ["Cow","🐄",.48,18,"day","the open southern meadow","a sweet carrot","slow grazing steps and tail swishes","farm","large"],
  chicken: ["Chicken","🐔",.66,27,"day","the allotments, market and cottage gardens","tiny carrot pieces","busy pecks and quick little runs","bird","small"],
  goose: ["Goose","🪿",.43,25,"day","the river, pond and south harbour","a carrot shaving","proud paddles and waddling patrols","water-bird","medium"],
  frog: ["Frog","🐸",.50,24,"all","Reedbank Wetland and damp garden edges","a tiny carrot shaving","springy hops and still pond-side rests","amphibian","tiny"],
  squirrel: ["Squirrel","🐿️",.56,48,"day","woodland trees, gardens and the Commons","a carrot coin","quick dashes, upright pauses and tail flicks","small-mammal","small"],
  deer: ["Deer","🦌",.22,42,"crepuscular","the woodland edge and quiet southern meadow","a long carrot","graceful bounds and watchful pauses","deer","large"],
  owl: ["Owl","🦉",.30,62,"night","woodland trees and quiet rooftops after dark","a small carrot piece","silent flights and wide-eyed perching","bird","medium"],
  bee: ["Bee","🐝",.70,74,"day","gardens, allotments and the Commons","a sweet carrot flower","tiny loops and cheerful hovering","insect","tiny"],
  butterfly: ["Butterfly","🦋",.62,58,"day","flower patches, gardens and the wetland","a carrot flower","soft fluttering loops","insect","tiny"],
  mouse: ["Field mouse","🐁",.60,35,"crepuscular","allotments, hedges and market corners","a carrot crumb","tiny scurries and whisker pauses","small-mammal","tiny"],
  snail: ["Snail","🐌",.72,8,"all","damp allotments and wetland paths","a carrot shaving","slow determined glides","crawler","tiny"],
  fish: ["River fish","🐟",.55,45,"all","the clean river and south estuary","a floating carrot crumb","quick swims and little splashes","fish","tiny"],
  pigeon: ["Pigeon","🐦",.68,68,"day","the market, station and café roofs","a carrot crumb","bobbing walks and short flights","bird","small"],
  turtle: ["Turtle","🐢",.34,12,"day","the lower river and Reedbank Wetland","a carrot slice","calm paddles and sunny rests","crawler","small"],
  pony: ["Pony","🐴",.36,34,"day","the southern meadow and farm tracks","a whole crunchy carrot","bright trots and mane-shaking pauses","farm","large"],
  chinchilla: ["Chinchilla","🐭",.01,25,"all","Paws & Wonders until adopted, then South Meadow","fresh greens and orchard fruit","soft hops and cloudlike tail flicks","small-mammal","small"],
  meerkat: ["Meerkat","🦦",.01,31,"day","Paws & Wonders until adopted, then South Meadow","mealworms and berries","quick scurries and upright lookout poses","small-mammal","small"],
  fennec_fox: ["Fennec fox","🦊",.01,37,"crepuscular","Paws & Wonders until adopted, then South Meadow","meat bites and berries","light-footed trots and enormous ear turns","canine","small"],
  macaw: ["Macaw","🦜",.01,70,"day","Paws & Wonders until adopted, then South Meadow","seeds and berries","bright wing stretches and clever sidesteps","bird","medium"],
  baby_triceratops: ["Baby Triceratops","🦕",.01,23,"day","the Paws & Wonders mystery egg, then South Meadow","fresh greens, carrots and apples","sturdy little trots and curious horn nudges","farm","medium"],
};

const waterSpeciesIds = ["duck","sea_otter","beaver","capybara","goose","fish","turtle"];
const aerialSpeciesIds = ["crow","songbird","owl","bee","butterfly","pigeon","macaw"];
const animationMeta = {
  cat:["feline","walk",9,"medium"], dog:["canine","walk",9,"medium"], rabbit:["hopper","hop",9,"medium"], hedgehog:["hedgehog","walk",6,"small"],
  duck:["waterBird","waddle",10,"medium"], raccoon:["canine","walk",9,"medium"], fox:["canine","walk",9,"medium"], crow:["bird","hop",8,"small"], songbird:["bird","hop",8,"small"],
  wolf:["canine","walk",9,"large"], sea_otter:["stocky","waddle",8,"medium"], beaver:["stocky","walk",8,"medium"], capybara:["stocky","walk",8,"large"], baby_pig:["stocky","walk",9,"medium"],
  sheep:["stocky","walk",9,"large"], goat:["stocky","walk",9,"large"], donkey:["equine","walk",9,"large"], cow:["stocky","walk",9,"large"], chicken:["bird","waddle",8,"small"],
  goose:["waterBird","waddle",10,"medium"], frog:["frog","hop",6,"small"], squirrel:["smallMammal","hop",6,"small"], deer:["equine","walk",9,"large"], owl:["bird","hop",8,"medium"],
  bee:["flutter","flutter",6,"tiny"], butterfly:["flutter","flutter",6,"tiny"], mouse:["smallMammal","walk",6,"tiny"], snail:["snail","crawl",4,"tiny"], fish:["fish","swim",6,"small"],
  pigeon:["bird","hop",8,"small"], turtle:["turtle","walk",6,"small"], pony:["equine","walk",9,"large"], chinchilla:["smallMammal","hop",8,"small"], meerkat:["smallMammal","walk",8,"small"],
  fennec_fox:["canine","walk",9,"medium"], macaw:["bird","waddle",8,"medium"], baby_triceratops:["dino","walk",9,"large"],
};

export const ANIMAL_SPECIES = Object.freeze(Object.fromEntries(Object.entries(species).map(([id, values]) => {
  const [label,icon,chance,speed,schedule,habitat,treat,motionDescription,_family,_sizeClass,rare=false] = values;
  const [accepted,favorites] = diets[id];
  const [family,motion,frames,sizeClass] = animationMeta[id];
  const size = ({tiny:.72,small:.88,medium:1.05,large:1.28})[sizeClass] || 1;
  return [id,Object.freeze({ id,label,icon,chance,speed,schedule,habitat,treat,motion,motionDescription,family,frames,size,sizeClass,rare,accepted:Object.freeze(accepted),favorites:Object.freeze(favorites) })];
})));

export const ANIMAL_HABITATS = Object.freeze({
  cat:[[285,575],[555,575],[730,650],[1110,720],[1880,410],[3300,610],[3650,2220]], dog:[[1030,760],[1390,760],[1540,920],[420,720],[780,1390],[3200,1110]],
  rabbit:[[80,1510],[1450,2320],[3000,290],[520,2140],[330,2460],[3300,2160]], hedgehog:[[85,1540],[1480,2320],[2260,1240],[340,2480],[1890,2160]],
  duck:[[2665,620],[2650,930],[2645,1280],[2690,1740],[2690,2210],[2110,2320]], raccoon:[[2330,1110],[2410,1040],[670,700],[3480,990],[3650,730]],
  fox:[[2250,1270],[2410,1100],[400,2300],[520,2160],[3000,2170],[4100,2050]], crow:[[470,615],[1280,660],[2860,520],[3470,555],[3900,330],[3710,1220]],
  songbird:[[1050,685],[1560,690],[65,1490],[2990,275],[2970,1040],[1710,2250],[3930,2220]], wolf:[[2260,1240],[2415,1090],[330,2490],[480,2160],[3020,2170],[4140,2000]],
  sea_otter:[[2660,1160],[2685,1660],[2690,2240],[2100,2320],[3700,2070],[3930,2140]], beaver:[[2645,820],[2650,1040],[2660,1260],[2680,1570],[2690,1910]],
  capybara:[[2680,1680],[2690,1960],[2690,2210],[2700,2440],[2130,2370]], baby_pig:[[2990,315],[90,1525],[1500,2140],[510,675],[700,2160],[3200,2170]],
  sheep:[[1040,2390],[1280,2460],[820,2310],[1860,2440]], goat:[[2200,1390],[2080,1290],[1460,2470],[930,2250]], donkey:[[760,2380],[1740,2520],[3420,2260],[2050,2440]],
  cow:[[510,2380],[920,2490],[1410,2400],[1820,2510]], chicken:[[1120,2220],[1350,2280],[620,1510],[510,760],[820,920]], goose:[[2660,760],[2665,1340],[2690,2020],[2100,2320],[3700,2390]],
  frog:[[2050,2270],[2200,2380],[1460,1220],[1230,1190]], squirrel:[[2240,1120],[2370,1210],[1160,1050],[540,1470],[3000,340]], deer:[[2290,1330],[2160,1440],[430,2260],[1850,2500],[4070,2000]],
  owl:[[2320,1060],[2190,1240],[540,300],[3980,440]], bee:[[1250,1130],[1450,1190],[1180,2230],[1510,2280],[3200,310]], butterfly:[[1100,1260],[1510,1150],[1980,2290],[430,1510],[3040,390]],
  mouse:[[1120,2180],[1510,2220],[720,930],[2940,850],[3900,700]], snail:[[1090,2310],[1430,2370],[1990,2440],[1280,1310]], fish:[[2660,470],[2650,1080],[2670,1580],[2690,2120],[2700,2490]],
  pigeon:[[450,810],[700,820],[3790,330],[2960,560],[3500,900]], turtle:[[2660,1240],[2680,1900],[2690,2320],[2130,2360]], pony:[[700,2450],[1550,2480],[1930,2460],[320,2290]],
  chinchilla:[[430,2320],[620,2440]], meerkat:[[520,2240],[760,2400]], fennec_fox:[[360,2470],[820,2320]], macaw:[[480,2180],[700,2510]], baby_triceratops:[[600,2380],[360,2260]],
});

export const WATER_SPECIES = Object.freeze(new Set(waterSpeciesIds));
export const AERIAL_SPECIES = Object.freeze(new Set(aerialSpeciesIds));
export const SHOP_ONLY_SPECIES = Object.freeze(new Set(["chinchilla","meerkat","fennec_fox","macaw","baby_triceratops"]));
export const TERRITORY_RADII = Object.freeze({cat:135,dog:175,rabbit:155,hedgehog:100,duck:170,raccoon:145,fox:220,crow:235,songbird:215,wolf:260,sea_otter:190,beaver:185,capybara:195,baby_pig:155,sheep:150,goat:175,donkey:190,cow:165,chicken:120,goose:175,frog:105,squirrel:190,deer:240,owl:230,bee:120,butterfly:145,mouse:95,snail:65,fish:210,pigeon:210,turtle:115,pony:210,chinchilla:110,meerkat:140,fennec_fox:180,macaw:210,baby_triceratops:185});

export const RARE_ANIMAL_ENCOUNTERS = Object.freeze({
  wolf:Object.freeze({periodDays:6,offsetDay:2,startMinute:360,durationMinutes:180,entryMinutes:32,exitMinutes:36,forest:Object.freeze([4160,1660]),town:Object.freeze([3900,1660]),runMultiplier:1.65,replayDelayMinutes:10,arrivalMessage:"🌲 Something large is stirring near the eastern woods…"}),
  sea_otter:Object.freeze({periodDays:7,offsetDay:4,startMinute:660,durationMinutes:190,entryMinutes:34,exitMinutes:38,forest:Object.freeze([2720,2780]),town:Object.freeze([2680,2500]),runMultiplier:1.55,replayDelayMinutes:10,arrivalMessage:"🌊 A rare splash echoes from the southern river reeds…"}),
  beaver:Object.freeze({periodDays:8,offsetDay:2,startMinute:510,durationMinutes:210,entryMinutes:34,exitMinutes:38,forest:Object.freeze([2600,20]),town:Object.freeze([2650,300]),runMultiplier:1.55,replayDelayMinutes:10,arrivalMessage:"🪵 Fresh wood chips and a broad tail splash appear in the upper river…"}),
  capybara:Object.freeze({periodDays:8,offsetDay:6,startMinute:750,durationMinutes:210,entryMinutes:34,exitMinutes:38,forest:Object.freeze([2720,2780]),town:Object.freeze([2690,2500]),runMultiplier:1.5,replayDelayMinutes:10,arrivalMessage:"🌿 A remarkably calm rare visitor is swimming up from the southern reeds…"}),
  baby_pig:Object.freeze({periodDays:5,offsetDay:3,startMinute:480,durationMinutes:210,entryMinutes:28,exitMinutes:34,forest:Object.freeze([35,1515]),town:Object.freeze([185,1515]),runMultiplier:1.75,replayDelayMinutes:10,arrivalMessage:"🌳 The western forest edge is rustling with tiny footsteps…"}),
});

const wildTemplates = [
  ["animal-cat-1","cat","Marmalade","Bold",0xd68b43,0xf1c078],["animal-cat-2","cat","Misty","Quiet",0x858a8d,0xd9d9d2],["animal-cat-3","cat","Patches","Independent",0xf3e7cf,0x654d3e],
  ["animal-dog-1","dog","Bramble","Playful",0x9c6b42,0xead0a6],["animal-dog-2","dog","Pip","Loyal",0xd9c198,0x5e4939],
  ["animal-rabbit-1","rabbit","Clover","Gentle",0xc8b39c,0xf0dfd2],["animal-rabbit-2","rabbit","Thistle","Shy",0x8b8177,0xd5c9bd],["animal-rabbit-3","rabbit","Dandelion","Curious",0xefe3c6,0xc89762],
  ["animal-hedgehog-1","hedgehog","Button","Sleepy",0x795d48,0xc79d72],["animal-hedgehog-2","hedgehog","Hazel","Cautious",0x6b5041,0xb98c65],
  ["animal-duck-1","duck","Puddle","Cheerful",0xede7c9,0xe6a548],["animal-duck-2","duck","Reed","Calm",0x6e8d69,0xd7b34d],["animal-duck-3","duck","Pebble","Sociable",0x8b7968,0xd99a43],
  ["animal-raccoon-1","raccoon","Bandit","Clever",0x777b7a,0x30383a],["animal-raccoon-2","raccoon","Mochi","Mischievous",0x8c8b84,0x343638],
  ["animal-fox-1","fox","Ember","Watchful",0xc96332,0xf0d0aa],["animal-fox-2","fox","Fern","Patient",0xa95534,0xe7bf93],
  ["animal-crow-1","crow","Inky","Clever",0x252c32,0x6a7180],["animal-crow-2","crow","Rook","Observant",0x34383d,0x777f8a],
  ["animal-songbird-1","songbird","Bluebell","Bright",0x5e8fb0,0xe4b955],["animal-songbird-2","songbird","Robin","Brave",0x8a6750,0xd66543],["animal-songbird-3","songbird","Wren","Lively",0x9a7956,0xe2c28a],
  ["animal-wolf-1","wolf","Luna","Elusive",0x68727a,0xd5d7d2],["animal-sea-otter-1","sea_otter","Ripple","Playful but wary",0x6f5543,0xd9bd92],["animal-beaver-1","beaver","Willow","Industrious and wary",0x795a3e,0xc79a66],
  ["animal-capybara-1","capybara","Marlow","Serene and sociable",0x9b6f4d,0xd2ae7f],["animal-baby-pig-1","baby_pig","Truffle","Sweet and skittish",0xe5a4a3,0xf2c3bd],
  ["animal-sheep-1","sheep","Cloud","Gentle",0xf4ead2,0xb79b83],["animal-goat-1","goat","Nettle","Adventurous",0xd8d0c2,0x735f55],["animal-donkey-1","donkey","Biscuit","Patient",0x938178,0xd9c6ae],
  ["animal-cow-1","cow","Daisy","Peaceful",0xf3ead9,0x655b58],["animal-chicken-1","chicken","Peck","Busy",0xf3eee0,0xd95e4e],["animal-goose-1","goose","Waddle","Proud",0xf1eee0,0xe19a35],
  ["animal-frog-1","frog","Moss","Bouncy",0x54a84e,0xbde5a1],["animal-squirrel-1","squirrel","Acorn","Energetic",0xb8733f,0xf0c48b],["animal-deer-1","deer","Fawn","Graceful",0xb8794f,0xf1d0a6],
  ["animal-owl-1","owl","Tuppence","Wise",0x9b785b,0xead7b4],["animal-bee-1","bee","Bumble","Cheerful",0xe9a92f,0x6b4933],["animal-butterfly-1","butterfly","Flutter","Dreamy",0xef7f7d,0x73c9c2],
  ["animal-mouse-1","mouse","Pipkin","Timid",0xb9aaa0,0xefd2c4],["animal-snail-1","snail","Mallow","Determined",0xb58b61,0xd16e4f],["animal-fish-1","fish","Minnow","Shimmering",0x4d8794,0x9ed1c8],
  ["animal-pigeon-1","pigeon","Pebbles","Sociable",0x647b83,0xb5ccd0],["animal-turtle-1","turtle","Shelly","Calm",0x668c53,0xb7b16a],["animal-pony-1","pony","Chestnut","Friendly",0xa96c48,0xf0c18e],
];

const shopTemplates = [
  ["pet-dog-labrador","dog","Sunny","Warm, bouncy and people-focused",0xc99a4d,0xf1d195,"labrador","pet-labrador"],
  ["pet-dog-spaniel","dog","Poppy","Affectionate and inquisitive",0xa8673f,0xefd0a2,"spaniel","pet-spaniel"],
  ["pet-dog-dachshund","dog","Pretzel","Brave, funny and determined",0x9b5935,0xdba578,"dachshund","pet-dachshund"],
  ["pet-dog-corgi","dog","Biscuit","Bright and sociable",0xd57e35,0xfff1cf,"corgi","pet-corgi"],
  ["pet-dog-border-collie","dog","Scout","Focused and energetic",0x2e3434,0xf4f0df,"border-collie","pet-border-collie"],
  ["pet-dog-husky","dog","Nova","Expressive and adventurous",0x77848c,0xedf2ef,"husky","pet-husky"],
  ["pet-chinchilla","chinchilla","Dusty","Gentle and observant",0x9ba0a2,0xe0ded7,null,"pet-chinchilla"],
  ["pet-meerkat","meerkat","Tango","Alert and endlessly curious",0xb88b58,0xead1a2,null,"pet-meerkat"],
  ["pet-fennec","fennec_fox","Sahara","Quick, shy and playful",0xe0ad68,0xfff0cf,null,"pet-fennec"],
  ["pet-macaw","macaw","Rio","Clever, colourful and talkative",0x2d86ad,0xefbd3f,null,"pet-macaw"],
  ["pet-baby-triceratops","baby_triceratops","Sprout","Ancient, sturdy and surprisingly cuddly",0x76a567,0xc8d99b,null,"pet-baby-triceratops"],
];

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

function nearestRiverPoint(x, y) {
  let best = {x:RIVER_PATH[0][0],y:RIVER_PATH[0][1],distance:Number.POSITIVE_INFINITY};
  for (let index = 1; index < RIVER_PATH.length; index += 1) {
    const [ax,ay] = RIVER_PATH[index - 1];
    const [bx,by] = RIVER_PATH[index];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const amount = lengthSquared ? clamp(((x - ax) * dx + (y - ay) * dy) / lengthSquared,0,1) : 0;
    const qx = ax + dx * amount;
    const qy = ay + dy * amount;
    const distance = Math.hypot(x - qx,y - qy);
    if (distance < best.distance) best = {x:qx,y:qy,distance};
  }
  return best;
}

const staticAnimalObstacles = TOWN_LOGICAL_GEOMETRY.navigationObstacles;

function groundPointBlocked(x, y) {
  if (x < 18 || x > WORLD.width - 18 || y < 18 || y > WORLD.height - 18) return true;
  if (nearestRiverPoint(x,y).distance < 96) return true;
  return staticAnimalObstacles.some(obstacle => x >= obstacle.x - 18 && x <= obstacle.x + obstacle.width + 18 && y >= obstacle.y - 18 && y <= obstacle.y + obstacle.height + 18);
}

export function groundAnimalSegmentBlocked(from, to, spacing = 4) {
  const count = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / spacing));
  for (let index = 0; index <= count; index += 1) {
    const amount = index / count;
    if (groundPointBlocked(from.x + (to.x - from.x) * amount, from.y + (to.y - from.y) * amount)) return true;
  }
  return false;
}

function safeGroundPoint(id, x, y, maxSearch = 180) {
  if (!groundPointBlocked(x,y)) return {x,y};
  const seed = [...id].reduce((sum, character) => sum + character.charCodeAt(0),0);
  const base = seed % 360 * Math.PI / 180;
  for (let radius = 22; radius <= maxSearch; radius += 18) {
    for (let step = 0; step < 20; step += 1) {
      const angle = base + step * Math.PI * 2 / 20;
      const candidate = {x:clamp(x + Math.cos(angle) * radius,18,WORLD.width - 18),y:clamp(y + Math.sin(angle) * radius,18,WORLD.height - 18)};
      if (!groundPointBlocked(candidate.x,candidate.y)) return candidate;
    }
  }
  for (let gridY = 18; gridY <= WORLD.height - 18; gridY += 36) {
    for (let gridX = 18; gridX <= WORLD.width - 18; gridX += 36) {
      if (!groundPointBlocked(gridX, gridY)) return { x: gridX, y: gridY };
    }
  }
  throw new RangeError(`No safe logical ground point exists for ${id}.`);
}

function safeGroundRoutePoint(id, initial, ideal, radius) {
  const seed = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const candidates = [safeGroundPoint(id, ideal.x, ideal.y, Math.min(180, radius + 70))];
  for (let ring = radius; ring >= 18; ring -= 18) {
    for (let step = 0; step < 24; step += 1) {
      const angle = (seed % 360) * Math.PI / 180 + step * Math.PI * 2 / 24;
      candidates.push({
        x: clamp(initial.x + Math.cos(angle) * ring, 18, WORLD.width - 18),
        y: clamp(initial.y + Math.sin(angle) * ring * .72, 18, WORLD.height - 18),
      });
    }
  }
  return candidates.find((candidate) => !groundPointBlocked(candidate.x, candidate.y) && !groundAnimalSegmentBlocked(initial, candidate)) || initial;
}

function territoryRoute(speciesId, anchor, index) {
  const radius = TERRITORY_RADII[speciesId] || 160;
  if (WATER_SPECIES.has(speciesId)) {
    const riverAnchor = nearestRiverPoint(anchor[0],anchor[1]);
    return Object.freeze([-radius,-radius * .48,0,radius * .48,radius].map(offset => {
      const point = nearestRiverPoint(riverAnchor.x,clamp(riverAnchor.y + offset,24,WORLD.height - 24));
      return Object.freeze({x:Math.round(point.x),y:Math.round(point.y)});
    }));
  }
  const seed = [...`${speciesId}-${index}`].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const initial = AERIAL_SPECIES.has(speciesId) ? {x:anchor[0],y:anchor[1]} : safeGroundPoint(`${speciesId}-${index}`,anchor[0],anchor[1],Math.min(220,radius + 80));
  const points = [[initial.x,initial.y]];
  for (let step = 0; step < 6; step += 1) {
    const angle = (seed % 360) * Math.PI / 180 + step * Math.PI * 2 / 6;
    const distance = radius * (.48 + ((seed + step * 19) % 28) / 100);
    const ideal = {x:clamp(initial.x + Math.cos(angle) * distance,18,WORLD.width - 18),y:clamp(initial.y + Math.sin(angle) * distance * .72,18,WORLD.height - 18)};
    const candidate = AERIAL_SPECIES.has(speciesId) ? ideal : safeGroundRoutePoint(`${speciesId}-${index}-${step}`, initial, ideal, radius);
    points.push([candidate.x,candidate.y]);
    if (!AERIAL_SPECIES.has(speciesId)) points.push([initial.x,initial.y]);
  }
  return Object.freeze(points.map(([x,y]) => Object.freeze({ x: Math.round(x), y: Math.round(y) })));
}

function definitionFromWild(template, index) {
  const [id,speciesId,name,personality,color,accent] = template;
  const habitats = ANIMAL_HABITATS[speciesId];
  const anchor = RARE_ANIMAL_ENCOUNTERS[speciesId]?.town || habitats[index % habitats.length];
  const route = territoryRoute(speciesId,anchor,index);
  return Object.freeze({ id,species:speciesId,name,personality,color,accent,initialTrust:8 + (index * 7) % 21,shopPet:false,rare:Boolean(ANIMAL_SPECIES[speciesId].rare),water:WATER_SPECIES.has(speciesId),aerial:AERIAL_SPECIES.has(speciesId),habitatAnchor:Object.freeze({...route[0]}),route });
}

function definitionFromShop(template, index) {
  const [id,speciesId,name,personality,color,accent,breedId,petShopSku] = template;
  const anchor = ANIMAL_HABITATS[speciesId][index % ANIMAL_HABITATS[speciesId].length];
  const route = territoryRoute(speciesId,anchor,index);
  return Object.freeze({ id,species:speciesId,name,personality,color,accent,initialTrust:100,shopPet:true,breedId,petShopSku,rare:false,water:WATER_SPECIES.has(speciesId),aerial:AERIAL_SPECIES.has(speciesId),habitatAnchor:Object.freeze({...route[0]}),route });
}

export const WILDLIFE_DEFINITIONS = Object.freeze(wildTemplates.map(definitionFromWild));
export const SHOP_PET_DEFINITIONS = Object.freeze(shopTemplates.map(definitionFromShop));
export const ANIMAL_DEFINITIONS = Object.freeze([...WILDLIFE_DEFINITIONS,...SHOP_PET_DEFINITIONS]);
export const ANIMAL_BY_ID = Object.freeze(Object.fromEntries(ANIMAL_DEFINITIONS.map(animal => [animal.id,animal])));

export function speciesFor(animalOrId) {
  const definition = typeof animalOrId === "string" ? ANIMAL_BY_ID[animalOrId] : animalOrId;
  return definition ? ANIMAL_SPECIES[definition.species] : null;
}

export function adoptionRulesFor(animalOrId) { return speciesFor(animalOrId)?.rare ? ADOPTION_RULES.rare : ADOPTION_RULES.common; }

export function adoptionChance(animalState, animalDefinition = ANIMAL_BY_ID[animalState?.id]) {
  if (!animalState || !animalDefinition || animalDefinition.shopPet) return 0;
  const rules = adoptionRulesFor(animalDefinition);
  return Math.min(.95,speciesFor(animalDefinition).chance + animalState.trust * rules.trustMultiplier + animalState.failedRequests * rules.failedRequestBonus);
}

const scheduledRareStart = (config, day) => (day - 1) * 1440 + config.startMinute;

export function rareVisitState(definition, world, resident = null) {
  const config = RARE_ANIMAL_ENCOUNTERS[definition?.species];
  if (!config) return { rare:false,active:true,phase:"normal",source:"schedule" };
  if (resident?.adopted) return { rare:true,active:true,phase:"companion",source:"companion" };
  const absolute = absoluteWorldMinute(world);
  const replayStart = resident?.rareReplayStartAbsoluteMinute;
  if (Number.isInteger(replayStart) && absolute >= replayStart && absolute < replayStart + config.durationMinutes) {
    const elapsed = absolute - replayStart;
    return {rare:true,active:true,phase:elapsed < config.entryMinutes ? "entering" : elapsed >= config.durationMinutes - config.exitMinutes ? "returning" : "visiting",source:"offline-replay",startAbsoluteMinute:replayStart,elapsed};
  }
  const scheduled = ((world.day - config.offsetDay) % config.periodDays + config.periodDays) % config.periodDays === 0;
  const elapsed = world.clockMinutes - config.startMinute;
  const active = scheduled && elapsed >= 0 && elapsed < config.durationMinutes;
  return {rare:true,active,phase:!active ? "away" : elapsed < config.entryMinutes ? "entering" : elapsed >= config.durationMinutes - config.exitMinutes ? "returning" : "visiting",source:"scheduled",startAbsoluteMinute:scheduledRareStart(config,world.day),elapsed};
}

export function townWelcomesWildlife(environment) {
  return ["cared-for", "calm"].includes(environment?.cleanliness?.band);
}

function riverSectionPollution(environment, sectionId) {
  const items = (environment?.river?.items || []).filter((item) => item.sectionId === sectionId);
  const stuck = items.filter((item) => item.status === "stuck").length;
  if (stuck >= 3 || items.length >= 7) return 3;
  if (stuck >= 2 || items.length >= 5) return 2;
  if (stuck >= 1 || items.length >= 3) return 1;
  return 0;
}

export function animalEnvironmentBonus(definition, state) {
  if (!definition) return 0;
  if (!WATER_SPECIES.has(definition.species)) return townWelcomesWildlife(state?.environment) ? 2 : 0;
  const pollution = RIVER_SECTIONS.reduce((sum, section) => sum + riverSectionPollution(state?.environment, section.id), 0) / Math.max(1, RIVER_SECTIONS.length);
  return pollution < 1.5 ? 2 : 0;
}

export function animalScheduleVisible(definition, world, resident = null, environment = null) {
  if (!definition || definition.shopPet) return Boolean(resident?.adopted);
  if (resident?.adopted) return true;
  if (speciesFor(definition)?.rare) return rareVisitState(definition,world,resident).active;
  const hour = world.clockMinutes / 60;
  const schedule = speciesFor(definition)?.schedule;
  const welcoming = townWelcomesWildlife(environment);
  if (schedule === "all") return true;
  if (schedule === "night") return hour >= (welcoming ? 18 : 19) || hour < (welcoming ? 7 : 6.5);
  if (schedule === "crepuscular") return hour < (welcoming ? 10 : 9) || hour >= (welcoming ? 16.5 : 17.5);
  return hour >= (welcoming ? 5.5 : 6) && hour < (welcoming ? 21 : 20.5);
}

function hashUnit(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000003) / 1000003;
}

function weightedChoice(candidates, key) {
  if (candidates.length === 0) return null;
  const weights = candidates.map(definition => Math.max(.035, Math.pow(speciesFor(definition)?.chance || .1, 1.55)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = hashUnit(key) * total;
  for (let index = 0; index < candidates.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return candidates[index];
  }
  return candidates.at(-1);
}

function routeWaitMinutes(definition, routeIndex) {
  if (["fox", "wolf"].includes(definition?.species)) return 3.8;
  if (["songbird", "crow"].includes(definition?.species)) return 0.9;
  return 1.6 + (routeIndex % 3) * 0.7;
}

function routeMotionState(routePoints, absoluteMinute, speed, offset = 0, definition = null) {
  if (!routePoints?.length) return { position: { x: 0, y: 0 }, routeIndex: 0, wait: 0, phase: "idle" };
  if (routePoints.length === 1) return { position: { ...routePoints[0] }, routeIndex: 0, wait: 0, phase: "idle" };
  const segments = routePoints.map((from, routeIndex) => {
    const to = routePoints[(routeIndex + 1) % routePoints.length];
    const travel = Math.max(0.35, Math.hypot(to.x - from.x, to.y - from.y) / Math.max(1, speed));
    const wait = routeWaitMinutes(definition, routeIndex);
    return { from, to, routeIndex, travel, wait, duration: travel + wait };
  });
  const cycle = segments.reduce((sum, segment) => sum + segment.duration, 0);
  let cursor = ((absoluteMinute + offset * WILDLIFE_ROTATION.slotDurationMinutes) % cycle + cycle) % cycle;
  for (const segment of segments) {
    if (cursor <= segment.travel) {
      const fraction = clamp(cursor / segment.travel, 0, 1);
      return {
        position: {
          x: Math.round((segment.from.x + (segment.to.x - segment.from.x) * fraction) * 10) / 10,
          y: Math.round((segment.from.y + (segment.to.y - segment.from.y) * fraction) * 10) / 10,
        },
        routeIndex: segment.routeIndex,
        wait: 0,
        phase: "moving",
      };
    }
    cursor -= segment.travel;
    if (cursor <= segment.wait) return { position: { ...segment.to }, routeIndex: (segment.routeIndex + 1) % routePoints.length, wait: Math.round((segment.wait - cursor) * 10) / 10, phase: "waiting" };
    cursor -= segment.wait;
  }
  return { position: { ...routePoints[0] }, routeIndex: 0, wait: 0, phase: "idle" };
}

function positionOnRoute(routePoints, absoluteMinute, speed, offset = 0, definition = null) {
  return routeMotionState(routePoints, absoluteMinute, speed, offset, definition).position;
}

function placedObjectRadius(object) {
  return Math.max(18, Number(object?.hooks?.wildlifeObstacle?.radius) || 30);
}

function pointBlockedByPlacements(point, objects) {
  return (objects || []).some((object) => Math.hypot(point.x - Number(object.x), point.y - Number(object.y)) < placedObjectRadius(object));
}

function avoidPlacedObjects(definition, point, objects) {
  if (!point || definition?.aerial || definition?.water || !pointBlockedByPlacements(point, objects)) return point;
  const seed = Math.floor(hashUnit(`${definition.id}:${Math.round(point.x)}:${Math.round(point.y)}`) * 360);
  for (let radius = 26; radius <= 150; radius += 18) {
    for (let step = 0; step < 20; step += 1) {
      const angle = (seed + step * 18) * Math.PI / 180;
      const candidate = { x: clamp(point.x + Math.cos(angle) * radius, 18, WORLD.width - 18), y: clamp(point.y + Math.sin(angle) * radius, 18, WORLD.height - 18) };
      if (!groundPointBlocked(candidate.x, candidate.y) && !pointBlockedByPlacements(candidate, objects)) return candidate;
    }
  }
  return point;
}

export function wildlifeEnvironmentResponse(definition, world) {
  const metadata = speciesFor(definition);
  const currentWeather = world.weather?.current || world.current || {};
  const weather = currentWeather.kind || (typeof world.weather === "string" ? world.weather : "clear");
  const season = currentWeather.season || world.season || "spring";
  let activityMultiplier = 1;
  let behavior = "foraging";

  if (AERIAL_SPECIES.has(definition.species)) {
    behavior = "flying";
    if (weather === "windy") { activityMultiplier *= .68; behavior = "riding the breeze"; }
    if (weather === "rain") { activityMultiplier *= .62; behavior = "sheltering from rain"; }
    if (weather === "snow") { activityMultiplier *= .48; behavior = "sheltering from snow"; }
  } else if (WATER_SPECIES.has(definition.species)) {
    behavior = "swimming";
    if (weather === "rain") { activityMultiplier *= 1.14; behavior = "playing in the rain"; }
    if (weather === "snow") { activityMultiplier *= .72; behavior = "keeping near shelter"; }
  } else if (weather === "rain") {
    activityMultiplier *= .82;
    behavior = "seeking dry cover";
  } else if (weather === "snow") {
    activityMultiplier *= .74;
    behavior = "padding through the snow";
  } else if (weather === "windy") {
    activityMultiplier *= .9;
    behavior = "sniffing the wind";
  }

  if ((definition.species === "bee" || definition.species === "butterfly") && season === "winter") activityMultiplier *= .38;
  if (["bee","butterfly","songbird","frog"].includes(definition.species) && season === "spring") activityMultiplier *= 1.12;
  if (["squirrel","mouse","raccoon"].includes(definition.species) && season === "autumn") activityMultiplier *= 1.12;
  if (["wolf","fox","owl"].includes(definition.species) && season === "winter") activityMultiplier *= 1.08;

  return Object.freeze({
    weather,
    season,
    behavior,
    activityMultiplier: Math.round(activityMultiplier * 1000) / 1000,
    water: WATER_SPECIES.has(definition.species),
    aerial: AERIAL_SPECIES.has(definition.species),
    schedule: metadata?.schedule || "day",
  });
}

function animationPresentation(definition, environment, position, previousPosition) {
  const metadata = speciesFor(definition);
  const movingLeft = position.x < previousPosition.x;
  const cadence = Math.max(.35, (metadata?.speed || 18) / 18 * environment.activityMultiplier);
  const elevation = metadata?.motion === "flutter" ? 28 + Math.round(hashUnit(definition.id) * 26) : 0;
  return Object.freeze({
    family: metadata?.family || "small-mammal",
    size: metadata?.size || 1,
    motion: metadata?.motion || "walk",
    cadence,
    facing: movingLeft ? "left" : "right",
    elevation,
    water: environment.water,
    aerial: environment.aerial,
  });
}

function rareEncounterPosition(definition, visit, absoluteMinute, speed, offset = 0) {
  const config = RARE_ANIMAL_ENCOUNTERS[definition.species];
  if (!config) return positionOnRoute(definition.route,absoluteMinute,speed,offset,definition);
  const forestPoint = WATER_SPECIES.has(definition.species) ? nearestRiverPoint(config.forest[0],config.forest[1]) : {x:config.forest[0],y:config.forest[1]};
  const forest = {x:Math.round(forestPoint.x),y:Math.round(forestPoint.y)};
  // Rare-arrival endpoints are protected gameplay locations, not visual route
  // anchors. Keep the authored encounter contract exact even when a normal
  // habitat route is adjusted around logical obstacles.
  const town = { x: config.town[0], y: config.town[1] };
  if (!visit.active) return forest;
  if (visit.phase === "entering") {
    const amount = clamp(visit.elapsed / config.entryMinutes,0,1);
    return {x:Math.round((forest.x + (town.x - forest.x) * amount) * 10) / 10,y:Math.round((forest.y + (town.y - forest.y) * amount) * 10) / 10};
  }
  if (visit.phase === "returning") {
    const amount = clamp((visit.elapsed - (config.durationMinutes - config.exitMinutes)) / config.exitMinutes,0,1);
    return {x:Math.round((town.x + (forest.x - town.x) * amount) * 10) / 10,y:Math.round((town.y + (forest.y - town.y) * amount) * 10) / 10};
  }
  return positionOnRoute(definition.route,absoluteMinute,speed,offset,definition);
}

export function activeRareVisitor(animalState, world, environmentState = null) {
  const residents = animalState?.residents || {};
  return WILDLIFE_DEFINITIONS
    .filter(definition => speciesFor(definition)?.rare && !residents[definition.id]?.adopted)
    .map(definition => ({
      definition,
      visit: rareVisitState(definition,world,residents[definition.id]),
    }))
    .filter(({definition,visit}) => visit.active && animalScheduleVisible(definition,world,residents[definition.id],environmentState))
    .sort((left,right) => {
      const leftReplay = left.visit.source === "offline-replay" ? 0 : 1;
      const rightReplay = right.visit.source === "offline-replay" ? 0 : 1;
      return leftReplay - rightReplay
        || left.visit.startAbsoluteMinute - right.visit.startAbsoluteMinute
        || left.definition.id.localeCompare(right.definition.id);
    })[0] || null;
}

export function worldAnimalPresentations(animalState, world, context = {}) {
  const residents = animalState?.residents || {};
  const environmentState = context?.environment || null;
  const placedObjects = context?.townPlacement?.objects || [];
  const absolute = absoluteWorldMinute(world);
  const adopted = ANIMAL_DEFINITIONS.filter(definition => residents[definition.id]?.adopted);
  const regularCandidates = WILDLIFE_DEFINITIONS.filter(definition => {
    const resident = residents[definition.id];
    return !speciesFor(definition)?.rare && !resident?.adopted && animalScheduleVisible(definition,world,resident,environmentState);
  }).sort((left,right) => left.id.localeCompare(right.id));
  const roster = [];
  const usedSpecies = new Set(adopted.map(definition => definition.species));
  for (let selection = 0; selection < WILDLIFE_ROTATION.baseVisible && regularCandidates.length > 0; selection += 1) {
    const available = regularCandidates.filter(definition => !roster.includes(definition) && !usedSpecies.has(definition.species));
    const epoch = Math.floor((absolute - selection * WILDLIFE_ROTATION.slotStaggerMinutes) / WILDLIFE_ROTATION.slotDurationMinutes);
    const chosen = weightedChoice(available, `wildlife:${world.day}:${selection}:${epoch}`);
    if (!chosen) break;
    roster.push(chosen);
    usedSpecies.add(chosen.species);
  }

  const rareVisitor = activeRareVisitor(animalState,world,environmentState);
  if (rareVisitor && roster.length < WILDLIFE_ROTATION.maxVisible) roster.push(rareVisitor.definition);

  const visibleIds = new Set([...roster,...adopted].map(definition => definition.id));
  return ANIMAL_DEFINITIONS
    .filter(definition => !definition.shopPet || residents[definition.id]?.adopted)
    .map((definition,index) => {
      const resident = residents[definition.id];
      const environment = wildlifeEnvironmentResponse(definition,world);
      const route = resident?.adopted ? SOUTH_MEADOW.route : definition.route;
      const speed = (speciesFor(definition)?.speed || 18) * environment.activityMultiplier;
      const rareVisit = rareVisitState(definition,world,resident);
      const routeOffset = index * WILDLIFE_ROTATION.slotStaggerMinutes / WILDLIFE_ROTATION.slotDurationMinutes;
      const following = Boolean(resident?.active);
      const rawPosition = following
        ? null
        : !resident?.adopted && rareVisit.rare
          ? rareEncounterPosition(definition,rareVisit,absolute,speed,routeOffset)
          : positionOnRoute(route,absolute,speed,routeOffset,definition);
      const rawPreviousPosition = following
        ? null
        : !resident?.adopted && rareVisit.rare
          ? rareEncounterPosition(definition,{...rareVisit,elapsed:rareVisit.elapsed - .1},absolute - .1,speed,routeOffset)
          : positionOnRoute(route,absolute - .1,speed,routeOffset,definition);
      const position = avoidPlacedObjects(definition,rawPosition,placedObjects);
      const previousPosition = avoidPlacedObjects(definition,rawPreviousPosition,placedObjects);
      const animation = following
        ? animationPresentation(definition,environment,{x:1,y:0},{x:0,y:0})
        : animationPresentation(definition,environment,position,previousPosition);
      const visible = Boolean(resident?.adopted || visibleIds.has(definition.id));
      const depth = !position ? 300 : environment.aerial ? 620 + position.y / 100 : environment.water ? 130 + position.y / 20 : 180 + position.y / 10;
      const motionState = following ? { routeIndex: 0, wait: 0, phase: "following" } : routeMotionState(route,absolute,speed,routeOffset,definition);
      return Object.freeze({
        id: definition.id,
        definition,
        resident,
        state: resident,
        visible,
        interactionReady: visible && !following,
        location: following ? "following" : resident?.adopted ? SOUTH_MEADOW.id : "wild",
        position,
        environment,
        animation,
        motionState: Object.freeze(motionState),
        homeSlot: resident?.adopted ? adopted.findIndex((candidate) => candidate.id === definition.id) : -1,
        rareVisit,
        depth,
      });
    });
}

export function missedRareEncounter(animalState, fromAbsoluteMinute, toAbsoluteMinute) {
  if (!Number.isFinite(fromAbsoluteMinute) || !Number.isFinite(toAbsoluteMinute) || toAbsoluteMinute <= fromAbsoluteMinute) return null;
  let latest = null;
  for (const definition of WILDLIFE_DEFINITIONS.filter(candidate => speciesFor(candidate)?.rare)) {
    const resident = animalState?.residents?.[definition.id];
    if (resident?.adopted) continue;
    const config = RARE_ANIMAL_ENCOUNTERS[definition.species];
    const replayStart = resident?.rareReplayStartAbsoluteMinute;
    if (Number.isInteger(replayStart) && replayStart >= fromAbsoluteMinute && replayStart + config.durationMinutes <= toAbsoluteMinute) {
      latest = Object.freeze({definition,startAbsoluteMinute:replayStart,endAbsoluteMinute:replayStart + config.durationMinutes,config,source:"replay"});
    }
    const firstDay = Math.max(1,Math.floor(fromAbsoluteMinute / 1440) + 1);
    const lastDay = Math.max(firstDay,Math.floor(toAbsoluteMinute / 1440) + 1);
    for (let day = firstDay; day <= lastDay; day += 1) {
      const scheduled = ((day - config.offsetDay) % config.periodDays + config.periodDays) % config.periodDays === 0;
      if (!scheduled) continue;
      const start = scheduledRareStart(config,day);
      const end = start + config.durationMinutes;
      if (start >= fromAbsoluteMinute && end <= toAbsoluteMinute && (!latest || end > latest.endAbsoluteMinute)) {
        latest = Object.freeze({definition,startAbsoluteMinute:start,endAbsoluteMinute:end,config,source:"scheduled"});
      }
    }
  }
  return latest;
}
