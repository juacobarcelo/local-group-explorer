# Local Group Explorer

Explore the Milky Way, Andromeda, Triangulum and the Magellanic Clouds in a browser. Each galaxy has a three-dimensional reconstruction of its visible stellar body. Select a galaxy and open **Model & sources** to see its adopted diameter, reconstructed features and references.

## Run locally

From a fresh copy of this project, use Node.js 24 with npm and a desktop browser with WebGL 2 enabled. In the folder containing this README, run the following commands.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. To build and serve the production version, run `npm run build` followed by `npm run preview`.

## Explore

| Action | Control |
| --- | --- |
| Locate a galaxy | Choose its catalog entry or click its map label. |
| Orbit | Select **Frame galaxy**, then drag in the map. |
| Inspect the model | Choose **Observed view** or **Edge-on view** in the galaxy card. |
| Show the reference plane | Enable **Show reference plane** to draw a grid through the centers of the Milky Way, Andromeda and Triangulum. |
| Inspect the group from two directions | Choose **Top view** to see the triangle, or **Edge-on plane view** to see the two Magellanic Clouds on the same side of the grid. Drag to change your viewing angle. |
| Zoom | Scroll the mouse wheel. |
| Fly freely | Use W/S to move forward/back, A/D for sideways movement and Q/E to descend/rise. Drag to look around. |
| Return to the group | Choose **Overview** or press Home with the map focused. |

At the initial **1×** settings, one scene unit represents one kiloparsec for both diameters and distances. **Galaxy size** scales each luminous body about its own center. **Galaxy separation** scales every center's offset from the center of the Milky Way. Zoom changes the camera distance. Labels help locate small galaxies at true scale.

The reference plane is a navigation aid defined by the three galaxy centers. The catalog positions stay fixed as you orbit.

## Tests

```sh
npm test
npx playwright install chromium
npm run test:e2e
```

On Linux hosts lacking Chromium system libraries, use `npx playwright install --with-deps chromium`. The browser tests start a local Vite server automatically. They check camera motion and scene geometry through the controls, then capture Andromeda from two directions and both Magellanic Clouds. Find the PNGs under `test-results/`. GitHub Actions runs the build and both test commands and uploads browser results.

## Catalog and model credits

The [catalog guide](docs/catalog.md) explains how to add a galaxy, record its sources, interpret the fixed positions and reuse the original model outputs.
