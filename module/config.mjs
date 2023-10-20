//import { i18n } from './helpers/utils.mjs';

export const WW = {}

// Define Constants
WW.attributes = {
  'str': 'WW.Strength',
  'agi': 'WW.Agility',
  'int': 'WW.Intellect',
  'wil': 'WW.Will'
}

WW.details = {
  'features': 'WW.Features',
  'personality': 'WW.Personality',
  'belief': 'WW.Belief',
  /*'professions': 'WW.Professions',
  'languages': 'WW.Languages',*/
  /*'information': 'WW.Information',
  'bg_ancestry': 'WW.Ancestry',
  'deeds': 'WW.Deeds'*/
}

// Dropdown menus
WW.dropdownNumbers = {
  '⅛': '⅛',
  '¼': '¼',
  '½': '½',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
}

WW.rollAttributes = {
  '': 'WW.Dont',
  'str': 'WW.Strength',
  'agi': 'WW.Agility',
  'int': 'WW.Intellect',
  'wil': 'WW.Will',
  'luck': 'WW.Luck'
}

WW.rollAgainst = {
  '': 'WW.DontAgainst',
  'def': 'WW.Defense.Label',
  'str': 'WW.Strength',
  'agi': 'WW.Agility',
  'int': 'WW.Intellect',
  'wil': 'WW.Will'
}

WW.instantLabels = {
  'damage': 'WW.InstantEffect.Damage',
  'heal': 'WW.InstantEffect.Heal',
  'healthLose': 'WW.InstantEffect.HealthLose',
  'healthRecover': 'WW.InstantEffect.HealthRecover',
  'affliction': 'WW.InstantEffect.Affliction'
}

WW.instantIcons = {
  'damage': 'icons/svg/explosion.svg',
  'heal': 'icons/svg/heal.svg',
  'healthLose': 'icons/svg/degen.svg',
  'healthRecover': 'icons/svg/regen.svg',
  'affliction': 'icons/svg/skull.svg'
}

WW.instantTriggers = {
  'onUse': 'WW.Effect.OnUse',
  'onSuccess': 'WW.Effect.OnSuccess',
  'onCritical': 'WW.Effect.OnCritical',
  'onFailure': 'WW.Effect.OnFailure'
}

WW.bestowAfflictions = {
  /*'': 'WW.InstantEffect.DontBestow',*/
  'Blinded': 'WW.Blinded',
  'Confused': 'WW.Confused',
  'Controlled': 'WW.Controlled',
  'Cursed': 'WW.Cursed',
  'Deafened': 'WW.Deafened',
  'Frightened': 'WW.Frightened',
  'Held': 'WW.Held',
  'ImpairedStr': 'WW.ImpairedStr',
  'ImpairedAgi': 'WW.ImpairedAgi',
  'ImpairedInt': 'WW.ImpairedInt',
  'ImpairedWil': 'WW.ImpairedWil',
  'OnFire': 'WW.OnFire',
  'Poisoned': 'WW.Poisoned',
  'Prone': 'WW.Prone',
  'Stunned': 'WW.Stunned',
  'Unconscious': 'WW.Unconscious',
  'Asleep': 'WW.Asleep',
  'Weakened': 'WW.Weakened',
}

WW.effectTriggers = {
  'passive': 'WW.Effect.Passive',
  'onUse': 'WW.Effect.OnUse',
  'onSuccess': 'WW.Effect.OnSuccess',
  'onCritical': 'WW.Effect.OnCritical',
  'onFailure': 'WW.Effect.OnFailure'
}

WW.effectTargets = {
  'none': 'WW.Effect.None',
  'tokens': 'WW.Effect.Tokens',
  'area': 'WW.Effect.Area',
  'areaAlly': 'WW.Effect.AreaAlly',
  'areaEnemy': 'WW.Effect.AreaEnemy'
}

WW.dropdownSubtypes = {
  'trait': 'WW.TalentSubtypes.Trait',
  'aura': 'WW.TalentSubtypes.Aura',
  'action': 'WW.TalentSubtypes.Action',
  'reaction': 'WW.TalentSubtypes.Reaction',
  'end': 'WW.TalentSubtypes.End',
  'fury': 'WW.TalentSubtypes.Fury',
};

