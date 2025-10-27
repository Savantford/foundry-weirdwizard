import BaseCharOptionModel from './base-charoption.mjs'
import { makeIntField, makeRequiredStrField, makeStrField, makeUuidStrField } from '../field-presets.mjs';

const fields = foundry.data.fields;

export default class PathModel extends BaseCharOptionModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    
    schema.tier = makeRequiredStrField('novice');

    schema.benefits = new fields.SchemaField({
      benefit1: makeBenefitField(1),
      benefit2: makeBenefitField(2),
      benefit3: makeBenefitField(5),
      benefit4: makeBenefitField()
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

/* Path Benefit Field */
const makeBenefitField = (level = 99) => new fields.SchemaField({
  levelReq: makeIntField(level),

  stats: new fields.SchemaField({
    naturalSet: makeIntField(),
    naturalIncrease: makeIntField(),
    armoredIncrease: makeIntField(),
    healthStarting: makeIntField(),
    healthIncrease: makeIntField(),
    speedIncrease: makeIntField(),
    bonusDamage: makeIntField(),
  }),

  spells: makeRequiredStrField('0'),

  // Granted items
  items: new fields.ArrayField(
    makeUuidStrField()
  ),

  // Granted list entries
  languages: new fields.TypedObjectField(
    new fields.SchemaField({
      name: makeRequiredStrField(),
      desc: makeStrField(),
      grantedBy: makeUuidStrField()
    }, { nullable: true })
  ),

  traditions: new fields.TypedObjectField( // Delete on a later update
    new fields.SchemaField({
      name: makeRequiredStrField(),
      desc: makeStrField(),
      grantedBy: makeUuidStrField()
    }, { nullable: true })
  )

})