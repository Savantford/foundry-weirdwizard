import BaseCharOptionModel from './base-charoption.mjs';
import { makeUuidStrField } from '../field-presets.mjs'

export default class TraditionModel extends BaseCharOptionModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // Item references
    schema.talents = new fields.SetField( makeUuidStrField() );

    schema.spells = new fields.SchemaField({
      novice: new fields.SetField( makeUuidStrField() ),
      expert: new fields.SetField( makeUuidStrField() ),
      master: new fields.SetField( makeUuidStrField() )
    });

    return schema;
  }
}