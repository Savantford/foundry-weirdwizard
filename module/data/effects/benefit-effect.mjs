import {
  BaseEffectModel,
  makeStrField
} from "./base-effect.mjs";

export default class BenefitEffectModel extends BaseEffectModel {

  static defineSchema() {
    
    return foundry.utils.mergeObject(super.defineSchema(),
      {
        charOption: makeStrField('')
      }
    );
    
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