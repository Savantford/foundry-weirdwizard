import {
  BaseCharOptionModel,
  fields,
  base,
  makeIntField,
  makeStrField
} from './base-charoption.mjs'

export default class PathData extends BaseCharOptionModel {

  static defineSchema() {
    const type = 'Path';
    
    return {
      ...base(type),

      tier: makeStrField('novice'),

      benefits: new fields.SchemaField({
        benefit1: makeBenefitField(1),
        benefit2: makeBenefitField(2),
        benefit3: makeBenefitField(5),
        benefit4: makeBenefitField()
      })

    }
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {

    return super.migrateData(source);
  }

}

const makeBenefitField = (level = 99) => new fields.SchemaField({
  levelReq: makeIntField(level),

  languages: new fields.ArrayField(
    new fields.ObjectField({ initial: { name: "", desc: "" } })
  ),

  stats: new fields.SchemaField({
    naturalSet: makeIntField(),
    naturalIncrease: makeIntField(),
    armoredIncrease: makeIntField(),
    healthStarting: makeIntField(),
    healthIncrease: makeIntField(),
    speedIncrease: makeIntField(),
    bonusDamage: makeIntField(),
  }),

  traditions: new fields.ArrayField(
    new fields.ObjectField({ initial: { name: "", desc: "" } })
  ),

  spells: makeStrField(),

  items: new fields.ArrayField(makeStrField())
})