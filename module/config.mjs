export const WW = {}

// Define Constants
WW.ATTRIBUTES = {
  'str': 'WW.Strength',
  'agi': 'WW.Agility',
  'int': 'WW.Intellect',
  'wil': 'WW.Will'
}

WW.PROFESSION_CATEGORIES = {
  'commoner': 'WW.Professions.Commoner',
  'academic': 'WW.Professions.Academic',
  'aristocratic': 'WW.Professions.Aristrocratic',
  'criminal': 'WW.Professions.Criminal',
  'entertainment': 'WW.Professions.Entertainment',
  'military': 'WW.Professions.Military',
  'religious': 'WW.Professions.Religious',
  'wilderness': 'WW.Professions.Wilderness'
}

// Dropdown menus
WW.dropdownNumbers = {
  0.125: '⅛',
  0.25: '¼',
  0.5: '½',
  1.0: '1',
  2.0: '2',
  3.0: '3',
  4.0: '4',
  5.0: '5',
  6.0: '6',
  7.0: '7',
  8.0: '8',
  9.0: '9',
  10.0: '10',
  11.0: '11',
  12.0: '12',
}

WW.rollAttributes = {
  '': 'WW.Roll.Dont',
  'str': 'WW.Strength',
  'agi': 'WW.Agility',
  'int': 'WW.Intellect',
  'wil': 'WW.Will',
  'luck': 'WW.Luck'
}

WW.rollAgainst = {
  '': 'WW.Roll.AgainstDefault',
  'def': 'WW.Defense.Label',
  'str': 'WW.Strength',
  'agi': 'WW.Agility',
  'int': 'WW.Intellect',
  'wil': 'WW.Will'
}

WW.TARGETING_METHODS = {
  'manual': 'WW.Targeting.Manual',
  'template': 'WW.Targeting.Template'
  /*'': 'WW.Roll.Targeting.Disable'*/
}

WW.TEMPLATE_TYPES = {
  'size': 'WW.Targeting.Size',
  'spread': 'WW.Targeting.Spread'
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

WW.WEAPON_REQUIREMENTS = {
  '': 'WW.Weapon.Requirements.None',
  'str10': 'WW.Weapon.Requirements.Str10',
  'str12': 'WW.Weapon.Requirements.Str12',
  'str14': 'WW.Weapon.Requirements.Str14',
  'agi11': 'WW.Weapon.Requirements.Agi11',
  'agi12': 'WW.Weapon.Requirements.Agi12',
  'agi14': 'WW.Weapon.Requirements.Agi14',
  'int10agi12': 'WW.Weapon.Requirements.Int10Agi12',
};

WW.WEAPON_GRIPS = {
  'One': 'WW.Weapon.GripOne',
  'Two': 'WW.Weapon.GripTwo',
  'Off': 'WW.Weapon.GripOff'
};

WW.WEAPON_TRAITS = {
  'ammunition': {
    'label': 'WW.Weapon.Traits.Ammunition.Label',
    'tip': 'WW.Weapon.Traits.Ammunition.Tip',
    'path': 'system.traits.ammunition',
  },
  'bludgeoning': {
    'label': 'WW.Weapon.Traits.Bludgeoning.Label',
    'tip': 'WW.Weapon.Traits.Bludgeoning.Tip',
    'path': 'system.traits.bludgeoning',
  },
  'brutal': {
    'label': 'WW.Weapon.Traits.Brutal.Label',
    'tip': 'WW.Weapon.Traits.Brutal.Tip',
    'path': 'system.traits.brutal',
  },
  'cumbersome': {
    'label': 'WW.Weapon.Traits.Cumbersome.Label',
    'tip': 'WW.Weapon.Traits.Cumbersome.Tip',
    'path': 'system.traits.cumbersome',
  },
  'disarming': {
    'label': 'WW.Weapon.Traits.Disarming.Label',
    'tip': 'WW.Weapon.Traits.Disarming.Tip',
    'path': 'system.traits.disarming',
  },
  'firearm': {
    'label': 'WW.Weapon.Traits.Firearm.Label',
    'tip': 'WW.Weapon.Traits.Firearm.Tip',
    'path': 'system.traits.firearm',
  },
  'large': {
    'label': 'WW.Weapon.Traits.Large.Label',
    'tip': 'WW.Weapon.Traits.Large.Tip',
    'path': 'system.traits.large',
  },
  'light': {
    'label': 'WW.Weapon.Traits.Light.Label',
    'tip': 'WW.Weapon.Traits.Light.Tip',
    'path': 'system.traits.light',
  },
  'long': {
    'label': 'WW.Weapon.Traits.Long.Label',
    'tip': 'WW.Weapon.Traits.Long.Tip',
    'path': 'system.traits.long',
  },
  'misfire': {
    'label': 'WW.Weapon.Traits.Misfire.Label',
    'tip': 'WW.Weapon.Traits.Misfire.Tip',
    'path': 'system.traits.misfire',
  },
  'nimble': {
    'label': 'WW.Weapon.Traits.Nimble.Label',
    'tip': 'WW.Weapon.Traits.Nimble.Tip',
    'path': 'system.traits.nimble',
  },
  'piercing': {
    'label': 'WW.Weapon.Traits.Piercing.Label',
    'tip': 'WW.Weapon.Traits.Piercing.Tip',
    'path': 'system.traits.piercing',
  },
  'range': {
    'label': 'WW.Weapon.Traits.Range.Label',
    'tip': 'WW.Weapon.Traits.Range.Tip',
    'path': 'system.traits.range',
  },
  'reload': {
    'label': 'WW.Weapon.Traits.Reload.Label',
    'tip': 'WW.Weapon.Traits.Reload.Tip',
    'path': 'system.traits.reload'
  },
  'slashing': {
    'label': 'WW.Weapon.Traits.Slashing.Label',
    'tip': 'WW.Weapon.Traits.Slashing.Tip',
    'path': 'system.traits.slashing',
  },
  'slow': {
    'label': 'WW.Weapon.Traits.Slow.Label',
    'tip': 'WW.Weapon.Traits.Slow.Tip',
    'path': 'system.traits.slow',
  },
  'special': {
    'label': 'WW.Weapon.Traits.Special.Label',
    'tip': 'WW.Weapon.Traits.Special.Tip',
    'path': 'system.traits.special',
  },
  'thrown': {
    'label': 'WW.Weapon.Traits.Thrown.Label',
    'tip': 'WW.Weapon.Traits.Thrown.Tip',
    'path': 'system.traits.thrown',
  },
  'versatile': {
    'label': 'WW.Weapon.Traits.Versatile.Label',
    'tip': 'WW.Weapon.Traits.Versatile.Tip',
    'path': 'system.traits.versatile',
  }
};

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
}

