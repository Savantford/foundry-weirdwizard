export const effChanges = {};

/* Self Attribute Rolls */
effChanges.boons = {
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt(),
  luck: addInt(),
  attacks: addInt(),
  spells: addInt(),
  resistMagical: addInt()
}

effChanges.banes = {
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt(),
  luck: addInt(),
  attacks: addInt(),
  spells: addInt(),
  resistMagical: addInt()
}

effChanges.autoFail = {
  str: setBoo(),
  agi: setBoo(),
  int: setBoo(),
  wil: setBoo(),
  luck: setBoo(),
  attacks: addInt(),
  spells: addInt(),
  resistMagical: addInt()
}

/* Rolls Against Self */
effChanges.boonsAgainst = {
  def: addInt(),
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt(),
  fromAttacks: addInt(),
  fromSpells: addInt(),
  fromMagical: addInt()
}

effChanges.banesAgainst = {
  def: addInt(),
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt(),
  fromAttacks: addInt(),
  fromSpells: addInt(),
  fromMagical: addInt()
}

effChanges.autoSuccessAgainst = {
  def: setBoo(),
  str: setBoo(),
  agi: setBoo(),
  int: setBoo(),
  wil: setBoo(),
  fromAttacks: addInt(),
  fromSpells: addInt(),
  fromMagical: addInt()
}

/* Other Stats */
effChanges.extraDamage = {
  dice: addInt(),
  mod: addInt()
}

effChanges.defense = {
  override: overInt(),
  bonus: addInt(),
  armored: upInt(1),
  armoredIncrease: addInt(),
  natural: overInt(1),
  naturalIncrease: addInt(),
  naturalReduce: addInt()
}

effChanges.health = {
  tempIncrease: addInt(),
  tempReduce: addInt(),
  override: overInt(),
  starting: overInt(1),
  increase: addInt()
}

effChanges.speed = {
  tempIncrease: addInt(),
  tempReduce: addInt(),
  halved: setBoo(),
  override: overInt(),
  increase: addInt()
}

effChanges.size = {
  increase: addInt(),
  override: overInt(),
  normal: overInt(1)
}

effChanges.bonusDamage = {
  increase: addInt()
}

/* Attribute Changes */
effChanges.upgradeAttribute = {
  str: upInt(),
  agi: upInt(),
  int: upInt(),
  wil: upInt()
}

effChanges.downgradeAttribute = {
  str: downInt(),
  agi: downInt(),
  int: downInt(),
  wil: downInt()
}

effChanges.overrideAttribute = {
  str: overInt(),
  agi: overInt(),
  int: overInt(),
  wil: overInt()
}

effChanges.increaseAttribute = {
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt()
}

effChanges.reduceAttribute = {
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt()
}

/* Make functions */

/* Mode Number:
  0: Special
  1: Multiply
  2: Add
  3: Downgrade
  4: Upgrade
  5: Override
*/

function addInt(priority = null) {
  return makeChangeData(2,'int',priority);
}

function overInt(priority = null) {
  return makeChangeData(5,'int',priority);
}

function upInt(priority = null) {
  return makeChangeData(4,'int',priority);
}

function downInt(priority = null) {
  return makeChangeData(3,'int',priority);
}

function setBoo(priority = null) {
  return makeChangeData(5,'boo',priority);
}

function makeChangeData(mode,valueType,priority = null) {
  return {
    mode: mode,
    priority: priority,
    valueType: valueType
  };
}

/**
 * Build flattened lookup maps from CONFIG.WW.EFFECT_OPTIONS
 * Sets CONFIG.WW.EFFECT_CHANGE_KEYS and CONFIG.WW.EFFECT_CHANGE_LABELS
 */
export function initializeEffectLookups() {
  const refObj = CONFIG.WW.EFFECT_OPTIONS || {};
  const keys = {};
  const labels = {};

  for (const [, value] of Object.entries(refObj)) {
    Object.entries(value.options || {}).forEach(([optId, data]) => {
      keys[optId] = data.key;
      labels[optId] = data.label;
    });
  }

  CONFIG.WW.EFFECT_CHANGE_KEYS = keys;
  CONFIG.WW.EFFECT_CHANGE_LABELS = labels;
}