WW.talentSources = {
  'None': 'WW.TalentSources.None',
  'Ancestry': 'WW.TalentSources.Ancestry',
  'Novice': 'WW.TalentSources.Novice',
  'Expert': 'WW.TalentSources.Expert',
  'Master': 'WW.TalentSources.Master',
  'Magical': 'WW.TalentSources.Magical',
  'Other': 'WW.TalentSources.Other'
};

WW.dropdownFrequencies = {
  'day': 'WW.FrequencyChoices.Day',
  'hour': 'WW.FrequencyChoices.Hour',
  'minute': 'WW.FrequencyChoices.Minute',
  'round': 'WW.FrequencyChoices.Round'
};

WW.dropdownTiers = {
  'Novice': 'WW.Novice',
  'Expert': 'WW.Expert',
  'Master': 'WW.Master'
};

WW.coins = {
  'cp': 'WW.Coins.CP',
  'sp': 'WW.Coins.SP',
  'gp': 'WW.Coins.GP'
};

WW.itemSubtypes = {
  'generic': 'WW.Generic',
  'weapon': 'WW.Weapon.Label',
  'armor': 'WW.Armor.Label',
  'consumable': 'WW.Consumable',
  'container': 'WW.Container'
};

WW.itemQualities = {
  'standard': 'WW.QualityStandard',
  'superior': 'WW.QualitySuperior',
  'inferior': 'WW.QualityInferior'
};

WW.weaponGrip = {
  'One': 'WW.Weapon.GripOne',
  'Two': 'WW.Weapon.GripTwo',
  'Off': 'WW.Weapon.GripOff'
};

WW.weaponProperties = {
  'ammunition': {
    'label': 'WW.Properties.Ammunition.Label',
    'tip': 'WW.Properties.Ammunition.Tip',
    'path': 'system.properties.ammunition',
  },
  'brutal': {
    'label': 'WW.Properties.Brutal.Label',
    'tip': 'WW.Properties.Brutal.Tip',
    'path': 'system.properties.brutal',
  },
  'concussing': {
    'label': 'WW.Properties.Concussing.Label',
    'tip': 'WW.Properties.Concussing.Tip',
    'path': 'system.properties.concussing',
  },
  'disarming': {
    'label': 'WW.Properties.Disarming.Label',
    'tip': 'WW.Properties.Disarming.Tip',
    'path': 'system.properties.disarming',
  },
  'driving': {
    'label': 'WW.Properties.Driving.Label',
    'tip': 'WW.Properties.Driving.Tip',
    'path': 'system.properties.driving',
  },
  'fast': {
    'label': 'WW.Properties.Fast.Label',
    'tip': 'WW.Properties.Fast.Tip',
    'path': 'system.properties.fast',
  },
  'firearm': {
    'label': 'WW.Properties.Firearm.Label',
    'tip': 'WW.Properties.Firearm.Tip',
    'path': 'system.properties.firearm',
  },
  'great': {
    'label': 'WW.Properties.Great.Label',
    'tip': 'WW.Properties.Great.Tip',
    'path': 'system.properties.great',
  },
  'light': {
    'label': 'WW.Properties.Light.Label',
    'tip': 'WW.Properties.Light.Tip',
    'path': 'system.properties.light',
  },
  'long': {
    'label': 'WW.Properties.Long.Label',
    'tip': 'WW.Properties.Long.Tip',
    'path': 'system.properties.long',
  },
  'nimble': {
    'label': 'WW.Properties.Nimble.Label',
    'tip': 'WW.Properties.Nimble.Tip',
    'path': 'system.properties.nimble',
  },
  'painful': {
    'label': 'WW.Properties.Painful.Label',
    'tip': 'WW.Properties.Painful.Tip',
    'path': 'system.properties.painful',
  },
  'precise': {
    'label': 'WW.Properties.Precise.Label',
    'tip': 'WW.Properties.Precise.Tip',
    'path': 'system.properties.precise',
  },
  'range': {
    'label': 'WW.Properties.Range.Label',
    'tip': 'WW.Properties.Range.Tip',
    'path': 'system.properties.range',
  },
  'reload': {
    'label': 'WW.Properties.Reload.Label',
    'tip': 'WW.Properties.Reload.Tip',
    'path': 'system.properties.reload'
  },
  'sharp': {
    'label': 'WW.Properties.Sharp.Label',
    'tip': 'WW.Properties.Sharp.Tip',
    'path': 'system.properties.sharp',
  },
  'shattering': {
    'label': 'WW.Properties.Shattering.Label',
    'tip': 'WW.Properties.Shattering.Tip',
    'path': 'system.properties.shattering',
  },
  'slow': {
    'label': 'WW.Properties.Slow.Label',
    'tip': 'WW.Properties.Slow.Tip',
    'path': 'system.properties.slow',
  },
  'special': {
    'label': 'WW.Properties.Special.Label',
    'tip': 'WW.Properties.Special.Tip',
    'path': 'system.properties.special',
  },
  'thrown': {
    'label': 'WW.Properties.Thrown.Label',
    'tip': 'WW.Properties.Thrown.Tip',
    'path': 'system.properties.thrown',
  },
  'unbalancing': {
    'label': 'WW.Properties.Unbalancing.Label',
    'tip': 'WW.Properties.Unbalancing.Tip',
    'path': 'system.properties.unbalancing',
  },
  'versatile': {
    'label': 'WW.Properties.Versatile.Label',
    'tip': 'WW.Properties.Versatile.Tip',
    'path': 'system.properties.versatile',
  }
};

