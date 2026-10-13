export const DEFAULT_ENTRIES = {};

/* Default Entries */
DEFAULT_ENTRIES.NEW_LIST = {
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

DEFAULT_ENTRIES.DESCRIPTORS = {
  'human': {
    name: 'Human',
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
  'fungus': {
    name: 'Fungus',
    desc: ''
  },
  'plant': {
    name: 'Plant',
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

DEFAULT_ENTRIES.IMMUNITIES = {
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

DEFAULT_ENTRIES.LANGUAGES = {
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

DEFAULT_ENTRIES.MOVEMENT_TRAITS = {
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

DEFAULT_ENTRIES.SENSES = {
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

DEFAULT_ENTRIES.CONNECTIONS = {
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