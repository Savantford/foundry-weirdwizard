import WWDocumentMixin from "./ww-document.mjs";

/**
 * Extend the basic Item with some modifications.
 * @extends {Item}
*/
export default class WWItem extends WWDocumentMixin(Item) {

  /* -------------------------------------------- */
  /*  Document Creation                           */
  /* -------------------------------------------- */

  async _preCreate(data, options, user) {
    let icon = data.img;
    
    // If no image is provided, set default by category.
    if (!icon) {

      switch (this.type) {
        case 'equipment':
          icon = 'icons/svg/item-bag.svg';
        break;
   
        case 'talent':
          icon = 'icons/svg/card-hand.svg';
        break;
  
        case 'spell':
          icon = 'icons/svg/lightning.svg';
        break;
  
        case 'Ancestry':
          icon = 'icons/svg/oak.svg';
        break;

        case 'Profession':
          icon = 'systems/weirdwizard/assets/icons/professions/dig-dug.svg';
        break;
  
        case 'Path':
          icon = 'icons/svg/stone-path.svg';
        break;
      }

    }

    await this.updateSource({ img: icon });
    
    return await super._preCreate(await data, options, user);
  }

  /* -------------------------------------------- */
  /*  Document Update                             */
  /* -------------------------------------------- */

  async _preUpdate(changes, options, user) {
    await super._preUpdate(changes, options, user);
    
    // Null heldBy if item has no actor
    if (!this.actor && this.system.heldBy) this.system.heldBy = null;

  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /**
  * Augment the basic Item data model with additional dynamic data.
  */
  /*prepareData() {
    super.prepareData();

    // Get the Item's data
    const system = this.system;
    const actorData = this.actor ? this.actor.system : {};

  }*/

  /* -------------------------------------------- */
  /*  Properties (Getters)                        */
  /* -------------------------------------------- */

  get isActivity() {
    return (i.system.attribute || i.effects.size || i.system.instant.length);
  }

  /**
   * Check if item needs targets
   * @returns needTargets
  */ 
  get needTargets() {
    let need = false;
  
    // Check if an against attribute is checked
    if (this.system?.against) need = true;
  
    // Check if any Active Effect needs tokens as targets
    if (this.effects) {
      for (const e of this.effects) {
        if (e.target != 'none') need = true;
      }
    }
  
    // Check if any Active Effect needs tokens as targets
    if (this.system?.instant) {
      for (const e of this.system.instant) {
        if (e.target != 'none') need = true;
      }
    }
  
    return need;
  }

  get charOption() {
    if (this.type == 'Ancestry' || this.type == 'Profession' || this.type == 'Path') return true; else return false;
  }

  /* -------------------------------------------- */
  /*  Static Methods                              */
  /* -------------------------------------------- */
  
  /**
     * Present a Dialog form to create a new Document of this type.
     * Choose a name and a type from a select menu of types.
     * @param {object} data              Initial data with which to populate the creation form
     * @param {object} [context={}]      Additional context options or dialog positioning options
     * @param {Document|null} [context.parent]   A parent document within which the created Document should belong
     * @param {string|null} [context.pack]       A compendium pack within which the Document should be created
     * @param {string[]} [context.types]         A restriction the selectable sub-types of the Dialog.
     * @returns {Promise<Document|null>} A Promise which resolves to the created Document, or null if the dialog was
     *                                   closed.
     * @memberof ClientDocumentMixin
     */
  static async createDialog(data={}, {parent=null, pack=null, types, ...options}={}) {

    const cls = this.implementation;

    // Identify allowed types
    let documentTypes = [];
    let defaultType = CONFIG[this.documentName]?.defaultType;
    let defaultTypeAllowed = false;
    let hasTypes = false;
    if (this.TYPES.length > 1) {
      if (types?.length === 0) throw new Error("The array of sub-types to restrict to must not be empty");

      // Register supported types
      for (const type of this.TYPES) {
        if (type === CONST.BASE_DOCUMENT_TYPE) continue;
        if (types && !types.includes(type)) continue;
        let label = CONFIG[this.documentName]?.typeLabels?.[type];
        label = label && game.i18n.has(label) ? game.i18n.localize(label) : type;
        documentTypes.push({ value: type, label });
        if (type === defaultType) defaultTypeAllowed = true;
      }
      if (!documentTypes.length) throw new Error("No document types were permitted to be created");

      if (!defaultTypeAllowed) defaultType = documentTypes[0].value;
      // Sort alphabetically
      /*documentTypes.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));*/
      hasTypes = true;
    }

    // Identify destination collection
    let collection;
    if (!parent) {
      if (pack) collection = game.packs.get(pack);
      else collection = game.collections.get(this.documentName);
    }

    // Collect data
    const folders = collection?._formatFolderSelectOptions() ?? [];
    const label = game.i18n.localize(this.metadata.label);
    const title = game.i18n.format("DOCUMENT.Create", { type: label });
    const type = data.type || defaultType;

    // Render the document creation form
    const html = await foundry.applications.handlebars.renderTemplate("templates/sidebar/document-create.html", {
      folders,
      name: data.name || "",
      defaultName: cls.defaultName({ type, parent, pack }),
      folder: data.folder,
      hasFolders: folders.length >= 1,
      hasTypes,
      type,
      types: documentTypes
    });

    // Render the confirmation dialog window
    return Dialog.prompt({
      title,
      content: html,
      label: title,
      render: html => {
        if (!hasTypes) return;
        html[0].querySelector('[name="type"]').addEventListener("change", e => {
          const nameInput = html[0].querySelector('[name="name"]');
          nameInput.placeholder = cls.defaultName({ type: e.target.value, parent, pack });
        });
      },
      callback: html => {
        const form = html[0].querySelector("form");
        const fd = new FormDataExtended(form);
        foundry.utils.mergeObject(data, fd.object, { inplace: true });
        if (!data.folder) delete data.folder;
        if (!data.name?.trim()) data.name = cls.defaultName({ type: data.type, parent, pack });
        return cls.create(data, { parent, pack, renderSheet: true });
      },
      rejectClose: false,
      options
    });
    
    
  }

  /* -------------------------------------------- */
  
  static migrateData(data) {
    // Fix uppercase on document types
    switch (data.type) {
      case "Equipment": data.type = "equipment"; break;
      case "Trait or Talent": data.type = "talent"; break;
      case "Spell": data.type = "spell"; break;
    }
    
    return super.migrateData(data);
  }

}