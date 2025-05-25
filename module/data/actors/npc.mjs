import { camelCase } from '../../helpers/utils.mjs';
import {
  BaseActorModel,
  description,
  attributes,
  stats,
  details
} from './base-actor.mjs'

export default class NpcData extends BaseActorModel {

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

    // Migrate total Defense to Natural Defense (4.3.0)
    if (source.stats?.defense?.total && !source.stats?.defense?.natural && source.stats?.defense?.total !== 10 && source.stats?.defense?.total !== source.stats?.defense?.natural) {
      source.stats.defense.natural = source.stats.defense.total;
    }

    // Migrate List Entries
    if (typeof source.details?.type === 'string') { // Types
      const arr = source.details.type.split(",");
      source.details.types = arr.filter(s => s).map((s) => ({ name: s.trim() }));
    }

    // Migrate Types to Descriptors
    if (source.details?.types && !source.details?.descriptors) source.details.descriptors = source.details.types;

    if (typeof source.details?.senses === 'string') { // Senses
      const arr = source.details.senses.split(",");
      source.details.senses = arr.filter(s => s).map((s) => ({ name: s.trim() }));
    }
    
    if (typeof source.details?.languages === 'string') { // Languages
      const arr = source.details.languages.split(",");
      source.details.languages = arr.filter(s => s).map((s) => ({ name: s.trim() }));
    }

    if (typeof source.details?.immune === 'string') { // Immune
      const arr = source.details.immune.split(",");
      source.details.immune = arr.filter(s => s).map((s) => ({ name: s.trim() }));
    }

    if (typeof source.stats?.speed?.special === 'string') { // Movement Traits (Speed Special)
      const arr = source.stats.speed.special.split(",");
      source.details.movementTraits = arr.filter(s => s).map((s) => ({ name: s.trim() }));
    }
    
    // Fix legacy Level strings
    if (isNaN(source.stats?.level)) {
      
      // 
      switch (source.stats?.level) {
        case '⅛': source.stats.level = 0.125; break;
        case '¼': source.stats.level = 0.25; break;
        case '½': source.stats.level = 0.5; break;
        //default: source.stats.level = 1; break; // This is causing issues
      }

    }

    // Migrate Level to Difficulty
    if (source.stats?.level) source.stats.difficulty = source.stats.level;

    // Migrate Size
    if (isNaN(source.stats?.size)) {
      
      switch (source.stats?.size) {
        case '⅛': source.stats.size = 0.125; break;
        case '¼': source.stats.size = 0.25; break;
        case '½': source.stats.size = 0.5; break;
        //default: source.stats.size = 1; break; // This is causing issues
      }
    }

    // Migrate other stuff
    if ('stats' in source && !source.stats?.damage?.raw && source.stats?.damage?.value) source.stats.damage.raw = source.stats?.damage?.value;

    // Migrate immune to immunities
    if ('details' in source && source.details?.immune) source.details.immunities = source.details.immune;

    // Migrate entry lists from array to object
    if ('details' in source) {
      const entryTypes = ['senses', 'descriptors', 'languages', 'immunities', 'movementTraits'];

      for (const key in source.details) {
        const prop = source.details[key];

        // Check for the entryTypes and if it's an array
        if (source.details.hasOwnProperty(key) && entryTypes.includes(key) && Array.isArray(prop)) {
          const map = prop.map(value => [value.name ? camelCase(value.name) : camelCase(value), value]);

          source.details[key] = Object.fromEntries(map);
        }

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