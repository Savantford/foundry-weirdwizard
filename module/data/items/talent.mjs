import {
  BaseItemModel,
  fields,
  base,
  activity,
  makeStrField
} from './base-item.mjs'

export default class TalentData extends BaseItemModel {

  static defineSchema() {
    const type = 'Talent';
    
    return {
      ...base(type),
      ...activity(type),

      subtype: makeStrField('trait',0,1),
      source: makeStrField('none',0,1)
    }
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {

    // Convert Aura and Fury to normal traits
    if (source.subtype === 'aura') source.subtype = 'trait';
    if (source.subtype === 'fury') source.subtype = 'trait';

    // Apply lowercase to source field & change 'magical' to 'tradition'
    if (source.source !== source.source?.toLowerCase()) source.source = source.source.toLowerCase();
    if (source.source === 'magical') source.source = 'tradition';

    // Convert Health recover to Health regain
    if (source.instant) {
      for (const i of source.instant) {
        if (i.label === 'healthRecover') i.label = 'healthRegain';
      }
    }
    
    return super.migrateData(source);
  }

}