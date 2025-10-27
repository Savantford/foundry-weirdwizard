import embedCard from "../../helpers/embed-card.mjs";

export class BaseEffectModel extends foundry.abstract.TypeDataModel {

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

  static defineSchema() {
    
    return {
      target: makeStrField('none',0),
      trigger: makeStrField('passive',0),

      duration: new fields.SchemaField({
        selected: makeStrField('none',0),
        inMinutes: makeIntField(null,1),
        inHours: makeIntField(null,1),
        inDays: makeIntField(null,1),
        autoExpire: makeBooField(true)
      }),
      
      grantedBy: makeStrField()
    }

  }

}

/****************************************/

export const fields = foundry.data.fields;

export const makeHtmlField = (init = '') => new fields.SchemaField({
  value: new fields.HTMLField({
    initial: init,
    textSearch: true // Allow it to be searched in the Search Bar
  }),

  name: new fields.StringField({
    initial: '',
    textSearch: true
  })
})

export const makeFloField = (init = 0) => new fields.NumberField({
  required: true,
  initial: init,
  min: 0,
  nullable: true,
  integer: false
})

export const makeIntField = (init = 0, min = 0) => new fields.NumberField({
  required: true,
  initial: init,
  min: min,
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