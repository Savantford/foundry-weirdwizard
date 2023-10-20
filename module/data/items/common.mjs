
export const fields = foundry.data.fields;

export function base(type = String) {
  let desc = 'No description.';
  let active = true;

  if (type === 'Equipment') desc = '';
  if (type === 'Spell') active = false;

  let obj = {
    description: makeHtmlField(desc),
    active: makeBooField(active)
  }

  return obj;
};

export function physical(type = String) {

  let obj = {
    quantity: makeIntField(1),
    weightUnit: makeIntField(1),

    price: new fields.SchemaField({
      value: makeIntField(),
      coin: makeStrField('sp')
    }),

    availability: makeStrField()/*,
    equipped: makeBooField(false),
    identified: makeBooField(true)*/
    
  }

  return obj;
};

export function activity(type = String) {

  let obj = {
    attribute: makeStrField(),
    against: makeStrField(),

    boons: new fields.NumberField({
      required: true,
      initial: 0,
      integer: true
    }),

    range: makeIntField(),
    affliction: makeStrField(),

    uses: new fields.SchemaField({
      value: makeIntField(),
      max: makeIntField(),
      onRest: makeBooField(true)/*,
      frequency: makeStrField('day')*/
    }),

    //damage: makeStrField(),
    healing: makeStrField(),
    instant: new fields.ArrayField(
      new fields.ObjectField({
        label: makeStrField(),
        trigger: makeStrField('onUse'),
        target: makeStrField('tokens'),
        value: makeStrField()
      })
    )
    
  }

  if (type === 'Equipment') {
    obj.uses.onRest = makeBooField(false);
    //obj.uses.autodestroy = makeBooField(false);
  }

  else if (type === 'Spell') obj.uses.max = makeIntField(1)

  return obj;
};

export function currency() {
  return {
    currency: new fields.SchemaField({
      gp: makeIntField(),
      sp: makeIntField(),
      cp: makeIntField(),
    })
  }
}

/****************************************/

export const makeHtmlField = (init = '') => new fields.SchemaField({
  value: new fields.HTMLField({
    initial: init,
    textSearch: true // Allow it to be searched in the Search Bar
  })
})

export const makeIntField = (init = 0) => new fields.NumberField({
  required: true,
  initial: init,
  min: 0,
  nullable: true,
  integer: true
})

export const makeStrField = (init = '', blank = true, searchable = false) => new fields.StringField({
  initial: init,
  blank: blank,
  textSearch: searchable
})

export const makeBooField = (init = false) => new fields.BooleanField ({
  initial: init
})