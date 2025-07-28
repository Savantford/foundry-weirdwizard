import embedCard from "../../helpers/embed-card.mjs";
import { makeBooField, makeRequiredStrField, makeUuidStrField, makePosIntField } from "../field-presets.mjs";

export default class BaseEffectModel extends foundry.abstract.TypeDataModel {

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
    const fields = foundry.data.fields;
    
    const schema = {
      target: makeRequiredStrField('none'),
      trigger: makeRequiredStrField('passive'),

      duration: new fields.SchemaField({
        selected: makeRequiredStrField('none'),
        inMinutes: makePosIntField(null),
        inHours: makePosIntField(null),
        inDays: makePosIntField(null),
        autoExpire: makeBooField(true)
      }),
      
      grantedBy: makeUuidStrField()
    }

    return schema;
  }

}