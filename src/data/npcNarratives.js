// Faithful extraction of the authored version-82 narrative catalogue.
// Kept separate from runtime logic so stories remain stable, inspectable data.

export const NPC_NARRATIVE_CONFIG=Object.freeze({schemaVersion:3,storyStageCount:4,recentThoughtLimit:6,seenBeatLimit:64,flagLimit:32,thoughtTextLimit:220,selectedDayLimit:12,stageHistoryLimit:4,progressReasonLimit:160,minStageDayGap:1});
export const NPC_NARRATIVE_STAGES=Object.freeze(["introduction","opening","growth","resolution"]);
export const NPC_STORY_STAGE_REQUIREMENTS=Object.freeze({
  1:Object.freeze({selections:2,selectedDays:2,activities:2,jobs:0,bond:0,restoration:"none"}),
  2:Object.freeze({selections:4,selectedDays:3,activities:8,jobs:6,bond:38,restoration:"relevant"}),
  3:Object.freeze({selections:7,selectedDays:5,activities:18,jobs:18,bond:45,restoration:"town",minDaysSinceAdvance:1})
});
function defineNpcNarrative(traits,ambition,concern,arc,bonds){
  return Object.freeze({traits:Object.freeze([...traits]),ambition,concern,arc:Object.freeze([...arc]),bonds:Object.freeze({...bonds})});
}
export const NPC_NARRATIVE_PROFILES=Object.freeze({
  Maya:defineNpcNarrative(["warm","perceptive"],"Make Corner Café feel like the town's shared morning room.","Long shifts sometimes leave her too busy to notice when a regular needs company.",[
    "Maya keeps a handwritten note of every regular's favourite morning drink.",
    "She starts setting aside a quiet table for residents who look as though they need a gentle start.",
    "A cleaner town centre inspires her to plan a pay-it-forward breakfast with nearby businesses.",
    "Corner Café becomes a dependable gathering place where Maya quietly connects neighbours who can help one another."
  ],{Sam:"They trade first-batch pastries for first-pot coffee and compare notes before sunrise.",Grace:"Grace brings playgroup families to the quiet table, and Maya always keeps crayons nearby.",Ella:"Ella supplies market news with the morning milk delivery, making her Maya's unofficial town bulletin."}),
  Leo:defineNpcNarrative(["patient","weather-wise"],"Keep a careful record of the river and prove fishing can help protect it.","He worries the changing water has driven away a shoal he remembers from childhood.",[
    "Leo begins a small river journal, recording water clarity, birds and every fish he releases.",
    "He compares dock observations with Finn and asks Mia what plants might strengthen the banks.",
    "As rubbish disappears, familiar ripples return to stretches that had gone quiet.",
    "Leo completes a local river guide and teaches younger residents to fish without harming the water."
  ],{Finn:"Finn reads the currents from the dock while Leo reads them from the line; together they notice changes first.",Ben:"The mill's rhythm tells Leo when the river is running differently, so he often checks in with Ben.",Mia:"Mia helps Leo identify riverbank plants, and he brings her notes about where the soil is washing away."}),
  Ava:defineNpcNarrative(["organised","encouraging"],"Create a grocer shelf supplied entirely by Willowmere growers.","She fears ordering mistakes will waste food and disappoint the growers who trusted her.",[
    "Ava begins marking an empty shelf for produce grown within walking distance of the shop.",
    "She asks Noah, Mia and local allotment growers what they can reliably harvest each season.",
    "The first small deliveries sell out, but Ava learns to order carefully instead of filling the shelf too quickly.",
    "Her Willowmere-grown shelf becomes a permanent fixture linking the grocer, orchard and allotments."
  ],{Maya:"Maya tells Ava which ingredients the café needs most and takes surplus before it can be wasted.",Grace:"Grace tests Ava's simple fruit-and-vegetable signs with the playgroup children.",Lily:"Lily helps Ava explain the local-produce idea to residents and places it on the civic noticeboard."}),
  Noah:defineNpcNarrative(["quiet","steadfast"],"Revive an old Willowmere apple variety from the orchard's remaining tree.","He is unsure whether the ageing tree will stay healthy long enough to provide strong new saplings.",[
    "Noah watches the old apple tree closely and labels its healthiest branches.",
    "He and Sofia compare blossom, fruit and seed notes while Max repairs a safe place for young trees.",
    "New player-planted saplings give Noah enough healthy growth to continue the old variety.",
    "The revived apple becomes an orchard tradition, with the first fruit of each harvest saved for the village."
  ],{Sofia:"Sofia understands the orchard's seasons as well as Noah does, though they rarely agree on pruning.",Max:"Max repairs orchard frames and quietly saves straight offcuts for Noah's new saplings.",Ben:"Ben remembers stories about the old apple from mill workers who ate it during harvest season."}),
  Mia:defineNpcNarrative(["practical","generous"],"Turn the community garden into a place where anyone can learn to grow food.","Several tired beds are losing soil, and Mia worries new gardeners will blame themselves.",[
    "Mia starts testing soil from each garden bed and writes plain-language notes beside them.",
    "She asks Rosie for pollinator seeds and Leo for observations about erosion near the river.",
    "Restored beds and cleaner paths let Mia begin short gardening lessons for neighbours.",
    "The garden becomes a teaching space whose harvest is shared between homes, cafés and the grocer."
  ],{Rosie:"Rosie saves seed heads for Mia, while Mia reports which flowers actually thrive outside the shop.",Ruby:"Ruby and Mia coordinate park compost and garden cuttings so almost nothing useful is thrown away.",Leo:"Leo brings riverbank observations that help Mia protect the garden's dampest soil."}),
  Sam:defineNpcNarrative(["inventive","soft-spoken"],"Recreate a beloved Willowmere loaf from an incomplete bakery notebook.","The final page is missing, and every test loaf tastes close but never quite right.",[
    "Sam finds an old ingredient list tucked behind a bakery shelf and begins testing it before dawn.",
    "Maya remembers the loaf's aroma, while Ella and Theo search the market and deliveries for the right grain.",
    "Local produce and a restored town celebration give Sam the clue hidden in the notebook's stained margin.",
    "The Willowmere loaf returns as the bakery's community-day special, shared rather than kept secret."
  ],{Maya:"Maya tastes every test loaf with the first coffee of the day and notices details Sam misses.",Ella:"Ella searches her supplier stories for the grain named in Sam's faded notebook.",Theo:"Theo protects Sam's fragile test loaves during delivery and reports which households ask for them again."}),
  Lily:defineNpcNarrative(["diplomatic","attentive"],"Build a civic noticeboard that makes even quiet residents feel represented.","She worries town decisions are shaped by whoever speaks loudest in the square.",[
    "Lily starts collecting small handwritten suggestions instead of waiting for formal meetings.",
    "Ava and Ruby help her translate everyday shop and park concerns into practical town tasks.",
    "Restoration progress gives Lily space to display completed requests alongside new ones.",
    "The noticeboard becomes a trusted record of promises made, work completed and neighbours thanked."
  ],{Ava:"Ava brings Lily practical requests overheard at the grocer, especially from residents who avoid meetings.",Ruby:"Ruby helps Lily separate urgent safety problems from improvements that can wait.",Ella:"Ella makes sure market traders read Lily's notices instead of relying on rumours."}),
  Ben:defineNpcNarrative(["methodical","loyal"],"Bring the old watermill back to a smooth, dependable rhythm.","A hidden vibration suggests one worn part could damage the machinery if he cannot find it.",[
    "Ben begins noting every unusual knock and pause in the mill's daily rhythm.",
    "Max checks the timber while Finn and Leo describe changes they have noticed downstream.",
    "Cleaner water and a carefully fitted repair allow the mill to run a full day without shuddering.",
    "Ben preserves the repair notes so the next mill worker will understand both the machine and the river."
  ],{Max:"Max trusts Ben's ear for machinery, and Ben trusts Max's hands with old timber.",Finn:"Finn reports floating debris before it reaches the mill, giving Ben time to protect the wheel.",Leo:"Leo notices changes in the current that help Ben distinguish river trouble from mechanical trouble."}),
  Sofia:defineNpcNarrative(["observant","hopeful"],"Create pollinator paths that connect the orchard to nearby gardens.","Unpredictable blossom timing has made each harvest harder to plan.",[
    "Sofia maps where bees pause between the orchard and community garden.",
    "She works with Noah, Mia and Rosie to test small strips of useful flowers.",
    "New saplings and healthier beds make the pollinator path visible in every direction.",
    "The orchard begins flowering more reliably, and Sofia records the planting pattern for future seasons."
  ],{Noah:"Noah studies the trees while Sofia studies everything that moves between them.",Mia:"Mia gives Sofia trial space beside the allotments and honest reports about what survives.",Rosie:"Rosie supplies careful seed mixtures and learns from Sofia which blooms attract local pollinators."}),
  Max:defineNpcNarrative(["resourceful","protective"],"Repair Willowmere's worn public woodwork using reclaimed local timber.","He worries people praise a quick repair without seeing the weaknesses still hidden underneath.",[
    "Max starts marking benches, orchard frames and railings that need more than a surface patch.",
    "Ben helps him test reclaimed mill timber while Finn identifies the dampest dock boards.",
    "Town cleanup uncovers sound pieces that Max can reuse instead of discarding.",
    "His repair ledger becomes a long-term maintenance plan rather than a collection of emergency fixes."
  ],{Ben:"Ben and Max solve problems slowly together, usually without needing many words.",Finn:"Finn knows which harbour boards take the worst weather and refuses to let Max underestimate the tide.",Theo:"Theo brings Max odd-shaped reclaimed materials that other deliveries would have thrown away."}),
  Ella:defineNpcNarrative(["energetic","persuasive"],"Revive the old market square with a regular evening market.","She fears traders will not commit unless she can promise enough visitors.",[
    "Ella begins asking residents what would make them stay in the square after work.",
    "Maya, Sam and Theo help her test a tiny market evening with food and careful deliveries.",
    "A cleaner square and stronger local produce network convince more traders to try one night.",
    "The evening market becomes a monthly tradition where town stories travel as readily as goods."
  ],{Maya:"Maya brings hot drinks to Ella's earliest market mornings and the most honest feedback.",Sam:"Sam's small bakery stall gives Ella's test events their first dependable queue.",Theo:"Theo turns Ella's ambitious lists into deliveries that actually arrive in the right order."}),
  Theo:defineNpcNarrative(["quick-thinking","earnest"],"Design a reliable delivery route that creates less packaging and waste.","When he falls behind, he is tempted to choose speed over care.",[
    "Theo starts recording where delays, damaged parcels and discarded wrapping happen most often.",
    "Ella and Sam help him test reusable crates while Alfie compares faster routes.",
    "Cleaner streets and better public bins make careful delivery easier than cutting corners.",
    "Theo establishes a crate-return round that shops trust and younger delivery riders can follow."
  ],{Ella:"Ella gives Theo impossible-looking delivery lists but always helps him improve the order.",Alfie:"Theo and Alfie turn route planning into a friendly competition, though Theo values reliability over speed.",Sam:"Sam lends Theo stackable bread crates and insists that every loaf arrive uncrushed."}),
  Ruby:defineNpcNarrative(["watchful","patient"],"Create a connected park route where residents and wildlife can move safely.","Busy days can undo a week's careful work faster than she can repair it.",[
    "Ruby begins noting damaged verges, litter traps and the quiet routes used by wildlife.",
    "Grace and Mia help her identify places that need safer paths rather than more signs.",
    "As the park recovers, Ruby links the cleanest areas into one welcoming walking loop.",
    "The route becomes a shared town habit, maintained by residents who now understand why it matters."
  ],{Grace:"Grace notices hazards at a child's height that Ruby might otherwise walk past.",Mia:"Mia and Ruby exchange compost, cuttings and practical advice about exhausted soil.",Lily:"Lily turns Ruby's field notes into civic work orders before small problems grow."}),
  Finn:defineNpcNarrative(["dependable","plain-spoken"],"Restore Fisher's Landing as a safe working dock and community lookout.","He suspects rot beneath boards that still look sound from above.",[
    "Finn begins checking the landing one board at a time after each tide.",
    "Max tests the timber while Leo and Ben report debris and current changes.",
    "River cleanup exposes the worst hidden damage before anyone is hurt.",
    "The repaired landing serves workers, fishers and residents without losing its practical character."
  ],{Leo:"Leo understands the water beside the landing, while Finn understands everything built above it.",Ben:"Ben warns Finn when mill releases or jams may change the pull on moorings.",Max:"Finn tests every board Max repairs and gives praise only when it truly holds."}),
  Grace:defineNpcNarrative(["cheerful","protective"],"Create a simple nature trail that lets children learn from the restored town.","She worries litter and damaged paths make outdoor play feel unsafe to families.",[
    "Grace collects the questions children ask about birds, trees, water and rubbish.",
    "Ruby, Maya and Ava help her plan safe stops with snacks, signs and practical examples.",
    "Each restored place becomes another stop on the trail rather than merely a cleaner backdrop.",
    "The finished trail turns town care into a story children can retell and continue."
  ],{Ruby:"Ruby teaches Grace how to visit wildlife without crowding it.",Maya:"Maya provides a calm meeting table and remembers which families need extra patience.",Ava:"Ava turns oddly shaped local produce into playful learning examples for the children."}),
  Oliver:defineNpcNarrative(["disciplined","secretly sentimental"],"Host a seasonal community supper built around local ingredients.","His complicated standards can make helpers feel their contribution is not good enough.",[
    "Oliver drafts an ambitious supper menu with more courses than the kitchen can comfortably manage.",
    "Charlie, Hugo and Chloe challenge him to choose dishes residents will enjoy together.",
    "Reliable local produce lets Oliver simplify the menu without lowering its quality.",
    "The supper succeeds because Oliver learns to share ownership of it with the whole team."
  ],{Charlie:"Charlie translates Oliver's kitchen ambitions into an evening guests can actually understand.",Hugo:"Oliver and Hugo respect one another's skill enough to argue honestly about every menu.",Chloe:"Chloe reminds Oliver that hospitality continues after the plate leaves the kitchen."}),
  Chloe:defineNpcNarrative(["outgoing","fair-minded"],"Start a welcoming music evening where quieter residents also feel comfortable.","She worries the pub's loudest regulars will resist any change to their familiar routine.",[
    "Chloe starts asking customers which songs make them stay and which make them leave early.",
    "Jack, Amelia and Evie help her test an earlier, softer evening with games and food.",
    "A more cared-for town centre draws residents who had never considered entering the pub.",
    "The music evening becomes known for conversation first and volume second."
  ],{Jack:"Jack supplies careful non-alcoholic drinks and tells Chloe when the room feels too crowded.",Amelia:"Amelia brings late food and the courage to tell Chloe when an idea will not work.",Evie:"Evie understands playful competition and helps Chloe choose games that include newcomers."}),
  Jack:defineNpcNarrative(["curious","precise"],"Create a signature coffee blend named for Willowmere.","During a rush he can become so focused on speed that he stops tasting what he serves.",[
    "Jack begins testing tiny blend changes after the morning queue has gone.",
    "Chloe, Nora and Millie describe the town in flavours rather than measurements.",
    "Cleaner riverside walks inspire a balanced blend that feels familiar without copying the past.",
    "Jack serves the Willowmere blend with a short story about the neighbours who helped shape it."
  ],{Chloe:"Chloe challenges Jack's careful measurements with direct feedback from real customers.",Nora:"Nora gives Jack unexpected colour and texture words that improve how he thinks about flavour.",Millie:"Millie can reproduce Jack's best cups under pressure and notices when a test blend is too fussy."}),
  Amelia:defineNpcNarrative(["bold","practical"],"Turn Harbour General into the village's most useful little shop.","She worries that choosing the wrong shelf stock will leave neighbours unprepared when the weather turns.",[
    "Amelia starts noting which everyday essentials neighbours ask for on their way through the harbour.",
    "Chloe, George and Poppy help her compare rainy-day needs, winter clothing and useful travel stock.",
    "The player-owned shelves begin changing with the forecast, and villagers notice the shop has what they need.",
    "Harbour General becomes the dependable first stop before a wet, snowy or windy day."
  ],{Chloe:"Chloe tells Amelia which weather items late-shift workers keep forgetting.",George:"George explains what walkers need before rain and cold arrive at the beach.",Poppy:"Poppy reports which essentials harbour visitors ask for most often."}),
  Henry:defineNpcNarrative(["thoughtful","cautiously ambitious"],"Turn the cinema into a home for local documentary and impact-film nights.","He fears the building is losing relevance faster than he can find a new audience.",[
    "Henry begins listing old screenings that once brought very different residents together.",
    "Freya, Arthur and Jack help him test a small discussion night with careful projection and coffee.",
    "Town restoration stories give Henry local subjects that matter beyond entertainment.",
    "The cinema becomes a place where residents watch, discuss and plan what they can improve next."
  ],{Freya:"Freya protects projection quality while Henry thinks about why each film deserves an audience.",Arthur:"Arthur understands how guests experience the building from pavement to seat.",Jack:"Jack's coffee keeps Henry's smallest discussion nights warm enough to feel intentional."}),
  Isla:defineNpcNarrative(["gracious","quietly determined"],"Learn to lead community events rather than remaining only behind the tables.","She finds it difficult to ask for responsibility when confident colleagues are already speaking.",[
    "Isla starts keeping notes on what makes large restaurant bookings run smoothly.",
    "Charlie and Hugo give her one part of an event to lead from start to finish.",
    "Her calm response to a difficult evening earns the team's open trust.",
    "Isla becomes the restaurant's community-event organiser and mentors the next hesitant server."
  ],{Charlie:"Charlie makes space for Isla to speak before solving a problem himself.",Hugo:"Hugo trusts Isla's timing in the dining room even when the kitchen feels rushed.",Millie:"Millie and Isla compare the different pressures of café and restaurant service without pretending either is easy."}),
  Oscar:defineNpcNarrative(["steady","community-minded"],"Source more of the market's food from Willowmere growers.","Local harvests are inconsistent, and he worries empty shelves will weaken customers' trust.",[
    "Oscar begins a seasonal list of what the orchard, allotments and gardens can truly supply.",
    "Rosie, Henry and Alfie help him balance local ambition with dependable deliveries.",
    "New planting and better harvests allow one section of the market to become fully local.",
    "Oscar builds flexible agreements that support growers without promising produce nature cannot provide."
  ],{Rosie:"Rosie understands seasonal supply and refuses to let Oscar treat every crop like warehouse stock.",Henry:"Henry helps Oscar tell the human stories behind local products during cinema events.",Alfie:"Alfie gives Oscar fast, honest reports when a local collection route is slipping."}),
  Evie:defineNpcNarrative(["gentle","endlessly curious"],"Find safe homes for every animal in her care and understand the mysterious egg in the quiet enclosure.","She refuses to rush an adoption, and the egg's old field journal is missing several pages.",[
    "Evie begins matching each animal's temperament to the rhythm of life in its possible new home.",
    "Alfie, Chloe and Millie help trace the egg's journey through old delivery notes and town memories.",
    "Restoration milestones warm the patterned shell, and a tiny triceratops answers Evie's patient tapping.",
    "Paws & Wonders becomes a trusted adoption room where unusual companions are understood before they are chosen."
  ],{Alfie:"Alfie searches old delivery records for the egg's missing field journal.",Chloe:"Chloe quietly introduces shy adopters when the shop is calm.",Millie:"Millie brings towels, snacks and an instinct for which nervous animal needs space."}),
  George:defineNpcNarrative(["good-humoured","weather-tested"],"Make the beach café's early breakfast worth visiting in every season.","Rubbish, rough weather and unpredictable crowds make fresh preparation risky.",[
    "George starts noting which mornings bring walkers, harbour workers and families to the beach.",
    "Millie, Poppy and Amelia help him test a small menu that can adapt without creating waste.",
    "A restored beach brings steadier visitors and lets George use more local ingredients.",
    "The breakfast becomes a dependable town ritual even when the weather is less dependable."
  ],{Millie:"Millie understands the café's customers well enough to challenge George's guesses with evidence.",Poppy:"Poppy brings the earliest harbour news and judges breakfast by whether it survives a windy walk.",Amelia:"Amelia and George compare packaging honestly because both see what ends up on the beach."}),
  Freya:defineNpcNarrative(["meticulous","imaginative"],"Identify and preserve a box of old, badly labelled cinema reels.","One damaged label may cause an important local film to be mistaken for an ordinary advertisement.",[
    "Freya begins cleaning and cataloguing the reels one careful section at a time.",
    "Arthur, Henry and Louis search programmes and residents' memories for matching dates.",
    "A glimpse of an old Willowmere street finally identifies the missing community film.",
    "Freya screens the restored reel with a new archive record that future projectionists can trust."
  ],{Arthur:"Arthur remembers audience stories that never appeared in official cinema records.",Henry:"Henry finds the audience and funding while Freya protects the physical films.",Louis:"Louis can turn one frame of an unidentified reel into a question the whole town wants to answer."}),
  Arthur:defineNpcNarrative(["courteous","observant"],"Make the cinema easier and more welcoming for children, older residents and first-time visitors.","He is comfortable helping individuals but nervous speaking to a full room.",[
    "Arthur begins noting every doorway, sign and seating problem that causes a visitor to hesitate.",
    "Freya, Henry and Nora help him test clearer guidance without making the cinema feel clinical.",
    "Arthur introduces one screening himself after the usual host is delayed.",
    "His calm welcome becomes part of the cinema's identity, and the access improvements remain permanent."
  ],{Freya:"Freya trusts Arthur to notice audience discomfort while she is focused on the screen.",Henry:"Henry gives Arthur practical authority to change the visitor experience rather than only report problems.",Nora:"Nora sketches clearer signs that keep Arthur's warm tone instead of looking official and cold."}),
  Poppy:defineNpcNarrative(["capable","adventurous"],"Create durable, colourful harbour signs that help visitors without cluttering the waterfront.","Wind and salt keep damaging every temporary solution.",[
    "Poppy maps where visitors stop, turn back or accidentally enter working harbour space.",
    "George, Amelia and Alfie test wording, container returns and delivery routes against the map.",
    "Reclaimed materials survive their first season while a cleaner harbour makes the route easier to follow.",
    "The finished signs become part of the harbour's character instead of looking like warnings added afterward."
  ],{George:"George knows which harbour directions café visitors misunderstand before breakfast.",Amelia:"Amelia helps Poppy connect Harbour General's useful weather stock to the harbour route.",Alfie:"Alfie tests every sign at delivery speed and reports the turns people miss."}),
  Charlie:defineNpcNarrative(["confident","inclusive"],"Turn occasional restaurant events into relaxed community recipe nights.","The dining room can feel too formal for residents who would have the best stories to share.",[
    "Charlie starts asking guests which family dishes they would explain if the room felt less intimidating.",
    "Oliver, Hugo and Isla help design a simple evening where stories matter as much as plating.",
    "The first recipe night succeeds when an unexpected guest teaches the kitchen something new.",
    "Charlie establishes a rotating host table so the event never belongs only to the restaurant staff."
  ],{Oliver:"Charlie protects guests from Oliver's most complicated ideas without dismissing his care.",Hugo:"Hugo trusts Charlie to read the room and change the pace before the kitchen notices.",Isla:"Charlie deliberately hands Isla visible responsibility instead of keeping every introduction for himself."}),
  Rosie:defineNpcNarrative(["creative","ecologically minded"],"Build a community seed library from plants proven to thrive in Willowmere.","She worries attractive imported varieties are replacing tougher local plants.",[
    "Rosie begins labelling seeds by where they actually grew rather than by catalogue promises.",
    "Mia, Sofia and Oscar help her test garden, orchard and market interest.",
    "Successful local planting produces enough seed for residents to borrow and return.",
    "The seed library becomes a living record of the town's gardens and changing seasons."
  ],{Mia:"Mia tests Rosie's seeds in ordinary beds and reports failures as carefully as successes.",Sofia:"Sofia focuses Rosie's attention on flowers that support the orchard's pollinators.",Oscar:"Oscar gives the seed library visible market space without trying to turn every packet into a product."}),
  Alfie:defineNpcNarrative(["energetic","competitive"],"Become the town's fastest genuinely low-waste delivery rider.","When stressed, he still mistakes shortcuts for good decisions.",[
    "Alfie times his routes but begins counting damaged parcels and discarded wrapping as penalties.",
    "Theo, Evie and Poppy challenge him with reusable crates, rare parts and harbour turns.",
    "Cleaner streets reveal that careful routes can be faster than repeated mistakes.",
    "Alfie publishes a rider route that values safe, complete deliveries rather than speed alone."
  ],{Theo:"Alfie races Theo's route times, while Theo quietly tracks the mistakes Alfie's stopwatch ignores.",Evie:"Evie's search for the egg's field journal turns Alfie's ordinary rounds into a careful archive hunt.",Poppy:"Poppy refuses to accept 'the harbour is confusing' as an excuse for a missed delivery."}),
  Millie:defineNpcNarrative(["bright","self-doubting"],"Create a weekend picnic menu for the beach café.","She has strong ideas but assumes more experienced colleagues will not take them seriously.",[
    "Millie starts writing picnic ideas on order slips she keeps hidden in her apron.",
    "George, Evie and Nora each discover part of the plan and encourage her in very different ways.",
    "A cleaner beach gives Millie the chance to test a small picnic basket with real visitors.",
    "The weekend menu becomes hers to lead, and Millie begins asking newer staff for their ideas too."
  ],{George:"George has more faith in Millie's customer instincts than she realises.",Evie:"Evie trusts Millie's instinct for calming a nervous animal and refuses to let her minimise that gift.",Nora:"Nora sketches Millie's picnic ideas before Millie is brave enough to show anyone else."}),
  Hugo:defineNpcNarrative(["focused","principled"],"Develop a riverside seasonal menu that wastes almost nothing.","His perfectionism makes him reluctant to serve a dish until every detail belongs to him.",[
    "Hugo begins tracking useful trimmings and seasonal ingredients the kitchen currently overlooks.",
    "Isla, Charlie and Oliver push him to share unfinished ideas instead of protecting them.",
    "Local produce and community recipe nights reveal a simple dish stronger than his complicated tests.",
    "Hugo's seasonal menu changes with the harvest and credits every person who shaped it."
  ],{Isla:"Isla can tell when Hugo needs a practical service answer rather than another kitchen experiment.",Charlie:"Charlie persuades Hugo to explain ideas in plain language before guests lose patience.",Oliver:"Hugo and Oliver challenge one another's standards, then quietly borrow one another's best solutions."}),
  Ivy:defineNpcNarrative(["calm","persistent"],"Create a gentle wellbeing walk connecting useful resting places around town.","Residents often ignore rest until they are already exhausted or unwell.",[
    "Ivy begins noting benches, quiet paths and difficult stretches mentioned during everyday conversations.",
    "Grace, Rosie and Freya help her consider children, seasonal planting and accessible destinations.",
    "Town restoration makes enough of the route safe and pleasant for a small walking group.",
    "The wellbeing walk becomes an ordinary weekly habit rather than something residents use only when struggling."
  ],{Grace:"Grace helps Ivy make the route suitable for families instead of designing only for confident walkers.",Rosie:"Rosie identifies calming seasonal planting that will not create difficult maintenance.",Freya:"Freya helps Ivy connect the route to cinema events so residents have a warm destination."}),
  Louis:defineNpcNarrative(["expressive","restless"],"Create late-evening screenings where residents tell local stories before the film.","He dislikes silence so much that he sometimes fills space before listening properly.",[
    "Louis starts collecting one-minute town memories from people leaving the cinema.",
    "Freya, Arthur and Nora help him distinguish a good introduction from a performance about himself.",
    "A recovered local reel gives residents something personal to respond to.",
    "Louis becomes a careful host who knows when a story needs a question and when it needs quiet."
  ],{Freya:"Freya gives Louis precise historical details and expects him not to embellish them.",Arthur:"Arthur teaches Louis that a gentle welcome can be more effective than a dramatic one.",Nora:"Nora's quiet observations make Louis slow down long enough to hear the story underneath them."}),
  Nora:defineNpcNarrative(["imaginative","empathetic"],"Paint a town mural in which residents genuinely recognise themselves.","She worries a beautiful mural could still feel dishonest if she chooses every story alone.",[
    "Nora begins making tiny sketches during ordinary café, harbour and cinema visits.",
    "Jack, Millie and Louis help her ask residents what parts of town they consider their own.",
    "Restoration changes the mural plan from a picture of decline into one of shared effort.",
    "Nora completes a mural built from contributed details, leaving space for future chapters."
  ],{Jack:"Jack gives Nora a dependable café corner and surprisingly useful language for colour.",Millie:"Millie notices small customer rituals that Nora turns into the mural's most human details.",Louis:"Louis gathers stories easily, while Nora helps him recognise which ones should be handled quietly."})
});

