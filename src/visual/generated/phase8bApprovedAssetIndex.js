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
    },
    {
      "schemaVersion": 1,
      "id": "terrain.town.slice.pavement",
      "kind": "spritesheet",
      "source": {
        "kind": "file",
        "file": "/assets/runtime/phase-8a/town-pavement-tile.v1.png",
        "format": "png",
        "owner": "Phase8BApprovedArtwork"
      },
      "runtime": {
        "renderTarget": "phaser",
        "textureKey": "kw.phase8a.terrain.town.slice.pavement"
      },
      "technical": {
        "pixelArt": true,
        "alpha": false,
        "width": 256,
        "height": 256,
        "nativePixelsPerLogicalUnit": 1,
        "frameWidth": 64,
        "frameHeight": 64,
        "directions": []
      },
      "requiredness": "required",
      "lifecycle": {
        "scope": "scene",
        "unload": "on-last-scene-release"
      },
      "status": "phase-8b-approved-runtime",
      "productionContractId": "terrain.town.slice.pavement",
      "cache": {
        "version": "1cbc77da4662",
        "contentSha256": "1cbc77da46624f987773f345c7cfd87c002d3ab64deab00790707052ab1c5c4e"
      },
      "validation": {
        "maximumRuntimeBytes": 140000,
        "maximumDimension": 4096
      },
      "provenance": {
        "semanticId": "terrain.town.slice.pavement",
        "contractVersion": "1.0.0",
        "candidateSha256": "1cbc77da46624f987773f345c7cfd87c002d3ab64deab00790707052ab1c5c4e",
        "reviewer": "youyoulu",
        "approvedAt": "2026-09-01T11:59:24.957Z",
        "masterPath": "artwork/masters/phase-8a/town-pavement-tile/v1/town-pavement-tile.v1.png",
        "runtimePath": "public/assets/runtime/phase-8a/town-pavement-tile.v1.png",
        "runtimeUrl": "/assets/runtime/phase-8a/town-pavement-tile.v1.png"
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
    },
    {
      "schemaVersion": 1,
      "id": "prefab.phase-8a.terrain.pavement",
      "family": "family.town-terrain.slice",
      "variant": "phase-8a-premium-slice",
      "renderer": "phaser",
      "layers": [
        {
          "id": "main",
          "assetId": "terrain.town.slice.pavement",
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
      "productionContractId": "terrain.town.slice.pavement"
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
    },
    {
      "schemaVersion": 1,
      "id": "state.phase-8a.terrain.pavement",
      "defaultState": "centre",
      "states": {
        "centre": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 0,
            "placeholder": true
          }
        },
        "grass-edge-north": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 1,
            "placeholder": true
          }
        },
        "grass-edge-east": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 2,
            "placeholder": true
          }
        },
        "grass-edge-south": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 3,
            "placeholder": true
          }
        },
        "grass-edge-west": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 4,
            "placeholder": true
          }
        },
        "grass-outer-corner-north-east": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 5,
            "placeholder": true
          }
        },
        "grass-outer-corner-south-east": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 6,
            "placeholder": true
          }
        },
        "grass-outer-corner-south-west": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 7,
            "placeholder": true
          }
        },
        "grass-outer-corner-north-west": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 8,
            "placeholder": true
          }
        },
        "grass-inner-corner-north-east": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 9,
            "placeholder": true
          }
        },
        "grass-inner-corner-south-east": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 10,
            "placeholder": true
          }
        },
        "grass-inner-corner-south-west": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 11,
            "placeholder": true
          }
        },
        "grass-inner-corner-north-west": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 12,
            "placeholder": true
          }
        },
        "grass-only": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 13,
            "placeholder": true
          }
        },
        "isolated-paver-transition": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 14,
            "placeholder": true
          }
        },
        "worn-grass-transition": {
          "prefabId": "prefab.phase-8a.terrain.pavement",
          "modifier": {
            "frame": 15,
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
    },
    {
      "schemaVersion": 1,
      "id": "instance.phase-8a.town.terrain.pavement",
      "sceneId": "TownScene",
      "prefabId": "prefab.phase-8a.terrain.pavement",
      "stateId": "state.phase-8a.terrain.pavement",
      "position": {
        "x": 640,
        "y": 493
      },
      "scale": {
        "x": 1,
        "y": 1
      },
      "depth": 249.3,
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
        "repeat": "surface-autotile",
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
        "terrain.town.slice.grass",
        "terrain.town.slice.pavement"
      ],
      "animationIds": [],
      "activation": "phase-8b-approved"
    }
  ]
});
