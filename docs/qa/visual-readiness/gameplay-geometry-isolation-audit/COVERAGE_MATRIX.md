# Gameplay Geometry Isolation Coverage Matrix

| Area | Status | Evidence | Main risk / required action |
| --- | --- | --- | --- |
| Player collisions | PASS | `TownScene.isBlocked`; fixed radius 17; no texture-body creation | Keep logical radius independent of player art |
| NPC pointer collision/hit area | PASS | explicit `42×66` container | Preserve when sprites replace procedural children |
| NPC world navigation | FAIL | 1/138 static links enters Paws & Wonders; no runtime collision query | Validate edges and dynamic obstacles |
| Animal pointer hit area | PASS | explicit `52×54` container | Keep interaction state separate from render alpha |
| Animal ground movement | FAIL | 20/481 sampled segments; 5 affected definitions | Segment-clear route generation |
| Water-animal movement | PASS | 0 off-river route-point violations | Add continuous segment check during repair |
| Player-placed objects | PARTIAL | logical footprints protect player/wildlife | NPC routes ignore them |
| Building collisions | FAIL | house visual scale creates collision | Separate house visual and geometry state |
| Entrances / doors / exits | PARTIAL | explicit points/radii exist | Many are derived from house/shop visual rectangles |
| Town shops and venues | FAIL | visual rectangle is also selection/collision source | Separate stable geometry layers |
| Job markers | PASS | explicit marker/approach/radius data | Retain semantic IDs when moved to layouts |
| Town rubbish selection | PASS | explicit interaction coordinates/radii | Keep decorative art non-interactive |
| Waste Collection items | PASS | explicit `105×95` input container | Replace art inside the container only |
| Crops / orchard / placed trees | PASS | farming/town-placement service geometry | Preserve catalogue footprints |
| River interaction | PASS | authored logical river, bridge, and interaction data | Do not infer from bank art |
| Fishing / magnet fishing | PASS | locked water zones and sockets; replacement fixtures pass | Expand same pattern to other scenes |
| Mini-game touch areas | PARTIAL | Lawn/Power Wash pass; House Interior control is 40 px | Enforce 44 px minimum everywhere |
| UI hit targets | PARTIAL | tested profile buttons mostly pass | Add full-scene automated target scan |
| Occlusion / depth | PASS | ground-Y depth policies | Add tree/building replacement integration test |
| Camera bounds | PASS | explicit world bounds | No sprite-size dependency found |
| World bounds | PASS | `WORLD 4200×2800` | Keep art overflow presentation-only |
| Spawn points | PASS | explicit data in world/interior definitions | Validate against independent collision geometry |
| Trigger regions | PARTIAL | explicit radii but some centres derive from display rects | Separate IDs and geometry layers |
| Appliance/counter standing points | OBSERVATION | restaurant games are direct-tap, not walkable | Decide and document intended contract |
| Decorative input interception | PASS | 12 intentional interactive sites; no decorative interceptors found | Add lint/validator allowlist |
| Animated-frame body stability | PASS | no automatic physics bodies; fixed containers/manual collision | Keep frame dimensions out of gameplay |
| Save visual identity | PASS | 0 texture/path/frame fields in fresh save | Add migration regression fixture |
| Missing optional artwork | PARTIAL | Fishing/registry fallback passes | Other scene families not yet layout-migrated |
