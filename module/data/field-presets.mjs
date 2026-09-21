const fields = foundry.data.fields;

/* -------------------------------------------- */
/*  Number Fields                               */
/* -------------------------------------------- */

/* Integer (Min 0) */
export const makeIntField = (options={}) => {
  const { initial = 0, label } = options;

  return new fields.NumberField({
    initial, label,
    min: 0,
    required: true,
    nullable: true,
    integer: true,
    clean: true
  })
}

/* Positive Integer (Min 1) */
export const makePosIntField = (options={}) => {
  const { initial = 1, label } = options;

  return new fields.NumberField({
    initial, label,
    min: 1,
    required: true,
    nullable: true,
    integer: true,
    clean: true
  })
}

/* Float (Min 0) */
export const makeFloField = (options={}) => {
  const { initial = 0, label } = options;

  return new fields.NumberField({
    initial, label,
    min: 0,
    required: true,
    nullable: true,
    integer: false
  })
}

/* Positive Integer */
export const makePosNegIntField = (options={}) => {
  const { initial = 0, label } = options;

  return new fields.NumberField({
    initial, label,
    required: true,
    nullable: true,
    integer: true,
    clean: true
  })
}

/* Any Number */
export const makeNumField = (options={}) => {
  const { initial = 1, label } = options;

  return new fields.NumberField({
    initial, label,
    required: true,
    positive: true
  })
}

/* -------------------------------------------- */
/*  String Fields                               */
/* -------------------------------------------- */

/* Regular String */
export const makeStrField = (options={}) => {
  const { initial = '', label } = options;

  return new fields.StringField({
    initial, label,
    blank: true,
    textSearch: true
  })
}

/* ID Reference String (Nullable, cannot be blank) */
export const makeIdStrField = (options={}) => {
  const { initial = null, label } = options;
  
  return new fields.StringField({
    initial, label,
    nullable: true
  })
}

/* UUID Reference String (Nullable, cannot be blank) */
export const makeUuidStrField = (options={}) => {
  const { initial = null, label } = options;

  return new fields.DocumentUUIDField({
    initial, label,
    nullable: true,
    //relative: true - v14 only
  })
}

/* Required String (Cannot be blank; for dropdown and name fields) */
export const makeRequiredStrField = (options={}) => {
  const { initial = '', label } = options;

  return new fields.StringField({
    initial, label,
    blank: false
  })
}

/* -------------------------------------------- */
/*  Other Fields                                */
/* -------------------------------------------- */

export const makeBooField = (options={}) => {
  const { initial = false, label } = options;

  return new fields.BooleanField ({
    initial, label
  })
}

/* Complex Fields */
export const makeHtmlField = (options={}) => {
  const { initial = '', label } = options;

  return new fields.HTMLField({
    initial, label,
    textSearch: true // Allow it to be searched in the Search Bar
  })
}

export function makeAttributeField({ options={} }) {
  const { label } = options;

  return new fields.SchemaField({
    value: new fields.NumberField({
      label,
      initial: 10,
      max: 20,
      min: 0,
      required: true,
      integer: true,
      hint: label + 'Score'
    })
  })
}