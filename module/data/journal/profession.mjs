import BaseCharOptionModel from './base-charoption.mjs';
import { makeIntField, makeRequiredStrField, makeStrField, makeUuidStrField } from '../field-presets.mjs';

export default class ProfessionModel extends BaseCharOptionModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.category = makeRequiredStrField('commoner');

    schema.benefits = new fields.SchemaField({
      benefit1: new fields.SchemaField({
        levelReq: makeIntField({ initial: 0 }),

        items: new fields.SetField( makeUuidStrField() ),

        // List entries
        languages: new fields.SetField( makeStrField() )
      })
    });

    return schema;
  }
}