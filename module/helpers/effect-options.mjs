// Effect change metadata registry (label-keyed). Example: "boons.str" -> { mode, valueType, priority }
export const effChanges = {};
// Back-compat clearer alias; prefer this in new code
export { effChanges as effectChangeMetaRegistry };

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

/**
 * Labels-only catalog for rendering effect change selects. Derived once from CONFIG.WW.EFFECT_OPTIONS
 * to avoid reading globals during template render.
 */
export const effectChangeOptionLabels = (() => {
  const optionsObj = foundry.utils.deepClone(CONFIG.WW.EFFECT_OPTIONS);
  for (const [catKey, catVal] of Object.entries(optionsObj)) {
    optionsObj[catKey].options = Object.entries(catVal.options).reduce((all, [optId, data]) => {
      all[optId] = data.label;
      return all;
    }, {});
  }
  return optionsObj;
})();

/**
 * Resolve metadata for an effect change option given its label key (e.g., "boons.str").
 * Returns null if no metadata exists.
 * @param {string} labelKey
 * @returns {{mode:number, priority:(number|null), valueType:'int'|'str'|'boo'}|null}
 */
export function getEffectChangeMeta(labelKey) {
  try {
    return labelKey.split('.').reduce((o, i) => o?.[i], effChanges) ?? null;
  } catch (e) {
    return null;
  }
}

// Stable local copies of lookups for safe use in UI context
export const effectLookups = { keys: {}, labels: {}, types: {}, modes: {}, priorities: {} };

/**
 * Shape a list of ActiveEffect changes for rendering in the sheet/template.
 * Adds valueType to each change so the template can render the appropriate input widget.
 * This is a thin layer to avoid reading CONFIG during render and to keep sheets minimal.
 * @param {Array<{key:string,value:any}>} changes
 * @returns {Array<{key:string,value:any,valueType?:'int'|'str'|'boo'}>}
 */
export function shapeEffectChangesForRender(changes=[]) {
  return (changes || []).map((c) => {
    const meta = getEffectChangeMeta(c.key) || {};
    return { ...c, valueType: meta.valueType };
  });
}
