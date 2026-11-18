# Gravity in the Local Group

The scenario follows the centers of the Milky Way, Andromeda, Triangulum and the two Magellanic Clouds from 2 billion years before to 2 billion years after the catalog epoch. Each of the five galaxies pulls on the other four. The remaining catalog galaxies are available in the short-term mode. The gravity and straight tracks start with the same catalog positions and velocities. The former includes mutual attraction and the latter extends each galaxy's initial velocity unchanged. The mass model is fixed across this interval.

The calculation uses an inertial frame in which the Milky Way starts at rest. To draw a track, the explorer subtracts the Milky Way position **at the same epoch** on that track. This retains the Milky Way's gravitational response to its satellites. Initial radial velocities, proper motions and their sources are in the [motion guide](motion.md).

## Adopted mass distributions

Each galaxy has a spherical dark halo and a more compact spherical distribution of ordinary matter. The latter approximates its inner luminous mass. Each component uses a Plummer profile. At radius r it encloses the mass fraction r³/(r² + a²)^(3/2), where a is its scale radius. Half its mass lies inside about 1.305a. A halo extends beyond either radius. The optional halo rendering visualizes this assumption. Its visibility and the drawn sizes of the galaxies have no effect on their gravitational attractions.

| Galaxy | Adopted dark mass (solar masses) | Halo scale a (kpc) | Adopted ordinary mass (solar masses) | Ordinary-matter scale (kpc) |
| --- | ---: | ---: | ---: | ---: |
| Milky Way | 800 billion | 50 | 73 billion | 3 |
| Large Magellanic Cloud | 150 billion | 17 | 2 billion | 1.5 |
| Small Magellanic Cloud | 20 billion | 5.7 | 0.52 billion | 1 |
| Andromeda | 1,396 billion | 82 | 104 billion | 5 |
| Triangulum | 93.6 billion | 11.5 | 6.4 billion | 2 |

For Andromeda and Triangulum we adopt mass budgets based on the galaxy models of Patel et al. and approximate them with the spherical components in this table. The scales are scenario parameters. Present-day center velocities come from the astrometry used in the short-term mode, in the same Galactocentric frame. [Patel et al., model parameters](https://doi.org/10.1093/mnras/stw2616) · [Wu et al., proper motions](https://doi.org/10.1051/0004-6361/202555477)

The Milky Way and Large Cloud mass budgets follow the example models in the 2023 study of Large Cloud peripheral stars. We combine the Galactic disk and bulge. Our Plummer halo scales approximately match the source model's enclosed mass at 50 kpc for the Milky Way and 8.7 kpc for the Large Cloud. The assumed compact scales are rounded disk lengths used as spherical model parameters. The Small Cloud adopts rounded dark and disk masses from the 2026 Magellanic halo simulations. Its scale of 5.7 kpc gives a circular speed near 60 km/s at 2.9 kpc when the compact component is included, matching the approximate observational constraint quoted by the 2023 study. Total halo masses, especially for a tidally disturbed satellite, depend on the adopted scenario. [Large Cloud periphery and model parameters, section 7.1](https://doi.org/10.1093/mnras/stad1698) · [Magellanic halo and disk parameters, Table 1](https://doi.org/10.3847/1538-4357/ae4a9d)

## Forces and integration

For each galaxy pair, the force is the sum of the four component interactions (halo–halo, halo–ordinary, ordinary–halo and ordinary–ordinary). For each term, multiply the center separation vector by G m₁ m₂/(r² + a₁² + a₂²)^(3/2), with G = 4.49850 × 10⁻¹² kpc³ per solar mass per Myr². Both centers receive equal and opposite forces. This symmetric softened potential approximates the interaction of extended objects. The exact force between two overlapping spherical density distributions would require integrating over both profiles.

Velocity Verlet integration advances the centers in fixed steps of 0.5 Myr forward and backward from the same initial state. The viewer retains calculated steps and interpolates between neighboring positions for smooth playback. Tests for these initial conditions compare the two 2,000 Myr endpoints against a 0.25 Myr step, check energy and momentum conservation, and integrate back to the initial epoch. [Gravity tests](../tests/unit/gravity.test.ts)

The rigid profiles omit dynamical friction, tidal stripping, gas drag, halo deformation and external perturbers. Mass and measurement uncertainties are held at the adopted values. The time window makes the curvature visible. Interpreting encounters or reconstructing the history of the Magellanic Stream would require additional physics and an ensemble of initial conditions.
