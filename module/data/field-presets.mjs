const fields = foundry.data.fields;

/* -------------------------------------------- */
/*  Number Fields                               */
/* -------------------------------------------- */

/* Integer (Min 0) */
export const makeIntField = (init = 0) => new fields.NumberField({
  required: true,
  initial: init,
  min: 0,
  nullable: true,
  integer: true,
  clean: true
})

/* Positive Integer (Min 1) */
export const makePosIntField = (init = 0) => new fields.NumberField({
  required: true,
  initial: init,
  min: 1,
  nullable: true,
  integer: true,
  clean: true
})

/* Float (Min 0) */
export const makeFloField = (init = 0) => new fields.NumberField({
  required: true,
  initial: init,
  min: 0,
  nullable: true,
  integer: false
})

/* Any Number */
export const makeNumField = (init = 1) => new fields.NumberField({
  required: true,
  initial: init,
  positive: true
})

/* -------------------------------------------- */
/*  String Fields                               */
/* -------------------------------------------- */

/* Regular String */
export const makeStrField = (init = '') => new fields.StringField({
  initial: init,
  blank: true,
  textSearch: true
})

/* UUID Reference String (Nullable, cannot be blank) */
export const makeUuidStrField = (init = null) => new fields.StringField({
  initial: init,
  nullable: true
})

/* Required String (Cannot be blank; for dropdown and name fields) */
export const makeRequiredStrField = (init = '') => new fields.StringField({
  initial: init,
  blank: false
})

/* -------------------------------------------- */
/*  Other Fields                                */
/* -------------------------------------------- */

export const makeBooField = (init = false) => new fields.BooleanField ({
  initial: init
})

/* Complex Fields */
export const makeHtmlField = (init = '') => new fields.HTMLField({
  initial: init,
  textSearch: true // Allow it to be searched in the Search Bar
})

export function makeAttributeField(attribute) {
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