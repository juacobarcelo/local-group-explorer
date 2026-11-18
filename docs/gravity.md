# Gravity in the Magellanic system

The scenario follows the centers of the Milky Way and the Large and Small Magellanic Clouds from 500 million years before to 500 million years after the catalog epoch. All three pull on each other. The gravity and straight tracks start with the same catalog positions and velocities. The former includes mutual attraction and the latter extends each galaxy's initial velocity unchanged. The mass model is fixed across this interval.

The calculation uses an inertial frame in which the Milky Way starts at rest. To draw a track, the explorer subtracts the Milky Way position **at the same epoch** on that track. This retains the Milky Way's gravitational response to its satellites. In this scenario, after 100 Myr its center has moved about 0.53 kpc in the initial inertial frame. The two Large Cloud tracks differ by 3.25 kpc in the displayed frame at +100 Myr and by 62.9 kpc at +500 Myr. These values come from the shipped model. Initial radial velocities, proper motions and their sources are in the [motion guide](motion.md).

## Adopted mass distributions

Each galaxy has a spherical dark halo and a more compact spherical distribution of ordinary matter. The latter approximates its inner luminous mass. Each component uses a Plummer profile. At radius r it encloses the mass fraction r³/(r² + a²)^(3/2), where a is its scale radius. Half its mass lies inside about 1.305a. A halo extends beyond either radius. The optional halo rendering visualizes this assumption. Its visibility and the drawn sizes of the galaxies have no effect on their gravitational attractions.

| Galaxy | Adopted dark mass (solar masses) | Halo scale a (kpc) | Adopted ordinary mass (solar masses) | Ordinary-matter scale (kpc) |
| --- | ---: | ---: | ---: | ---: |
| Milky Way | 800 billion | 50 | 73 billion | 3 |
| Large Magellanic Cloud | 150 billion | 17 | 2 billion | 1.5 |
| Small Magellanic Cloud | 20 billion | 5.7 | 0.52 billion | 1 |

The Milky Way and Large Cloud mass budgets follow the example models in the 2023 study of Large Cloud peripheral stars. We combine the Galactic disk and bulge. Our Plummer halo scales approximately match the source model's enclosed mass at 50 kpc for the Milky Way and 8.7 kpc for the Large Cloud. The assumed compact scales are rounded disk lengths used as spherical model parameters. The Small Cloud adopts rounded dark and disk masses from the 2026 Magellanic halo simulations. Its scale of 5.7 kpc gives a circular speed near 60 km/s at 2.9 kpc when the compact component is included, matching the approximate observational constraint quoted by the 2023 study. Total halo masses, especially for a tidally disturbed satellite, depend on the adopted scenario. [Large Cloud periphery and model parameters, section 7.1](https://doi.org/10.1093/mnras/stad1698) · [Magellanic halo and disk parameters, Table 1](https://doi.org/10.3847/1538-4357/ae4a9d)

## Forces and integration

For each galaxy pair, the force is the sum of the four component interactions (halo–halo, halo–ordinary, ordinary–halo and ordinary–ordinary). For each term, multiply the center separation vector by G m₁ m₂/(r² + a₁² + a₂²)^(3/2), with G = 4.49850 × 10⁻¹² kpc³ per solar mass per Myr². Both centers receive equal and opposite forces. This symmetric softened potential approximates the interaction of extended objects. The exact force between two overlapping spherical density distributions would require integrating over both profiles.

Velocity Verlet integration advances the centers in fixed steps of 0.5 Myr forward and backward from the same initial state. The viewer retains calculated steps and interpolates between neighboring positions for smooth playback. Tests for these initial conditions compare the two 500 Myr endpoints against a 0.25 Myr step, check energy and momentum conservation, and integrate back to the initial epoch. [Gravity tests](../tests/unit/gravity.test.ts)

The rigid profiles omit dynamical friction, tidal stripping, gas drag, halo deformation and external perturbers. Mass and measurement uncertainties are held at the adopted values. The time window makes the curvature visible. Interpreting encounters or reconstructing the history of the Magellanic Stream would require additional physics and an ensemble of initial conditions.
