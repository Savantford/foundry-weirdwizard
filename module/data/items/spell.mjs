import {
  base,
  activity,
  makeStrField
} from './common.mjs'

export default class SpellData extends foundry.abstract.DataModel {

  static defineSchema() {
    const type = 'Spell';
    
    return {
      ...base(type),
      ...activity(type),
      
      tier: makeStrField('Novice',1,1),
      tradition: makeStrField('',1,1),
      requirement: makeStrField('',1,1),
      casting: makeStrField('',1,1),
      target: makeStrField('',1,1),
      duration: makeStrField('',1,1)
    }
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {
    
    if ('range' in source && isNaN(source.range)) source.range = 0;

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