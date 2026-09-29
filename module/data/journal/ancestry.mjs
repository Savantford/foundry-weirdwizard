import BaseCharOptionModel from './base-charoption.mjs';
import { makeIntField, makeRequiredStrField, makeStrField, makeUuidStrField } from '../field-presets.mjs';

export default class AncestryModel extends BaseCharOptionModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.benefits = new fields.SchemaField({
      benefit1: new fields.SchemaField({
        levelReq: makeIntField({ initial: 0 }),

        attributes: makeStrField(),

        stats: new fields.SchemaField({
          
          naturalIncrease: makeIntField(),
          healthIncrease: makeIntField(),

          sizeNormal: new fields.NumberField({
            min: 0,
            initial: 1
          }),
          speedNormal: makeIntField()
          
        }),

        items: new fields.ArrayField( makeStrField() ),

        // List Entries
        descriptors: new fields.ArrayField( makeStrField() ),
        immunities: new fields.ArrayField( makeStrField() ),
        languages: new fields.ArrayField( makeStrField() ),
        movementTraits: new fields.ArrayField( makeStrField() ),
        senses: new fields.ArrayField( makeStrField() )
      })
    });

    return schema;
  }

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    
    this.benefits.benefit1.stats.sizeFraction = game.weirdwizard.utils.nearestFraction(this.benefits.benefit1.stats.sizeNormal);
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