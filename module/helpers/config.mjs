export const WEIRDWIZARD = {}

// Define Constants
WEIRDWIZARD.attributes = {
  "str": "WEIRDWIZARD.Strength",
  "agi": "WEIRDWIZARD.Agility",
  "int": "WEIRDWIZARD.Intellect",
  "wil": "WEIRDWIZARD.Will"
}

WEIRDWIZARD.details = {
  "features": "WEIRDWIZARD.Features",
  "personality": "WEIRDWIZARD.Personality",
  "belief": "WEIRDWIZARD.Belief",
  "professions": "WEIRDWIZARD.Professions",
  "languages": "WEIRDWIZARD.Languages",
  "information": "WEIRDWIZARD.Information",
  "bg_ancestry": "WEIRDWIZARD.Ancestry",
  "deeds": "WEIRDWIZARD.Deeds"
}

// Dropdown menus
WEIRDWIZARD.dropdownAttributes = {
  "": "WEIRDWIZARD.None",
  "str": "WEIRDWIZARD.Strength",
  "agi": "WEIRDWIZARD.Agility",
  "int": "WEIRDWIZARD.Intellect",
  "wil": "WEIRDWIZARD.Will"
}

WEIRDWIZARD.dropdownSources = {
  "Ancestry": "WEIRDWIZARD.SourceChoices.Ancestry",
  "Novice": "WEIRDWIZARD.SourceChoices.Novice",
  "Expert": "WEIRDWIZARD.SourceChoices.Expert",
  "Master": "WEIRDWIZARD.SourceChoices.Master",
  "Other": "WEIRDWIZARD.SourceChoices.Other"
};

/*WEIRDWIZARD.dropdownTypes = {
  "passive": "WEIRDWIZARD.TypeChoices.Passive",
  "action": "WEIRDWIZARD.TypeChoices.Action",
  "move": "WEIRDWIZARD.TypeChoices.Move",
  "minor": "WEIRDWIZARD.TypeChoices.Minor",
  "reaction": "WEIRDWIZARD.TypeChoices.Reaction"
};*/

WEIRDWIZARD.dropdownFrequencies = {
  "day": "WEIRDWIZARD.FrequencyChoices.Day",
  "hour": "WEIRDWIZARD.FrequencyChoices.Hour",
  "minute": "WEIRDWIZARD.FrequencyChoices.Minute",
  "round": "WEIRDWIZARD.FrequencyChoices.Round"
};

WEIRDWIZARD.dropdownTiers = {
  "Novice": "WEIRDWIZARD.Novice",
  "Expert": "WEIRDWIZARD.Expert",
  "Master": "WEIRDWIZARD.Master"
};

WEIRDWIZARD.dropdownGrip = {
  "One-Handed": "WEIRDWIZARD.GripOne",
  "Two-Handed": "WEIRDWIZARD.GripTwo",
  "Off-Hand": "WEIRDWIZARD.GripOff"
};

WEIRDWIZARD.armor = {
  "unarmored": {
    "label": "WEIRDWIZARD.Armor.Unarmored",
    "def": null,
    "bonus": null,
    "type": null
  },
  "padded": {
    "label": "WEIRDWIZARD.Armor.Padded",
    "def": 11,
    "bonus": null,
    "type": "Light"
  },
  "leather": {
    "label": "WEIRDWIZARD.Armor.Leather",
    "def": 12,
    "bonus": 1,
    "type": "Light"
  },
  "brigandine": {
    "label": "WEIRDWIZARD.Armor.Brigandine",
    "def": 13,
    "bonus": 1,
    "type": "Light"
  },
  "ring": {
    "label": "WEIRDWIZARD.Armor.Ring",
    "def": 14,
    "bonus": 2,
    "type": "Medium"
  },
  "mail": {
    "label": "WEIRDWIZARD.Armor.Mail",
    "def": 15,
    "bonus": null,
    "type": "Medium"
  },
  "plateAndMail": {
    "label": "WEIRDWIZARD.Armor.PlateAndMail",
    "def": 16,
    "bonus": null,
    "type": "Medium"
  },
  "breastplate": {
    "label": "WEIRDWIZARD.Armor.Breastplate",
    "def": 16,
    "bonus": 3,
    "type": "Heavy"
  },
  "plate": {
    "label": "WEIRDWIZARD.Armor.Plate",
    "def": 17,
    "bonus": null,
    "type": "Heavy"
  },
  "fullPlate": {
    "label": "WEIRDWIZARD.Armor.FullPlate", 
    "def": 18,
    "bonus": null,
    "type": "Heavy"
  }
};
