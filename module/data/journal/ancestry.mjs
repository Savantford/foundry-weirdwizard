import BaseCharOptionModel from './base-charoption.mjs';
import { makeIntField, makeStrField } from '../field-presets.mjs';

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

        items: new fields.SetField( makeStrField() ),

        // List Entries
        descriptors: new fields.SetField( makeStrField() ),
        immunities: new fields.SetField( makeStrField() ),
        languages: new fields.SetField( makeStrField() ),
        movementTraits: new fields.SetField( makeStrField() ),
        senses: new fields.SetField( makeStrField() )
      })
    });

    return schema;
  }

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    
    this.benefits.benefit1.stats.sizeFraction = game.weirdwizard.utils.nearestFraction(this.benefits.benefit1.stats.sizeNormal);
  }
}