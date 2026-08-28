import test from "node:test";
import assert from "node:assert/strict";
import {
  AERIAL_SPECIES,
  ANIMAL_BY_ID,
  ANIMAL_DEFINITIONS,
  ANIMAL_RELOCATION_CONFIG,
  ANIMAL_SPECIES,
  ANIMAL_VISUAL_FIDELITY_VERSION,
  RARE_ANIMAL_ENCOUNTERS,
  SHOP_PET_DEFINITIONS,
  WATER_SPECIES,
  WILDLIFE_DEFINITIONS,
  animalScheduleVisible,
  rareVisitState,
  wildlifeEnvironmentResponse,
  worldAnimalPresentations,
} from "../src/data/animals.js";
import { ITEM_CATALOG } from "../src/data/items.js";
import { createFreshGameState, GameStateService, upgradeGameState, validateGameState } from "../src/state/GameState.js";
import { normalizeWorldState } from "../src/state/worldState.js";
import { SaveRepository } from "../src/state/SaveRepository.js";
import { AnimalService } from "../src/systems/AnimalService.js";
import { MemoryStorage } from "./helpers/MemoryStorage.js";

const EXPECTED_SPECIES = [
  "cat","dog","rabbit","hedgehog","duck","raccoon","fox","crow","songbird","wolf","sea_otter","beaver","capybara","baby_pig","sheep","goat","donkey","cow","chicken","goose","frog","squirrel","deer","owl","bee","butterfly","mouse","snail","fish","pigeon","turtle","pony","chinchilla","meerkat","fennec_fox","macaw","baby_triceratops",
];

test("Milestone 35 preserves the complete 37-species and 56-identity original animal catalogue", () => {
  assert.deepEqual(Object.keys(ANIMAL_SPECIES), EXPECTED_SPECIES);
  assert.equal(WILDLIFE_DEFINITIONS.length, 45);
  assert.equal(new Set(WILDLIFE_DEFINITIONS.map((definition) => definition.species)).size, 32);
  assert.equal(SHOP_PET_DEFINITIONS.length, 11);
  assert.equal(ANIMAL_DEFINITIONS.length, 56);
  assert.equal(new Set(ANIMAL_DEFINITIONS.map((definition) => definition.id)).size, 56);
});

test("every exact accepted food and favourite points to a real inventory item", () => {
  for (const species of Object.values(ANIMAL_SPECIES)) {
    assert.ok(species.accepted.length > 0, `${species.id} has no diet`);
    assert.ok(species.favorites.every((itemId) => species.accepted.includes(itemId)), `${species.id} favourite is unsafe`);
    assert.ok(species.accepted.every((itemId) => ITEM_CATALOG[itemId]), `${species.id} has an unknown food`);
  }
  assert.deepEqual(ANIMAL_SPECIES.capybara.favorites, ["fresh-greens","allotment-carrot"]);
  assert.deepEqual(ANIMAL_SPECIES.macaw.accepted, ["mixed-seeds","sunflower-seeds","wild-berries"]);
});

test("day, night, crepuscular and all-day schedules remain distinct", () => {
  const world = createFreshGameState({ now: 0 }).world;
  const at = (clockMinutes) => ({ ...world, clockMinutes });
  assert.equal(animalScheduleVisible(ANIMAL_BY_ID["animal-dog-1"],at(720)), true);
  assert.equal(animalScheduleVisible(ANIMAL_BY_ID["animal-dog-1"],at(60)), false);
  assert.equal(animalScheduleVisible(ANIMAL_BY_ID["animal-hedgehog-1"],at(60)), true);
  assert.equal(animalScheduleVisible(ANIMAL_BY_ID["animal-hedgehog-1"],at(720)), false);
  assert.equal(animalScheduleVisible(ANIMAL_BY_ID["animal-fox-1"],at(1080)), true);
  assert.equal(animalScheduleVisible(ANIMAL_BY_ID["animal-snail-1"],at(720)), true);
});

test("a cared-for town widens the exact wildlife appearance windows", () => {
  const world = createFreshGameState({ now: 0 }).world;
  const at = (clockMinutes) => ({ ...world, clockMinutes });
  const cared = { cleanliness: { band: "cared-for" } };
  assert.equal(animalScheduleVisible(ANIMAL_BY_ID["animal-dog-1"],at(345),null,cared),true);
  assert.equal(animalScheduleVisible(ANIMAL_BY_ID["animal-dog-1"],at(345)),false);
  assert.equal(animalScheduleVisible(ANIMAL_BY_ID["animal-hedgehog-1"],at(1110),null,cared),true);
  assert.equal(animalScheduleVisible(ANIMAL_BY_ID["animal-fox-1"],at(1000),null,cared),true);
});

