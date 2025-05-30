import {
  BaseCharOptionModel,
  makeStrField
} from './base-charoption.mjs'

export default class TraditionData extends BaseCharOptionModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // Item references
    schema.talents = new fields.ArrayField(makeStrField());

    schema.spells = new fields.SchemaField({
      novice: new fields.ArrayField(makeStrField()),
      expert: new fields.ArrayField(makeStrField()),
      master: new fields.ArrayField(makeStrField())
    });

    return schema;
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