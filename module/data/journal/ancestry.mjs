import { TypedObjectField } from '../typed-object-field.mjs';
import {
  BaseCharOptionModel,
  makeIntField,
  makeStrField
} from './base-charoption.mjs'

export default class AncestryData extends BaseCharOptionModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.benefits = new fields.SchemaField({
      benefit1: new fields.SchemaField({
        levelReq: makeIntField(0),

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

        items: new fields.ArrayField(makeStrField()),

        // List Entries
        descriptors: new TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("", 0),
            desc: makeStrField(),
            grantedBy: makeStrField(null)
          }, { nullable: true })
        ),

        immunities: new TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("", 0),
            desc: makeStrField(),
            grantedBy: makeStrField(null)
          }, { nullable: true })
        ),

        languages: new TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("", 0),
            desc: makeStrField(),
            grantedBy: makeStrField(null)
          }, { nullable: true })
        ),

        movementTraits: new TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("", 0),
            desc: makeStrField(),
            grantedBy: makeStrField(null)
          }, { nullable: true })
        ),

        senses: new TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("", 0),
            desc: makeStrField(),
            grantedBy: makeStrField(null)
          }, { nullable: true })
        ),
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

    // Migrate Types to Descriptors
    if (source.details?.types) source.details.descriptors = source.details.types;

    return super.migrateData(source);
  }

}