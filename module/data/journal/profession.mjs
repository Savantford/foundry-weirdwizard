import BaseCharOptionModel from './base-charoption.mjs';
import { makeIntField, makeRequiredStrField, makeStrField, makeUuidStrField } from '../field-presets.mjs';

export default class ProfessionModel extends BaseCharOptionModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.category = makeRequiredStrField('commoner');

    schema.benefits = new fields.SchemaField({

      benefit1: new fields.SchemaField({
        levelReq: makeIntField(0),

        items: new fields.ArrayField(
          makeUuidStrField()
        ),

        // List entries
        languages: new fields.TypedObjectField(
          new fields.SchemaField({
            name: makeRequiredStrField(),
            desc: makeStrField(),
            grantedBy: makeUuidStrField()
          }, { nullable: true })
        )

      })

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