test("all five rare visitors keep their exact periods, windows and entry behaviour", () => {
  assert.deepEqual(Object.fromEntries(Object.entries(RARE_ANIMAL_ENCOUNTERS).map(([id,value]) => [id,[value.periodDays,value.offsetDay,value.startMinute,value.durationMinutes,value.entryMinutes,value.exitMinutes]])), {
    wolf:[6,2,360,180,32,36], sea_otter:[7,4,660,190,34,38], beaver:[8,2,510,210,34,38], capybara:[8,6,750,210,34,38], baby_pig:[5,3,480,210,28,34],
  });
  const wolf = ANIMAL_BY_ID["animal-wolf-1"];
  const resident = createFreshGameState({ now: 0 }).animals.residents[wolf.id];
  assert.equal(rareVisitState(wolf,{day:2,clockMinutes:360},resident).phase,"entering");
  assert.equal(rareVisitState(wolf,{day:2,clockMinutes:400},resident).phase,"visiting");
  assert.equal(rareVisitState(wolf,{day:2,clockMinutes:530},resident).phase,"returning");
  assert.equal(rareVisitState(wolf,{day:3,clockMinutes:400},resident).active,false);
  assert.equal(Object.values(RARE_ANIMAL_ENCOUNTERS).every((config) => config.arrivalMessage.length > 20),true);
});

test("scheduled rare arrivals persist one notice per visit", () => {
  const state = createFreshGameState({ now: 0 });
  state.world = normalizeWorldState({...state.world,day:2,clockMinutes:360},{now:2000});
  const gameState = new GameStateService(state);
  const animals = new AnimalService(gameState,new SaveRepository(new MemoryStorage()),{now:() => 2000});
  const first = animals.refreshRareVisits({persist:false});
  assert.equal(first.code,"rare-animal-arrived");
  assert.equal(first.notices.some((notice) => notice.animalId === "animal-wolf-1" && /woods/.test(notice.message)),true);
  assert.equal(animals.refreshRareVisits({persist:false}).notices.length,0);
});

test("water and aerial species expose distinct environment, animation and depth handling", () => {
  assert.deepEqual([...WATER_SPECIES], ["duck","sea_otter","beaver","capybara","goose","fish","turtle"]);
  assert.deepEqual([...AERIAL_SPECIES], ["crow","songbird","owl","bee","butterfly","pigeon","macaw"]);
  const state = createFreshGameState({ now: 0 });
  const presentations = worldAnimalPresentations(state.animals,state.world);
  const duck = presentations.find((entry) => entry.definition.id === "animal-duck-1");
  const bee = presentations.find((entry) => entry.definition.id === "animal-bee-1");
  assert.equal(duck.environment.water,true);
  assert.equal(duck.animation.water,true);
  assert.equal(bee.environment.aerial,true);
  assert.equal(bee.animation.motion,"flutter");
  assert.ok(bee.animation.elevation >= 28);
  assert.ok(bee.depth > duck.depth);
});

test("rare entry and return phases travel between the exact forest and town points", () => {
  const state = createFreshGameState({now:0});
  state.world.day = 2;
  state.world.clockMinutes = 360;
  let wolf = worldAnimalPresentations(state.animals,state.world).find((entry) => entry.id === "animal-wolf-1");
  assert.deepEqual(wolf.position,{x:4160,y:1660});
  state.world.clockMinutes = 376;
  wolf = worldAnimalPresentations(state.animals,state.world).find((entry) => entry.id === "animal-wolf-1");
  assert.deepEqual(wolf.position,{x:4030,y:1660});
  state.world.clockMinutes = 539;
  wolf = worldAnimalPresentations(state.animals,state.world).find((entry) => entry.id === "animal-wolf-1");
  assert.ok(wolf.position.x > 4150 && wolf.rareVisit.phase === "returning");
});

test("weather and seasons produce bounded species-specific wildlife responses", () => {
  const duck = ANIMAL_BY_ID["animal-duck-1"];
  const crow = ANIMAL_BY_ID["animal-crow-1"];
  const bee = ANIMAL_BY_ID["animal-bee-1"];
  const rain = {current:{kind:"rain",season:"spring"}};
  const wind = {current:{kind:"windy",season:"autumn"}};
  const winter = {current:{kind:"clear",season:"winter"}};
  assert.ok(wildlifeEnvironmentResponse(duck,rain).activityMultiplier > 1);
  assert.ok(wildlifeEnvironmentResponse(crow,wind).activityMultiplier < 1);
  assert.equal(wildlifeEnvironmentResponse(crow,wind).behavior,"riding the breeze");
  assert.ok(wildlifeEnvironmentResponse(bee,winter).activityMultiplier < .5);
});

test("the live rotation is deterministic, species-diverse, bounded and hides unadopted shop pets", () => {
  const state = createFreshGameState({ now: 0 });
  const first = worldAnimalPresentations(state.animals,state.world);
  const second = worldAnimalPresentations(state.animals,state.world);
  assert.deepEqual(first.map((entry) => [entry.id,entry.visible,entry.position]),second.map((entry) => [entry.id,entry.visible,entry.position]));
  const visibleWild = first.filter((entry) => entry.visible && !entry.resident.adopted);
  assert.ok(visibleWild.length >= 3 && visibleWild.length <= 4);
  assert.equal(new Set(visibleWild.map((entry) => entry.definition.species)).size,visibleWild.length);
  assert.ok(visibleWild.every((entry) => Number.isFinite(entry.position.x) && Number.isFinite(entry.position.y)));
  assert.ok(first.every((entry) => !entry.definition.shopPet));
});

