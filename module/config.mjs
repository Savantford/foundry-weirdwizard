export const WW = {}

/* Attributes */
WW.ATTRIBUTES = {
  'str': 'WW.Attributes.Strength',
  'agi': 'WW.Attributes.Agility',
  'int': 'WW.Attributes.Intellect',
  'wil': 'WW.Attributes.Will'
}

WW.ATTRIBUTES_SHORT = {
  'str': 'WW.Attributes.StrengthShort',
  'agi': 'WW.Attributes.AgilityShort',
  'int': 'WW.Attributes.IntellectShort',
  'wil': 'WW.Attributes.WillShort'
}

WW.ATTRIBUTE_ROLLS = {
  'str': 'WW.Attributes.StrengthRoll',
  'agi': 'WW.Attributes.AgilityRoll',
  'int': 'WW.Attributes.IntellectRoll',
  'wil': 'WW.Attributes.WillRoll',
  'luck': 'WW.Attributes.LuckRoll'
}

WW.ATTRIBUTE_ICONS = {
  'str': '/systems/weirdwizard/assets/icons/biceps.svg',
  'agi': '/systems/weirdwizard/assets/icons/agility.svg',
  'int': '/systems/weirdwizard/assets/icons/open-book.svg',
  'wil': '/systems/weirdwizard/assets/icons/burning-star.svg',
  'luck': '/systems/weirdwizard/assets/icons/clover.svg',
  'def': 'icons/svg/shield.svg'
}

WW.ROLL_ATTRIBUTE_LABELS = {
  'str': 'WW.Roll.Strength',
  'agi': 'WW.Roll.Agility',
  'int': 'WW.Roll.Intellect',
  'wil': 'WW.Roll.Will',
  'luck': 'WW.Roll.Luck'
}

/* Dropdown Menus */
WW.LEVELS = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10'
}

WW.TIERS = {
  'novice': 'WW.CharOptions.Novice',
  'expert': 'WW.CharOptions.Expert',
  'master': 'WW.CharOptions.Master'
};

