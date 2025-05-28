import { camelCase } from '../../helpers/utils.mjs';
import { TypedObjectField } from '../typed-object-field.mjs';
import { BaseActorModel, makeCharOptionField, makeHtmlField, makeIntField, makeNumField, makeStrField } from './base-actor.mjs';

export default class CharacterData extends BaseActorModel {

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    
    const schema = super.defineSchema();

    // Add currency
    schema.currency = new fields.SchemaField({
      gp: makeIntField(),
      sp: makeIntField(),
      cp: makeIntField(),
    });

    // Add Character Details
    schema.details = new fields.SchemaField({
      appearance: makeHtmlField(),
      background: makeHtmlField(),
      personality: makeHtmlField(),
      beliefs: makeHtmlField(),
      notes: makeHtmlField(),

      // Will be deleted in a later date
      professions: makeStrField("", 1, 1),
      ancestry: makeStrField("", 1, 1),
      novice: makeStrField("", 1, 1),
      expert: makeStrField("", 1, 1),
      master: makeStrField("", 1, 1)
    }),

    // Add Character Options
    schema.charOptions = new fields.SchemaField({

      ancestry: makeCharOptionField('Compendium.weirdwizard.character-options.JournalEntry.pAAZKv2vrilITojZ.JournalEntryPage.GI4b6WkOLlTszbRe'),

      // Paths
      novice: makeCharOptionField(),
      expert: makeCharOptionField(),
      master: makeCharOptionField(),

      // Arrays
      professions: new fields.ArrayField(
        makeCharOptionField()
      ),

      traditions: new fields.ArrayField(
        makeCharOptionField()
      )
    })
    
    // Add Character stats
    schema.stats.fields.level = makeNumField();
    schema.stats.fields.bonusdamage = makeIntField();

    // Adjust Character-specific initials
    schema.description = makeHtmlField('Unknown biography.');
    schema.stats.fields.defense.fields.natural = makeIntField(8);
    
    // Will be deleted in a later date
    schema.listEntries.fields.traditions = new TypedObjectField(
      new fields.SchemaField({
        name: makeStrField("", 0),
        desc: makeStrField(),
        grantedBy: makeStrField(null)
      }, { nullable: true })
    );

    return schema;
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {
    
    // Migrate Details
    if (source.details?.features?.value && !source.details?.appearance?.value) source.details.appearance = {value: source.details.features.value};
    if ((source.description?.value || source.details?.bg_ancestry?.value) && !source.details?.background?.value) source.details.background = {value: source.description.value + source.details.bg_ancestry?.value};
    if (source.details?.belief?.value && !source.details?.beliefs?.value) source.details.beliefs = {value: source.details.belief.value};
    if ((source.details?.deeds?.value || source.details?.information?.value) && !source.details?.notes?.value) source.details.notes = {value: source.details.deeds.value + source.details.information.value};

    // Migrate Speed
    if ('stats.speed.value' in source) source.stats.speed.current = source.stats.speed.value;
    if ('stats.speed.raw' in source) source.stats.speed.normal = source.stats.speed.raw;

    // Migrate legacy Traditions
    if (typeof source.details?.traditions === 'string') {
      const arr = source.details.traditions.split(",");
      source.details.traditions = arr.filter(s => s).map((s) => ({ name: s.trim() }));
    }

    // Migrate bonus damage and reputation
    if ('stats' in source && isNaN(source.stats?.bonusdamage)) source.stats.bonusdamage = 0;
    if ('details' in source && isNaN(source.details?.reputation)) source.details.reputation = 0;
    
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