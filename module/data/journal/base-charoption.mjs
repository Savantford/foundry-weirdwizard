import embedCard from "../../helpers/embed-card.mjs";

const fields = foundry.data.fields;

export class BaseCharOptionModel extends foundry.abstract.TypeDataModel {

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

    const schema = {
      // Description
      description: makeHtmlField('No description.')
      
    }

    return schema;
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {

    // Migrate immune to immunities
    if ('details' in source && source.details?.immune) source.details.immunities = source.details.immune;

    // Migrate entry lists from array to object to system.listEntries
    if ('details' in source && 'listEntries' in source) {
      const listKeys = ['senses', 'descriptors', 'languages', 'immunities', 'movementTraits', 'traditions'];

      for (const key in source.details) {
        const prop = source.details[key];

        // Check for the listKeys and if it's an array
        if (source.details.hasOwnProperty(key) && listKeys.includes(key)) {

          if (Array.isArray(prop)) {

            if (prop.length) {
              const map = prop.map(value => [value.name ? camelCase(value.name) : camelCase(value), value]);

              source.listEntries[key] = Object.fromEntries(map);
            } else {
              source.listEntries[key] = {};
            }

          }

        }

      }

    }

    return source;
  }

}

export function grants() {

  const obj = {
    quantity: makeIntField(1),
    weightUnit: makeIntField(1),

    price: new fields.SchemaField({
      value: makeIntField(),
      coin: makeStrField('sp')
    }),

    availability: makeStrField()/*,
    equipped: makeBooField(false),
    identified: makeBooField(true)*/
    
  }

  return obj;
};

/****************************************/

export const makeHtmlField = (init = '') => new fields.SchemaField({
  value: new fields.HTMLField({
    initial: init,
    textSearch: true // Allow it to be searched in the Search Bar
  })
})

export const makeIntField = (init = 0) => new fields.NumberField({
  required: true,
  initial: init,
  min: 0,
  nullable: true,
  integer: true
})

export const makeStrField = (init = '', blank = true, searchable = false) => new fields.StringField({
  initial: init,
  blank: blank,
  textSearch: searchable
})

export const makeBooField = (init = false) => new fields.BooleanField ({
  initial: init
})