WW.SIZES = {
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

WW.BESTIARY_DIFFICULTIES = {
  1: 1,
  2: 2,
  4: 4,
  8: 8,
  16: 16,
  32: 32,
  64: 64
}

WW.COINS = {
  'cp': 'WW.Equipment.CP',
  'sp': 'WW.Equipment.SP',
  'gp': 'WW.Equipment.GP'
};

WW.CONNECTIONS = {
  'financial': 'WW.Group.Connections.Financial',
  'influence': 'WW.Group.Connections.Influence',
  'professional': 'WW.Group.Connections.Professional',
  'information': 'WW.Group.Connections.Information',
  'resource': 'WW.Group.Connections.Resource',
  'security': 'WW.Group.Connections.Security'
};

/* Items */
WW.ITEM_TYPES = {
  'equipment': 'TYPES.Item.equipment',
  'talent': 'TYPES.Item.talent',
  'spell': 'TYPES.Item.spell',
};

WW.TALENT_SUBTYPES = {
  'trait': 'WW.Talent.Trait',
  'action': 'WW.Talent.Action',
  'reaction': 'WW.Talent.Reaction',
  'end': 'WW.Talent.End'
};

WW.TALENT_SOURCES = {
  'none': 'WW.Talent.Source.None',
  'ancestry': 'WW.Talent.Source.Ancestry',
  'novice': 'WW.Talent.Source.Novice',
  'expert': 'WW.Talent.Source.Expert',
  'master': 'WW.Talent.Source.Master',
  'tradition': 'WW.Talent.Source.Tradition',
  'other': 'WW.Talent.Source.Other'
};

WW.TALENT_SOURCE_LABELS = {
  'none': 'WW.Talent.Source.NoneLabel',
  'ancestry': 'WW.Talent.Source.AncestryLabel',
  'novice': 'WW.Talent.Source.NoviceLabel',
  'expert': 'WW.Talent.Source.ExpertLabel',
  'master': 'WW.Talent.Source.MasterLabel',
  'tradition': 'WW.Talent.Source.TraditionLabel',
  'other': 'WW.Talent.Source.OtherLabel'
};

WW.USES_LEVEL_RELATIVE = {
  'manual': 'WW.Item.Uses.Manual',
  'full': 'WW.Item.Uses.Full',
  'half': 'WW.Item.Uses.Half',
  'third': 'WW.Item.Uses.Third'
};

WW.SPELL_TIERS = {
  'novice': 'WW.Spell.Novice',
  'expert': 'WW.Spell.Expert',
  'master': 'WW.Spell.Master'
};

WW.EQUIPMENT_SUBTYPES = {
  'generic': 'WW.Equipment.Generic',
  'weapon': 'WW.Weapon.Label',
  'armor': 'WW.Armor.Label',
  'consumable': 'WW.Equipment.Consumable',
  'container': 'WW.Container.Label'
};

WW.EQUIPMENT_AVAILABILITIES = {
  'common': 'WW.Equipment.Availability.Common',
  'uncommon': 'WW.Equipment.Availability.Uncommon',
  'rare': 'WW.Equipment.Availability.Rare',
  'exotic': 'WW.Equipment.Availability.Exotic',
};

WW.EQUIPMENT_QUALITIES = {
  'standard': 'WW.Equipment.Quality.Standard',
  'superior': 'WW.Equipment.Quality.Superior',
  'inferior': 'WW.Equipment.Quality.Inferior'
};

WW.EQUIPMENT_COINS = {
  'gp': {
    'tip': 'WW.Equipment.GP',
    'color': 'gold'
  },
  'sp': {
    'tip': 'WW.Equipment.SP',
    'color': 'silver'
  },
  'cp': {
    'tip': 'WW.Equipment.CP',
    'color': 'copper'
  }
};

WW.WEAPON_REQUIREMENTS = {
  '': 'WW.Weapon.Requirement.None',
  'str11': 'WW.Weapon.Requirement.Str11',
  'str12': 'WW.Weapon.Requirement.Str12',
  'str13': 'WW.Weapon.Requirement.Str13',
  'str14': 'WW.Weapon.Requirement.Str14',
  'agi11': 'WW.Weapon.Requirement.Agi11',
  'agi12': 'WW.Weapon.Requirement.Agi12',
  'agi13': 'WW.Weapon.Requirement.Agi13'
};

WW.WEAPON_GRIPS = {
  'one': 'WW.Weapon.Grip.One',
  'two': 'WW.Weapon.Grip.Two',
  'off': 'WW.Weapon.Grip.Off',
  'natural': 'WW.Weapon.Grip.Natural'
};

WW.WEAPON_GRIPS_SHORT = {
  'one': 'WW.Weapon.Grip.OneShort',
  'two': 'WW.Weapon.Grip.TwoShort',
  'off': 'WW.Weapon.Grip.OffShort'
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

WW.ARMOR_TYPES = {
  'light': 'WW.Armor.Light',
  'medium': 'WW.Armor.Medium',
  'heavy': 'WW.Armor.Heavy'
}

/* Item Automations */

WW.ROLL_ATTRIBUTES = {
  '': 'WW.Roll.Dont',
  'str': 'WW.Attributes.Strength',
  'agi': 'WW.Attributes.Agility',
  'int': 'WW.Attributes.Intellect',
  'wil': 'WW.Attributes.Will',
  'luck': 'WW.Attributes.Luck'
}

WW.ROLL_AGAINST = {
  '': 'WW.Roll.AgainstDefault',
  'def': 'WW.Defense.Label',
  'str': 'WW.Attributes.Strength',
  'agi': 'WW.Attributes.Agility',
  'int': 'WW.Attributes.Intellect',
  'wil': 'WW.Attributes.Will'
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

/* Character Options */

WW.CHARACTER_OPTIONS = {
  'ancestry': 'TYPES.JournalEntryPage.ancestry',
  'path': 'TYPES.JournalEntryPage.path',
  'profession': 'TYPES.JournalEntryPage.profession',
  'tradition': 'TYPES.JournalEntryPage.tradition'
}

WW.PATH_TIERS = {
  'novice': 'WW.CharOptions.NovicePath',
  'expert': 'WW.CharOptions.ExpertPath',
  'master': 'WW.CharOptions.MasterPath'
};

WW.PROFESSION_CATEGORIES = {
  'academic': 'WW.Profession.Academic',
  'aristocratic': 'WW.Profession.Aristocratic',
  'commoner': 'WW.Profession.Commoner',
  'criminal': 'WW.Profession.Criminal',
  'entertainment': 'WW.Profession.Entertainment',
  'military': 'WW.Profession.Military',
  'religious': 'WW.Profession.Religious',
  'wilderness': 'WW.Profession.Wilderness'
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

WW.MULTI_CHOICE_TARGET_HEADERS = {
  'pre-targets': 'WW.MultiChoice.TargetHeader.PreTargets',
  'targets': 'WW.MultiChoice.TargetHeader.Targets',
  'selected': 'WW.MultiChoice.TargetHeader.Selected',
  'character': 'WW.MultiChoice.TargetHeader.Character',
  'combatants': 'WW.MultiChoice.TargetHeader.Combatants',
  'scene-tokens': 'WW.MultiChoice.TargetHeader.SceneTokens',
  'actors-tab': 'WW.MultiChoice.TargetHeader.ActorsTab'
}

WW.MULTI_CHOICE_TARGET_HEADER_ICONS = {
  'pre-targets': 'arrows-down-to-people',
  'targets': 'users-viewfinder',
  'selected': 'users-rectangle',
  'character': 'user-large',
  'combatants': 'swords',
  'scene-tokens': 'users',
  'actors-tab': 'folder-open'
}

/* Instant Effects */

WW.INSTANT_LABELS = {
  'damage': 'WW.InstantEffect.Damage',
  'heal': 'WW.InstantEffect.Heal',
  'healthLose': 'WW.InstantEffect.HealthLose',
  'healthRegain': 'WW.InstantEffect.HealthRegain',
  'affliction': 'WW.InstantEffect.Affliction'
}

WW.INSTANT_ICONS = {
  'damage': 'icons/svg/explosion.svg',
  'heal': 'icons/svg/heal.svg',
  'healthLose': 'icons/svg/degen.svg',
  'healthRegain': 'icons/svg/regen.svg',
  'affliction': 'icons/svg/skull.svg'
}

WW.INSTANT_TRIGGERS = {
  'onUse': 'WW.Effect.OnUse',
  'onSuccess': 'WW.Effect.OnSuccess',
  'onCritical': 'WW.Effect.OnCritical',
  'onFailure': 'WW.Effect.OnFailure'
}

WW.AFFLICTIONS = {
  'blinded': 'WW.Affliction.Blinded',
  'confused': 'WW.Affliction.Confused',
  'controlled': 'WW.Affliction.Controlled',
  'cursed': 'WW.Affliction.Cursed',
  'deafened': 'WW.Affliction.Deafened',
  'frightened': 'WW.Affliction.Frightened',
  'held': 'WW.Affliction.Held',
  'impairedStr': 'WW.Affliction.ImpairedStr',
  'impairedAgi': 'WW.Affliction.ImpairedAgi',
  'impairedInt': 'WW.Affliction.ImpairedInt',
  'impairedWil': 'WW.Affliction.ImpairedWil',
  'onFire': 'WW.Affliction.OnFire',
  'poisoned': 'WW.Affliction.Poisoned',
  'prone': 'WW.Affliction.Prone',
  'slowed': 'WW.Affliction.Slowed',
  'stunned': 'WW.Affliction.Stunned',
  'unconscious': 'WW.Affliction.Unconscious',
  'asleep': 'WW.Affliction.Asleep',
  'vulnerable': 'WW.Affliction.Vulnerable',
  'weakened': 'WW.Affliction.Weakened',
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
    header: 'WW.Effect.Duration.Combat.Header',
    options: {
      'luckEnds': 'WW.Effect.Duration.Combat.LuckEnds',
      '1round': 'WW.Effect.Duration.Combat.1Round',
      '2rounds': 'WW.Effect.Duration.Combat.2Rounds',
      'Xrounds': 'WW.Effect.Duration.Combat.XRounds',
      'turnEnd': 'WW.Effect.Duration.Combat.TurnEnd',
      'nextTriggerTurnStart': 'WW.Effect.Duration.Combat.NextTriggerTurnStart',
      'nextTargetTurnStart': 'WW.Effect.Duration.Combat.NextTargetTurnStart',
      'nextTriggerTurnEnd': 'WW.Effect.Duration.Combat.NextTriggerTurnEnd',
      'nextTargetTurnEnd': 'WW.Effect.Duration.Combat.NextTargetTurnEnd'
    }
  },
  outOfCombat: {
    header: 'WW.Effect.Duration.OutOfCombat.Header',
    options: {
      '1minute': 'WW.Effect.Duration.OutOfCombat.1Minute',
      'minutes': 'WW.Effect.Duration.OutOfCombat.Minutes',
      'hours': 'WW.Effect.Duration.OutOfCombat.Hours',
      'days': 'WW.Effect.Duration.OutOfCombat.Days'
    }
  }
}

WW.EFFECT_CHANGE_PRESET_DATA = {
  boons: {
    header: 'WW.Effect.Keys.Boons.Header',
    options: {
      'boons.str': {
        key: 'system.boons.selfRoll.str',
        label: 'WW.Effect.Keys.Boons.Strength'
      },
      'boons.agi': {
        key: 'system.boons.selfRoll.agi',
        label: 'WW.Effect.Keys.Boons.Agility'
      },
      'boons.int': {
        key: 'system.boons.selfRoll.int',
        label: 'WW.Effect.Keys.Boons.Intellect'
      },
      'boons.wil': {
        key: 'system.boons.selfRoll.wil',
        label: 'WW.Effect.Keys.Boons.Will'
      },
      'boons.luck': {
        key: 'system.boons.selfRoll.luck',
        label: 'WW.Effect.Keys.Boons.Luck'
      },
      'boons.attacks': {
        key: 'system.boons.selfRoll.attacks',
        label: 'WW.Effect.Keys.Boons.Attacks'
      },
      'boons.spells': {
        key: 'system.boons.selfRoll.spells',
        label: 'WW.Effect.Keys.Boons.Spells'
      },
      'boons.resistMagical': {
        key: 'system.boons.selfRoll.resistMagical',
        label: 'WW.Effect.Keys.Boons.ResistMagical'
      }
    }
  },
  banes: {
    header: 'WW.Effect.Keys.Banes.Header',
    options: {
      'banes.str': {
        key: 'system.boons.selfRoll.str',
        label: 'WW.Effect.Keys.Banes.Strength'
      },
      'banes.agi': {
        key: 'system.boons.selfRoll.agi',
        label: 'WW.Effect.Keys.Banes.Agility'
      },
      'banes.int': {
        key: 'system.boons.selfRoll.int',
        label: 'WW.Effect.Keys.Banes.Intellect'
      },
      'banes.wil': {
        key: 'system.boons.selfRoll.wil',
        label: 'WW.Effect.Keys.Banes.Will'
      },
      'banes.luck': {
        key: 'system.boons.selfRoll.luck',
        label: 'WW.Effect.Keys.Banes.Luck'
      },
      'banes.attacks': {
        key: 'system.boons.selfRoll.attacks',
        label: 'WW.Effect.Keys.Banes.Attacks'
      },
      'banes.spells': {
        key: 'system.boons.selfRoll.spells',
        label: 'WW.Effect.Keys.Banes.Spells'
      },
      'banes.resistMagical': {
        key: 'system.boons.selfRoll.resistMagical',
        label: 'WW.Effect.Keys.Banes.ResistMagical'
      }
    }
  },
  autoFail: {
    header: 'WW.Effect.Keys.AutoFail.Header',
    options: {
      'autoFail.str': {
        key: 'system.autoFail.str',
        label: 'WW.Effect.Keys.AutoFail.Strength'
      },
      'autoFail.agi': {
        key: 'system.autoFail.agi',
        label: 'WW.Effect.Keys.AutoFail.Agility'
      },
      'autoFail.int': {
        key: 'system.autoFail.int',
        label: 'WW.Effect.Keys.AutoFail.Intellect'
      },
      'autoFail.wil': {
        key: 'system.autoFail.wil',
        label: 'WW.Effect.Keys.AutoFail.Will'
      }
    }
  },
  boonsAgainst: {
    header: 'WW.Effect.Keys.BoonsAgainst.Header',
    options: {
      'boonsAgainst.def': {
        key: 'system.boons.against.def',
        label: 'WW.Effect.Keys.BoonsAgainst.Defense'
      },
      'boonsAgainst.str': {
        key: 'system.boons.against.str',
        label: 'WW.Effect.Keys.BoonsAgainst.Strength'
      },
      'boonsAgainst.agi': {
        key: 'system.boons.against.agi',
        label: 'WW.Effect.Keys.BoonsAgainst.Agility'
      },
      'boonsAgainst.int': {
        key: 'system.boons.against.int',
        label: 'WW.Effect.Keys.BoonsAgainst.Intellect'
      },
      'boonsAgainst.wil': {
        key: 'system.boons.against.wil',
        label: 'WW.Effect.Keys.BoonsAgainst.Will'
      },
      'boonsAgainst.fromAttacks': {
        key: 'system.boons.against.fromAttacks',
        label: 'WW.Effect.Keys.BoonsAgainst.FromAttacks'
      },
      'boonsAgainst.fromSpells': {
        key: 'system.boons.against.fromSpells',
        label: 'WW.Effect.Keys.BoonsAgainst.FromSpells'
      },
      'boonsAgainst.fromMagical': {
        key: 'system.boons.against.fromMagical',
        label: 'WW.Effect.Keys.BoonsAgainst.FromMagical'
      }
    }
  },
  banesAgainst: {
    header: 'WW.Effect.Keys.BanesAgainst.Header',
    options: {
      'banesAgainst.def': {
        key: 'system.boons.against.def',
        label: 'WW.Effect.Keys.BanesAgainst.Defense'
      },
      'banesAgainst.str': {
        key: 'system.boons.against.str',
        label: 'WW.Effect.Keys.BanesAgainst.Strength'
      },
      'banesAgainst.agi': {
        key: 'system.boons.against.agi',
        label: 'WW.Effect.Keys.BanesAgainst.Agility'
      },
      'banesAgainst.int': {
        key: 'system.boons.against.int',
        label: 'WW.Effect.Keys.BanesAgainst.Intellect'
      },
      'banesAgainst.wil': {
        key: 'system.boons.against.wil',
        label: 'WW.Effect.Keys.BanesAgainst.Will'
      },
      'banesAgainst.fromAttacks': {
        key: 'system.boons.against.fromAttacks',
        label: 'WW.Effect.Keys.BanesAgainst.FromAttacks'
      },
      'banesAgainst.fromSpells': {
        key: 'system.boons.against.fromSpells',
        label: 'WW.Effect.Keys.BanesAgainst.FromSpells'
      },
      'banesAgainst.fromMagical': {
        key: 'system.boons.against.fromMagical',
        label: 'WW.Effect.Keys.BanesAgainst.FromMagical'
      }
    }
  },
  autoSuccessAgainst: {
    header: 'WW.Effect.Keys.AutoSuccessAgainst.Header',
    options: {
      'autoSuccessAgainst.def': {
        key: 'system.autoSuccess.against.def',
        label: 'WW.Effect.Keys.AutoSuccessAgainst.Defense'
      },
      'autoSuccessAgainst.str': {
        key: 'system.autoSuccess.against.str',
        label: 'WW.Effect.Keys.AutoSuccessAgainst.Strength'
      },
      'autoSuccessAgainst.agi': {
        key: 'system.autoSuccess.against.agi',
        label: 'WW.Effect.Keys.AutoSuccessAgainst.Agility'
      },
      'autoSuccessAgainst.int': {
        key: 'system.autoSuccess.against.int',
        label: 'WW.Effect.Keys.AutoSuccessAgainst.Intellect'
      },
      'autoSuccessAgainst.wil': {
        key: 'system.autoSuccess.against.wil',
        label: 'WW.Effect.Keys.AutoSuccessAgainst.Will'
      }
    }
  },
  extraDamage: {
    header: 'WW.Effect.Keys.ExtraDamage.Header',
    options: {
      'extraDamage.dice': {
        key: 'system.extraDamage.attacks.dice',
        label: 'WW.Effect.Keys.ExtraDamage.Dice'
      },
      'extraDamage.mod': {
        key: 'system.extraDamage.attacks.mod',
        label: 'WW.Effect.Keys.ExtraDamage.Mod'
      }
    }
  },
  defense: {
    header: 'WW.Effect.Keys.Defense.Header',
    options: {
      'defense.override': {
        key: 'system.stats.defense.override',
        label: 'WW.Effect.Keys.Defense.Override'
      },
      'defense.bonus': {
        key: 'system.stats.defense.bonus',
        label: 'WW.Effect.Keys.Defense.Bonus'
      },
      'defense.armored': {
        key: 'system.stats.defense.armored',
        label: 'WW.Effect.Keys.Defense.Armored'
      },
      'defense.armoredIncrease': {
        key: 'system.stats.defense.armored',
        label: 'WW.Effect.Keys.Defense.ArmoredIncrease'
      },
      'defense.natural': {
        key: 'system.stats.defense.natural',
        label: 'WW.Effect.Keys.Defense.Natural'
      },
      'defense.naturalIncrease': {
        key: 'system.stats.defense.natural',
        label: 'WW.Effect.Keys.Defense.NaturalIncrease'
      },
      'defense.naturalReduce': {
        key: 'system.stats.defense.natural',
        label: 'WW.Effect.Keys.Defense.NaturalReduce'
      }
    }
  },
  health: {
    header: 'WW.Effect.Keys.Health.Header',
    options: {
      'health.tempIncrease': {
        key: 'system.stats.health.current',
        label: 'WW.Effect.Keys.Health.TempIncrease'
      },
      'health.tempReduce': {
        key: 'system.stats.health.current',
        label: 'WW.Effect.Keys.Health.TempReduce'
      },
      'health.override': {
        key: 'system.stats.health.override',
        label: 'WW.Effect.Keys.Health.Override'
      },
      'health.starting': {
        key: 'system.stats.health.normal',
        label: 'WW.Effect.Keys.Health.Starting'
      },
      'health.increase': {
        key: 'system.stats.health.normal',
        label: 'WW.Effect.Keys.Health.Increase'
      }
    }
  },
  speed: {
    header: 'WW.Effect.Keys.Speed.Header',
    options: {
      'speed.tempIncrease': {
        key: 'system.stats.speed.current',
        label: 'WW.Effect.Keys.Speed.TempIncrease'
      },
      'speed.tempReduce': {
        key: 'system.stats.speed.current',
        label: 'WW.Effect.Keys.Speed.TempReduce'
      },
      'speed.halved': {
        key: 'system.stats.speed.halved',
        label: 'WW.Effect.Keys.Speed.Halved'
      },
      'speed.override': {
        key: 'system.stats.speed.override',
        label: 'WW.Effect.Keys.Speed.Override'
      },
      'speed.normal': {
        key: 'system.stats.speed.normal',
        label: 'WW.Effect.Keys.Speed.Normal'
      },
      'speed.increase': {
        key: 'system.stats.speed.normal',
        label: 'WW.Effect.Keys.Speed.Increase'
      }
    }
  },
  size: {
    header: 'WW.Effect.Keys.Size.Header',
    options: {
      'size.increase': {
        key: 'system.stats.size',
        label: 'WW.Effect.Keys.Size.Increase'
      },
      'size.override': {
        key: 'system.stats.size',
        label: 'WW.Effect.Keys.Size.Override'
      },
      'size.normal': {
        key: 'system.stats.size',
        label: 'WW.Effect.Keys.Size.Normal'
      },
    }
  },
  bonusDamage: {
    header: 'WW.Effect.Keys.BonusDamage.Header',
    options: {
      'bonusDamage.increase': {
        key: 'system.stats.bonusdamage',
        label: 'WW.Effect.Keys.BonusDamage.Increase'
      }
    }
  },
  upgradeAttribute: {
    header: 'WW.Effect.Keys.UpgradeAttribute.Header',
    options: {
      'upgradeAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.Effect.Keys.UpgradeAttribute.Strength'
      },
      'upgradeAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.Effect.Keys.UpgradeAttribute.Agility'
      },
      'upgradeAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.Effect.Keys.UpgradeAttribute.Intellect'
      },
      'upgradeAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.Effect.Keys.UpgradeAttribute.Will'
      }
    }
  },
  downgradeAttribute: {
    header: 'WW.Effect.Keys.DowngradeAttribute.Header',
    options: {
      'downgradeAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.Effect.Keys.DowngradeAttribute.Strength'
      },
      'downgradeAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.Effect.Keys.DowngradeAttribute.Agility'
      },
      'downgradeAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.Effect.Keys.DowngradeAttribute.Intellect'
      },
      'downgradeAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.Effect.Keys.DowngradeAttribute.Will'
      }
    }
  },
  overrideAttribute: {
    header: 'WW.Effect.Keys.OverrideAttribute.Header',
    options: {
      'overrideAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.Effect.Keys.OverrideAttribute.Strength'
      },
      'overrideAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.Effect.Keys.OverrideAttribute.Agility'
      },
      'overrideAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.Effect.Keys.OverrideAttribute.Intellect'
      },
      'overrideAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.Effect.Keys.OverrideAttribute.Will'
      }
    }
  },
  increaseAttribute: {
    header: 'WW.Effect.Keys.IncreaseAttribute.Header',
    options: {
      'increaseAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.Effect.Keys.IncreaseAttribute.Strength'
      },
      'increaseAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.Effect.Keys.IncreaseAttribute.Agility'
      },
      'increaseAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.Effect.Keys.IncreaseAttribute.Intellect'
      },
      'increaseAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.Effect.Keys.IncreaseAttribute.Will'
      }
    }
  },
  reduceAttribute: {
    header: 'WW.Effect.Keys.ReduceAttribute.Header',
    options: {
      'reduceAttribute.str': {
        key: 'system.attributes.str.value',
        label: 'WW.Effect.Keys.ReduceAttribute.Strength'
      },
      'reduceAttribute.agi': {
        key: 'system.attributes.agi.value',
        label: 'WW.Effect.Keys.ReduceAttribute.Agility'
      },
      'reduceAttribute.int': {
        key: 'system.attributes.int.value',
        label: 'WW.Effect.Keys.ReduceAttribute.Intellect'
      },
      'reduceAttribute.wil': {
        key: 'system.attributes.wil.value',
        label: 'WW.Effect.Keys.ReduceAttribute.Will'
      }
    }
  },
}

