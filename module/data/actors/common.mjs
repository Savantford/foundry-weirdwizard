
export const fields = foundry.data.fields;

export function description (type = String) {
  let init = 'No creature description.';

  if (type === 'Character') init = "Unknown biography.";

  return {
    description: makeHtmlField(init)
  }
};

export const attributes = () => ({
  attributes: new fields.SchemaField({
    str: makeAttribute('Strength'),
    agi: makeAttribute('Agility'),
    int: makeAttribute('Intellect'),
    wil: makeAttribute('Will')
  })
})

export function stats(type = String) {

  let obj = {
    defense: makeDefense(type),
    health: makeHealth(type),

    damage: new fields.SchemaField({
      value: makeIntField(),
      max: makeIntField()
    }),

    size: makeStrField('1', false),
    level: makeStrField('1', false),

    speed: new fields.SchemaField({
      value: makeIntField(),
      raw: makeIntField(5),
      special: makeStrField()
    })
  }

  if (type === 'Character') obj.bonusdamage = makeIntField();

  else if (type === 'NPC') obj.solitary = makeBooField();

  return {stats: new fields.SchemaField(obj)};
};

export function details(type = String) {
  const obj = {
    type: makeStrField('',1,1),
    senses: makeStrField(),
    languages: makeStrField(),
    immune: makeStrField()
  }

  if (type === 'Character') {
    obj.languages = makeStrField("Common");
    obj.professions = makeStrField("",1,1);
    obj.ancestry = makeStrField("Human",1,1);
    obj.novice = makeStrField("",1,1);
    obj.expert = makeStrField("",1,1);
    obj.master = makeStrField("",1,1);
    obj.reputation = makeIntField();
    obj.traditions = makeStrField();

    obj.features = makeHtmlField();
    obj.personality = makeHtmlField();
    obj.belief = makeHtmlField();
    obj.information = makeHtmlField();
    obj.bg_ancestry = makeHtmlField();
    obj.deeds = makeHtmlField();
  }
  

  return {details: new fields.SchemaField(obj)}
}

/****************************************/
const makeHtmlField = (init = '') => new fields.SchemaField({
  value: new fields.HTMLField({
    initial: init,
    textSearch: true // Allow it to be searched in the Search Bar
  })
})

const makeBooField = (init = false) => new fields.BooleanField ({
  initial: init
})

export const makeIntField = (init = 0) => new fields.NumberField({
  required: true,
  initial: init,
  min: 0,
  integer: true
})

const makeStrField = (init = '', blank = true) => new fields.StringField({
  initial: init,
  blank: blank
})

function makeAttribute(attribute) {
  const label = 'WW.' + attribute;

  return new fields.SchemaField({
    value: new fields.NumberField({
      required: true,
      initial: 10,
      max: 20,
      min: 0,
      integer: true,
      label: label,
      hint: label
    })
  })
}

function makeDefense(type) {

  if (type == 'Character') { return new fields.SchemaField({
    total: makeIntField(),
    natural: makeIntField(10)
  })}

  else if (type == 'NPC') return new fields.SchemaField({
    total: makeIntField(10),
    details: makeStrField()
  })
  
  else return {}
}

function makeHealth(type) {

  if (type == 'Character') { return new fields.SchemaField({
    current: makeIntField(),
    normal: makeIntField(),
    starting: makeIntField(10),
    novice: makeIntField(),
    expert: makeIntField(),
    master: makeIntField(),
    lost: makeIntField(),
    bonus: makeIntField()
  })}

  else if (type == 'NPC') return new fields.SchemaField({
    current: makeIntField(10)
  })

  else return {}
}