WW.SPELLS_LEARNED = {
  '0': '—',
  '1n': 'WW.Spells.Learned.OneNovice',
  '2n': 'WW.Spells.Learned.TwoNovice',
  '3n': 'WW.Spells.Learned.ThreeNovice',
  '4n': 'WW.Spells.Learned.FourNovice',
  '1e': 'WW.Spells.Learned.OneExpert',
  '2e': 'WW.Spells.Learned.TwoExpert',
  '1m': 'WW.Spells.Learned.OneMaster'
}

/* Instant Effects */

WW.INSTANT_LABELS = {
  'damage': 'WW.InstantEffect.Damage',
  'heal': 'WW.InstantEffect.Heal',
  'healthLose': 'WW.InstantEffect.HealthLose',
  'healthRecover': 'WW.InstantEffect.HealthRecover',
  'affliction': 'WW.InstantEffect.Affliction'
}

WW.INSTANT_ICONS = {
  'damage': 'icons/svg/explosion.svg',
  'heal': 'icons/svg/heal.svg',
  'healthLose': 'icons/svg/degen.svg',
  'healthRecover': 'icons/svg/regen.svg',
  'affliction': 'icons/svg/skull.svg'
}

WW.INSTANT_TRIGGERS = {
  'onUse': 'WW.Effect.OnUse',
  'onSuccess': 'WW.Effect.OnSuccess',
  'onCritical': 'WW.Effect.OnCritical',
  'onFailure': 'WW.Effect.OnFailure'
}

WW.BESTOW_AFFLICTIONS = {
  /*'': 'WW.InstantEffect.DontBestow',*/
  'Blinded': 'WW.Affliction.Blinded',
  'Confused': 'WW.Affliction.Confused',
  'Controlled': 'WW.Affliction.Controlled',
  'Cursed': 'WW.Affliction.Cursed',
  'Deafened': 'WW.Affliction.Deafened',
  'Frightened': 'WW.Affliction.Frightened',
  'Held': 'WW.Affliction.Held',
  'ImpairedStr': 'WW.Affliction.ImpairedStr',
  'ImpairedAgi': 'WW.Affliction.ImpairedAgi',
  'ImpairedInt': 'WW.Affliction.ImpairedInt',
  'ImpairedWil': 'WW.Affliction.ImpairedWil',
  'OnFire': 'WW.Affliction.OnFire',
  'Poisoned': 'WW.Affliction.Poisoned',
  'Prone': 'WW.Affliction.Prone',
  'Stunned': 'WW.Affliction.Stunned',
  'Unconscious': 'WW.Affliction.Unconscious',
  'Asleep': 'WW.Affliction.Asleep',
  'Weakened': 'WW.Affliction.Weakened',
}

