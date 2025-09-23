import { i18n, sysPath } from "../helpers/utils.mjs";

/**
 * A mixin which extends each Document definition with specialized client-side behaviors.
 * This mixin defines the client-side interface for database operations and common document behaviors.
 * @category Mixins
 * @param {typeof Document} Base    The base Document class to be mixed
 */
export default function WWDocumentMixin(Base) {
  
  class WWBaseDocument extends Base {

    /* -------------------------------------------- */
    /*  Data Preparation                            */
    /* -------------------------------------------- */

    /** @inheritdoc */
    static migrateData(data) {

      // 6.2.0 subtype migrations - Thanks Draw Steel for the inspiration
      if (['Character', 'NPC', 'Group', 'Vehicle', 'Equipment', 'Trait or Talent', 'Spell'].includes(data.type)) {

        switch (data.type) {
          case "Character": data.type = "character"; break;
          case "NPC": data.type = "npc"; break;
          case "Group": data.type = "group"; break;
          case "Vehicle": data.type = "vehicle"; break;
          case "Equipment": data.type = "equipment"; break;
          case "Trait or Talent": data.type = "talent"; break;
          case "Spell": data.type = "spell"; break;
        }

        foundry.utils.setProperty(data, "flags.weirdwizard.migrateType", true);
      }

      return super.migrateData(data);
    }

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
      const documentConfig = CONFIG[this.documentName];
      const documentName = game.i18n.localize(`DOCUMENT.${this.documentName}`);
      let anchorIcon = icon ?? documentConfig.sidebarIcon;
      console.log(icon)
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
        /*const typeLabel = documentConfig.typeLabels[this.type];
        const typeName = game.i18n.has(typeLabel) ? `${game.i18n.localize(typeLabel)}` : "";
        dataset.tooltipText ??= typeName ?
          game.i18n.format("DOCUMENT.TypePageFormat", {type: typeName, page: documentName}) :
          documentName;*/
        anchorIcon = icon ?? documentConfig.typeIcons?.[this.type] ?? documentConfig.sidebarIcon;
      }

      name ??= this.name;

      return foundry.applications.ux.TextEditor.implementation.createAnchor({ attrs, dataset, name, classes, icon: anchorIcon });
    }

    /* -------------------------------------------- */

    /* Prepare a fancy document card to use in tooltips. */
    async toCard(options) {
      let templateFile = this.documentName.toLowerCase();
      if (this.documentName === 'ActiveEffect') templateFile = 'effect';
      if (this.documentName === 'JournalEntryPage') templateFile = 'page';

      const card = await foundry.applications.handlebars.renderTemplate(
        sysPath(`templates/apps/tooltips/${await templateFile}.hbs`),
        await this._prepareCardContext(options)
      );
      
      return await card;
    }

    /* -------------------------------------------- */

    async toEmbed(config, options = {}) {
      // Add to config 
      config.label = this.name;

      // Add to options
      options.rollData = this.documentName === 'Actor' ? this.getRollData() : null;
      options.relativeTo = this;
      options.async = true;
      options.secrets = this.isOwner;

      // Prepare wrapper
      const wrapper = document.createElement('div');
      wrapper.classList.add('document-embed');

      // Prepare embed template
      let templateFile = this.documentName.toLowerCase();
      if (this.documentName === 'ActiveEffect') templateFile = 'effect';
      if (this.documentName === 'JournalEntryPage') templateFile = 'page';

      wrapper.innerHTML = await foundry.applications.handlebars.renderTemplate(
        sysPath(`templates/apps/embeds/${templateFile}.hbs`),
        await this._prepareCardContext(options)
      );

      return wrapper;
    }

    /* -------------------------------------------- */

    async _prepareCardContext(options) {
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
          if (this.type === 'character') {
            // Prepare subtitle
            if (charOptions.ancestry) context.subtitle = charOptions.ancestry.name;

            const sep = context.subtitle ? ' • ' : '';

            if (charOptions.master) context.subtitle += sep + charOptions.master.name;
            else if (charOptions.expert) context.subtitle += sep + charOptions.expert.name;
            else if (charOptions.novice) context.subtitle += sep + charOptions.novice.name;

            // Prepare main text
            context.text = await TextEditor.enrichHTML(this.system.details.appearance, options);

          } else {
            // Prepare subtitle
            for (const d in listEntries.descriptors) {
              const descriptor = listEntries.descriptors[d];
              context.subtitle += (context.subtitle ? ', ' : '') + descriptor.name;
            }
            
            // Prepare main text
            context.text = await TextEditor.enrichHTML(this.system.description, options);
          }

        }; break;

        case 'Item': {
          // Prepare subtitle
          switch (this.type) {
            case 'equipment':
              context.subtitle = i18n(CONFIG.WW.EQUIPMENT_SUBTYPES[this.system.subtype]);
            break;

            case 'talent':
              context.subtitle = i18n(CONFIG.WW.TALENT_SUBTYPES[this.system.subtype]);
            break;

            case 'spell':
              context.subtitle = `${i18n('TYPES.Item.Spell')} • ${i18n(CONFIG.WW.TIERS[this.system.tier])}`;
              const sep = context.subtitle ? ' • ' : '';

              if (this.system.tradition) context.subtitle += sep + this.system.tradition;
            break;
          }
          
          // Prepare main text
          context.text = await TextEditor.enrichHTML(this.system.description, options);

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

      return context;

    }

    /**
     * @override
     * Present a Dialog form to create a new Document of this type.
     * Choose a name and a type from a select menu of types.
     * @param {object} data                Document creation data
     * @param {DatabaseCreateOperation} [createOptions]  Document creation options.
     * @param {object} [options={}]        Options forwarded to DialogV2.prompt
     * @param {{id: string; name: string}[]} [options.folders] Available folders in which the new Document can be place
     * @param {string[]} [options.types]   A restriction of the selectable sub-types of the Dialog.
     * @param {string} [options.template]  A template to use for the dialog contents instead of the default.
     * @param {object} [options.context]   Additional render context to provide to the template.
     * @returns {Promise<Document|null>}   A Promise which resolves to the created Document, or null if the dialog was
     *                                     closed.
     */
    static async createDialog(data={}, createOptions={}, {folders, types, template, context, ...dialogOptions}={}) {
      const applicationOptions = {
        top: "position", left: "position", width: "position", height: "position", scale: "position", zIndex: "position",
        title: "window", id: "", classes: "", jQuery: ""
      };

      for ( const [k, v] of Object.entries(createOptions) ) {
        if ( k in applicationOptions ) {
          foundry.utils.logCompatibilityWarning("The ClientDocument.createDialog signature has changed. "
            + "It now accepts database operation options in its second parameter, "
            + "and options for DialogV2.prompt in its third parameter.", { since: 13, until: 15, once: true });
          const dialogOption = applicationOptions[k];
          if ( dialogOption ) foundry.utils.setProperty(dialogOptions, `${dialogOption}.${k}`, v);
          else dialogOptions[k] = v;
          delete createOptions[k];
        }
      }

      const { parent, pack } = createOptions;
      const cls = this.implementation;

      // Identify allowed types
      const documentTypes = [];
      let defaultType = CONFIG[this.documentName]?.defaultType;
      let defaultTypeAllowed = false;
      let hasTypes = false;
      if ( this.TYPES.length > 1 ) {
        if ( types?.length === 0 ) throw new Error("The array of sub-types to restrict to must not be empty");

        // Register supported types
        for ( const type of this.TYPES ) {
          if ( type === CONST.BASE_DOCUMENT_TYPE ) continue;
          if ( types && !types.includes(type) ) continue;
          let label = CONFIG[this.documentName]?.typeLabels?.[type];
          label = label && game.i18n.has(label) ? game.i18n.localize(label) : type;
          documentTypes.push({value: type, label});
          if ( type === defaultType ) defaultTypeAllowed = true;
        }
        if ( !documentTypes.length ) throw new Error("No document types were permitted to be created");

        if ( !defaultTypeAllowed ) defaultType = documentTypes[0].value;
        // Sort alphabetically
        //documentTypes.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));
        hasTypes = true;
      }

      // Identify destination collection
      let collection;
      if ( !parent ) {
        if ( pack ) collection = game.packs.get(pack);
        else collection = game.collections.get(this.documentName);
      }

      // Collect data
      folders ??= collection?._formatFolderSelectOptions() ?? [];
      const label = game.i18n.localize(this.metadata.label);
      const title = game.i18n.format("DOCUMENT.Create", {type: label});
      const type = data.type || defaultType;

      // Render the document creation form
      template ??= "templates/sidebar/document-create.html";
      const html = await foundry.applications.handlebars.renderTemplate(template, {
        folders, hasTypes, type,
        name: data.name || "",
        defaultName: cls.defaultName({type, parent, pack}),
        folder: data.folder,
        hasFolders: folders.length >= 1,
        types: documentTypes,
        ...context
      });
      const content = document.createElement("div");
      content.innerHTML = html;

      // Render the confirmation dialog window
      return foundry.applications.api.DialogV2.prompt(foundry.utils.mergeObject({
        content,
        window: {title}, // FIXME: double localization
        position: {width: 360},
        render: (event, dialog) => {
          if ( !hasTypes ) return;
          dialog.element.querySelector('[name="type"]').addEventListener("change", e => {
            const nameInput = dialog.element.querySelector('[name="name"]');
            nameInput.placeholder = cls.defaultName({type: e.target.value, parent, pack});
          });
        },
        ok: {
          label: title, // FIXME: double localization
          callback: (event, button) => {
            const fd = new foundry.applications.ux.FormDataExtended(button.form);
            foundry.utils.mergeObject(data, fd.object);
            if ( !data.folder ) delete data.folder;
            if ( !data.name?.trim() ) data.name = cls.defaultName({type: data.type, parent, pack});
            return cls.create(data, {renderSheet: true, ...createOptions});
          }
        }
      }, dialogOptions));
    }

  }

  return WWBaseDocument;

}