WW.effectCategories = {
  'boons': 'WW.EffectKeys.Headers.Boons',
  'banes': 'WW.EffectKeys.Headers.Banes',
  'autoFail': 'WW.EffectKeys.Headers.AutoFail',
  'boonAgainst': 'WW.EffectKeys.Headers.BoonsAgainst',
  'extraDamage': 'WW.EffectKeys.Headers.ExtraDamage',
  'defense': 'WW.EffectKeys.Headers.Defense',
  'health': 'WW.EffectKeys.Headers.Health',
  'speed': 'WW.EffectKeys.Headers.Speed',
  'attribute': 'WW.EffectKeys.Headers.Attribute'
}

WW.effOptions = {
  boons: {
    header: 'WW.EffectKeys.Boons.Header',
    options: {
      'boons.str': {
        key: 'system.boons.attributes.str.global',
        label: 'WW.EffectKeys.Boons.Strength'
      },
      'boons.agi': {
        key: 'system.boons.attributes.agi.global',
        label: 'WW.EffectKeys.Boons.Agility'
      },
      'boons.int': {
        key: 'system.boons.attributes.int.global',
        label: 'WW.EffectKeys.Boons.Intellect'
      },
      'boons.wil': {
        key: 'system.boons.attributes.wil.global',
        label: 'WW.EffectKeys.Boons.Will'
      },
      'boons.luck': {
        key: 'system.boons.attributes.luck.global',
        label: 'WW.EffectKeys.Boons.Luck'
      },
      'boons.attack': {
        key: 'system.boons.attacks.global',
        label: 'WW.EffectKeys.Boons.Attack'
      }
    }
  },
  banes: {
    header: 'WW.EffectKeys.Banes.Header',
    options: {
      'banes.str': {
        key: 'system.boons.attributes.str.global',
        label: 'WW.EffectKeys.Banes.Strength'
      },
      'banes.agi': {
        key: 'system.boons.attributes.agi.global',
        label: 'WW.EffectKeys.Banes.Agility'
      },
      'banes.int': {
        key: 'system.boons.attributes.int.global',
        label: 'WW.EffectKeys.Banes.Intellect'
      },
      'banes.wil': {
        key: 'system.boons.attributes.wil.global',
        label: 'WW.EffectKeys.Banes.Will'
      },
      'banes.luck': {
        key: 'system.boons.attributes.luck.global',
        label: 'WW.EffectKeys.Banes.Luck'
      },
      'banes.attack': {
        key: 'system.boons.attacks.global',
        label: 'WW.EffectKeys.Banes.Attack'
      }
    }
  },
  autoFail: {
    header: 'WW.EffectKeys.AutoFail.Header',
    options: {
      'autoFail.str': {
        key: 'system.autoFail.str',
        label: 'WW.EffectKeys.AutoFail.Strength'
      },
      'autoFail.agi': {
        key: 'system.autoFail.agi',
        label: 'WW.EffectKeys.AutoFail.Agility'
      },
      'autoFail.int': {
        key: 'system.autoFail.int',
        label: 'WW.EffectKeys.AutoFail.Intellect'
      },
      'autoFail.wil': {
        key: 'system.autoFail.wil',
        label: 'WW.EffectKeys.AutoFail.Will'
      }
    }
  },
  boonsAgainst: {
    header: 'WW.EffectKeys.BoonsAgainst.Header',
    options: {
      'boonsAgainst.def': {
        key: 'system.boons.against.def',
        label: 'WW.EffectKeys.BoonsAgainst.Defense'
      },
      'boonsAgainst.str': {
        key: 'system.boons.against.str',
        label: 'WW.EffectKeys.BoonsAgainst.Strength'
      },
      'boonsAgainst.agi': {
        key: 'system.boons.against.agi',
        label: 'WW.EffectKeys.BoonsAgainst.Agility'
      },
      'boonsAgainst.int': {
        key: 'system.boons.against.int',
        label: 'WW.EffectKeys.BoonsAgainst.Intellect'
      },
      'boonsAgainst.wil': {
        key: 'system.boons.against.wil',
        label: 'WW.EffectKeys.BoonsAgainst.Will'
      }
    }
  },
  extraDamage: {
    header: 'WW.EffectKeys.ExtraDamage.Header',
    options: {
      'extraDamage.dice': {
        key: 'system.extraDamage.attacks.dice',
        label: 'WW.EffectKeys.ExtraDamage.Dice'
      },
      'extraDamage.mod': {
        key: 'system.extraDamage.attack.mod',
        label: 'WW.EffectKeys.ExtraDamage.Mod'
      }
    }
  },
  defense: {
    header: 'WW.EffectKeys.Defense.Header',
    options: {
      'defense.override': {
        key: 'system.stats.defense.total',
        label: 'WW.EffectKeys.Defense.Override'
      },
      'defense.bonus': {
        key: 'system.stats.defense.bonus',
        label: 'WW.EffectKeys.Defense.Bonus'
      },
      'defense.armored': {
        key: 'system.stats.defense.armored',
        label: 'WW.EffectKeys.Defense.Armored'
      },
      'defense.natural': {
        key: 'system.stats.defense.natural',
        label: 'WW.EffectKeys.Defense.Natural'
      },
      'defense.naturalIncrease': {
        key: 'system.stats.defense.natural',
        label: 'WW.EffectKeys.Defense.NaturalIncrease'
      },
      'defense.naturalReduce': {
        key: 'system.stats.defense.natural',
        label: 'WW.EffectKeys.Defense.NaturalReduce'
      }
    }
  },
  health: {
    header: 'WW.EffectKeys.Health.Header',
    options: {
      'health.tempIncrease': {
        key: 'system.stats.health.current',
        label: 'WW.EffectKeys.Health.TempIncrease'
      },
      'health.tempReduce': {
        key: 'system.stats.health.current',
        label: 'WW.EffectKeys.Health.TempReduce'
      },
      'health.override': {
        key: 'system.stats.health.normal',
        label: 'WW.EffectKeys.Health.Override'
      },
      'health.increase': {
        key: 'system.stats.health.normal',
        label: 'WW.EffectKeys.Health.Increase'
      }
    }
  },
  speed: {
    header: 'WW.EffectKeys.Speed.Header',
    options: {
      'speed.tempIncrease': {
        key: 'system.stats.speed.current',
        label: 'WW.EffectKeys.Speed.TempIncrease'
      },
      'speed.tempReduce': {
        key: 'system.stats.speed.current',
        label: 'WW.EffectKeys.Speed.TempReduce'
      },
      'speed.halved': {
        key: 'system.stats.speed.halved',
        label: 'WW.EffectKeys.Speed.Halved'
      },
      'speed.override': {
        key: 'system.stats.speed.normal',
        label: 'WW.EffectKeys.Speed.Override'
      },
      'speed.increase': {
        key: 'system.stats.speed.normal',
        label: 'WW.EffectKeys.Speed.Increase'
      }
    }
  },
  size: {
    header: 'WW.EffectKeys.Size.Header',
    options: {
      'size.increase': {
        key: 'system.stats.size',
        label: 'WW.EffectKeys.Size.Increase'
      },
      'size.override': {
        key: 'system.stats.size',
        label: 'WW.EffectKeys.Size.Override'
      }
    }
  },
  upgradeAttribute: {
    header: 'WW.EffectKeys.UpgradeAttribute.Header',
    options: {
      'upgradeAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.EffectKeys.UpgradeAttribute.Strength'
      },
      'upgradeAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.EffectKeys.UpgradeAttribute.Agility'
      },
      'upgradeAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.EffectKeys.UpgradeAttribute.Intellect'
      },
      'upgradeAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.EffectKeys.UpgradeAttribute.Will'
      }
    }
  },
  downgradeAttribute: {
    header: 'WW.EffectKeys.DowngradeAttribute.Header',
    options: {
      'downgradeAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.EffectKeys.DowngradeAttribute.Strength'
      },
      'downgradeAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.EffectKeys.DowngradeAttribute.Agility'
      },
      'downgradeAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.EffectKeys.DowngradeAttribute.Intellect'
      },
      'downgradeAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.EffectKeys.DowngradeAttribute.Will'
      }
    }
  },
  overrideAttribute: {
    header: 'WW.EffectKeys.OverrideAttribute.Header',
    options: {
      'overrideAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.EffectKeys.OverrideAttribute.Strength'
      },
      'overrideAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.EffectKeys.OverrideAttribute.Agility'
      },
      'overrideAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.EffectKeys.OverrideAttribute.Intellect'
      },
      'overrideAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.EffectKeys.OverrideAttribute.Will'
      }
    }
  },
}