WW.COMPENDIUM_TYPES = {
  'generic': 'WW.System.Index.Generic',
  'paths': 'WW.CharOptions.Paths',
  'professions': 'WW.CharOptions.Professions',
  'armor': 'WW.Armor.Label',
  'weapons': 'WW.Equipment.Weapons'
};

WW.COMPENDIUM_INDEX_ENRICHER_LABELS = {
  'armor': 'WW.Armor.Label',
  'weapons': 'WW.Equipment.Weapons',
  'hirelings': 'WW.Equipment.Hirelings',
  'character-options': 'WW.CharOptions.Label',
  'traits': 'WW.CharOptions.AncestryTraits',
  'talents': 'WW.CharOptions.PathTalents',
  'spells': 'WW.CharOptions.TraditionSpells'
};

WW.COMPENDIUM_GROUPS = {
  'system': 'WW.System.Compendium.Group.Core',
  'world': 'WW.System.Compendium.Group.World',
  'module': 'WW.System.Compendium.Group.Modules',
  'sotww-secrets': 'WW.System.Compendium.Group.Secrets',
  'sotww-heroes': 'WW.System.Compendium.Group.Heroes',
  'sotww-wa': 'WW.System.Compendium.Group.WeirdAncestries'
};

/* Default Entries */
WW.NEW_DEFAULT_ENTRY = {
  'afflictions': {
    key: 'affliction',
    loc: 'WW.ListEntry.Affliction.New'
  },
  'descriptors': {
    key: 'descriptor',
    loc: 'WW.ListEntry.Descriptor.New'
  },
  'immunities': {
    key: 'immunity',
    loc: 'WW.ListEntry.Immunity.New'
  },
  'languages': {
    key: 'language',
    loc: 'WW.ListEntry.Language.New'
  },
  'movementTraits': {
    key: 'movementTrait',
    loc: 'WW.ListEntry.MovementTrait.New'
  },
  'senses': {
    key: 'sense',
    loc: 'WW.ListEntry.Sense.New'
  },
  'weaponTraits': {
    key: 'weapon',
    loc: 'WW.ListEntry.WeaponTrait.New'
  },
};

