
export const fields = foundry.data.fields;

export function base(type = String) {
  const obj = {
    description: makeHtmlField('No description.'),
    group: makeStrField(),
    active: makeBooField(true)
  }

  return obj;
};

export function grants() {

  const obj = {
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