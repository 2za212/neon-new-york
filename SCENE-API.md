Current playable entry (2026-11-12): NYC Neon Greenway.

Current space-density pass: `nyc-soho-infill.js` adds 8 real street buildings,
2 attached south volumes, two canopies and a solid overhead link. Their public
metadata is `world.soho.infill.{stats,buildings,fixtures,bridge,atrium,marketHall}`.
`world.eastPark.density` supplies 20 grouped trees, 14 shrub beds, a walkable
knoll, an enterable greenhouse and a coffee shelter, with real C/S metadata.
`nyc-city-occupation.js` attaches after district-road flush, before batch finish;
`world.occupation.{vehicles,fixtures,parkingRejected,crowdPaths,stats}` exposes
39 parked vehicles, 5 cargo bikes and 14 additional people. Candidate parking
reserves real shop crossings and district path corridors. Vehicle C boxes cover
the whole body and mirrors. People remain in the existing six instanced draws.
Current static batch: 1,522,224 triangles / 1,161 colliders / 398 surfaces;
36 people, 41 available point lights with unchanged 6/10/14 active limits.
The 15 new density cases and previous 60/9/26/11 suites pass. The earlier art
pass figures below are historical baselines; current density report is
`.game-builder/qa/city-density-result.json`.

District art refinement (current): `nyc-soho-detail.js` and
`nyc-east-park-detail.js` are attached by their district modules before the shared
architecture batch finishes. Their `detail.fixtures` contain exact new collider
boxes; `detail.lights` / `detail.emissives` expose local day/night controls.
SoHo supplies two real drain `steamSources` to the existing atmosphere draw.
The shared district kit now uses the spawn sidewalk/oak texture sources and UV
metre scales, adds slab joints and moulded first-floor frames without narrowing
the real 1.4m openings. New thin slab caps are visual, the existing walking level
remains .36m. Park terminal plinths have matching physical top surfaces.
Current batch: 1,361,508 triangles, 839 colliders, 363 ground patches; 37 available
point lights use the existing 6/10/14 active limits. The original 60 navigation,
9 occupied-world and 26 motor/flight cases pass; 11 district-art hardware,
day/night, texture-scale and light-budget cases also pass.
Wetland water remains a shallow PBR surface; only streets share the single
planar reflection. No pool reflection capture was added.

`index.html` + `nyc-game.js` + `nyc.css` build to `dist/` with `npm run build`.
The map uses a third-person trailing camera with free orbit, zoom and camera
collision. WASD is camera-relative; Shift runs; Space jumps; Escape pauses;
H toggles the photo HUD. Touch uses a left stick and right-side camera swipe.

`nyc-scene.js`, `nyc-materials.js`, `nyc-geometry.js`: original local New York
street modules, deterministic textured materials, spatially merged voxel details.
`nyc-avatar.js`: original 1.75m character with Idle / Walk / Run / Jump.
`nyc-motor.js`: feet-based motor, .31m capsule radius, .36m maximum step,
vertical collision, bounds and camera clearance. `npm test` checks behaviour.
`nyc-controls.js`: keyboard, drag, wheel and independent touch pointers.

Art pass 02: `nyc-street-props-v2.js` replaces street trees with .16-.20m
leaf clusters and the subway with open iron railings, rounded voxel lanterns,
route markers and a real descending well. The solid asphalt and west sidewalk
are split around x[-10.32,-6.88], z[11.64,13.96]; the maintenance gate remains
closed and the original player collision envelope is retained.
`nyc-cyber-layer.js` / `nyc-display-textures.js` add original graphic LED ads,
service conduits, four bounded lights and two animated service drones.
`nyc-atmosphere.js` adds small steam plumes and authored broken light impressions.
`nyc-wet-reflection.js` captures one 512px planar road reflection; it is disabled
in low quality. Default lighting is now a readable blue-hour neon night.
Transparent effects and the reflection plane are excluded from the GTAO normal
override. They must not introduce false cards or a false floor into the AO pass.