WW.DEFAULT_DESCRIPTORS = {
  'ancestry': {
    name: 'Ancestry',
    desc: ''
  },
  'angel': {
    name: 'Angel',
    desc: ''
  },
  'beast': {
    name: 'Beast',
    desc: ''
  },
  'creation': {
    name: 'Creation',
    desc: ''
  },
  'demon': {
    name: 'Demon',
    desc: ''
  },
  'elemental': {
    name: 'Elemental',
    desc: ''
  },
  'faerie': {
    name: 'Faerie',
    desc: ''
  },
  'fiend': {
    name: 'Fiend',
    desc: ''
  },
  'fungusPlant': {
    name: 'Fungus/Plant',
    desc: ''
  },
  'monster': {
    name: 'Monster',
    desc: ''
  },
  'spirit': {
    name: 'Spirit',
    desc: ''
  },
  'undead': {
    name: 'Undead',
    desc: ''
  },
  'amphibious': {
    name: 'Amphibious',
    desc: ''
  },
  'aquatic': {
    name: 'Aquatic',
    desc: ''
  },
  'swarm': {
    name: 'Swarm',
    desc: ''
  }
};

WW.DEFAULT_IMMUNITIES = {
  /* Affliction Immunities */
  'blinded': {
    name: 'WW.Affliction.Blinded',
    category: 'affliction'
  },
  'confused': {
    name: 'WW.Affliction.Confused',
    category: 'affliction'
  },
  'controlled': {
    name: 'WW.Affliction.Controlled',
    category: 'affliction'
  },
  'cursed': {
    name: 'WW.Affliction.Cursed',
    category: 'affliction'
  },
  'deafened': {
    name: 'WW.Affliction.Deafened',
    category: 'affliction'
  },
  'frightened': {
    name: 'WW.Affliction.Frightened',
    category: 'affliction'
  },
  'held': {
    name: 'WW.Affliction.Held',
    category: 'affliction'
  },
  'impairedStr': {
    name: 'WW.Affliction.ImpairedStr',
    category: 'affliction'
  },
  'impairedAgi': {
    name: 'WW.Affliction.ImpairedAgi',
    category: 'affliction'
  },
  'impairedInt': {
    name: 'WW.Affliction.ImpairedInt',
    category: 'affliction'
  },
  'impairedWil': {
    name: 'WW.Affliction.ImpairedWil',
    category: 'affliction'
  },
  'onFire': {
    name: 'WW.Affliction.OnFire',
    category: 'affliction'
  },
  'poisoned': {
    name: 'WW.Affliction.Poisoned',
    category: 'affliction'
  },
  'prone': {
    name: 'WW.Affliction.Prone',
    category: 'affliction'
  },
  'slowed': {
    name: 'WW.Affliction.Slowed',
    category: 'affliction'
  },
  'stunned': {
    name: 'WW.Affliction.Stunned',
    category: 'affliction'
  },
  'unconscious': {
    name: 'WW.Affliction.Unconscious',
    category: 'affliction'
  },
  'asleep': {
    name: 'WW.Affliction.Asleep',
    category: 'affliction'
  },
  'vulnerable': {
    name: 'WW.Affliction.Vulnerable',
    category: 'affliction'
  },
  'weakened': {
    name: 'WW.Affliction.Weakened',
    category: 'affliction'
  },

  /* Other Immunities */
  'deprivation': {
    name: 'deprivation',
    category: 'other'
  },
  'exposure': {
    name: 'exposure',
    category: 'other'
  },
  'infection': {
    name: 'infection',
    category: 'other'
  },
  'suffocation': {
    name: 'suffocation',
    category: 'other'
  }
};

