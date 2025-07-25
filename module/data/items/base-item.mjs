import embedCard from "../../helpers/embed-card.mjs";

export class BaseItemModel extends foundry.abstract.TypeDataModel {

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
  const desc = (type === 'Equipment') ? '' : 'No description.';
  const active = (type === 'Spell') ? false : true;

  const obj = {
    description: makeHtmlField(desc),
    active: makeBooField(active),
    grantedBy: new fields.StringField({
      initial: null,
      blank: true,
      textSearch: false,
      nullable: true
    })
  }

  return obj;
};

export function physical(type = String) {

  const obj = {
    quantity: makeIntField(1),
    weightUnit: makeIntField(1),

    price: new fields.SchemaField({
      value: makeFloField(),
      coin: makeStrField('sp')
    }),

    availability: makeStrField()
  }

  return obj;
}

export function activity(type = String) {

  const obj = {
    magical: makeBooField(type === 'Spell' ? true : false),
    attribute: makeStrField(),
    against: makeStrField(),

    boons: new fields.NumberField({
      required: true,
      initial: 0,
      integer: true
    }),

    range: makeIntField(),
    affliction: makeStrField(),

    uses: new fields.SchemaField({
      value: makeIntField(),
      max: makeIntField(),
      onRest: makeBooField(true),
      levelRelative: makeStrField('manual',0)
    }),

    healing: makeStrField(),
    instant: new fields.ArrayField(
      new fields.ObjectField({
        label: makeStrField(),
        trigger: makeStrField('onUse'),
        target: makeStrField('tokens'),
        value: makeStrField()
      })
    ),

    targeting: makeStrField('manual'),
    template: new fields.SchemaField({
      type: makeStrField('size'),
      value: makeIntField(5)
    })
    
  }

  if (type === 'Equipment') {
    obj.uses.onRest = makeBooField(false);
    //obj.uses.autodestroy = makeBooField(false);
  }

  else if (type === 'Spell') obj.uses.max = makeIntField(1)

  return obj;
}

/****************************************/

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