import {
  description,
  attributes,
  stats,
  details
} from './common.mjs'

export default class NpcData extends foundry.abstract.DataModel {

  static defineSchema() {
    const type = 'NPC';
    
    return {
      ...description(type),
      ...attributes(),
      ...stats(type),
      ...details(type)
    }
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {
    
    // Migrate Level
    if (isNaN(source.stats.level)) {
      
      switch (source.stats.level) {
        case '⅛': source.stats.level = 0.125; break;
        case '¼': source.stats.level = 0.25; break;
        case '½': source.stats.level = 0.5; break;
        default: source.stats.level = 1; break;
      }
    }

    // Migrate Size
    if (isNaN(source.stats.size)) {
      
      switch (source.stats.size) {
        case '⅛': source.stats.size = 0.125; break;
        case '¼': source.stats.size = 0.25; break;
        case '½': source.stats.size = 0.5; break;
        default: source.stats.size = 1; break;
      }
    }

    return super.migrateData(source);
  }

  /**
   * Determine whether the character is dead.
   * @type {boolean}
   */
  get dead() {
    const invulnerable = CONFIG.specialStatusEffects.INVULNERABLE;
    if ( this.parent.effects.some(e => e.statuses.has("invulnerable") )) return false;
    return this.health.value <= this.health.min;
  }

  /* The defined dead property could then be accessed on any Actor document of the character type as follows:

  // Determine if a character is dead.
  game.actors.getName("Character").system.dead;
  */

}