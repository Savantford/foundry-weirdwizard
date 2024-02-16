import {
  fields,
  base,
  makeStrField,
  makeIntField
} from './charoptions_base.mjs'

export default class AncestryData extends foundry.abstract.DataModel {

  static defineSchema() {
    const type = 'Ancestry';

    return {
      ...base(type),

      benefits: new fields.SchemaField({
        benefit1: makeBenefitField()
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

const makeBenefitField = () => new fields.SchemaField({
  types: new fields.ArrayField(
    new fields.ObjectField({ initial: { name: "", desc: "" } })
  ),

  senses: new fields.ArrayField(
    new fields.ObjectField({ initial: { name: "", desc: "" } })
  ),

  languages: new fields.ArrayField(
    new fields.ObjectField({ initial: { name: "", desc: "" } })
  ),

  immune: new fields.ArrayField(
    new fields.ObjectField({ initial: { name: "", desc: "" } })
  ),

  attributes: makeStrField(),

  stats: new fields.SchemaField({
    
    naturalIncrease: makeIntField(),
    healthIncrease: makeIntField(),

    sizeNormal: new fields.NumberField({
      min: 0,
      max: 10,
      initial: 1
    }),
    speedNormal: makeIntField()
    
  }),

  movementTraits: new fields.ArrayField(
    new fields.ObjectField({ initial: { name: "", desc: "" } })
  ),

  items: new fields.ArrayField(makeStrField())
})