/* Active Effects */

WW.EFFECT_TRIGGERS = {
  'passive': 'WW.Effect.Passive',
  'onUse': 'WW.Effect.OnUse',
  'onSuccess': 'WW.Effect.OnSuccess',
  'onCritical': 'WW.Effect.OnCritical',
  'onFailure': 'WW.Effect.OnFailure'
}

WW.EFFECT_TARGETS = {
  'none': 'WW.Effect.None',
  'tokens': 'WW.Effect.Any',
  'enemies': 'WW.Effect.Enemies',
  'allies': 'WW.Effect.Allies'
}

WW.EFFECT_TARGETS_TARGETED = {
  'none': 'WW.Effect.NoneTargeted',
  'tokens': 'WW.Effect.AnyTargeted',
  'enemies': 'WW.Effect.EnemiesTargeted',
  'allies': 'WW.Effect.AlliesTargeted'
}

WW.EFFECT_DURATIONS = {
  combat: {
    header: 'WW.EffectDurations.Combat.Header',
    options: {
      'luckEnds': 'WW.EffectDurations.Combat.LuckEnds',
      '1round': 'WW.EffectDurations.Combat.1Round',
      '2rounds': 'WW.EffectDurations.Combat.2Rounds',
      'Xrounds': 'WW.EffectDurations.Combat.XRounds',
      'turnEnd': 'WW.EffectDurations.Combat.TurnEnd',
      'nextTriggerTurnStart': 'WW.EffectDurations.Combat.NextTriggerTurnStart',
      'nextTargetTurnStart': 'WW.EffectDurations.Combat.NextTargetTurnStart',
      'nextTriggerTurnEnd': 'WW.EffectDurations.Combat.NextTriggerTurnEnd',
      'nextTargetTurnEnd': 'WW.EffectDurations.Combat.NextTargetTurnEnd'
    }
  },
  outOfCombat: {
    header: 'WW.EffectDurations.OutOfCombat.Header',
    options: {
      '1minute': 'WW.EffectDurations.OutOfCombat.1Minute',
      'minutes': 'WW.EffectDurations.OutOfCombat.Minutes',
      'hours': 'WW.EffectDurations.OutOfCombat.Hours',
      'days': 'WW.EffectDurations.OutOfCombat.Days'
    }
  }
  
}

WW.EFFECT_OPTIONS = {
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
  banesAgainst: {
    header: 'WW.EffectKeys.BanesAgainst.Header',
    options: {
      'banesAgainst.def': {
        key: 'system.boons.against.def',
        label: 'WW.EffectKeys.BanesAgainst.Defense'
      },
      'banesAgainst.str': {
        key: 'system.boons.against.str',
        label: 'WW.EffectKeys.BanesAgainst.Strength'
      },
      'banesAgainst.agi': {
        key: 'system.boons.against.agi',
        label: 'WW.EffectKeys.BanesAgainst.Agility'
      },
      'banesAgainst.int': {
        key: 'system.boons.against.int',
        label: 'WW.EffectKeys.BanesAgainst.Intellect'
      },
      'banesAgainst.wil': {
        key: 'system.boons.against.wil',
        label: 'WW.EffectKeys.BanesAgainst.Will'
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
        key: 'system.stats.defense.override',
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
      'defense.armoredIncrease': {
        key: 'system.stats.defense.armored',
        label: 'WW.EffectKeys.Defense.ArmoredIncrease'
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
        key: 'system.stats.health.bonus',
        label: 'WW.EffectKeys.Health.TempIncrease'
      },
      'health.tempReduce': {
        key: 'system.stats.health.lost',
        label: 'WW.EffectKeys.Health.TempReduce'
      },
      'health.override': {
        key: 'system.stats.health.override',
        label: 'WW.EffectKeys.Health.Override'
      },
      'health.starting': {
        key: 'system.stats.health.normal',
        label: 'WW.EffectKeys.Health.Starting'
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
        key: 'system.stats.speed.current',
        label: 'WW.EffectKeys.Speed.Override'
      },
      'speed.normal': {
        key: 'system.stats.speed.normal',
        label: 'WW.EffectKeys.Speed.Normal'
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
      },
      'size.normal': {
        key: 'system.stats.size',
        label: 'WW.EffectKeys.Size.Normal'
      },
    }
  },
  bonusDamage: {
    header: 'WW.EffectKeys.BonusDamage.Header',
    options: {
      'bonusDamage.increase': {
        key: 'system.stats.bonusDamage',
        label: 'WW.EffectKeys.BonusDamage.Increase'
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

/* Character Options */

WW.PATH_TIERS = {
  'novice': 'WW.NovicePath',
  'expert': 'WW.ExpertPath',
  'master': 'WW.MasterPath'
};
