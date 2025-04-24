
export default class ActiveEffectData extends foundry.abstract.DataModel {

  static defineSchema() {
    
    return {
      target: makeStrField('none'),
      trigger: makeStrField('passive'),

      duration: new fields.SchemaField({
        selected: makeStrField(),
        inMinutes: makeIntField(),
        inHours: makeIntField(),
        inDays: makeIntField(),
        autoExpire: makeBooField(true)
      }),
      
      grantedBy: makeStrField()
    }

  }

  /**
   * Determine whether the item is destroyed.
   * @type {boolean}
   */
  get destroyed() {
    const invulnerable = CONFIG.specialStatusEffects.INVULNERABLE;
    if ( this.parent.effects.some(e => e.statuses.has('invulnerable') )) return false;
    return this.health.value <= this.health.min;
  }

}

/****************************************/

export const fields = foundry.data.fields;

export const makeHtmlField = (init = '') => new fields.SchemaField({
  value: new fields.HTMLField({
    initial: init,
    textSearch: true // Allow it to be searched in the Search Bar
  }),

  name: new fields.StringField({
    initial: '',
    textSearch: true
  })
})

export const makeFloField = (init = 0) => new fields.NumberField({
  required: true,
  initial: init,
  min: 0,
  nullable: true,
  integer: false
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