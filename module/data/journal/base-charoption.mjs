import embedCard from "../../helpers/embed-card.mjs";
import { camelCase } from "../../helpers/utils.mjs";
import { makeHtmlField } from "../field-presets.mjs";

export default class BaseCharOptionModel extends foundry.abstract.TypeDataModel {

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
      description: makeHtmlField('No description.')
    };

    return schema;
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {

    // Migrate immune to immunities
    if ('benefits' in source) {
      const listKeys = ['senses', 'descriptors', 'languages', 'immunities', 'movementTraits', 'traditions'];

      for (const b in source.benefits) {
        const benefit = source.benefits[b];
        
        for (const listKey in benefit) {
          const list = benefit[listKey];

          // Check for the listKeys and if it's an array
          if (benefit.hasOwnProperty(listKey) && listKeys.includes(listKey)) {
            
            if (Array.isArray(list)) {

              if (list.length) {
                const map = list.map(value => [value.name ? camelCase(value.name) : camelCase(value), value]);

                benefit[listKey] = Object.fromEntries(map);
              } else {
                benefit[listKey] = {};
              }

            }
          }
        }
      }
    }

    return source;
  }

}