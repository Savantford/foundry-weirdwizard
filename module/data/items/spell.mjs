import { makeBooField, makeHtmlField, makeIntField, makeRequiredStrField, makeStrField } from '../field-presets.mjs';
import BaseItemModel from './base-item.mjs';
import { i18n } from '../../helpers/utils.mjs';

export default class SpellModel extends BaseItemModel {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();
    
    // Add Spell fields
    schema.tier = makeRequiredStrField('novice');
    schema.tradition = makeStrField();
    schema.casting = makeStrField();
    schema.target = makeStrField();
    schema.duration = makeStrField('Instantaneous');

    // Adjust Spell-specific initials
    schema.active = makeBooField(false);
    schema.description = makeHtmlField(i18n("WW.System.Sheet.NoDescription"));
    schema.magical = makeBooField(true);
    schema.uses.fields.max = makeIntField(1);

    return schema;
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {
    
    // Validate range
    if ('range' in source && isNaN(source.range)) source.range = 0;

    // Convert Health recover to Health regain
    if (source.instant) {
      for (const i of source.instant) {
        if (i.label === 'healthRecover') i.label = 'healthRegain';
      }
    }

    // Apply lowercase to tier field
    if (source.tier !== source.tier?.toLowerCase()) source.tier = source.tier.toLowerCase();

    return super.migrateData(source);
  }

  /**
   * Determine whether the item is destroyed.
   * @type {boolean}
   */
  get destroyed() {
    const invulnerable = CONFIG.specialStatusEffects.INVULNERABLE;
    if ( this.parent.effects.some(e => e.statuses.has('invulnerable') )) return false;
    return this.health.value <= this.health.min;
  }

  /* The defined destroyed property could then be accessed on any Actor document of the item type as follows:

  // Determine if a item is destroyed.
  game.actors.getName('character').system.destroyed;
  */

}