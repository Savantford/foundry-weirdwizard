import { TypedObjectField } from '../typed-object-field.mjs';
import {
  BaseCharOptionModel,
  makeIntField,
  makeStrField
} from './base-charoption.mjs'

const fields = foundry.data.fields;

export default class PathData extends BaseCharOptionModel {

  static defineSchema() {
    const schema = super.defineSchema();
    
    schema.tier = makeStrField('novice', 0);

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

  traditions: new fields.ArrayField(
    new fields.ObjectField({ initial: { name: "", desc: "" } })
  ),

  spells: makeStrField('0', 0),

  // Granted items
  items: new fields.ArrayField(makeStrField()),

  // Granted list entries
  languages: new TypedObjectField(
    new fields.SchemaField({
      name: makeStrField("", 0),
      desc: makeStrField(),
      grantedBy: makeStrField(null)
    }, { nullable: true })
  )

})