Lighting pass 03: `nyc-sky.js` supplies layered blue-hour clouds and the same
pure-sky scene for cached PMREM environment lighting. `nyc-lighting.js` couples
that environment to fog, a directional key, restrained fill, local warm lamp
pools and PCF shadows. Explicit material environment maps preserve the separate
glass and dark-character bounce strengths in Three 0.187. Sky/character/world
lighting presets switch together; the cloud field does not reset on a switch.
The wet road now uses sparse, softly blurred puddle islands; static wet patch
metalness and additive colour impressions are reduced to preserve asphalt grit.

Spawn sample pass: `nyc-sample-frontages.js` replaces the lower solid boxes of
two buildings with three real shop rooms and a recessed residential stoop.
`SAMPLE_FRONTAGES` is the shared shell contract; keep its origin, rotation,
width and recess depth aligned with `building()` in `nyc-scene.js`. The upper
masonry starts at 4.10m; back and side cores stay solid. Clear glazing has no
opaque window-map facade hiding the shop. `world.sample` exposes a 40x40m
rectangle x[-20,20], z[2,42], the three actual customer entries, frontage
furniture/collision metadata, and the service-court paths.
`nyc-sample-street.js` adds .38m sidewalk slabs and a .39m service court, while
retaining clear x=+/-8.85m pedestrian paths. The 3.45m-wide service alley
continues through the old laundry gate into the shared yard at (26,24.4).
A 4.48m ground-floor passage leads to the cross street, a cart gate opens
east to the park, and 16 steps reach the drying balcony at y=2.95m.
At x=-17 a second 4.80m passage connects the cross street to the working
market under the railway. Local shop/service lights
switch with the existing night/dusk preset. Wet patches share the existing
single road reflection capture. The initial/reset view faces the new shops.
`nyc-motor.js` uses the same rounded capsule footprint for step acquisition and
landing support, preventing leading-edge stair drops. Collider-top landings
still require crossing from above and steps still check standing headroom.
`npm test` has 26 movement/flight checks; the independent sample acceptance is
`.game-builder/qa/spawn-sample-qa.cjs` (23 checks).

World coordinates are metres: road top .18, typical sidewalk .36, sample
sidewalk .38, spawn (0,.18,22). Ground routes connect the subway, neon corner,
greenway park, Hudson waterfront, Midtown, SoHo and East Commons. The south,
east and Midtown-to-park seams are open; only outer street mouths are closed.
The skyline is compositionally adapted from NYC; this is not a GIS reconstruction.

Full-city pass: `nyc-soho.js` / `nyc-east-park.js` share the original scene,
physics, sky, map and 15 real landmarks. `nyc-district-kit.js` supplies 3.3m
recessed shop rooms and registers roads. The parent flushes the shared road
registry once after both districts exist, clipping intersection paving and
using `roadRegistry.pavingExclusions` for authored courts/platforms. Never
flush an independent copy of the same district in the final scene.
East Commons owns the overlap x[44,84], z[52,96]. SoHo ground excludes it.
`world.soho` and `world.eastPark` expose actual entries, routes and features;
the latter includes roof, wetland, stairs and terrain-island metadata. The
walking polygon has 12 corners, area 67,728sqm, inside a 290x340m envelope.
`nyc-light-budget.js` selects a stable 14/10/6 nearby point lights by quality.
Fine architectural fittings have 100/68/40m limits; foliage/emitters/glass and
structural silhouettes stay visible. A 60-frame local console profile counts
all render passes and is diagnostic evidence, not a phone-performance claim.
`.game-builder/qa/full-city-qa.cjs` verifies 60 real-world acceptance cases;
old sample and bridge routes are included. The original 16 NPCs plus 6 new
commuters remain in six instanced draws.

