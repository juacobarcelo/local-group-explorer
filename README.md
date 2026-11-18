# Local Group Explorer

Explore the Milky Way, Andromeda, Triangulum, the Magellanic Clouds and nearby dwarf galaxies in a browser. Each galaxy has a three-dimensional reconstruction of its visible stellar body. Select a galaxy and open **Model & sources** to see its adopted diameter, reconstructed features and references.

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
| Explore close companions | Select **Milky Way satellites**, then enable **Show motion arrows**. Each arrow spans ten million years of motion at the adopted velocity. |
| Move through time | Drag **Simulation time**, play forward or backward, pause, or choose **Return to present**. |
| Zoom | Scroll the mouse wheel. |
| Fly freely | Use W/S to move forward/back, A/D for sideways movement and Q/E to descend/rise. Drag to look around. |
| Return to the group | Choose **Overview** or press Home with the map focused. |

At the initial **1×** settings, one scene unit represents one kiloparsec for both diameters and distances. **Galaxy size** scales each luminous body about its own center. **Galaxy separation** scales every center's offset from the center of the Milky Way. Zoom changes the camera distance. Enable logarithmic sizes to enlarge small galaxies relative to the largest galaxy in the catalog. The size slider still multiplies all displayed diameters. Switch back to linear sizes to compare their physical proportions.

The reference plane follows the centers of the Milky Way, Andromeda and Triangulum at the selected time. Dragging to orbit changes only the camera.

## How many galaxies are there?

The explorer shows 23 galaxies. A count of confirmed galaxies within one megaparsec of the Local Volume Database group center gives 114, including the Milky Way. The [catalog guide](docs/catalog.md) gives the release and selection criteria. Makarov and colleagues counted **134 galaxies within one megaparsec of the Local Group barycenter** in their 2025 compilation. This is a spatial selection around the group's center of mass, and surveys continue to identify faint candidates. [Makarov et al. (2025), section 1](https://doi.org/10.1051/0004-6361/202554778)

## Time and telescope observations

The timeline covers ten million years before and after the catalog epoch. It combines measured center velocities in a Milky Way reference frame with illustrative disk rotation where a speed and radius have been adopted. The [motion guide](docs/motion.md) explains the sources, assumptions and coverage.

To explore additional observations:

- **Resolved stars in Andromeda and Triangulum.** Hubble image mosaics and stellar brightness catalogs span ultraviolet, optical and near-infrared bands. Each survey covers part of its galaxy. [Andromeda PHAT](https://archive.stsci.edu/hlsp/phat) · [Triangulum PHATTER](https://archive.stsci.edu/hlsp/phatter)
- **Gas motion in IC 1613.** VLA radio observations of neutral hydrogen provide intensity and velocity maps. The line-of-sight gas velocity varies across the disk. This is a different measurement from the galaxy center's velocity through the Local Group. [NRAO observations and data products](https://science.nrao.edu/science/surveys/littlethings/data/ic1613.html)

- **Resolved stars in WLM.** Webb near-infrared imaging and photometry reveal individual stars in this isolated dwarf. [JWSTSTARS data products](https://archive.stsci.edu/hlsp/jwststars)

## Tests

```sh
npm test
npx playwright install chromium
npm run test:e2e
```

On Linux hosts lacking Chromium system libraries, use `npx playwright install --with-deps chromium`. The browser tests start a local Vite server automatically. They check camera motion and scene geometry through the controls, then capture Andromeda from two directions and both Magellanic Clouds. Find the PNGs under `test-results/`. GitHub Actions runs the build and both test commands and uploads browser results.

## Catalog and model credits

The [catalog guide](docs/catalog.md) explains how to add a galaxy, record its sources, interpret the reference positions and reuse the original model outputs.
