//import { i18n } from './helpers/utils.mjs';

export const WW = {}

// Define Constants
WW.attributes = {
  "str": "WW.Strength",
  "agi": "WW.Agility",
  "int": "WW.Intellect",
  "wil": "WW.Will"
}

WW.details = {
  "features": "WW.Features",
  "personality": "WW.Personality",
  "belief": "WW.Belief",
  /*"professions": "WW.Professions",
  "languages": "WW.Languages",*/
  /*"information": "WW.Information",
  "bg_ancestry": "WW.Ancestry",
  "deeds": "WW.Deeds"*/
}

// Dropdown menus
WW.dropdownNumbers = {
  "⅛": "⅛",
  "¼": "¼",
  "½": "½",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "10",
}
WW.dropdownAttributes = {
  "": "WW.Dont",
  "str": "WW.Strength",
  "agi": "WW.Agility",
  "int": "WW.Intellect",
  "wil": "WW.Will",
  "luck": "WW.Luck"
}

WW.dropdownSubtypes = {
  "trait": "WW.TalentSubtypes.Trait",
  "aura": "WW.TalentSubtypes.Aura",
  "action": "WW.TalentSubtypes.Action",
  "reaction": "WW.TalentSubtypes.Reaction",
  "end": "WW.TalentSubtypes.End",
  "fury": "WW.TalentSubtypes.Fury",
};

WW.talentSources = {
  "None": "WW.TalentSources.None",
  "Ancestry": "WW.TalentSources.Ancestry",
  "Novice": "WW.TalentSources.Novice",
  "Expert": "WW.TalentSources.Expert",
  "Master": "WW.TalentSources.Master",
  "Magical": "WW.TalentSources.Magical",
  "Other": "WW.TalentSources.Other"
};

WW.dropdownFrequencies = {
  "day": "WW.FrequencyChoices.Day",
  "hour": "WW.FrequencyChoices.Hour",
  "minute": "WW.FrequencyChoices.Minute",
  "round": "WW.FrequencyChoices.Round"
};

WW.dropdownTiers = {
  "Novice": "WW.Novice",
  "Expert": "WW.Expert",
  "Master": "WW.Master"
};

WW.coins = {
  "cp": "WW.Coins.CP",
  "sp": "WW.Coins.SP",
  "gp": "WW.Coins.GP"
};

WW.itemSubtypes = {
  "generic": "WW.Generic",
  "weapon": "WW.Weapon.Label",
  "armor": "WW.Armor.Title",
  "consumable": "WW.Consumable",
  "container": "WW.Container"
};

WW.itemQualities = {
  "standard": "WW.QualityStandard",
  "superior": "WW.QualitySuperior",
  "inferior": "WW.QualityInferior"
};

WW.weaponGrip = {
  "One": "WW.Weapon.GripOne",
  "Two": "WW.Weapon.GripTwo",
  "Off": "WW.Weapon.GripOff"
};

