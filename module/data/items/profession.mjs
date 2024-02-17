import {
  fields,
  base,
  makeStrField,
  makeIntField,
  /*makeBooField,
  makeHtmlField*/
} from './charoptions_base.mjs'

export default class ProfessionData extends foundry.abstract.DataModel {

  static defineSchema() {
    const type = 'Profession';

    return {
      ...base(type),

      category: makeStrField('commoner'),

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
    
  languages: new fields.ArrayField(
    new fields.ObjectField({ initial: { name: "", desc: "" } })
  ),

  items: new fields.ArrayField(makeStrField())
})