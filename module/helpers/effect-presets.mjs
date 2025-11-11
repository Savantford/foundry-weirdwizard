// Effect change metadata registry (label-keyed). Example: "boons.str" -> { mode, valueType, priority }
export const changePresets = {};
// Back-compat clearer alias; prefer this in new code
export { changePresets as effectChangeMetaRegistry };

/* -------------------------------------------- */
/*  Change Presets                              */
/* -------------------------------------------- */

/* Self Attribute Rolls */
changePresets.boons = {
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt(),
  luck: addInt(),
  attacks: addInt(),
  spells: addInt(),
  resistMagical: addInt()
}

changePresets.banes = {
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt(),
  luck: addInt(),
  attacks: addInt(),
  spells: addInt(),
  resistMagical: addInt()
}

changePresets.autoFail = {
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
changePresets.boonsAgainst = {
  def: addInt(),
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt(),
  fromAttacks: addInt(),
  fromSpells: addInt(),
  fromMagical: addInt()
}

changePresets.banesAgainst = {
  def: addInt(),
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt(),
  fromAttacks: addInt(),
  fromSpells: addInt(),
  fromMagical: addInt()
}

changePresets.autoSuccessAgainst = {
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
changePresets.extraDamage = {
  dice: addInt(),
  mod: addInt()
}

changePresets.defense = {
  override: overInt(),
  bonus: addInt(),
  armored: upInt(1),
  armoredIncrease: addInt(),
  natural: overInt(1),
  naturalIncrease: addInt(),
  naturalReduce: addInt()
}

changePresets.health = {
  tempIncrease: addInt(),
  tempReduce: addInt(),
  override: overInt(),
  starting: overInt(1),
  increase: addInt()
}

changePresets.speed = {
  tempIncrease: addInt(),
  tempReduce: addInt(),
  halved: setBoo(),
  override: overInt(),
  normal: overInt(1),
  increase: addInt()
}

changePresets.size = {
  increase: addInt(),
  override: overInt(),
  normal: overInt(1)
}

changePresets.bonusDamage = {
  increase: addInt()
}

/* Attribute Changes */
changePresets.upgradeAttribute = {
  str: upInt(),
  agi: upInt(),
  int: upInt(),
  wil: upInt()
}

changePresets.downgradeAttribute = {
  str: downInt(),
  agi: downInt(),
  int: downInt(),
  wil: downInt()
}

changePresets.overrideAttribute = {
  str: overInt(),
  agi: overInt(),
  int: overInt(),
  wil: overInt()
}

changePresets.increaseAttribute = {
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt()
}

changePresets.reduceAttribute = {
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt()
}

/* -------------------------------------------- */
/*  Simplified Change Data making functions     */
/* -------------------------------------------- */
/* Modes:
  https://foundryvtt.com/api/v13/variables/CONST.ACTIVE_EFFECT_MODES.html
*/

function addInt(priority = null) {
  return makeChangeData(CONST.ACTIVE_EFFECT_MODES.ADD, 'int', priority);
}

/* -------------------------------------------- */

function overInt(priority = null) {
  return makeChangeData(CONST.ACTIVE_EFFECT_MODES.OVERRIDE, 'int', priority);
}

/* -------------------------------------------- */

function upInt(priority = null) {
  return makeChangeData(CONST.ACTIVE_EFFECT_MODES.UPGRADE, 'int', priority);
}

/* -------------------------------------------- */

function downInt(priority = null) {
  return makeChangeData(CONST.ACTIVE_EFFECT_MODES.DOWNGRADE, 'int', priority);
}

/* -------------------------------------------- */

function setBoo(priority = null) {
  return makeChangeData(CONST.ACTIVE_EFFECT_MODES.OVERRIDE, 'boo', priority);
}

/* -------------------------------------------- */

/**
 * Make a change data object to use in Active Effects.
 * @param {*} mode      The change's Mode (Add, Override, etc)
 * @param {*} valueType The change data Type (Integer, Boolean, etc)
 * @param {*} priority  The effect's Priority
 * @returns 
 */
function makeChangeData(mode, valueType, priority = null) {
  return {
    mode: mode,
    priority: priority,
    valueType: valueType
  };
}

/* -------------------------------------------- */
/*  Other Helper Functions                      */
/* -------------------------------------------- */

/**
 * Build flattened lookup maps from CONFIG.WW.EFFECT_CHANGE_PRESET_DATA
 * Sets CONFIG.WW.EFFECT_CHANGE_PRESET_KEYS and CONFIG.WW.EFFECT_CHANGE_PRESET_LABELS
 * (these replace EFFECT_CHANGE_PRESET_KEYS and EFFECT_CHANGE_LABELS where still needed)
 */
export function initializeEffectLookups() {
  const keys = {};
  const labels = {};

  for (const [, value] of Object.entries(CONFIG.WW.EFFECT_CHANGE_PRESET_DATA)) {
    Object.entries(value.options || {}).forEach(([optId, data]) => {
      keys[optId] = data.key;
      labels[optId] = data.label;
    });
  }

  CONFIG.WW.EFFECT_CHANGE_PRESET_KEYS = keys;
  CONFIG.WW.EFFECT_CHANGE_PRESET_LABELS = labels;
}

/* -------------------------------------------- */

/**
 * Resolve metadata for an effect change option given its label key (e.g., "boons.str").
 * Returns null if no metadata exists.
 * @param {string} labelKey
 * @returns {{mode:CONST.ACTIVE_EFFECT_MODES, priority:(number|null), valueType:'int'|'str'|'boo'}|null}
 */
export function getEffectChangeMeta(labelKey) {
  try {
    return labelKey.split('.').reduce((o, i) => o?.[i], changePresets) ?? null;
  } catch (e) {
    return null;
  }
}

/* -------------------------------------------- */

// Stable local copies of lookups for safe use in UI context
export const effectLookups = { keys: {}, labels: {}, types: {}, modes: {}, priorities: {} };

/* -------------------------------------------- */

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
    const hasMode = c?.mode !== undefined && c?.mode !== null && c?.mode !== '';
    const hasPriority = c?.priority !== undefined && c?.priority !== null && c?.priority !== '';
    return {
      ...c,
      valueType: meta.valueType,
      mode: hasMode ? c.mode : meta.mode,
      priority: hasPriority ? c.priority : meta.priority,
    };
  });
}
