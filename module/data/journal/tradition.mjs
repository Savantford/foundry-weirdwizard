import {
  BaseCharOptionModel,
  fields,
  base,
  makeStrField
} from './base-charoption.mjs'

export default class TraditionData extends BaseCharOptionModel {

  static defineSchema() {
    const type = 'Tradition';

    return {
      ...base(type),

      talents: new fields.ArrayField(makeStrField()),
      spells: new fields.SchemaField({
        novice: new fields.ArrayField(makeStrField()),
        expert: new fields.ArrayField(makeStrField()),
        master: new fields.ArrayField(makeStrField())
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