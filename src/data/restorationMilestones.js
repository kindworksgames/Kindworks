export const RESTORATION_MILESTONE_SCHEMA_VERSION = 1;
export const RESTORATION_PROCESSED_EVENT_LIMIT = 512;
export const FIRST_RESTORATION_GIFT_ITEM_ID = "town-planter";

export const RESTORATION_MILESTONE_ORDER = Object.freeze([
  "wake",
  "commons",
  "highstreet",
  "river",
  "station",
  "shore",
  "green",
  "festival",
]);

export const RESTORATION_MILESTONES = Object.freeze({
  wake: Object.freeze({
    id: "wake",
    icon: "💦",
    title: "WILLOWMERE IS WAKING UP",
    text: "People are starting to notice the difference.",
    change: "The old town fountain is flowing again, and the village centre feels alive.",
    focus: Object.freeze({ x: 550, y: 1020, zoom: 0.82 }),
    permanentChanges: Object.freeze(["old-market-fountain", "old-market-resident-visits"]),
  }),
  commons: Object.freeze({
    id: "commons",
    icon: "🌳",
    title: "WILLOW COMMONS REOPENS",
    text: "The park is welcoming residents back.",
    change: "Benches are repaired, the playground is brighter, and families are returning to the Commons.",
    focus: Object.freeze({ x: 1570, y: 1215, zoom: 0.76 }),
    permanentChanges: Object.freeze(["commons-benches", "commons-playground", "commons-resident-visits"]),
  }),
  highstreet: Object.freeze({
    id: "highstreet",
    icon: "🏘️",
    title: "HIGH STREET COMES BACK TO LIFE",
    text: "Shutters lift and the town centre gets busy again.",
    change: "Outdoor tables, market displays and brighter shopfronts bring more residents into High Street.",
    focus: Object.freeze({ x: 3260, y: 600, zoom: 0.74 }),
    permanentChanges: Object.freeze(["high-street-tables", "market-displays", "high-street-business-traffic"]),
  }),
  river: Object.freeze({
    id: "river",
    icon: "🐟",
    title: "THE RIVER RETURNS",
    text: "Clearer water is bringing wildlife and residents back.",
    change: "More fish, ducks and riverside visitors now appear along Willow River.",
    focus: Object.freeze({ x: 2650, y: 1180, zoom: 0.73 }),
    permanentChanges: Object.freeze(["river-fish", "river-ducks", "riverside-resident-visits"]),
  }),
  station: Object.freeze({
    id: "station",
    icon: "🎬",
    title: "KINDWORKS CINEMA REOPENS",
    text: "The cinema is lively again.",
    change: "Residents gather to watch real films about the cleanup creators and projects KindWorks supports.",
    focus: Object.freeze({ x: 3890, y: 330, zoom: 0.78 }),
    permanentChanges: Object.freeze(["cinema-open", "cinema-marquee", "cinema-resident-visits"]),
  }),
  shore: Object.freeze({
    id: "shore",
    icon: "🏖️",
    title: "SOUTH SHORE REOPENS",
    text: "The coast is ready for visitors again.",
    change: "Beach tables, umbrellas and harbour activity return to South Shore.",
    focus: Object.freeze({ x: 3720, y: 2440, zoom: 0.72 }),
    permanentChanges: Object.freeze(["shore-tables", "shore-umbrellas", "harbour-activity"]),
  }),
  green: Object.freeze({
    id: "green",
    icon: "🌲",
    title: "WILLOWMERE IS GROWING GREENER",
    text: "The improvements you placed are changing daily life.",
    change: "Residents use your trees, seating and bins more often, and small wildlife appears around restored spaces.",
    focus: Object.freeze({ x: 1570, y: 1215, zoom: 0.7 }),
    permanentChanges: Object.freeze(["placed-object-resident-use", "restored-space-wildlife", "reduced-disorder"]),
  }),
  festival: Object.freeze({
    id: "festival",
    icon: "🎉",
    title: "THE WILLOWMERE FESTIVAL",
    text: "Look what you've helped this town become.",
    change: "Bunting, music and crowds fill the town for Willowmere's first restoration festival.",
    focus: Object.freeze({ x: 1050, y: 1110, zoom: 0.6 }),
    permanentChanges: Object.freeze(["festival-plaque", "festival-memory", "festival-social-response"]),
  }),
});

export function restorationMilestoneDefinition(id) {
  return RESTORATION_MILESTONES[id] || null;
}

