export function createEquipment({canChange, apply}) {
  let weapon = null;

  function setWeapon(next) {
    if (next !== null && next !== 'rapier') return false;
    if (next === weapon) return true;
    if (!canChange() || !apply(next)) return false;
    weapon = next;
    return true;
  }

  return {setWeapon, canChange, get weapon() { return weapon; }};
}
