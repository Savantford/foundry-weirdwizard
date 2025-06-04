import embedCard from "../../helpers/embed-card.mjs";
import { camelCase } from "../../helpers/utils.mjs";
import { TypedObjectField } from "../typed-object-field.mjs";

export const fields = foundry.data.fields;

export class BaseActorModel extends foundry.abstract.TypeDataModel {

  /**
   * Convert this Document to some HTML display for embedding purposes.
   * @param {DocumentHTMLEmbedConfig} config  Configuration for embedding behavior.
   * @param {EnrichmentOptions} [options]     The original enrichment options for cases where the Document embed content
   *                                          also contains text that must be enriched.
   * @returns {Promise<HTMLDocumentEmbedElement|HTMLElement|HTMLCollection|null>}
   */
  /** @inheritdoc */
  async toEmbed(config, options = {}) {
    return embedCard(this.parent, config, options);
  }

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      // Description
      description: makeHtmlField('No creature description.'),

      // Attributes
      attributes: new fields.SchemaField({
        str: makeAttribute('Strength'),
        agi: makeAttribute('Agility'),
        int: makeAttribute('Intellect'),
        wil: makeAttribute('Will')
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

        size: makeNumField(),

        speed: new fields.SchemaField({
          normal: makeIntField(5),
          current: makeIntField()
        })
      }),

      // List Entries
      listEntries: new fields.SchemaField({

        descriptors: new TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("", 0),
            desc: makeStrField(),
            grantedBy: makeStrField(null)
          }, {nullable: true})
        ),

        senses: new TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("", 0),
            desc: makeStrField(),
            grantedBy: makeStrField(null)
          }, {nullable: true})
        ),

        languages: new TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("", 0),
            desc: makeStrField(),
            grantedBy: makeStrField(null)
          }, {nullable: true})
        ),

        immunities: new TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("", 0),
            desc: makeStrField(),
            grantedBy: makeStrField(null)
          }, {nullable: true})
        ),

        movementTraits: new TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("", 0),
            desc: makeStrField(),
            grantedBy: makeStrField(null)
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
            console.log(key)
            console.log(prop)
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

/****************************************/

export const makeBooField = (init = false) => new fields.BooleanField({
  initial: init
})

export const makeNumField = (init = 1) => new fields.NumberField({
  required: true,
  initial: init,
  positive: true
})

export const makeIntField = (init = 0) => new fields.NumberField({
  required: true,
  initial: init,
  min: 0,
  integer: true,
  clean: true
})

export const makeStrField = (init = '', blank = true) => new fields.StringField({
  initial: init,
  blank: blank
})

export const makeCharOptionField = (init = null) => new fields.StringField({
  initial: init,
  blank: true,
  nullable: true
})

export const makeHtmlField = (init = '') => new fields.SchemaField({
  value: new fields.HTMLField({
    initial: init,
    textSearch: true // Allow it to be searched in the Search Bar
  })
})

export function makeAttribute(attribute) {
  const label = 'WW.' + attribute;

  return new fields.SchemaField({
    value: new fields.NumberField({
      required: true,
      initial: 10,
      max: 20,
      min: 0,
      integer: true,
      label: label,
      hint: label
    })
  })
}
