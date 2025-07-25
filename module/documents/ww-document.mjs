import { i18n, sysPath } from "../helpers/utils.mjs";

/**
 * A mixin which extends each Document definition with specialized client-side behaviors.
 * This mixin defines the client-side interface for database operations and common document behaviors.
 * @category Mixins
 * @param {typeof Document} Base    The base Document class to be mixed
 */
export default function WWMixin(Base) {
  
  class WWBaseDocument extends Base {

    /* -------------------------------------------- */
    /*  Enrichment                                  */
    /* -------------------------------------------- */

    /**
     * @override
     * Create a content link for this Document.
     * @param {Partial<EnrichmentAnchorOptions>} [options]  Additional options to configure how the link is constructed.
     * @returns {HTMLAnchorElement}
     */
    async toAnchor({attrs={}, dataset={}, classes=[], name, icon}={}) {
      // Build dataset
      console.log(this)
      const documentConfig = CONFIG[this.documentName];
      const documentName = game.i18n.localize(`DOCUMENT.${this.documentName}`);
      let anchorIcon = icon ?? documentConfig.sidebarIcon;
      if ( !classes.includes("content-link") ) classes.unshift("content-link");
      attrs = foundry.utils.mergeObject({ draggable: "true" }, attrs);
      dataset = foundry.utils.mergeObject({
        link: "",
        uuid: this.uuid,
        id: this.id,
        type: this.documentName,
        pack: this.pack,
        tooltip: await this.toCard() //documentName
      }, dataset);

      // If this is a typed document, add the type to the dataset
      if ( this.type ) {
        const typeLabel = documentConfig.typeLabels[this.type];
        /*const typeName = game.i18n.has(typeLabel) ? `${game.i18n.localize(typeLabel)}` : "";
        dataset.tooltipText ??= typeName ?
          game.i18n.format("DOCUMENT.TypePageFormat", {type: typeName, page: documentName}) :
          documentName;*/
        anchorIcon = icon ?? documentConfig.typeIcons?.[this.type] ?? documentConfig.sidebarIcon;
      }

      name ??= this.name;

      return foundry.applications.ux.TextEditor.implementation.createAnchor({ attrs, dataset, name, classes, icon: anchorIcon });
    }

    /* Prepare a fancy document card to use in tooltips. */
    async toCard(options) {

      // Prepare variables
      const TextEditor = foundry.applications.ux.TextEditor.implementation;

      const context = {
        label: this.name,
        system: this.system,
        img: this instanceof JournalEntryPage ? this.src : this.img,
        type: this.type,

        subtitle: ''
      };
      
      switch (this.documentName) {

        case 'Actor': {
          const charOptions = this.charOptions;
          const listEntries = this.system.listEntries;

          // Prepare contextual variables
          if (this.type === 'Character') {
            // Prepare subtitle
            if (charOptions.ancestry) context.subtitle = charOptions.ancestry.name;

            const sep = context.subtitle ? ' • ' : '';

            if (charOptions.master) context.subtitle += sep + charOptions.master.name;
            else if (charOptions.expert) context.subtitle += sep + charOptions.expert.name;
            else if (charOptions.novice) context.subtitle += sep + charOptions.novice.name;

            // Prepare main text
            context.text = await TextEditor.enrichHTML(this.system.details.appearance.value, options);

          } else {
            // Prepare subtitle
            for (const d in listEntries.descriptors) {
              const descriptor = listEntries.descriptors[d];
              context.subtitle += (context.subtitle ? ', ' : '') + descriptor.name;
            }

            // Prepare main text
            context.text = await TextEditor.enrichHTML(this.system.description.value, options);
          }

        }; break;

        case 'Item': {
          // Prepare subtitle
          switch (this.type) {
            case 'Equipment':
              context.subtitle = i18n(CONFIG.WW.EQUIPMENT_SUBTYPES[this.system.subtype]);
            break;

            case 'Trait or Talent':
              context.subtitle = i18n(CONFIG.WW.TALENT_SUBTYPES[this.system.subtype]);
            break;

            case 'Spell':
              context.subtitle = i18n(CONFIG.WW.TIERS[this.system.tier]);
              const sep = context.subtitle ? ' • ' : '';

              if (this.system.tradition) context.subtitle += sep + this.system.tradition;
            break;
          }

          // Prepare main text
          context.text = await TextEditor.enrichHTML(this.description, options);

        }; break;

        case 'ActiveEffect': {
          // Prepare subtitle
          context.subtitle = i18n((this.duration.rounds || this.duration.seconds) ? "WW.Effect.Temporary" : "WW.Effect.Permanent");

          // Prepare main text
          context.text = await TextEditor.enrichHTML(this.description, options);

          // Prepare changes
          context.changes = '';

          for (const c of this.changes) {
            const label = CONFIG.WW.EFFECT_CHANGE_LABELS[c.key] ? i18n(CONFIG.WW.EFFECT_CHANGE_LABELS[c.key]) : 'BROKEN EFFECT CHANGE, FIX IT!';
            context.changes += `<li>${label} ${(c.value !== true) ? `${c.value}.` : ''}</li>`;
          }

        }; break;

        case 'JournalEntryPage': {
          // Prepare subtitle
          context.subtitle = i18n(CONFIG.WW.CHARACTER_OPTIONS[this.type]);

          // Prepare main text
          context.text = await TextEditor.enrichHTML(this.text.content, options);
        }; break;
      }

      // Create the tooltip card
      if (!context.text) context.text = 'No description available.';
      let templateFile = this.documentName.toLowerCase();
      if (this.documentName === 'ActiveEffect') templateFile = 'effect';
      if (this.documentName === 'JournalEntryPage') templateFile = 'page';

      const card = await foundry.applications.handlebars.renderTemplate(sysPath(`templates/apps/tooltips/${await templateFile}.hbs`), context);
      
      return await card;
    }

  }

  return WWBaseDocument;

}