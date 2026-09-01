// Generated from artwork/approvals/phase8b-approved-assets.v1.json. Do not hand-edit.
export const PHASE_8B_APPROVED_ASSET_INDEX = Object.freeze({
  "schemaVersion": 1,
  "assets": [
    {
      "schemaVersion": 1,
      "id": "terrain.town.slice.grass",
      "kind": "image",
      "source": {
        "kind": "file",
        "file": "/assets/runtime/phase-8a/town-grass-tile.v1.png",
        "format": "png",
        "owner": "Phase8BApprovedArtwork"
      },
      "runtime": {
        "renderTarget": "phaser",
        "textureKey": "kw.phase8a.terrain.town.slice.grass"
      },
      "technical": {
        "pixelArt": true,
        "alpha": false,
        "width": 64,
        "height": 64,
        "nativePixelsPerLogicalUnit": 1,
        "frameWidth": null,
        "frameHeight": null,
        "directions": []
      },
      "requiredness": "required",
      "lifecycle": {
        "scope": "scene",
        "unload": "on-last-scene-release"
      },
      "status": "phase-8b-approved-runtime",
      "productionContractId": "terrain.town.slice.grass",
      "cache": {
        "version": "4c9218bc1298",
        "contentSha256": "4c9218bc129831278781a62cdd319272a25a403c3a404f9d62a1bf563584deed"
      },
      "validation": {
        "maximumRuntimeBytes": 30000,
        "maximumDimension": 4096
      },
      "provenance": {
        "semanticId": "terrain.town.slice.grass",
        "contractVersion": "1.0.0",
        "candidateSha256": "4c9218bc129831278781a62cdd319272a25a403c3a404f9d62a1bf563584deed",
        "reviewer": "youyoulu",
        "approvedAt": "2026-09-01T10:19:18.226Z",
        "masterPath": "artwork/masters/phase-8a/town-grass-tile/v1/town-grass-tile.v1.png",
        "runtimePath": "public/assets/runtime/phase-8a/town-grass-tile.v1.png",
        "runtimeUrl": "/assets/runtime/phase-8a/town-grass-tile.v1.png"
      }
    }
  ],
  "prefabs": [
    {
      "schemaVersion": 1,
      "id": "prefab.phase-8a.terrain.grass",
      "family": "family.town-terrain.slice",
      "variant": "phase-8a-premium-slice",
      "renderer": "phaser",
      "layers": [
        {
          "id": "main",
          "assetId": "terrain.town.slice.grass",
          "role": "main",
          "optional": false
        }
      ],
      "scalePolicy": {
        "mode": "fixed-logical-footprint",
        "x": 1,
        "y": 1,
        "imageFit": "contain-within-visual-bounds"
      },
      "groundContactAnchor": {
        "x": 0,
        "y": 0
      },
      "origin": {
        "x": 0,
        "y": 0
      },
      "depthPolicy": {
        "mode": "world-y",
        "layerId": "ground-details",
        "base": 20,
        "divisor": 0
      },
      "shadowPolicy": {
        "mode": "no-shadow",
        "enabled": false
      },
      "animation": null,
      "sockets": {},
      "geometry": {
        "schemaVersion": 1,
        "visual": {
          "schemaVersion": 1,
          "kind": "rectangle",
          "x": 0,
          "y": 0,
          "width": 64,
          "height": 64
        },
        "collision": null,
        "navigation": null,
        "interaction": null,
        "touch": null
      },
      "productionContractId": "terrain.town.slice.grass"
    }
  ],
  "visualStates": [
    {
      "schemaVersion": 1,
      "id": "state.phase-8a.terrain.grass",
      "defaultState": "default",
      "states": {
        "default": {
          "prefabId": "prefab.phase-8a.terrain.grass",
          "modifier": {
            "frame": 0,
            "placeholder": true
          }
        }
      }
    }
  ],
  "animations": [],
  "sceneInstances": [
    {
      "schemaVersion": 1,
      "id": "instance.phase-8a.town.terrain.grass",
      "sceneId": "TownScene",
      "prefabId": "prefab.phase-8a.terrain.grass",
      "stateId": "state.phase-8a.terrain.grass",
      "position": {
        "x": 0,
        "y": 0
      },
      "scale": {
        "x": 1,
        "y": 1
      },
      "depth": 200,
      "worldOrigin": {
        "x": 1880,
        "y": 0
      },
      "visualOffset": {
        "x": 0,
        "y": 0
      },
      "binding": {
        "mode": "repeat",
        "repeat": "cover-town-ground",
        "dynamicPosition": null,
        "dynamicFacing": null,
        "visibleAfter": null,
        "gameplayOwner": null,
        "protectedWorldObjectId": null,
        "protectedWorldPosition": null,
        "protectedWorldYard": null,
        "protectedWorldRiver": null,
        "protectedWorldRoadId": null,
        "protectedGate": null,
        "npcIdentityBinding": null,
        "speciesBinding": null,
        "socketBinding": null,
        "safeAreaBindings": null,
        "minimumCssTouchTarget": null,
        "presentationOnly": false
      },
      "layoutId": "layout.phase-8a.town-block.house-6",
      "gameplayGeometryLocked": true,
      "activation": "phase-8b-approved"
    }
  ],
  "scenePacks": [
    {
      "schemaVersion": 1,
      "id": "pack.phase-8a.town-block",
      "sceneId": "TownScene",
      "assetIds": [
        "terrain.town.slice.grass"
      ],
      "animationIds": [],
      "activation": "phase-8b-approved"
    }
  ]
});