export const NPC_HOME_NARRATIVES=Object.freeze({
  home01:Object.freeze({name:"Morningbell Cottage",area:"West Gate, North Road",approach:"past West Gate",description:"A bright cottage where the kitchen lamps are often the first on before sunrise."}),
  home02:Object.freeze({name:"Hawthorn House",area:"North Road",approach:"along the hawthorn hedge",description:"A quiet brick home sheltered by an old hedge and a small, carefully tended front garden."}),
  home03:Object.freeze({name:"Market View Cottage",area:"North Road",approach:"up from Old Market Court",description:"A welcoming cottage whose front windows look towards the daily bustle of the market."}),
  home04:Object.freeze({name:"Blossom End",area:"North Road",approach:"at the orchard end of North Road",description:"A flower-framed home at the eastern end of the road, within an easy walk of the orchard."}),
  home05:Object.freeze({name:"Garden Gate House",area:"North Road",approach:"by the lane to the Commons",description:"A practical family home beside the path residents take towards the gardens and allotments."}),
  home06:Object.freeze({name:"Millstone Cottage",area:"North Road",approach:"near the turning for Mill Bridge",description:"A sturdy cottage where the distant rhythm of the watermill can be heard on quiet days."}),
  home07:Object.freeze({name:"Meadowgate House",area:"Willow Road",approach:"beside the South Meadow gate",description:"A green-painted home whose garden opens towards the meadow paths."}),
  home08:Object.freeze({name:"Willowbank Cottage",area:"Willow Road",approach:"under the old willow trees",description:"A riverside cottage tucked beneath willows, close to both the mill and the water."}),
  home11:Object.freeze({name:"Allotment View",area:"Willow Road",approach:"along the allotment path",description:"A modest home overlooking the growing beds and the neighbours who tend them."}),
  home12:Object.freeze({name:"Foxglove Cottage",area:"Willow Road",approach:"past the wildflower verge",description:"A cosy cottage recognised by the foxgloves and pollinator flowers along its fence."}),
  home09:Object.freeze({name:"Reedbank House",area:"Willow Road",approach:"towards the eastern wetland",description:"A calm home at the reed-lined end of Willow Road, where water birds are regular visitors."}),
  home13:Object.freeze({name:"Bridge End Cottage",area:"South Bank",approach:"just beyond Willow Bridge",description:"A useful stopping place at the bridge end of South Bank, familiar to workers and delivery riders."}),
  home14:Object.freeze({name:"Riverside View",area:"South Bank",approach:"along the riverside walk",description:"A warm home with a clear view of the river and the people passing on its promenade."}),
  home15:Object.freeze({name:"Harbour Lights House",area:"South Bank",approach:"towards the harbour lamps",description:"An easy-to-spot house where the harbour lights begin to show through the windows at dusk."}),
  home16:Object.freeze({name:"Shoreward Cottage",area:"South Bank",approach:"on the road towards South Shore",description:"A weathered cottage facing the route between the riverbank and the shore."}),
  home10:Object.freeze({name:"Riverstone Cottage",area:"South Shore",approach:"over the riverstone path",description:"A small stone cottage made comfortable by generations of riverside residents."}),
  home17:Object.freeze({name:"Lantern House",area:"South Shore",approach:"past the old shore lantern",description:"A cheerful house known for leaving a lantern lit when neighbours are expected home late."}),
  home18:Object.freeze({name:"Sea Glass Cottage",area:"South Shore",approach:"along the sea-glass lane",description:"A pale cottage decorated with smooth pieces of coloured glass found on the shore."}),
  home20:Object.freeze({name:"Meadowlight House",area:"South Shore",approach:"at the meadow-light end of the shore road",description:"The player's resident home, with room for a new life and its own changing story."})
});

