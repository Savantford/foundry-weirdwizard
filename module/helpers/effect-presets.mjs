// Effect change metadata registry (label-keyed). Example: "boons.str" -> { type, valueType, priority }
const changePresets = {};

// Back-compat clearer alias; prefer this in new code
export { changePresets as effectChangePresetData };

const EFFECT_CHANGE_PRESET_DATA = {
  boons: {
    header: 'WW.Effect.ChangePresets.Boons.Header',
    options: {
      'boons.str': {
        key: 'system.boons.selfRoll.str',
        label: 'WW.Effect.ChangePresets.Boons.Strength'
      },
      'boons.agi': {
        key: 'system.boons.selfRoll.agi',
        label: 'WW.Effect.ChangePresets.Boons.Agility'
      },
      'boons.int': {
        key: 'system.boons.selfRoll.int',
        label: 'WW.Effect.ChangePresets.Boons.Intellect'
      },
      'boons.wil': {
        key: 'system.boons.selfRoll.wil',
        label: 'WW.Effect.ChangePresets.Boons.Will'
      },
      'boons.luck': {
        key: 'system.boons.selfRoll.luck',
        label: 'WW.Effect.ChangePresets.Boons.Luck'
      },
      'boons.attacks': {
        key: 'system.boons.selfRoll.attacks',
        label: 'WW.Effect.ChangePresets.Boons.Attacks'
      },
      'boons.spells': {
        key: 'system.boons.selfRoll.spells',
        label: 'WW.Effect.ChangePresets.Boons.Spells'
      },
      'boons.resistMagical': {
        key: 'system.boons.selfRoll.resistMagical',
        label: 'WW.Effect.ChangePresets.Boons.ResistMagical'
      }
    }
  },
  banes: {
    header: 'WW.Effect.ChangePresets.Banes.Header',
    options: {
      'banes.str': {
        key: 'system.boons.selfRoll.str',
        label: 'WW.Effect.ChangePresets.Banes.Strength'
      },
      'banes.agi': {
        key: 'system.boons.selfRoll.agi',
        label: 'WW.Effect.ChangePresets.Banes.Agility'
      },
      'banes.int': {
        key: 'system.boons.selfRoll.int',
        label: 'WW.Effect.ChangePresets.Banes.Intellect'
      },
      'banes.wil': {
        key: 'system.boons.selfRoll.wil',
        label: 'WW.Effect.ChangePresets.Banes.Will'
      },
      'banes.luck': {
        key: 'system.boons.selfRoll.luck',
        label: 'WW.Effect.ChangePresets.Banes.Luck'
      },
      'banes.attacks': {
        key: 'system.boons.selfRoll.attacks',
        label: 'WW.Effect.ChangePresets.Banes.Attacks'
      },
      'banes.spells': {
        key: 'system.boons.selfRoll.spells',
        label: 'WW.Effect.ChangePresets.Banes.Spells'
      },
      'banes.resistMagical': {
        key: 'system.boons.selfRoll.resistMagical',
        label: 'WW.Effect.ChangePresets.Banes.ResistMagical'
      }
    }
  },
  autoFail: {
    header: 'WW.Effect.ChangePresets.AutoFail.Header',
    options: {
      'autoFail.str': {
        key: 'system.autoFail.str',
        label: 'WW.Effect.ChangePresets.AutoFail.Strength'
      },
      'autoFail.agi': {
        key: 'system.autoFail.agi',
        label: 'WW.Effect.ChangePresets.AutoFail.Agility'
      },
      'autoFail.int': {
        key: 'system.autoFail.int',
        label: 'WW.Effect.ChangePresets.AutoFail.Intellect'
      },
      'autoFail.wil': {
        key: 'system.autoFail.wil',
        label: 'WW.Effect.ChangePresets.AutoFail.Will'
      }
    }
  },
  boonsAgainst: {
    header: 'WW.Effect.ChangePresets.BoonsAgainst.Header',
    options: {
      'boonsAgainst.def': {
        key: 'system.boons.against.def',
        label: 'WW.Effect.ChangePresets.BoonsAgainst.Defense'
      },
      'boonsAgainst.str': {
        key: 'system.boons.against.str',
        label: 'WW.Effect.ChangePresets.BoonsAgainst.Strength'
      },
      'boonsAgainst.agi': {
        key: 'system.boons.against.agi',
        label: 'WW.Effect.ChangePresets.BoonsAgainst.Agility'
      },
      'boonsAgainst.int': {
        key: 'system.boons.against.int',
        label: 'WW.Effect.ChangePresets.BoonsAgainst.Intellect'
      },
      'boonsAgainst.wil': {
        key: 'system.boons.against.wil',
        label: 'WW.Effect.ChangePresets.BoonsAgainst.Will'
      },
      'boonsAgainst.fromAttacks': {
        key: 'system.boons.against.fromAttacks',
        label: 'WW.Effect.ChangePresets.BoonsAgainst.FromAttacks'
      },
      'boonsAgainst.fromSpells': {
        key: 'system.boons.against.fromSpells',
        label: 'WW.Effect.ChangePresets.BoonsAgainst.FromSpells'
      },
      'boonsAgainst.fromMagical': {
        key: 'system.boons.against.fromMagical',
        label: 'WW.Effect.ChangePresets.BoonsAgainst.FromMagical'
      }
    }
  },
  banesAgainst: {
    header: 'WW.Effect.ChangePresets.BanesAgainst.Header',
    options: {
      'banesAgainst.def': {
        key: 'system.boons.against.def',
        label: 'WW.Effect.ChangePresets.BanesAgainst.Defense'
      },
      'banesAgainst.str': {
        key: 'system.boons.against.str',
        label: 'WW.Effect.ChangePresets.BanesAgainst.Strength'
      },
      'banesAgainst.agi': {
        key: 'system.boons.against.agi',
        label: 'WW.Effect.ChangePresets.BanesAgainst.Agility'
      },
      'banesAgainst.int': {
        key: 'system.boons.against.int',
        label: 'WW.Effect.ChangePresets.BanesAgainst.Intellect'
      },
      'banesAgainst.wil': {
        key: 'system.boons.against.wil',
        label: 'WW.Effect.ChangePresets.BanesAgainst.Will'
      },
      'banesAgainst.fromAttacks': {
        key: 'system.boons.against.fromAttacks',
        label: 'WW.Effect.ChangePresets.BanesAgainst.FromAttacks'
      },
      'banesAgainst.fromSpells': {
        key: 'system.boons.against.fromSpells',
        label: 'WW.Effect.ChangePresets.BanesAgainst.FromSpells'
      },
      'banesAgainst.fromMagical': {
        key: 'system.boons.against.fromMagical',
        label: 'WW.Effect.ChangePresets.BanesAgainst.FromMagical'
      }
    }
  },
  autoSuccessAgainst: {
    header: 'WW.Effect.ChangePresets.AutoSuccessAgainst.Header',
    options: {
      'autoSuccessAgainst.def': {
        key: 'system.autoSuccess.against.def',
        label: 'WW.Effect.ChangePresets.AutoSuccessAgainst.Defense'
      },
      'autoSuccessAgainst.str': {
        key: 'system.autoSuccess.against.str',
        label: 'WW.Effect.ChangePresets.AutoSuccessAgainst.Strength'
      },
      'autoSuccessAgainst.agi': {
        key: 'system.autoSuccess.against.agi',
        label: 'WW.Effect.ChangePresets.AutoSuccessAgainst.Agility'
      },
      'autoSuccessAgainst.int': {
        key: 'system.autoSuccess.against.int',
        label: 'WW.Effect.ChangePresets.AutoSuccessAgainst.Intellect'
      },
      'autoSuccessAgainst.wil': {
        key: 'system.autoSuccess.against.wil',
        label: 'WW.Effect.ChangePresets.AutoSuccessAgainst.Will'
      }
    }
  },
  extraDamage: {
    header: 'WW.Effect.ChangePresets.ExtraDamage.Header',
    options: {
      'extraDamage.dice': {
        key: 'system.extraDamage.attacks.dice',
        label: 'WW.Effect.ChangePresets.ExtraDamage.Dice'
      },
      'extraDamage.mod': {
        key: 'system.extraDamage.attacks.mod',
        label: 'WW.Effect.ChangePresets.ExtraDamage.Mod'
      }
    }
  },
  defense: {
    header: 'WW.Effect.ChangePresets.Defense.Header',
    options: {
      'defense.override': {
        key: 'system.stats.defense.override',
        label: 'WW.Effect.ChangePresets.Defense.Override'
      },
      'defense.bonus': {
        key: 'system.stats.defense.bonus',
        label: 'WW.Effect.ChangePresets.Defense.Bonus'
      },
      'defense.armored': {
        key: 'system.stats.defense.armored',
        label: 'WW.Effect.ChangePresets.Defense.Armored'
      },
      'defense.armoredIncrease': {
        key: 'system.stats.defense.armored',
        label: 'WW.Effect.ChangePresets.Defense.ArmoredIncrease'
      },
      'defense.natural': {
        key: 'system.stats.defense.natural',
        label: 'WW.Effect.ChangePresets.Defense.Natural'
      },
      'defense.naturalIncrease': {
        key: 'system.stats.defense.natural',
        label: 'WW.Effect.ChangePresets.Defense.NaturalIncrease'
      },
      'defense.naturalReduce': {
        key: 'system.stats.defense.natural',
        label: 'WW.Effect.ChangePresets.Defense.NaturalReduce'
      }
    }
  },
  health: {
    header: 'WW.Effect.ChangePresets.Health.Header',
    options: {
      'health.tempIncrease': {
        key: 'system.stats.health.current',
        label: 'WW.Effect.ChangePresets.Health.TempIncrease'
      },
      'health.tempReduce': {
        key: 'system.stats.health.current',
        label: 'WW.Effect.ChangePresets.Health.TempReduce'
      },
      'health.override': {
        key: 'system.stats.health.override',
        label: 'WW.Effect.ChangePresets.Health.Override'
      },
      'health.starting': {
        key: 'system.stats.health.normal',
        label: 'WW.Effect.ChangePresets.Health.Starting'
      },
      'health.increase': {
        key: 'system.stats.health.normal',
        label: 'WW.Effect.ChangePresets.Health.Increase'
      }
    }
  },
  speed: {
    header: 'WW.Effect.ChangePresets.Speed.Header',
    options: {
      'speed.tempIncrease': {
        key: 'system.stats.speed.current',
        label: 'WW.Effect.ChangePresets.Speed.TempIncrease'
      },
      'speed.tempReduce': {
        key: 'system.stats.speed.current',
        label: 'WW.Effect.ChangePresets.Speed.TempReduce'
      },
      'speed.halved': {
        key: 'system.stats.speed.halved',
        label: 'WW.Effect.ChangePresets.Speed.Halved'
      },
      'speed.downgrade': {
        key: 'system.stats.speed.override',
        label: 'WW.Effect.ChangePresets.Speed.Downgrade'
      },
      'speed.override': {
        key: 'system.stats.speed.override',
        label: 'WW.Effect.ChangePresets.Speed.Override'
      },
      'speed.normal': {
        key: 'system.stats.speed.normal',
        label: 'WW.Effect.ChangePresets.Speed.Normal'
      },
      'speed.increase': {
        key: 'system.stats.speed.normal',
        label: 'WW.Effect.ChangePresets.Speed.Increase'
      }
    }
  },
  size: {
    header: 'WW.Effect.ChangePresets.Size.Header',
    options: {
      'size.increase': {
        key: 'system.stats.size',
        label: 'WW.Effect.ChangePresets.Size.Increase'
      },
      'size.override': {
        key: 'system.stats.size',
        label: 'WW.Effect.ChangePresets.Size.Override'
      },
      'size.normal': {
        key: 'system.stats.size',
        label: 'WW.Effect.ChangePresets.Size.Normal'
      },
    }
  },
  bonusDamage: {
    header: 'WW.Effect.ChangePresets.BonusDamage.Header',
    options: {
      'bonusDamage.increase': {
        key: 'system.stats.bonusdamage',
        label: 'WW.Effect.ChangePresets.BonusDamage.Increase'
      }
    }
  },
  upgradeAttribute: {
    header: 'WW.Effect.ChangePresets.UpgradeAttribute.Header',
    options: {
      'upgradeAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.Effect.ChangePresets.UpgradeAttribute.Strength'
      },
      'upgradeAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.Effect.ChangePresets.UpgradeAttribute.Agility'
      },
      'upgradeAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.Effect.ChangePresets.UpgradeAttribute.Intellect'
      },
      'upgradeAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.Effect.ChangePresets.UpgradeAttribute.Will'
      }
    }
  },
  downgradeAttribute: {
    header: 'WW.Effect.ChangePresets.DowngradeAttribute.Header',
    options: {
      'downgradeAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.Effect.ChangePresets.DowngradeAttribute.Strength'
      },
      'downgradeAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.Effect.ChangePresets.DowngradeAttribute.Agility'
      },
      'downgradeAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.Effect.ChangePresets.DowngradeAttribute.Intellect'
      },
      'downgradeAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.Effect.ChangePresets.DowngradeAttribute.Will'
      }
    }
  },
  overrideAttribute: {
    header: 'WW.Effect.ChangePresets.OverrideAttribute.Header',
    options: {
      'overrideAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.Effect.ChangePresets.OverrideAttribute.Strength'
      },
      'overrideAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.Effect.ChangePresets.OverrideAttribute.Agility'
      },
      'overrideAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.Effect.ChangePresets.OverrideAttribute.Intellect'
      },
      'overrideAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.Effect.ChangePresets.OverrideAttribute.Will'
      }
    }
  },
  increaseAttribute: {
    header: 'WW.Effect.ChangePresets.IncreaseAttribute.Header',
    options: {
      'increaseAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.Effect.ChangePresets.IncreaseAttribute.Strength'
      },
      'increaseAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.Effect.ChangePresets.IncreaseAttribute.Agility'
      },
      'increaseAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.Effect.ChangePresets.IncreaseAttribute.Intellect'
      },
      'increaseAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.Effect.ChangePresets.IncreaseAttribute.Will'
      }
    }
  },
  reduceAttribute: {
    header: 'WW.Effect.ChangePresets.ReduceAttribute.Header',
    options: {
      'reduceAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.Effect.ChangePresets.ReduceAttribute.Strength'
      },
      'reduceAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.Effect.ChangePresets.ReduceAttribute.Agility'
      },
      'reduceAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.Effect.ChangePresets.ReduceAttribute.Intellect'
      },
      'reduceAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.Effect.ChangePresets.ReduceAttribute.Will'
      }
    }
  },
  /* List Entries */
  descriptors: {
    header: "WW.ListEntry.Descriptor.Label",
    options: {
      'descriptors.add': {
        key: 'system.listEntries.descriptors',
        label: "WW.ListEntry.Descriptor.Create"
      },
      'descriptors.remove': {
        key: 'system.listEntries.descriptors',
        label: "Remove language"
      }
    }
  },
  immunities: {
    header: "WW.ListEntry.Immunity.Label",
    options: {
      'immunities.add': {
        key: 'system.listEntries.immunities',
        label: "WW.ListEntry.Immunity.Create"
      },
      'immunities.remove': {
        key: 'system.listEntries.immunities',
        label: "Remove language"
      }
    }
  },
  languages: {
    header: "WW.ListEntry.Language.Label",
    options: {
      'languages.add': {
        key: 'system.listEntries.languages',
        label: "WW.ListEntry.Language.Create"
      },
      'languages.remove': {
        key: 'system.listEntries.languages',
        label: "Remove language"
      }
    }
  },
  movementTraits: {
    header: "WW.ListEntry.MovementTrait.Label",
    options: {
      'movementTraits.add': {
        key: 'system.listEntries.movementTraits',
        label: "WW.ListEntry.MovementTrait.Create"
      },
      'movementTraits.remove': {
        key: 'system.listEntries.movementTraits',
        label: "Remove language"
      }
    }
  },
  senses: {
    header: "WW.ListEntry.Sense.Label",
    options: {
      'senses.add': {
        key: 'system.listEntries.senses',
        label: "WW.ListEntry.Sense.Create"
      },
      'senses.remove': {
        key: 'system.listEntries.senses',
        label: "Remove language"
      }
    }
  }
}

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

  for (const [, value] of Object.entries(EFFECT_CHANGE_PRESET_DATA)) {
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
