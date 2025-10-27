import BaseEffectModel from './base-effect.mjs';
import { makeUuidStrField } from '../field-presets.mjs';

export default class BenefitEffectModel extends BaseEffectModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    
    schema.charOption = makeUuidStrField();
    
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