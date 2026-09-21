const fields = foundry.data.fields;

/* -------------------------------------------- */
/*  Number Fields                               */
/* -------------------------------------------- */

/* Integer (Min 0) */
export const makeIntField = (options={}) => {
  const { init = 0 } = options;

  return new fields.NumberField({
    required: true,
    initial: init,
    min: 0,
    nullable: true,
    integer: true,
    clean: true
  })
}

/* Positive Integer (Min 1) */
export const makePosIntField = (options={}) => {
  const { init = 1 } = options;

  return new fields.NumberField({
    required: true,
    initial: init,
    min: 1,
    nullable: true,
    integer: true,
    clean: true
  })
}

/* Float (Min 0) */
export const makeFloField = (options={}) => {
  const { init = 0 } = options;

  return new fields.NumberField({
    required: true,
    initial: init,
    min: 0,
    nullable: true,
    integer: false
  })
}

/* Positive Integer */
export const makePosNegIntField = (options={}) => {
  const { init = 0 } = options;

  return new fields.NumberField({
    required: true,
    initial: init,
    nullable: true,
    integer: true,
    clean: true
  })
}

/* Any Number */
export const makeNumField = (options={}) => {
  const { init = 1 } = options;

  return new fields.NumberField({
    required: true,
    initial: init,
    positive: true
  })
}

/* -------------------------------------------- */
/*  String Fields                               */
/* -------------------------------------------- */

/* Regular String */
export const makeStrField = (options={}) => {
  const { init = ''} = options;

  return new fields.StringField({
    initial: init,
    blank: true,
    textSearch: true
  })
}

/* ID Reference String (Nullable, cannot be blank) */
export const makeIdStrField = (options={}) => {
  const { init = null } = options;
  
  return new fields.StringField({
    initial: init,
    nullable: true
  })
}

/* UUID Reference String (Nullable, cannot be blank) */
export const makeUuidStrField = (options={}) => {
  const { init = null } = options;

  return new fields.DocumentUUIDField({
    initial: init,
    nullable: true,
    //relative: true - v14 only
  })
}

/* Required String (Cannot be blank; for dropdown and name fields) */
export const makeRequiredStrField = (options={}) => {
  const { init = '' } = options;

  return new fields.StringField({
    initial: init,
    blank: false
  })
}

/* -------------------------------------------- */
/*  Other Fields                                */
/* -------------------------------------------- */

export const makeBooField = (options={}) => {
  const { init = false } = options;

  return new fields.BooleanField ({
    initial: init
  })
}

/* Complex Fields */
export const makeHtmlField = (options={}) => {
  const { init = '' } = options;

  return new fields.HTMLField({
    initial: init,
    textSearch: true // Allow it to be searched in the Search Bar
  })
}

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