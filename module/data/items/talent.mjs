import BaseItemModel from './base-item.mjs';
import { makeHtmlField, makeRequiredStrField } from '../field-presets.mjs';

export default class TalentModel extends BaseItemModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    
    schema.description = makeHtmlField('No description available.'),
    schema.subtype =  makeRequiredStrField('trait'),
    schema.source = makeRequiredStrField('none')
    

    return schema;
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