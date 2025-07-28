import { camelCase } from "../../helpers/utils.mjs";
import { makeAttributeField, makeHtmlField, makeIntField, makeFloField, makeStrField, makeUuidStrField } from "../field-presets.mjs";

export default class BaseActorModel extends foundry.abstract.TypeDataModel {

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      // Description
      description: makeHtmlField('No creature description.'),

      // Attributes
      attributes: new fields.SchemaField({
        str: makeAttributeField('Strength'),
        agi: makeAttributeField('Agility'),
        int: makeAttributeField('Intellect'),
        wil: makeAttributeField('Will')
      }),

      // Stats
      stats: new fields.SchemaField({
        defense: new fields.SchemaField({
          total: makeIntField(),
          natural: makeIntField(10),
          details: makeStrField()
        }),

        health: new fields.SchemaField({
          current: makeIntField(),
          normal: makeIntField(),
          lost: makeIntField()
        }),

        damage: new fields.SchemaField({
          raw: makeIntField(),
          value: makeIntField(),
          max: makeIntField()
        }),

        size: makeFloField(),

        speed: new fields.SchemaField({
          normal: makeIntField(5),
          current: makeIntField()
        })
      }),

      // List Entries
      listEntries: new fields.SchemaField({

        descriptors: new fields.TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("Unnamed", 0),
            desc: makeStrField(),
            grantedBy: makeUuidStrField()
          }, {nullable: true})
        ),

        senses: new fields.TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("Unnamed", 0),
            desc: makeStrField(),
            grantedBy: makeUuidStrField()
          }, {nullable: true})
        ),

        languages: new fields.TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("Unnamed", 0),
            desc: makeStrField(),
            grantedBy: makeUuidStrField()
          }, {nullable: true})
        ),

        immunities: new fields.TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("Unnamed", 0),
            desc: makeStrField(),
            grantedBy: makeUuidStrField()
          }, {nullable: true})
        ),

        movementTraits: new fields.TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("Unnamed", 0),
            desc: makeStrField(),
            grantedBy: makeUuidStrField()
          }, {nullable: true})
        )

      })
      
    };

    return schema;
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {
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

    // Migrate damage.raw to damage.value
    if ('stats' in source && !source.stats?.damage?.raw && source.stats?.damage?.value) source.stats.damage.raw = source.stats?.damage?.value;

    // Migrate immune to immunities
    if ('details' in source && source.details?.immune) source.details.immunities = source.details.immune;

    // Migrate entry lists from array to object to system.listEntries
    if ('details' in source/* && 'listEntries' in source*/) {
      const listKeys = ['senses', 'descriptors', 'languages', 'immunities', 'movementTraits', 'traditions'];
      
      for (const key in source.details) {
        const prop = source.details[key];
        
        // Check for the listKeys and if it's an array
        if (source.details.hasOwnProperty(key) && listKeys.includes(key)) {
          
          if (Array.isArray(prop)) {
            
            if (prop.length) {
              const map = prop.map(value => [value.name ? camelCase(value.name) : camelCase(value), value]);

              if (!source.listEntries) source.listEntries = {};

              source.listEntries[key] = Object.fromEntries(map);
            }
            
          }
          
        }

      }
      
    }

    return source;
  }

}