WW.DEFAULT_LANGUAGES = {
  'common': {
    name: 'Common',
    desc: 'The Common tongue originated with a seafaring people and was important for facilitating trade. It became the dominant language in the Great Kingdom and has spread to the new lands from the lips of refugees pouring across the borderlands. A dialect of Common—Seafarer—comes freighted with nautical jargon and odd digressions in which the speaker offers mild oaths to the sea god.'
  },
  'archaic': {
    name: 'Archaic',
    desc: ''
  },
  'handSigns': {
    name: 'Hand Signs',
    desc: ''
  },
  'kingdom': {
    name: 'Kingdom',
    desc: ''
  },
  'sylvan': {
    name: 'Sylvan',
    desc: ''
  },
  'alchemical': {
    name: 'Alchemical',
    desc: ''
  },
  'arcane': {
    name: 'Arcane',
    desc: ''
  },
  'druidic': {
    name: 'Druidic',
    desc: ''
  },
  'rangerSigns': {
    name: 'Ranger Signs',
    desc: ''
  },
  'thievesCant': {
    name: "Thieves' Cant",
    desc: ''
  }
};

WW.DEFAULT_MOVEMENT_TRAITS = {
  'burrower': {
    name: 'Burrower',
    desc: 'The creature burrows 1 yard into a solid surface of earth or stone for every 2 yards of movement it expends. It leaves behind a tunnel with a diameter equal to its Size – 1'
  }, 
  'climber': {
    name: 'Climber',
    desc: 'The creature climbs 1 yard for each yard of movement it expends; it can climb across ceilings and overhangs; it grants no boons on rolls to attack it due to climbing; and it rolls to climb with 1 boon.'
  }, 
  'fly': {
    name: 'Fly',
    desc: 'The creature can fly when it moves.'
  },
  'hover': {
    name: 'Hover',
    desc: 'The creature ignores any effect other than being unconscious that would cause it to fall while flying.'
  },
  'insubstantial': {
    name: 'Insubstantial',
    desc: 'The creature can move through or end its movement inside a solid object. While it is inside a solid object,  the creature cannot be harmed until the object is destroyed.  The creature ignores the effects of wind and other kinds of challenging terrain that can ordinarily affect flying creatures.'
  },
  'mount': {
    name: 'Mount',
    desc: 'The creature enables other creatures to ride upon it.'
  },
  'silent': {
    name: 'Silent',
    desc: 'The creature can sneak 1 yard for each yard of movement it expends and rolls to sneak with 1 boon.'
  },
  'slippery': {
    name: 'Slippery',
    desc: 'The creature’s moves do not enable other creatures to make free attacks against it.'
  },
  'squeeze': {
    name: 'Squeeze (# inches)',
    desc: 'The creature can squeeze through openings of the indicated size.'
  },
  'strider': {
    name: 'Strider',
    desc: 'The creature reduces by 1 the number of yards of movement it expends to move each yard across challenging terrain.'
  },
  'swimmer': {
    name: 'Swimmer',
    desc: 'The creature swims 1 yard for each yard of movement it expends; it ignores the effects of swimming on its attribute rolls, on its rolls to attack, and on rolls against its Defense; and it makes rolls to swim with 1 boon.'
  },
  'teleport': {
    name: 'Teleport #',
    desc: 'This creature can expend its move to teleport to an empty space that it can see within the indicated number of yards.'
  },
  'waterWalk': {
    name: 'Water Walk',
    desc: 'The creature can move across liquid surfaces as if they were solid and treats them as challenging terrain.'
  }
};

