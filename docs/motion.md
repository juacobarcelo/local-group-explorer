# Motion and the time control

The slider shows millions of years before or after the catalog epoch. Zero restores the published center positions and the original disk orientation. The Milky Way center anchors the coordinate system. The model treats the catalog measurements as a common reference epoch and omits light-travel-time corrections. Both playback directions use the same analytic calculation, so scrubbing to a date gives the same picture every time.

## Center velocities

Each moving center needs a distance, sky position, a systemic radial velocity and two proper motions. The radial measurement gives the speed along the line of sight. Proper motions give angular speeds east and north, including the cosine of declination in the eastern component. Spectroscopy and repeated astrometric images supply different pieces of the same three-dimensional measurement.

The calculation converts each proper motion to a transverse speed using 4.74047 times the distance in kpc times the proper motion in milliarcseconds per year. Radial and transverse components are projected onto a common equatorial Cartesian frame. We add the Sun's Galactic velocity once, using (U, V, W) = (12.9, 245.6, 7.78) km/s directed toward the Galactic center, the direction of Galactic rotation and Galactic north. The explorer adopts these components along the conventional Galactic axes and neglects the Sun’s small height above the disk. [Astropy solar velocity convention](https://docs.astropy.org/en/stable/api/astropy.coordinates.galactocentric_frame_defaults.html) · [Gaia DR3 coordinate transformation, equation 4.62](https://gea.esac.esa.int/archive/documentation/GDR3/Data_processing/chap_cu3ast/sec_cu3ast_intro/ssec_cu3ast_intro_tansforms.html)

We translate each center using this constant velocity for up to 10 Myr in either direction. A speed of 1 km/s travels approximately 1.023 pc per Myr. Gravity curves actual orbits, and tidal forces can change galaxy shapes. A tangent to the current orbit provides a short-time illustration. Computing pericenter times, mergers or encounters would require a separate gravitational model and sampling the measurement uncertainties. The separation slider multiplies both the position and the displacement after the physical calculation.

The data come from systemic radial velocities and proper motions in the Local Volume Database v1.1.2. For M31 and M33 we use the Gaia DR3 five-parameter proper motions of Wu et al. Each moving galaxy's card gives the input velocities, the larger of the quoted upper and lower proper-motion errors, and a reference to its astrometry. Distant galaxies can have large fractional uncertainties, particularly after subtracting the apparent motion induced by the Sun. Only the central measurement is animated. Catalog distances used in the transformation can differ from those assumed by the original papers. [Versioned measurements and original references](https://github.com/apace7/local_volume_database/releases/tag/v1.1.2) · [Wu et al. (2025)](https://doi.org/10.1051/0004-6361/202555477)

Andromeda I, M32 and NGC 205 have radial velocities in the compilation but lack both sky components there. Their centers stay at their catalog coordinates. A stationary icon in this case represents incomplete data. The Milky Way has a separate reason for staying at the origin. Its center defines the reference frame. Distances to held objects at other dates inherit that approximation.

## Internal rotation

The modeled stars in four galaxies turn around their local disk normal. All stars at a given disk radius rotate by the same angle. Inner tracers sweep larger angles than outer ones. For radius R the angular speed scales as 1 / sqrt(R² + a²), normalized at the reference radius in the table. The core scale a is one third of that radius, an illustrative assumption that keeps the center finite and produces an approximately flat circular-speed curve at larger radii. The stars move within the existing disk plane. The reconstruction omits independent arm-pattern speeds, bar dynamics, orbital dispersion and tidal changes.

| Disk | Speed used at reference radius | Reference radius | Direction and input |
| --- | ---: | ---: | --- |
| Milky Way | 229 km/s | 8.2 kpc | Clockwise looking down on Galactic north. Solar-neighborhood speed rounded from the measured circular-speed curve. [Eilers et al.](https://doi.org/10.3847/1538-4357/aaf648) · [Rotation direction](https://doi.org/10.1088/0004-637X/700/1/137) |
| Andromeda | 206 km/s | 10 kpc | Counterclockwise as seen from the Sun. The Gaia DR2 disk fit gives 206 ± 86 km/s. The reference radius is illustrative. [van der Marel et al.](https://arxiv.org/abs/1805.04079) |
| Triangulum | 80 km/s | 4 kpc | Clockwise as seen from the Sun. The Gaia DR2 disk fit gives 80 ± 52 km/s. The reference radius is illustrative. [van der Marel et al.](https://arxiv.org/abs/1805.04079) |
| Large Magellanic Cloud | 59.4 km/s | 1.8 kpc | Clockwise as seen from the Sun. Uses the 59.4 ± 11.9 km/s proper-motion rotation bin at 1.8 kpc. [van der Marel & Kallivayalil, Table 3](https://doi.org/10.1088/0004-637X/781/2/121) |

For the remaining galaxies the model leaves their internal configuration unchanged. Apparent stillness indicates the absence of an adopted internal velocity field. Real dwarf galaxies can have random stellar motions, rotation, or tidal disruption. These require information beyond the velocity of the galaxy as a whole.
