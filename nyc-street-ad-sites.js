// Metres, in the same world frame as the authored shop shells. Yaw turns the
// front normal (+Z). A blade's mountSide points along its local X to its wall.
const east = Math.PI / 2;
const west = -Math.PI / 2;

export const legacyAdSites = [
  // Old town: the food cart's lower apron, below its original serving window.
  {id:'deli', kind:'wall', x:9.72, y:1.10, z:20.20, width:2.12, height:.68, yaw:west, mountDepth:.17},
  // The service court's south masonry return, between two zinc downpipes.
  {id:'signal', kind:'poster', x:13.73, y:1.80, z:22.85, width:1.00, height:1.25, yaw:0, mountDepth:.24},
  // Lumen Clinic's west corner pier, beyond the fire-escape landings.
  {id:'pharmacy', kind:'blade', x:22.48, y:5.60, z:-9.06, width:2.48, height:.82, yaw:west, mountSide:-1, mountDepth:.39},

  // SoHo: Broome Café's upper iron pier above the canopy, facing along the walk.
  {id:'tea', kind:'blade', x:9.47, y:6.06, z:56.20, width:.94, height:2.68, yaw:Math.PI, mountSide:-1, mountDepth:.45},
  // Fascia of the western archive's streetward stepped awning.
  {id:'courier', kind:'ticker', x:-6.31, y:3.98, z:111.26, width:3.00, height:.92, yaw:east, mountDepth:.60},
  // Rear courtyard kitchen: a small price board bolted to the wooden counter.
  {id:'deli', kind:'wall', x:-35.80, y:.81, z:65.61, width:1.62, height:.52, yaw:0, mountDepth:.17},
  // South-facing blank steel of the real over-street power gallery.
  {id:'battery', kind:'poster', x:2.64, y:17.96, z:104.34, width:2.08, height:2.60, yaw:0, mountDepth:.24},

  // Old exchange: two separate shuttered tenancies flank the occupied lane.
  {id:'keys', kind:'blade', x:-4.47, y:5.13, z:-92.25, width:.90, height:2.56, yaw:0, mountSide:-1, mountDepth:.47},
  {id:'recycle', kind:'poster', x:5.86, y:1.72, z:-107.55, width:1.28, height:1.60, yaw:west, mountDepth:.31},
  // Lower cladding on the inhabited exchange bridge, below the lit windows.
  {id:'repair', kind:'ticker', x:.58, y:7.21, z:-109.08, width:3.10, height:.90, yaw:0, mountDepth:.24},

  // Night-shift battery service on the quay-facing return of Hudson Supply.
  // The plaque fits the brick pier between two sash windows, beside the downpipe.
  {id:'battery', kind:'poster', x:-123.18, y:1.88, z:-13.47, width:1.00, height:1.25, yaw:west, mountDepth:.23},
  // Park tram: the landward face of the existing information totem is unused.
  // Its timetable slats remain on the opposite face, towards the park entry.
  {id:'rail', kind:'poster', x:118.45, y:1.79, z:6.90, width:.72, height:.90, yaw:east, mountDepth:.19}
];