export const NPC_THOUGHT_ACTION_CATALOG=Object.freeze({
  HOME:["It is good to have a quiet moment at {home}.","I should make the most of being back at {home}.","The familiar approach {homeApproach} always helps me settle."],
  IDLE:["A pause like this is useful. I can decide what matters next.","I have a moment to notice what is happening around me."],
  WALKING:["I should reach {destination} before I get distracted.","The walk to {destination} usually clears my head."],
  WORKING:["I want to leave {workplace} a little better than I found it.","There is always one more useful thing I can do at {workplace}."],
  SHOPPING:["I hope I remember everything I need at {destination}.","A quick stop at {destination} always turns into hearing the latest town news."],
  DISPOSING:["If everyone carries one thing to a bin, the whole town feels different.","This belongs in a bin, not on a {town} path."],
  EATING:["I needed this little break more than I realised.","A proper meal makes the rest of the day feel manageable."],
  SOCIALISING:["It is nice when a busy day makes room for a real conversation.","I wonder what {friend} has noticed around town lately."],
  RELAXING:["I can let the day slow down for a moment here.","This is a good place to breathe and watch the town go by."],
  FISHING:["The water tells a different story every time I stop and listen.","Patience matters more than luck beside this river."],
  GARDENING:["Healthy soil is quiet proof that patient work matters.","I should remember what is growing well here today."],
  PLAYING:["A little play makes the whole town feel lighter.","I ought to enjoy this before the next job finds me."],
  SITTING:["From here, small changes around town are easier to notice.","I can sit for a moment without wasting the day."],
  RETURNING_HOME:["I am ready to see {home} again.","The path home always feels shorter at the end of a full day.","Once I turn towards {homeArea}, the day feels nearly complete."],
  SLEEPING:["Tomorrow can wait until I have had some proper rest.","A good night's sleep will make the morning clearer."],
  MISCHIEF:["This place feels neglected enough that nobody seems to be paying attention.","I should decide whether causing trouble is really the mark I want to leave here."],
  HELPING:["One small helpful act can change somebody else's whole day.","This town works best when we notice what needs doing." ]
});
export const NPC_THOUGHT_JOB_CATALOG=Object.freeze({
  cafe:["The best part of working at {workplace} is noticing what people need before they ask.","A familiar order can say more about someone than a long conversation."],
  food:["Good food carries the mood of the person who made it.","I want today's work at {workplace} to feel generous, not hurried."],
  market:["A well-run counter connects half the town without anyone noticing.","I should keep an eye on what the town is asking for, not just what is selling."],
  growing:["Every season asks for a different kind of patience.","I trust careful observation more than rushing the land."],
  river:["The river never stays the same, even when it looks still.","Working near the water teaches you to notice trouble early."],
  craft:["A repair is only honest when the hidden parts are sound too.","Good craft should keep helping long after people stop noticing it."],
  care:["The quietest person in town may be the one who most needs to be included.","Careful work is often made of details nobody applauds."],
  culture:["A shared story can make neighbours see the same place differently.","I want this part of town to welcome people who think they do not belong here."],
  delivery:["A reliable route is a promise made one doorstep at a time.","Fast is useful, but arriving with everything cared for matters more."],
  recreation:["Play gives people a reason to share a place instead of only passing through it.","A welcoming game can turn strangers into neighbours."],
  personal:["I am still finding the role that feels like mine in this town.","My hobbies may be the easiest way to meet the right people here."],
  general:["I want my work as {job} to make the town kinder.","Even an ordinary working day can leave something worthwhile behind."]
});
export const NPC_THOUGHT_DESTINATION_CATALOG=Object.freeze({
  home:["{home} will feel especially welcome after this.","I always notice something familiar when I return to {home}.","The turn towards {homeArea} makes the day feel nearly complete."],
  business:["I wonder who I will run into at {destination}.","There is usually more happening inside {destination} than the sign suggests."],
  market:["The route through {destination} is never short of news.","I should look carefully at what local people have brought to {destination}."],
  water:["The air changes as soon as I get close to {destination}.","I should take a proper look at the water when I reach {destination}."],
  growing:["Something at {destination} will have changed since the last time I looked.","There is always a small job waiting at {destination}."],
  green:["{destination} is one of the best places to hear the town breathe.","I hope there is time to linger at {destination}."],
  culture:["{destination} brings together people who might otherwise miss one another.","I wonder what story {destination} will add to today."],
  transit:["Every arrival at {destination} carries a story from somewhere else.","{destination} makes {town} feel connected to a much larger world."],
  general:["I wonder what will be different when I reach {destination}.","There may be someone at {destination} who needs a hand."]
});
export const NPC_THOUGHT_TIME_CATALOG=Object.freeze({
  dawn:["The town feels full of possibility before most doors open.","At this hour, every sound in Willowmere seems important."],
  morning:["Morning is when the town's plans begin bumping into one another.","There is still enough day ahead to do something useful."],
  afternoon:["The day is far enough along to see which plans are actually working.","Afternoons reveal what the morning forgot."],
  evening:["The town changes character when the workday starts letting go.","Evening is when people finally have time to notice one another."],
  night:["{town} is quieter now, but it never feels completely asleep.","The lamps make familiar paths feel like a different town."]
});
export const NPC_THOUGHT_TOWN_CATALOG=Object.freeze({
  neglected:["There is too much being left for somebody else to fix.","The town is asking for help in more places than people realise."],
  improving:["The work is not finished, but the town is beginning to believe it can change.","Every restored corner makes the neglected places stand out more clearly."],
  cared:["People are treating this town as though it belongs to all of us again.","The difference is not one grand gesture; it is hundreds of small choices."],
  restored:["{town} feels cared for, and I want to help keep it that way.","The town looks renewed without losing the memories that made it home."]
});
export const NPC_THOUGHT_WEATHER_CATALOG=Object.freeze({
  clear:["The clear sky makes every route through town feel possible.","I should make the most of this bright weather while it lasts."],
  rain:["The rain has made every roof and window sound different today.","I should keep to the sheltered side of the street and watch for puddles."],
  snow:["Snow makes familiar corners of {town} look newly discovered.","I should walk carefully; the snow has softened every edge of the path."],
  windy:["That wind could carry half the street away if nobody keeps an eye on it.","I can hear the gusts before I turn each corner today."]
});

export function npcHomeNarrative(homeNodeId) {
  return NPC_HOME_NARRATIVES[String(homeNodeId || "")] || Object.freeze({
    name: "Willowmere Home",
    area: "Willowmere",
    approach: "along a familiar village path",
    description: "A well-loved home in Willowmere.",
  });
}

export function narrativeProfileForName(name) {
  return NPC_NARRATIVE_PROFILES[String(name || "")] || null;
}

