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
  "professions": "WW.Professions",
  "languages": "WW.Languages",
  "information": "WW.Information",
  "bg_ancestry": "WW.Ancestry",
  "deeds": "WW.Deeds"
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
  "": "WW.None",
  "str": "WW.Strength",
  "agi": "WW.Agility",
  "int": "WW.Intellect",
  "wil": "WW.Will"
}

WW.dropdownSubtypes = {
  "trait": "WW.TalentSubtypes.Trait",
  "aura": "WW.TalentSubtypes.Aura",
  "action": "WW.TalentSubtypes.Action",
  "reaction": "WW.TalentSubtypes.Reaction",
  "end": "WW.TalentSubtypes.End",
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
  "weapon": "WW.Weapon",
  "armor": "WW.Armor.Title",
  "consumable": "WW.Consumable",
  "container": "WW.Container"
};

WW.itemQualities = {
  "standard": "WW.QualityStandard",
  "superior": "WW.QualitySuperior",
  "inferior": "WW.QualityInferior"
};

WW.dropdownGrip = {
  "One": "WW.GripOne",
  "Two": "WW.GripTwo",
  "Off": "WW.GripOff"
};

WW.armorTypes = {
  "light": "WW.Light",
  "medium": "WW.Medium",
  "heavy": "WW.Heavy"
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
