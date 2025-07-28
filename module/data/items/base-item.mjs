import embedCard from "../../helpers/embed-card.mjs";
import { makeStrField, makeBooField, makeIntField, makeHtmlField, makeUuidStrField, makeRequiredStrField } from '../field-presets.mjs';

export default class BaseItemModel extends foundry.abstract.TypeDataModel {

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
      description: makeHtmlField(),
      active: makeBooField(true),
      grantedBy: makeUuidStrField(),

      magical: makeBooField(false),
      attribute: makeStrField(), // Make it required maybe
      against: makeStrField(), // Make it required maybe

      boons: new fields.NumberField({
        required: true,
        initial: 0,
        integer: true
      }),

      range: makeIntField(),
      affliction: makeStrField(), // Make it required maybe

      uses: new fields.SchemaField({
        value: makeIntField(),
        max: makeIntField(),
        onRest: makeBooField(true),
        levelRelative: makeRequiredStrField('manual')
      }),

      healing: makeStrField(),
      instant: new fields.ArrayField(
        new fields.ObjectField({
          label: makeStrField(),
          trigger: makeRequiredStrField('onUse'),
          target: makeRequiredStrField('tokens'),
          value: makeStrField()
        })
      ),

      targeting: makeRequiredStrField('manual'),
      template: new fields.SchemaField({
        type: makeRequiredStrField('size'),
        value: makeIntField(5)
      })

    };

    return schema;
  }

}