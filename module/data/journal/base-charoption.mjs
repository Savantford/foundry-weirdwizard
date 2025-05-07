import embedCard from "../../helpers/embed-card.mjs";

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

}

export const fields = foundry.data.fields;

export function base(type = String) {
  const obj = {
    description: makeHtmlField('No description.')
  }

  return obj;
};

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