import { camelCase } from '../../helpers/utils.mjs';
import {
  BaseActorModel,
  fields,
  description,
  attributes,
  stats,
  details,
  charOptions,
  makeIntField
} from './base-actor.mjs'

export default class CharacterData extends BaseActorModel {

  static defineSchema() {
    const type = 'Character';
    
    return {
      ...description(type),
      ...attributes(),
      ...stats(type),
      ...details(type),
      ...charOptions(type),

      currency: new fields.SchemaField({
        gp: makeIntField(),
        sp: makeIntField(),
        cp: makeIntField(),
      }) 
    }
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {

    // Migrate Details
    if (source.details?.features?.value && !source.details?.appearance?.value) source.details.appearance = {value: source.details.features.value};
    if ((source.description?.value || source.details?.bg_ancestry?.value) && !source.details?.background?.value) source.details.background = {value: source.description.value + source.details.bg_ancestry.value};
    if (source.details?.belief?.value && !source.details?.beliefs?.value) source.details.beliefs = {value: source.details.belief.value};
    if ((source.details?.deeds?.value || source.details?.information?.value) && !source.details?.notes?.value) source.details.notes = {value: source.details.deeds.value + source.details.information.value};

    // Migrate Speed
    if ('stats.speed.value' in source) source.stats.speed.current = source.stats.speed.value;
    if ('stats.speed.raw' in source) source.stats.speed.normal = source.stats.speed.raw;

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

    if (typeof source.details?.traditions === 'string') { // Traditions
      const arr = source.details.traditions.split(",");
      source.details.traditions = arr.filter(s => s).map((s) => ({ name: s.trim() }));
    }
    
    // Migrate Level
    if (isNaN(source.stats?.level)) {

      switch (source.stats?.level) {
        case '⅛': source.stats.level = 0.125; break;
        case '¼': source.stats.level = 0.25; break;
        case '½': source.stats.level = 0.5; break;
      }
    }

    // Migrate Size
    if (isNaN(source.stats?.size)) {

      switch (source.stats?.size) {
        case '⅛': source.stats.size = 0.125; break;
        case '¼': source.stats.size = 0.25; break;
        case '½': source.stats.size = 0.5; break;
      }
    }

    // Migrate other stuff
    if ('stats' in source && isNaN(source.stats?.bonusdamage)) source.stats.bonusdamage = 0;
    if ('details' in source && isNaN(source.details?.reputation)) source.details.reputation = 0;
    if ('stats' in source && !source.stats?.damage?.raw && source.stats?.damage?.value) source.stats.damage.raw = source.stats?.damage?.value;

    // Migrate immune to immunities
    if ('details' in source && source.details?.immune) source.details.immunities = source.details.immune;

    // Migrate entry lists from array to object
    if ('details' in source) {
      const entryTypes = ['senses', 'descriptors', 'languages', 'immunities', 'movementTraits'];
      
      for (const key in source.details) {
        const prop = source.details[key];
        
        // Check for the entryTypes and if it's an array
        if (source.details.hasOwnProperty(key) && entryTypes.includes(key)) {
          
          if (Array.isArray(prop)) {
            console.log('isArray')
            console.log(key, prop)
            if (prop.length) {
              const map = prop.map(value => [value.name ? camelCase(value.name) : camelCase(value), value]);
              
              source.details[key] = Object.fromEntries(map);
            } else {
              source.details[key] = {};
            }
            
          } else {
            console.log('not array')
            console.log(key, prop)
          }
          
        }

      }

      console.log(source.details)
      
    }
    
    return super.migrateData(source);
  }

  /* -------------------------------------------- */
  /*  Properties (Getters)                        */
  /* -------------------------------------------- */

  /**
   * Determine whether the character is injured.
   * @type {boolean}
   */
  /*get dead() {
    const invulnerable = CONFIG.specialStatusEffects.INVULNERABLE;
    if ( this.parent.effects.some(e => e.statuses.has("invulnerable") )) return false;
    return this.health.value <= this.health.min;
  }*/

  /* The defined dead property could then be accessed on any Actor document of the character type as follows:

  // Determine if a character is dead.
  game.actors.getName("Character").system.dead;
  */

}