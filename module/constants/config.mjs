export const WW = {};

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
  'str': 'systems/weirdwizard/assets/icons/biceps.svg',
  'agi': 'systems/weirdwizard/assets/icons/agility.svg',
  'int': 'systems/weirdwizard/assets/icons/open-book.svg',
  'wil': 'systems/weirdwizard/assets/icons/burning-star.svg',
  'luck': 'systems/weirdwizard/assets/icons/clover.svg',
  'def': 'icons/svg/shield.svg'
}

WW.ROLL_ATTRIBUTE_LABELS = {
  'str': 'WW.Roll.Strength',
  'agi': 'WW.Roll.Agility',
  'int': 'WW.Roll.Intellect',
  'wil': 'WW.Roll.Will',
  'luck': 'WW.Roll.Luck'
}

WW.ROLL_OUTCOME_LABELS = {
  'success': 'WW.Roll.Success',
  'failure': 'WW.Roll.Failure',
  'critSuccess': 'WW.Roll.CriticalSuccess',
  'critFailure': 'WW.Roll.CriticalFailure'
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

WW.ENEMY_DIFFICULTIES = {
  0: "WW.Stats.DifficultyNone",
  1: 1,
  2: 2,
  4: 4,
  8: 8,
  16: 16,
  24: 24,
  32: 32,
  48: 48,
  64: 64,
  96: 96,
  128: 128
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
  '1+half': 'WW.Item.Uses.OnePlusHalf',
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
  'inferior': 'WW.Equipment.Quality.Inferior',
  'superior': 'WW.Equipment.Quality.Superior',
  'trinket': 'WW.Equipment.Quality.Trinket'
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

WW.EQUIPMENT_REQUIREMENTS = {
  '': 'WW.Equipment.Requirement.None',
  'str11': 'WW.Equipment.Requirement.Str11',
  'str12': 'WW.Equipment.Requirement.Str12',
  'str13': 'WW.Equipment.Requirement.Str13',
  'str14': 'WW.Equipment.Requirement.Str14',
  'agi11': 'WW.Equipment.Requirement.Agi11',
  'agi12': 'WW.Equipment.Requirement.Agi12',
  'agi13': 'WW.Equipment.Requirement.Agi13',
  'agi14': 'WW.Equipment.Requirement.Agi14'
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
  'off': 'WW.Weapon.Grip.OffShort',
  'natural': 'WW.Weapon.Grip.NaturalShort'
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
  '': 'WW.Roll.Against.Default',
  'def': 'WW.Defense.Label',
  'str': 'WW.Attributes.Strength',
  'agi': 'WW.Attributes.Agility',
  'int': 'WW.Attributes.Intellect',
  'wil': 'WW.Attributes.Will'
}

/* Targeting */

WW.TARGETING_OPERATIONS = {
  'none': 'WW.Targeting.Operations.None',
  'target': 'WW.Targeting.Operations.TargetTokens',
  'placeArea': 'WW.Targeting.Operations.PlaceArea'
}

WW.TARGETING_METHODS = {
  'manual': 'WW.Targeting.Methods.Manual',
  'self': 'WW.Targeting.Methods.Self',
  'area': 'WW.Targeting.Methods.Area'
}

WW.TARGETING_RESTRICTIONS = {
  'any': 'WW.Targeting.Restrictions.Any',
  'enemies': 'WW.Targeting.Restrictions.Enemies',
  'allies': 'WW.Targeting.Restrictions.Allies'
}

WW.ITEM_AREA_SHAPES = {
  'circle': 'WW.Item.Area.Shape.Circle',
  'emanation': 'WW.Item.Area.Shape.Emanation'
}

/* Character Options */

WW.CHARACTER_OPTIONS = {
  'ancestry': 'TYPES.JournalEntryPage.ancestry',
  'path': 'TYPES.JournalEntryPage.path',
  'profession': 'TYPES.JournalEntryPage.profession',
  'tradition': 'TYPES.JournalEntryPage.tradition'
}

WW.CHARACTER_OPTION_REMOVE_TOOLTIPS = {
  'ancestry': 'WW.Ancestry.Remove',
  'path': 'WW.Path.Remove',
  'profession': 'WW.Profession.Remove',
  'tradition': 'WW.Tradition.Remove'
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

WW.INSTANT_APPLY_LABELS = {
  'damage': "WW.InstantEffect.Damage",
  'heal': "Heal Damage",
  'healthLose': "Lose Health",
  'healthRegain': "Regain Lost Health",
  'affliction': "Bestow Affliction"
}

WW.INSTANT_TRIGGERS = {
  'onUse': 'WW.Effect.OnUse',
  'onSuccess': 'WW.Effect.OnSuccess',
  'onCritical': 'WW.Effect.OnCritical',
  'onFailure': 'WW.Effect.OnFailure'
}

/* Active Effects */

WW.EFFECT_TRIGGERS = {
  'passive': 'WW.Effect.Passive',
  'onUse': 'WW.Effect.OnUse',
  'onSuccess': 'WW.Effect.OnSuccess',
  'onCritical': 'WW.Effect.OnCritical',
  'onFailure': 'WW.Effect.OnFailure'
}

WW.EFFECT_TRIGGER_ICONS = {
  'passive': 'fa-solid fa-',
  'onUse': 'fa-solid fa-bolt',
  'onSuccess': 'fa-solid fa-check',
  'onCritical': 'fa-solid fa-check-double',
  'onFailure': 'fa-solid fa-x'
}

WW.EFFECT_TARGET_ICONS = {
  'none': 'fa-solid fa-user',
  'tokens': 'fa-solid fa-users-viewfinder',
  'enemies': 'fa-solid fa-users-viewfinder color-red',
  'allies': 'fa-solid fa-users-viewfinder color-green'
}

WW.EFFECT_DURATION_PRESETS = {
  '1minute': 'WW.Effect.DurationPresets.1Minute',
  '1hour': 'WW.Effect.DurationPresets.1Hour',
  'luckEnds': 'WW.Effect.DurationPresets.LuckEnds',
  '1round': 'WW.Effect.DurationPresets.RoundEnd',
  '2rounds': 'WW.Effect.DurationPresets.NextRoundEnd',
  'turnEnd': 'WW.Effect.DurationPresets.TurnEnd',
  'nextTriggerTurnStart': 'WW.Effect.DurationPresets.NextTriggerTurnStart',
  'nextTriggerTurnEnd': 'WW.Effect.DurationPresets.NextTriggerTurnEnd',
  'nextTargetTurnStart': 'WW.Effect.DurationPresets.NextTargetTurnStart',
  'nextTargetTurnEnd': 'WW.Effect.DurationPresets.NextTargetTurnEnd',
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

/* Compendia & Index */

WW.COMPENDIUM_INDEX_VIEWS = {
  'generic': 'WW.Index.Generic',

  /* Equipment Views */
  'equipment': 'TYPES.Item.equipment',
  'armor': 'WW.Armor.Label',
  'weapons': 'WW.Equipment.Weapons',

  /* Character Option Views */
  'ancestries': 'WW.CharOptions.Ancestries',
  'paths': 'WW.CharOptions.Paths',
  'professions': 'WW.CharOptions.Professions',
  'traditions': 'WW.Tradition.Label',

  /* Other */
  'creatures': 'WW.Index.Creatures',
  'talents': 'WW.Talents.Label',
  'spells': 'WW.Spells.Label'
};

WW.COMPENDIUM_INDEX_PRESET_LABELS = {
  'all': 'WW.Index.Label',

  /* Equipment */
  'equipment': 'TYPES.Item.equipment',
  'armor': 'WW.Armor.Label',
  'weapons': 'WW.Equipment.Weapons',
  'hirelings': 'WW.Equipment.Hirelings',
  
  /* Character Options */
  'ancestries': 'WW.CharOptions.Ancestries',
  'professions': 'WW.CharOptions.Professions',
  'novice': 'WW.Index.NovicePaths',
  'expert': 'WW.Index.ExpertPaths',
  'master': 'WW.Index.MasterPaths',
  'traditions': 'WW.Tradition.Label',

  /* Other */
  'creatures': 'WW.Index.Creatures',
  'talents': 'WW.Talents.Label',
  'spells': 'WW.Spells.Label'
};

WW.COMPENDIUM_INDEX_FILTER_LABELS = {
  'type': "WW.Index.Filters.DocumentType",
  'system.tier': "WW.Item.Tier",
  'system.grip': "WW.Weapon.Grip.Label",
  'system.traits': "WW.Weapon.Traits.Label"
};

WW.COMPENDIUM_GROUPS = {
  'system': 'WW.System.Compendium.Group.Core',
  'world': 'WW.System.Compendium.Group.World',
  'module': 'WW.System.Compendium.Group.Modules',
  'sww-secrets': 'WW.System.Compendium.Group.Secrets',
  'sww-heroes': 'WW.System.Compendium.Group.Heroes',
  'sww-wa': 'WW.System.Compendium.Group.WeirdAncestries'
};