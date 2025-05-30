import { TypedObjectField } from '../typed-object-field.mjs';
import {
  BaseCharOptionModel,
  makeStrField
} from './base-charoption.mjs'

export default class ProfessionData extends BaseCharOptionModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.category = makeStrField('commoner', 0);

    schema.benefits = new fields.SchemaField({

      benefit1: new fields.SchemaField({
        items: new fields.ArrayField(makeStrField()),

        // List entries
        languages: new TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("", 0),
            desc: makeStrField(),
            grantedBy: makeStrField(null)
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