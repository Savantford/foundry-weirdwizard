/**
 * Extend the basic JournalEntryPage with some modifications.
 * @extends {JournalEntryPage}
*/

//import { capitalize, i18n } from '../helpers/utils.mjs';

export default class WWJournalPage extends JournalEntryPage {
  /**
  * Augment the basic Item data model with additional dynamic data.
  */

  prepareData() {
    super.prepareData();

    // Get the Item's data
    const system = this.system;
    //const actorData = this.actor ? this.actor.system : {};

  }

  /* -------------------------------------------- */
  
  async _preCreate(data, options, user) {
    let icon = data.image;
    
    // If no image is provided, set default by category.
    if (!icon) {

      switch (this.type) {
        case 'ancestry':
          icon = 'icons/svg/oak.svg';
        break;

        case 'path':
          icon = 'icons/svg/stone-path.svg';
        break;

        case 'profession':
          icon = 'systems/weirdwizard/assets/icons/professions/dig-dug.svg';
        break;

        case 'tradition':
          icon = 'icons/svg/stone-path.svg';
        break;
      }

    }

    await this.updateSource({ 'src': icon });

    if (this.type === 'profession') await this.updateSource({ 'title.level': 3 });
    
    return await super._preCreate(await data, options, user);
  }

  /* -------------------------------------------- */

  async _preUpdate(changes, options, user) {
    await super._preUpdate(changes, options, user);

    // If Path, apply on tier change flow
    if (this.system.tier && (this.system.tier !== changes.system?.tier)) {
      await this._onTierChange(await changes);
    }
    
    // If Profession category is changes and the icon is one of the default ones, change base icon
    if (this.type === 'profession' && changes.system?.category !== this.system.category && (this.src === 'icons/svg/book.svg' || this.src.includes('systems/weirdwizard/assets/icons/professions'))) {
      await this._onProfessionCategoryChange(await changes);
    }

  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static async _onDeleteOperation(documents, operation, user) {

    // Delete granted Items
    for (const doc of documents) {
      
      // If character option
      if (await doc.isCharOption) {
        await doc.deleteGrantedItems();
        await doc.deleteGrantedEntries();
      }

    }

    super._onDeleteOperation(documents, operation, user);

  }

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  async _onTierChange(data) {
    const tier = await data.system?.tier ? data.system.tier : await this.system.tier;
    const benefits = {...await this.system.benefits};
    
    for (const key in benefits) {
      
      switch (key) {
        case 'benefit1': {
          if (tier == 'master') {
            benefits[key].levelReq = 7;
          } else if (tier == 'expert') {
            benefits[key].levelReq = 3;
          } else {
            benefits[key].levelReq = 1;
          }
        }; break;
        case 'benefit2': {
          if (tier == 'master') {
            benefits[key].levelReq = 8;
          } else if (tier == 'expert') {
            benefits[key].levelReq = 4;
          } else {
            benefits[key].levelReq = 2;
          }
        }; break;
        case 'benefit3': {
          if (tier == 'master') {
            benefits[key].levelReq = 10;
          } else if (tier == 'expert') {
            benefits[key].levelReq = 6;
          } else {
            benefits[key].levelReq = 5;
          }
        }; break;
        case 'benefit4': {
          if (tier == 'master') {
            benefits[key].levelReq = 99;
          } else if (tier == 'expert') {
            benefits[key].levelReq = 9;
          } else {
            benefits[key].levelReq = 99;
          }
        }; break;
      }
    }

    if (data.system?.benefits) data.system.benefits = benefits;
    
  }

  /* -------------------------------------------- */

  async _onProfessionCategoryChange(data) {
    const category = await data.system?.category ? data.system.category : await this.system.category;
    const path = 'systems/weirdwizard/assets/icons/professions/';
    
    switch (category) {
      case 'academic': data.src = 'icons/svg/book.svg'; break;
      case 'aristocratic': data.src = path + 'wax-seal.svg'; break;
      case 'commoner': data.src = path + 'dig-dug.svg'; break;
      case 'criminal': data.src = path + 'manacles.svg'; break;
      case 'entertainment': data.src = path + 'banjo.svg'; break;
      case 'military': data.src = path + 'saber-and-pistol.svg'; break;
      case 'religious': data.src = path + 'fire-shrine.svg'; break;
      case 'wilderness': data.src = path + 'compass.svg'; break;
    }
    
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
    const html = await renderTemplate("templates/sidebar/document-create.html", {
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

}