Platform SDK is installed from the official plugin and initialized with no optional
capabilities. This stateless, single-player map sample currently recommends no
cloud-save or multiplayer extension. Builder project metadata is not initialized
until the official publishing workflow; do not fabricate a binding or game ID.

The earlier experiment remains in `viewer.js` and `public/`. It can be rebuilt
with `npm run build:legacy`; it does not enter the new dist output.

---

Previous cyberpunk city: actual dense sculpted voxel iteration.

User priority: flat wall surfaces must also visibly contain many tiny same-material pixel colour patches, including the old main towers. The latest reference is a dark blue wall with small square/short vertical rectangular colour variations, without grout or a drawn grid. Silhouette detail alone does not meet this requirement. Many tiny solid voxels should also shape physical forms. Flat boxes with grid lines or shallow wall caps were rejected. Keep the brighter night lighting, cyan/magenta commercial signs, wet-road reflection and free walking.

Base city: towers.js / blocks.js / streets.js / urban-layer.js / scale-figures.js. bake-voxels.cjs uses buildBlocks({box,excludeFront:true}) to omit the old front housing, kiosks, vans and crate prototypes. Do not render those duplicates. Base occupancy stays .25m; wall-cap relief is disabled in this build. World source bounds remain min[-87.2,-1.975,-73.3], max[87.2,93.6,71.3].

Dense city sources: dense-housing.js replaces the two front shoulders; dense-tower-details.js supplies curved pipes, deep frames, fins and roof machinery; dense-street-props.js replaces foreground prototypes. Sources export buildDense...(api), with box(x,y,z,w,h,d,kind), roundedBox(x,y,z,w,h,d,radius,kind), cylinder(x,y,z,radius,height,kind,axis='y'), ellipsoid(x,y,z,rx,ry,rz,kind). All arguments are world centres and real dimensions. roundedBox is a true XYZ rounded-box SDF. kind is body/trim/recess/metal. Leave central road x[-9,9] and crossing z[17,30] clear.

bake-dense-city.cjs rasterizes the primitive union at .125m using tile halos, emits only surface-cell records and exact per-tile collision intervals. Runtime dense-voxel-city.js now defaults to cubeGap=0 and renders the exact exposed .125m voxel union at every range. This preserves all voxel contours while eliminating bright seams and hidden duplicate faces. Optional independent near cubes are used only when a positive gap is explicitly requested. Render chunks are 12m in XZ and 6m vertically; near/far hysteresis 10/12m. This prevents the entire city from paying full-cube triangle cost. Preserve actual per-voxel colour sampling and flat normals; continuous photographic noise across tiny cubes obscures their shape.

city-materials.js handles both packed meshes and instanced cubes. World projection must include instanceMatrix. Dense surface.a=4 marks per-voxel albedo and flat shading; do not replace it with a fake grid shader. Existing local atlas and authored sign canvases remain the asset sources. Dense collision is merged with the base model in dense-voxel-physics.js, so rounded openings and ground passages have matching collision rather than the old air walls.

Build all changed geometry: node build.cjs. Viewer/material/UI-only changes: esbuild viewer.js --bundle --minify --outfile=public/scene.js. Verify with node check-quarter-model.cjs and browser views. viewer.js renders on demand and updates dense LOD before drawing; keep the one shared wet-road reflection. Building detail and aerial presets focus the rebuilt street quarter; the overview button still shows the whole map.

Wall appearance update: cityWallPixels applies to every opaque vertical building surface (IDs0..5,12..14), independent of dense flags. Main colour patches are .0625m, rare finer accents .03125m, with short vertical pairs and local clusters in the same hue. Five colour steps preserve average brightness. Detail fades by unquantized screen footprint. Do not draw grout or derive bump from hard colour boundaries. Glass, emissive signs and roads keep their previous response. The wall-style button provides a same-camera before/after comparison; the default detail preset now faces an uninterrupted wall near (-48,1.72,25.5).
