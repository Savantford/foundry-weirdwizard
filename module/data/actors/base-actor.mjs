import embedCard from "../../helpers/embed-card.mjs";

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

}

export const fields = foundry.data.fields;

export function description(type = String) {
  const init = (type === 'Character') ? 'Unknown biography.' : 'No creature description.';

  return {
    description: makeHtmlField(init)
  }

};

export const attributes = () => ({
  attributes: new fields.SchemaField({
    str: makeAttribute('Strength'),
    agi: makeAttribute('Agility'),
    int: makeAttribute('Intellect'),
    wil: makeAttribute('Will')
  })
})

export function stats(type = String) {

  const obj = {

    defense: makeDefense(type),
    health: makeHealth(type),

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
  }

  if (type === 'Character') {
    obj.level = makeNumField();
    obj.bonusdamage = makeIntField();
  } else if (type === 'NPC') {
    obj.difficulty = makeIntField(1);
  };

  return { stats: new fields.SchemaField(obj) };
};

export function details(type = String) {
  
  const obj = {
    descriptors: new fields.ObjectField({
      initial: new fields.ObjectField({
        initial: {
          name: "",
          desc: "",
          grantedBy: null
        }
      })
    }),

    senses: new fields.ObjectField({
      initial: new fields.ObjectField({
        initial: {
          name: "",
          desc: "",
          grantedBy: null
        }
      })
    }),

    languages: new fields.ObjectField({
      initial: new fields.ObjectField({
        initial: {
          name: "",
          desc: "",
          grantedBy: null
        }
      })
    }),

    immunities: new fields.ObjectField({
      initial: new fields.ObjectField({
        initial: {
          name: "",
          desc: "",
          grantedBy: null
        }
      })
    }),

    movementTraits: new fields.ObjectField({
      initial: new fields.ObjectField({
        initial: {
          name: "",
          desc: "",
          grantedBy: null
        }
      })
    })

  }

  if (type === 'Character') {

    // Will be deleted in a later date
    obj.professions = makeStrField("", 1, 1);
    obj.ancestry = makeStrField("", 1, 1);
    obj.novice = makeStrField("", 1, 1);
    obj.expert = makeStrField("", 1, 1);
    obj.master = makeStrField("", 1, 1);

    obj.traditions = new fields.ArrayField(
      new fields.ObjectField({
        initial: {
          name: "",
          desc: "",
          grantedBy: null
        }
      })
    );

    // Details
    obj.appearance = makeHtmlField();
    obj.features = makeHtmlField(); // Deleted
    obj.background = makeHtmlField();
    obj.bg_ancestry = makeHtmlField(); // Deleted
    obj.personality = makeHtmlField();
    obj.beliefs = makeHtmlField();
    obj.belief = makeHtmlField(); // Deleted

    obj.notes = makeHtmlField();
    obj.information = makeHtmlField(); // Deleted
    obj.deeds = makeHtmlField(); // Deleted
  }


  return { details: new fields.SchemaField(obj) };
}

export function charOptions(type = String) {
  const obj = {
    ancestry: makeStrField('', 1) // Use Human Ancestry UUID instead
  };

  if (type === 'Character') {

    obj.professions = new fields.ArrayField(
      makeStrField()
    );

    // Paths
    obj.novice = makeStrField();
    obj.expert = makeStrField();
    obj.master = makeStrField();

    obj.traditions = new fields.ArrayField(
      makeStrField()
    );
  }

  return { charOptions: new fields.SchemaField(obj) };
}

/****************************************/
export const makeHtmlField = (init = '') => new fields.SchemaField({
  value: new fields.HTMLField({
    initial: init,
    textSearch: true // Allow it to be searched in the Search Bar
  })
})

const makeBooField = (init = false) => new fields.BooleanField({
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

const makeStrField = (init = '', blank = true) => new fields.StringField({
  initial: init,
  blank: blank
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

export function makeDefense(type) {

  if (type == 'Character') {
    return new fields.SchemaField({
      total: makeIntField(),
      natural: makeIntField(8)
    })
  }

  else if (type == 'NPC') return new fields.SchemaField({
    total: makeIntField(),
    natural: makeIntField(10),
    details: makeStrField()
  })

  else return {}
}

export function makeHealth(type) {

  if (type == 'Character') {
    return new fields.SchemaField({
      current: makeIntField(),
      normal: makeIntField(),
      lost: makeIntField()
    })
  } else if (type == 'NPC') return new fields.SchemaField({
    current: makeIntField(),
    normal: makeIntField(10),
    lost: makeIntField()
  })

  else return {}
}

