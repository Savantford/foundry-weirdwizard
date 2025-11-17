
import BaseActorModel from './base-creature.mjs';
import { makeFloField, makeHtmlField, makeIntField, makeStrField, makeUuidStrField } from '../field-presets.mjs';
import { i18n } from '../../helpers/utils.mjs';

export default class CharacterModel extends BaseActorModel {

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
      notes: makeHtmlField()
    });

    // Add Character Options
    schema.charOptions = new fields.SchemaField({

      ancestry: makeUuidStrField('Compendium.weirdwizard.character-options.JournalEntry.pAAZKv2vrilITojZ.JournalEntryPage.GI4b6WkOLlTszbRe'),

      // Path UUIDs
      novice: makeUuidStrField(),
      expert: makeUuidStrField(),
      master: makeUuidStrField(),

      // Array of UUIDs
      professions: new fields.ArrayField(
        makeUuidStrField()
      ),
      traditions: new fields.ArrayField(
        makeUuidStrField()
      )
      
    });
    
    // Add Character stats
    schema.stats.fields.level = makeFloField();
    schema.stats.fields.bonusdamage = makeIntField();
    
    // Adjust Character-specific initials
    schema.stats.fields.defense.fields.natural = makeIntField(8);
    schema.stats.fields.health.fields.normal = makeIntField(5);
    schema.stats.fields.health.fields.current = makeIntField(5);
    
    // Will be deleted in a later date
    schema.listEntries.fields.traditions = new fields.TypedObjectField(
      new fields.SchemaField({
        name: makeStrField(""),
        desc: makeStrField(),
        grantedBy: makeUuidStrField()
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

    // Migrate HTML fields to a single string
    if ('details' in source) {
      if (typeof source.details.appearance === 'object') source.details.appearance = source.details.appearance.value;
      if (typeof source.details.background === 'object') source.details.background = source.details.background.value;
      if (typeof source.details.personality === 'object') source.details.personality = source.details.personality.value;
      if (typeof source.details.beliefs === 'object') source.details.beliefs = source.details.beliefs.value;
      if (typeof source.details.notes === 'object') source.details.notes = source.details.notes.value;
    }
    
    return super.migrateData(source);
  }

}