test("wildlife pauses by species, avoids placed objects and exposes protected transition timing", () => {
  assert.deepEqual(ANIMAL_RELOCATION_CONFIG,{triggerDistance:520,fadeOutSeconds:.22,fadeInSeconds:.28});
  assert.equal(ANIMAL_VISUAL_FIDELITY_VERSION,"v44-reference-master");
  const state = createFreshGameState({ now: 0 });
  const raw = worldAnimalPresentations(state.animals,state.world,state).find((entry) => entry.visible && !entry.definition.aerial && !entry.definition.water);
  assert.ok(raw?.position);
  const radius = 70;
  const context = structuredClone(state);
  context.townPlacement.objects = [{id:"placed-animal-test",x:raw.position.x,y:raw.position.y,hooks:{wildlifeObstacle:{radius}}}];
  const avoided = worldAnimalPresentations(state.animals,state.world,context).find((entry) => entry.id === raw.id);
  assert.ok(Math.hypot(avoided.position.x-raw.position.x,avoided.position.y-raw.position.y) >= radius);
  let observedWait = false;
  for (let minute = 0; minute < 1440 && !observedWait; minute += 1) {
    const world = normalizeWorldState({...state.world,day:1,clockMinutes:minute},{now:minute});
    const fox = worldAnimalPresentations(state.animals,world,state).find((entry) => entry.id === "animal-fox-1");
    observedWait = fox.motionState.phase === "waiting" && fox.motionState.wait <= 3.8;
  }
  assert.equal(observedWait,true);
});

test("offline rare encounters receive one delayed replay instead of being silently lost", () => {
  const state = createFreshGameState({ now: 0 });
  const gameState = new GameStateService(state);
  const animals = new AnimalService(gameState,new SaveRepository(new MemoryStorage()),{now:() => 1000});
  const advanced = gameState.getSnapshot();
  advanced.world = normalizeWorldState({...advanced.world,day:9,clockMinutes:1439},{now:9000});
  assert.equal(gameState.replace(advanced).ok,true);
  const result = animals.refresh({persist:false,offline:true});
  assert.equal(result.ok,true);
  assert.ok(result.rareReplay?.animalId);
  const replayResident = gameState.getSnapshot().animals.residents[result.rareReplay.animalId];
  assert.equal(replayResident.rareReplayStartAbsoluteMinute,result.rareReplay.startsAtAbsoluteMinute);
  assert.equal(replayResident.rareVisitCount,1);
});

test("schema 31 expansion preserves existing progress and recovers original legacy animal records", () => {
  const old = createFreshGameState({ now: 0 });
  old.schemaVersion = 31;
  old.animals.schemaVersion = 1;
  delete old.animals.lastResolvedAbsoluteMinute;
  old.animals.residents = Object.fromEntries(Object.entries(old.animals.residents).slice(0,8));
  old.source.kind = "legacy-import";
  old.source.legacyVersion = 82;
  old.source.legacySourceKey = "kindworks_living_town_v38";
  old.source.importedAt = old.updatedAt;
  old.legacySnapshot = {animals:{activeAnimalId:"pet-macaw",animalEventSerial:91,animalCompanionDepartureEvents:4,animals:[
    {id:"animal-capybara-1",name:"Marlow",friendliness:73,adopted:false},
    {id:"pet-macaw",name:"Captain Rio",friendliness:88,adopted:true,active:true,purchasedDay:1,events:7},
  ]}};
  const upgraded = upgradeGameState(old,{now:1000});
  assert.equal(upgraded.schemaVersion,37);
  assert.equal(Object.keys(upgraded.animals.residents).length,56);
  assert.equal(upgraded.animals.residents["animal-capybara-1"].trust,73);
  assert.equal(upgraded.animals.residents["pet-macaw"].name,"Captain Rio");
  assert.equal(upgraded.animals.residents["pet-macaw"].purchasedDay,1);
  assert.equal(upgraded.animals.residents["pet-macaw"].eventCount,7);
  assert.equal(upgraded.animals.eventSerial,91);
  assert.equal(upgraded.animals.departureEvents,4);
  assert.equal(upgraded.animals.activeAnimalId,"pet-macaw");
  assert.equal(worldAnimalPresentations(upgraded.animals,upgraded.world).some((entry) => entry.id === "pet-macaw" && entry.visible),true);
  assert.equal(validateGameState(upgraded).ok,true);
});

test("Paws & Wonders stock can only be adopted through the dedicated Milestone 36 shop", () => {
  const state = createFreshGameState({ now: 0 });
  state.customResident.profile = {name:"Mae",skin:"warm",hair:0,hairColor:"dark-brown",accessory:"none",outfit:0,bodyBuild:"average",hobbies:["nature"]};
  const animals = new AnimalService(new GameStateService(state),new SaveRepository(new MemoryStorage()));
  const result = animals.requestAdoption("pet-chinchilla",{roll:0});
  assert.equal(result.code,"pet-shop-only");
  assert.match(result.message,/inside Paws & Wonders/);
  assert.equal(animals.getSnapshot().residents["pet-chinchilla"].adopted,false);
});
