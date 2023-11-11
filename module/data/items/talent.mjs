import {
  fields,
  base,
  activity,
  makeStrField
} from './common.mjs'

export default class TalentData extends foundry.abstract.DataModel {

  static defineSchema() {
    const type = 'Talent';
    
    return {
      ...base(type),
      ...activity(type),

      subtype: makeStrField('trait',0,1),
      source: makeStrField('None',0,1)
    }
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  /*static migrateData(source) {
    if ( 'weapons' in source ) {
      source.weapons = source.weapons.map(weapon => {
        return weapon === 'bmr' ? 'boomerang' : weapon;
      });
    }
    return super.migrateData(source);
  }*/

}