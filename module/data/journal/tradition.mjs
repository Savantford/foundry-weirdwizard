import BaseCharOptionModel from './base-charoption.mjs';
import { makeUuidStrField } from '../field-presets.mjs'

export default class TraditionModel extends BaseCharOptionModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // Item references
    schema.talents = new fields.ArrayField(
      makeUuidStrField()
    );

    schema.spells = new fields.SchemaField({
      novice: new fields.ArrayField(
        makeUuidStrField()
      ),

      expert: new fields.ArrayField(
        makeUuidStrField()
      ),

      master: new fields.ArrayField(
        makeUuidStrField()
      )
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