WW.weaponProperties = {
  "ammunition": {
    "label": "WW.Properties.Ammunition.Label",
    "tip": "WW.Properties.Ammunition.Tip",
    "path": "system.properties.ammunition",
  },
  "brutal": {
    "label": "WW.Properties.Brutal.Label",
    "tip": "WW.Properties.Brutal.Tip",
    "path": "system.properties.brutal",
  },
  "concussing": {
    "label": "WW.Properties.Concussing.Label",
    "tip": "WW.Properties.Concussing.Tip",
    "path": "system.properties.concussing",
  },
  "disarming": {
    "label": "WW.Properties.Disarming.Label",
    "tip": "WW.Properties.Disarming.Tip",
    "path": "system.properties.disarming",
  },
  "driving": {
    "label": "WW.Properties.Driving.Label",
    "tip": "WW.Properties.Driving.Tip",
    "path": "system.properties.driving",
  },
  "fast": {
    "label": "WW.Properties.Fast.Label",
    "tip": "WW.Properties.Fast.Tip",
    "path": "system.properties.fast",
  },
  "firearm": {
    "label": "WW.Properties.Firearm.Label",
    "tip": "WW.Properties.Firearm.Tip",
    "path": "system.properties.firearm",
  },
  "great": {
    "label": "WW.Properties.Great.Label",
    "tip": "WW.Properties.Great.Tip",
    "path": "system.properties.great",
  },
  "light": {
    "label": "WW.Properties.Light.Label",
    "tip": "WW.Properties.Light.Tip",
    "path": "system.properties.light",
  },
  "long": {
    "label": "WW.Properties.Long.Label",
    "tip": "WW.Properties.Long.Tip",
    "path": "system.properties.long",
  },
  "nimble": {
    "label": "WW.Properties.Nimble.Label",
    "tip": "WW.Properties.Nimble.Tip",
    "path": "system.properties.nimble",
  },
  "painful": {
    "label": "WW.Properties.Painful.Label",
    "tip": "WW.Properties.Painful.Tip",
    "path": "system.properties.painful",
  },
  "precise": {
    "label": "WW.Properties.Precise.Label",
    "tip": "WW.Properties.Precise.Tip",
    "path": "system.properties.precise",
  },
  "range": {
    "label": "WW.Properties.Range.Label",
    "tip": "WW.Properties.Range.Tip",
    "path": "system.properties.range",
  },
  "reload": {
    "label": "WW.Properties.Reload.Label",
    "tip": "WW.Properties.Reload.Tip",
    "path": "system.properties.reload"
  },
  "sharp": {
    "label": "WW.Properties.Sharp.Label",
    "tip": "WW.Properties.Sharp.Tip",
    "path": "system.properties.sharp",
  },
  "shattering": {
    "label": "WW.Properties.Shattering.Label",
    "tip": "WW.Properties.Shattering.Tip",
    "path": "system.properties.shattering",
  },
  "slow": {
    "label": "WW.Properties.Slow.Label",
    "tip": "WW.Properties.Slow.Tip",
    "path": "system.properties.slow",
  },
  "special": {
    "label": "WW.Properties.Special.Label",
    "tip": "WW.Properties.Special.Tip",
    "path": "system.properties.special",
  },
  "thrown": {
    "label": "WW.Properties.Thrown.Label",
    "tip": "WW.Properties.Thrown.Tip",
    "path": "system.properties.thrown",
  },
  "unbalancing": {
    "label": "WW.Properties.Unbalancing.Label",
    "tip": "WW.Properties.Unbalancing.Tip",
    "path": "system.properties.unbalancing",
  },
  "versatile": {
    "label": "WW.Properties.Versatile.Label",
    "tip": "WW.Properties.Versatile.Tip",
    "path": "system.properties.versatile",
  }
};

WW.armorTypes = {
  "light": "WW.Armor.Light",
  "medium": "WW.Armor.Medium",
  "heavy": "WW.Armor.Heavy"
}

WW.armor = {
  "unarmored": {
    "label": "WW.Armor.Unarmored",
    "def": null,
    "bonus": null,
    "type": null
  },
  "padded": {
    "label": "WW.Armor.Padded",
    "def": 11,
    "bonus": null,
    "type": "Light"
  },
  "leather": {
    "label": "WW.Armor.Leather",
    "def": 12,
    "bonus": 1,
    "type": "Light"
  },
  "brigandine": {
    "label": "WW.Armor.Brigandine",
    "def": 13,
    "bonus": 1,
    "type": "Light"
  },
  "ring": {
    "label": "WW.Armor.Ring",
    "def": 14,
    "bonus": 2,
    "type": "Medium"
  },
  "mail": {
    "label": "WW.Armor.Mail",
    "def": 15,
    "bonus": null,
    "type": "Medium"
  },
  "plateAndMail": {
    "label": "WW.Armor.PlateAndMail",
    "def": 16,
    "bonus": null,
    "type": "Medium"
  },
  "breastplate": {
    "label": "WW.Armor.Breastplate",
    "def": 16,
    "bonus": 3,
    "type": "Heavy"
  },
  "plate": {
    "label": "WW.Armor.Plate",
    "def": 17,
    "bonus": null,
    "type": "Heavy"
  },
  "fullPlate": {
    "label": "WW.Armor.FullPlate", 
    "def": 18,
    "bonus": null,
    "type": "Heavy"
  }
};