WW.DEFAULT_SENSES = {
  'awareness': {
    name: 'Awareness #',
    desc: 'The creature always perceives everything around it within the listed number in yards. This perception ignores the effects of obscurement and lighting.'
  },
  'darkVision': {
    name: 'Dark Vision',
    desc: 'The creature can see out to a range of 3 yards when in no light at all.'
  },
  'keenHearing': {
    name: 'Keen Hearing',
    desc: 'The creature hears out to double the normal distances.'
  },
  'keenScent': {
    name: 'Keen Scent',
    desc: 'The creature knows the location of each living or dead creature within 10 yards.'
  },
  'keenVision': {
    name: 'Keen Vision',
    desc: 'The creature can see twice as far as other creatures in natural light and doubles the normal range of artificial light sources. Finally, the creature reduces the degree of obscurement by one step, to a minimum of no obscurement.'
  },
  'trueVision': {
    name: 'True Vision',
    desc: 'The creature needs no light to see and treats everything within its line of sight as being illuminated. It perceives outlines around invisible creatures and objects in its line of sight. It also sees through mundane and magical disguises, perceives transformed creatures in their normal forms, and recognizes visual illusions for what they are.'
  }
};

WW.DEFAULT_CONNECTIONS = {
  'financial': {
    name: 'Financial',
    desc: 'The connection gives 5 gp to the character at the novice tier, 10 gp at the expert tier, or 25 gp at the master tier.'
  },
  'influence': {
    name: 'Influence',
    desc: 'The connection either allows access to a restricted area or person, such as inside a library after hours or a meeting with a local ruler, or helps a character make a different connection. In the latter case, the character activates the connection between quests to gain a different connection.'
  },
  'professional': {
    name: 'Professional',
    desc: 'The connection belongs to a particular profession and lends aid related to their area of expertise. This might be helpful for identifying a monster, creating an item, acquiring an inscription or consumable, securing shelter in a temple, or learning specific information related to the profession.'
  },
  'information': {
    name: 'Information',
    desc: 'The connection reveals information concerning any subject. The time it takes to gain this information depends on its secrecy. Common knowledge is immediate, while gaining exotic knowledge might require a character to wait until the end of the next quest or longer.'
  },
  'resource': {
    name: 'Resource',
    desc: 'The connection grants access to a specific tangible resource that is something other than coin: healing, horses, a ship, a tower or keep, a vehicle, or something else.'
  },
  'security': {
    name: 'Security',
    desc: 'The connection either grants a place for the character and allies to hole up for a time or provides the services of an armed guard for the duration of the next quest. The guard should have a Difficulty 1 at the novice tier, 2 at the expert tier, and 4 at the master tier.'
  }
};