WW.armorTypes = {
  'light': 'WW.Armor.Light',
  'medium': 'WW.Armor.Medium',
  'heavy': 'WW.Armor.Heavy'
}

WW.armor = {
  'unarmored': {
    'label': 'WW.Armor.Unarmored',
    'def': null,
    'bonus': null,
    'type': null
  },
  'padded': {
    'label': 'WW.Armor.Padded',
    'def': 11,
    'bonus': null,
    'type': 'Light'
  },
  'leather': {
    'label': 'WW.Armor.Leather',
    'def': 12,
    'bonus': 1,
    'type': 'Light'
  },
  'brigandine': {
    'label': 'WW.Armor.Brigandine',
    'def': 13,
    'bonus': 1,
    'type': 'Light'
  },
  'ring': {
    'label': 'WW.Armor.Ring',
    'def': 14,
    'bonus': 2,
    'type': 'Medium'
  },
  'mail': {
    'label': 'WW.Armor.Mail',
    'def': 15,
    'bonus': null,
    'type': 'Medium'
  },
  'plateAndMail': {
    'label': 'WW.Armor.PlateAndMail',
    'def': 16,
    'bonus': null,
    'type': 'Medium'
  },
  'breastplate': {
    'label': 'WW.Armor.Breastplate',
    'def': 16,
    'bonus': 3,
    'type': 'Heavy'
  },
  'plate': {
    'label': 'WW.Armor.Plate',
    'def': 17,
    'bonus': null,
    'type': 'Heavy'
  },
  'fullPlate': {
    'label': 'WW.Armor.FullPlate', 
    'def': 18,
    'bonus': null,
    'type': 'Heavy'
  }
};
