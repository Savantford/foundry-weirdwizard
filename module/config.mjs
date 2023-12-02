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

WW.weaponRequirements = {
  '': 'WW.Weapon.Requirements.None',
  'str10': 'WW.Weapon.Requirements.Str10',
  'str12': 'WW.Weapon.Requirements.Str12',
  'str14': 'WW.Weapon.Requirements.Str14',
  'agi11': 'WW.Weapon.Requirements.Agi11',
  'agi12': 'WW.Weapon.Requirements.Agi12',
  'agi14': 'WW.Weapon.Requirements.Agi14',
  'int10agi12': 'WW.Weapon.Requirements.Int10Agi12',
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

WW.weaponTraits = {
  'ammunition': {
    'label': 'WW.Weapon.Traits.Ammunition.Label',
    'tip': 'WW.Weapon.Traits.Ammunition.Tip',
    'path': 'system.traits.ammunition',
  },
  'brutal': {
    'label': 'WW.Weapon.Traits.Brutal.Label',
    'tip': 'WW.Weapon.Traits.Brutal.Tip',
    'path': 'system.traits.brutal',
  },
  'firearm': {
    'label': 'WW.Weapon.Traits.Firearm.Label',
    'tip': 'WW.Weapon.Traits.Firearm.Tip',
    'path': 'system.traits.firearm',
  },
  'forceful': {
    'label': 'WW.Weapon.Traits.Forceful.Label',
    'tip': 'WW.Weapon.Traits.Forceful.Tip',
    'path': 'system.traits.forceful',
  },
  'long': {
    'label': 'WW.Weapon.Traits.Long.Label',
    'tip': 'WW.Weapon.Traits.Long.Tip',
    'path': 'system.traits.long',
  },
  'nimble': {
    'label': 'WW.Weapon.Traits.Nimble.Label',
    'tip': 'WW.Weapon.Traits.Nimble.Tip',
    'path': 'system.traits.nimble',
  },
  'precise': {
    'label': 'WW.Weapon.Traits.Precise.Label',
    'tip': 'WW.Weapon.Traits.Precise.Tip',
    'path': 'system.traits.precise',
  },
  'range': {
    'label': 'WW.Weapon.Traits.Range.Label',
    'tip': 'WW.Weapon.Traits.Range.Tip',
    'path': 'system.traits.range',
  },
  'sharp': {
    'label': 'WW.Weapon.Traits.Sharp.Label',
    'tip': 'WW.Weapon.Traits.Sharp.Tip',
    'path': 'system.traits.sharp',
  },
  'shattering': {
    'label': 'WW.Weapon.Traits.Shattering.Label',
    'tip': 'WW.Weapon.Traits.Shattering.Tip',
    'path': 'system.traits.shattering',
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

WW.weaponAdvantages = {
  'disarming': {
    'label': 'WW.Weapon.Advantages.Disarming.Label',
    'tip': 'WW.Weapon.Advantages.Disarming.Tip',
    'path': 'system.advantages.disarming',
  },
  'disrupting': {
    'label': 'WW.Weapon.Advantages.Disrupting.Label',
    'tip': 'WW.Weapon.Advantages.Disrupting.Tip',
    'path': 'system.advantages.disrupting',
  },
  'driving': {
    'label': 'WW.Weapon.Advantages.Driving.Label',
    'tip': 'WW.Weapon.Advantages.Driving.Tip',
    'path': 'system.advantages.driving',
  },
  'guarding': {
    'label': 'WW.Weapon.Advantages.Guarding.Label',
    'tip': 'WW.Weapon.Advantages.Guarding.Tip',
    'path': 'system.advantages.guarding',
  },
  'lunging': {
    'label': 'WW.Weapon.Advantages.Lunging.Label',
    'tip': 'WW.Weapon.Advantages.Lunging.Tip',
    'path': 'system.advantages.lunging',
  },
  'pressing': {
    'label': 'WW.Weapon.Advantages.Pressing.Label',
    'tip': 'WW.Weapon.Advantages.Pressing.Tip',
    'path': 'system.advantages.pressing',
  },
  'special': {
    'label': 'WW.Weapon.Traits.Special.Label',
    'tip': 'WW.Weapon.Traits.Special.Tip',
    'path': 'system.advantages.special',
  }
};

WW.weaponDisadvantages = {
  'fixed': {
    'label': 'WW.Weapon.Disadvantages.Fixed.Label',
    'tip': 'WW.Weapon.Disadvantages.Fixed.Tip',
    'path': 'system.disadvantages.fixed',
  },
  'light': {
    'label': 'WW.Weapon.Disadvantages.Light.Label',
    'tip': 'WW.Weapon.Disadvantages.Light.Tip',
    'path': 'system.disadvantages.light',
  },
  'reload': {
    'label': 'WW.Weapon.Disadvantages.Reload.Label',
    'tip': 'WW.Weapon.Disadvantages.Reload.Tip',
    'path': 'system.disadvantages.reload'
  },
  'slow': {
    'label': 'WW.Weapon.Disadvantages.Slow.Label',
    'tip': 'WW.Weapon.Disadvantages.Slow.Tip',
    'path': 'system.disadvantages.slow',
  }
};

/* Instant Effects */

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

/* Active Effects */

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

WW.EFFECT_DURATIONS = {
  combat: {
    header: "WW.EffectDurations.Combat.Header",
    options: {
      "luckEnds": "WW.EffectDurations.Combat.LuckEnds",
      "1round": "WW.EffectDurations.Combat.1Round",
      "2rounds": "WW.EffectDurations.Combat.2Rounds",
      "Xrounds": "WW.EffectDurations.Combat.XRounds",
      "turnEnd": "WW.EffectDurations.Combat.TurnEnd",
      "nextTriggerTurnStart": "WW.EffectDurations.Combat.NextTriggerTurnStart",
      "nextTargetTurnStart": "WW.EffectDurations.Combat.NextTargetTurnStart",
      "nextTriggerTurnEnd": "WW.EffectDurations.Combat.NextTriggerTurnEnd",
      "nextTargetTurnEnd": "WW.EffectDurations.Combat.NextTargetTurnEnd"
    }
  },
  outOfCombat: {
    header: "WW.EffectDurations.OutOfCombat.Header",
    options: {
      "1minute": "WW.EffectDurations.OutOfCombat.1Minute",
      "minutes": "WW.EffectDurations.OutOfCombat.Minutes",
      "hours": "WW.EffectDurations.OutOfCombat.Hours",
      "days": "WW.EffectDurations.OutOfCombat.Days"
    }
  }
  
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
