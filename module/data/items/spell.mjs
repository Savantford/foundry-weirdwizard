import {
  BaseItemModel,
  fields,
  base,
  activity,
  makeBooField,
  makeIntField,
  makeStrField
} from './base-item.mjs'

export default class SpellData extends BaseItemModel {

  static defineSchema() {
    const type = 'Spell';
    
    return {
      ...base(type),
      ...activity(type),
      
      tier: makeStrField('novice',1,1),
      tradition: makeStrField('',1,1),
      casting: makeStrField('',1,1),
      target: makeStrField('',1,1),
      duration: makeStrField('Instantaneous',1,1),

      uses: new fields.SchemaField({
        value: makeIntField(),
        max: makeIntField(1),
        onRest: makeBooField(true),
        levelRelative: makeStrField('manual',0)
      })

    }
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
  game.actors.getName('Character').system.destroyed;
  */

}