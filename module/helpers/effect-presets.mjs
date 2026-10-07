// Effect change metadata registry (label-keyed). Example: "boons.str" -> { type, valueType, priority }
const changePresets = {};

// Back-compat clearer alias; prefer this in new code
export { changePresets as effectChangePresetData };

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
  str: subInt(),
  agi: subInt(),
  int: subInt(),
  wil: subInt(),
  luck: subInt(),
  attacks: subInt(),
  spells: subInt(),
  resistMagical: subInt()
}

changePresets.autoFail = {
  str: setBoo(),
  agi: setBoo(),
  int: setBoo(),
  wil: setBoo(),
  luck: setBoo()
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
  def: subInt(),
  str: subInt(),
  agi: subInt(),
  int: subInt(),
  wil: subInt(),
  fromAttacks: subInt(),
  fromSpells: subInt(),
  fromMagical: subInt()
}

changePresets.autoSuccessAgainst = {
  def: setBoo(),
  str: setBoo(),
  agi: setBoo(),
  int: setBoo(),
  wil: setBoo()
}

/* Other Stats */
changePresets.extraDamage = {
  dice: addInt(),
  mod: addInt()
}

changePresets.defense = {
  override: overInt(),
  bonus: addInt(),
  armored: upInt({ priority: 1 }),
  armoredIncrease: addInt(),
  natural: overInt({ priority: 1 }),
  naturalIncrease: addInt(),
  naturalReduce: subInt()
}

changePresets.health = {
  tempIncrease: addInt(),
  tempReduce: subInt(),
  override: overInt(),
  starting: upInt({ priority: 1 }),
  increase: addInt()
}

changePresets.speed = {
  tempIncrease: addInt(),
  tempReduce: subInt(),
  halved: setBoo(),
  override: overInt(),
  normal: overInt({ priority: 1 }),
  increase: addInt()
}

changePresets.size = {
  increase: addFlo(),
  override: overFlo(),
  normal: overFlo({ priority: 1 })
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
  str: subInt(),
  agi: subInt(),
  int: subInt(),
  wil: subInt()
}

/* List Entries */
changePresets.descriptors = {
  add: addInt(),
  remove: subInt()
}

changePresets.immunities = {
  add: addInt(),
  remove: subInt()
}

changePresets.languages = {
  add: addInt(),
  remove: subInt()
}

changePresets.movementTraits = {
  add: addInt(),
  remove: subInt()
}

changePresets.senses = {
  add: addInt(),
  remove: subInt()
}

/* -------------------------------------------- */
/*  Simplified Change Data making functions     */
/* -------------------------------------------- */
/* Types:
  https://foundryvtt.com/api/variables/CONST.ACTIVE_EFFECT_CHANGE_TYPES.html
*/

function addInt(options={}) {
  const { priority } = options;

  return makeChangeData('add', 'int', priority);
}

/* -------------------------------------------- */

function subInt(options={}) {
  const { priority } = options;

  return makeChangeData('subtract', 'int', priority);
}

/* -------------------------------------------- */

function overInt(options={}) {
  const { priority } = options;

  return makeChangeData('override', 'int', priority);
}

/* -------------------------------------------- */

function upInt(options={}) {
  const { priority } = options;

  return makeChangeData('upgrade', 'int', priority);
}

/* -------------------------------------------- */

function downInt(options={}) {
  const { priority } = options;

  return makeChangeData('downgrade', 'int', priority);
}

/* -------------------------------------------- */

function addFlo(options={}) {
  const { priority } = options;

  return makeChangeData('add', 'flo', priority);
}

/* -------------------------------------------- */

function overFlo(options={}) {
  const { priority } = options;

  return makeChangeData('override', 'flo', priority);
}

/* -------------------------------------------- */

function upFlo(options={}) {
  const { priority } = options;

  return makeChangeData('upgrade', 'flo', priority);
}

/* -------------------------------------------- */

function downFlo(options={}) {
  const { priority } = options;

  return makeChangeData('downgrade', 'flo', priority);
}

/* -------------------------------------------- */

function setBoo(options={}) {
  const { priority } = options;

  return makeChangeData('override', 'boo', priority);
}

/* -------------------------------------------- */

/**
 * Make a change data object to use in Active Effects.
 * @param {string} type      The change's Type (Add, Override, etc)
 * @param {string} valueType The change data Type (Integer, Boolean, etc)
 * @param {number} priority  The effect's Priority
 * @returns 
 */
function makeChangeData(type, valueType, options={}) {
  const { priority } = options;

  return {
    type: type,
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
 * @param {string} presetKey
 * @returns {{type:CONST.ACTIVE_EFFECT_CHANGE_TYPES, priority:(number|null), valueType:'boo'|'flo'|'int'|'str'}|null}
 */
export function getEffectChangeMeta(presetKey) {
  try {
    return presetKey.split('.').reduce((o, i) => o?.[i], changePresets) ?? null;
  } catch (e) {
    return null;
  }
}

/* -------------------------------------------- */

// Stable local copies of lookups for safe use in UI context
export const effectLookups = { keys: {}, labels: {}, types: {}, priorities: {} };

/* -------------------------------------------- */

/**
 * Shape a list of ActiveEffect changes for rendering in the sheet/template.
 * Adds valueType to each change so the template can render the appropriate input widget.
 * This is a thin layer to avoid reading CONFIG during render and to keep sheets minimal.
 * @param {Array<{key:string,value:any}>} changes
 * @returns {Array<{key:string,value:any,valueType?:'boo'|'flo'|'int'|'str'|}>}
 */
export function shapeEffectChangesForRender(changes=[]) {
  return (changes || []).map((c) => {
    const meta = getEffectChangeMeta(c.key) || {};
    const hasType = c?.type !== undefined && c?.type !== null && c?.type !== '';
    const hasPriority = c?.priority !== undefined && c?.priority !== null && c?.priority !== '';
    return {
      ...c,
      valueType: meta.valueType,
      type: hasType ? c.type : meta.type,
      priority: hasPriority ? c.priority : meta.priority,
    };
  });
}
