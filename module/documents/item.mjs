/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
*/

import { capitalize, i18n } from '../helpers/utils.mjs';

export default class WWItem extends Item {
  /**
  * Augment the basic Item data model with additional dynamic data.
  */

  prepareData() {
    super.prepareData();

    // Get the Item's data
    const system = this.system;
    const actorData = this.actor ? this.actor.system : {};

  }

  /* -------------------------------------------- */

  async _preCreate(data, options, user) {
    let icon = data.img;
    
    // If no image is provided, set default by category.
    if (!icon) {

      switch (this.type) {
        case 'Equipment':
          icon = 'icons/svg/item-bag.svg';
        break;
   
        case 'Trait or Talent':
          icon = 'icons/svg/card-hand.svg';
        break;
  
        case 'Spell':
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

  async _onCreate(data, options, user) {

    // Change the sheet to suit the tier
    if (this.type === 'Path') {
      await this._onTierChange(data);
    }

    return await super._onCreate(await data, options, user);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static async _onCreateDocuments(documents, options, userId) {
    super._onCreateDocuments(documents, options, userId);

    for (const doc of documents) {
      
      // If character option
      if (await doc.charOption) {
        await doc.updateBenefitsOnActor();
      }
    }
    
  }

  /** @inheritdoc */
  /*async _onCreateOperation(documents, options, userId) { // Swap to this when V12 support is removed
    super._onCreateOperation(documents, options, userId);

    for (const doc of documents) {
      
      // If character option
      if (await doc.charOption) {
        await doc.updateBenefitsOnActor();
      }
    }
    
  }*/

  /* -------------------------------------------- */

  async _preUpdate(changed, options, user) {

    // If Path, ensure changed.system.tier is defined
    if (this.type === 'Path' && !changed.system?.tier) changed.system.tier = this.system.tier;

    if (CONFIG.WW.IS_V12) { // If v12
      if (this.system.tier && (this.system.tier !== changed.system?.tier)) {
        await this._onTierChange(await changed);
      }
    } else { // if v11
      if (changed.system?.tier) {
        await this._onTierChange(await changed);
      }
    }

    // If Profession category is changed and the icon is one of the default ones, change base icon
    if (this.type === 'Profession' && changed.system?.category !== this.system.category && (this.img === 'icons/svg/book.svg' || this.img.includes('systems/weirdwizard/assets/icons/professions'))) {
      await this._onProfessionCategoryChange(await changed);
    }
    
    await super._preUpdate(await changed, options, user);

  };

  /* -------------------------------------------- */

  /**
   * @override
   * @param {object} data Update data
   * @param {options} options Context options
   * @param {string} userId Triggering user ID
   */
  async _onUpdate(data, options, userId) {
    super._onUpdate(data, options, userId);
    
    // If benefits were changed
    if (data.system?.benefits) {
      if (userId !== game.user.id) return;
      this.updateBenefitsOnActor();
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static async _onDeleteDocuments(documents, context) {
    
    // Delete granted Items
    for (const doc of documents) {
      
      // If character option
      if (await doc.charOption) {
        await doc.deleteGrantedItems();
        await doc.deleteGrantedEntries();
      }

    }

    super._onDeleteDocuments(documents, context);

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
      case 'academic': data.img = 'icons/svg/book.svg'; break;
      case 'aristocratic': data.img = path + 'wax-seal.svg'; break;
      case 'commoner': data.img = path + 'dig-dug.svg'; break;
      case 'criminal': data.img = path + 'manacles.svg'; break;
      case 'entertainment': data.img = path + 'banjo.svg'; break;
      case 'religious': data.img = path + 'fire-shrine.svg'; break;
      case 'military': data.img = path + 'saber-and-pistol.svg'; break;
      case 'wilderness': data.img = path + 'compass.svg'; break;
    }
    
  }

  /* -------------------------------------------- */

  updateBenefitsOnActor() {
    this.updateGrantedItems();
    this.updateGrantedEntries();
    if (this.type !== 'Profession') this.updateMainEffect();
  }

  /* -------------------------------------------- */

  updateMainEffect() {
    
    // Return if no actor exists
    if (!this.actor) return;

    const benefits = this.system.benefits;
    const level = this.actor.system.stats.level;

    const stats = {
      naturalSet: 0,
      naturalIncrease: 0,
      armoredIncrease: 0,
      healthStarting: 0,
      healthIncrease: 0,
      sizeNormal: 0,
      speedNormal: 0,
      speedIncrease: 0,
      bonusDamage: 0
    };
    
    
    for (const b in benefits) {

      const benefit = benefits[b];
      
      // If level does not meet the requirement, ignore it
      if (level >= benefit.levelReq) {
        const bStats = benefit.stats;

        if (bStats.naturalSet) stats.naturalSet = bStats.naturalSet;
        stats.naturalIncrease += bStats.naturalIncrease;
        stats.armoredIncrease += bStats.armoredIncrease;

        if (this.system.tier === 'novice' && benefit.levelReq === 1) stats.healthStarting = bStats.healthStarting;
        stats.healthIncrease += bStats.healthIncrease;

        if (bStats.sizeNormal) stats.sizeNormal = bStats.sizeNormal;
        if (bStats.speedNormal) stats.speedNormal = bStats.speedNormal;
        stats.speedIncrease += bStats.speedIncrease;
        stats.bonusDamage += bStats.bonusDamage;
      }
      
    }

    // Prepare changes for effect data
    const changes = [];
    
    if (stats.naturalSet) changes.push({
      key: 'defense.natural',
      value: stats.naturalSet,
      mode: 5,
      priority: 1
    })

    if (this.system.tier === 'novice') changes.push({
      key: 'health.starting',
      value: stats.healthStarting,
      mode: 5,
      priority: 1
    })

    if (stats.naturalIncrease) changes.push({
      key: 'defense.naturalIncrease',
      value: stats.naturalIncrease,
      mode: 2,
      priority: null
    })

    if (stats.armoredIncrease) changes.push({
      key: 'defense.armoredIncrease',
      value: stats.armoredIncrease,
      mode: 2,
      priority: null
    })
    
    if (stats.healthIncrease) changes.push({
      key: 'health.increase',
      value: stats.healthIncrease,
      mode: 2,
      priority: null
    })

    if (stats.sizeNormal) changes.push({
      key: 'size.normal',
      value: stats.sizeNormal,
      mode: 5,
      priority: 1
    })

    if (stats.speedNormal) changes.push({
      key: 'speed.normal',
      value: stats.speedNormal,
      mode: 5,
      priority: 1
    })

    if (stats.speedIncrease) changes.push({
      key: 'speed.increase',
      value: stats.speedIncrease,
      mode: 2,
      priority: null
    })

    if (stats.bonusDamage) changes.push({
      key: 'bonusDamage.increase',
      value: stats.bonusDamage,
      mode: 2,
      priority: null
    })
    
    // Create effect data object
    const effectData = {
      name: this.name,
      icon: this.img,
      description: this.system.description.value,
      origin: this.uuid,

      changes: changes,

      flags: {
        weirdwizard: {
          trigger: 'passive'
        }
      }
      
    };

    // Create or Update Effect
    if (this.effects.size) {

      for (const e of this.effects) {
        this.updateEmbeddedDocuments("ActiveEffect", [{ _id: e._id, ...effectData }]);
      }
      
    }
    else this.createEmbeddedDocuments("ActiveEffect", [effectData]);

  }

  /* -------------------------------------------- */

  async updateGrantedItems() {
    
    // Return if no actor exists
    if (!this.actor) return;
    
    const benefits = this.system.benefits,
      level = this.actor.system.stats.level,
      aItems = this.actor.items.filter(i => {
      return i.flags?.weirdwizard?.grantedBy === this._id;
    })

    const itemsArr = [];
    
    for (const b in benefits) {

      const benefit = benefits[b];

      if (!benefit.levelReq) benefit.levelReq = 0;
      
      // If level does not meet the requirement, ignore it
      if (level >= benefit.levelReq) {

        const bItems = benefit.items;

        for (const uuid of bItems) {
          
          const item = await fromUuid(uuid);
          const itemData = await game.items.fromCompendium(item);
          
          // Store the char option id on a flag
          itemData.flags = {
            weirdwizard: {
              grantedBy: this._id
            }
          }

          // If item with the same name is not found, create it on the actor
          if (!aItems.find(i => i.name === itemData.name )) itemsArr.push(itemData);
          
        }

      }
      
    }

    // Create items on actor
    return await this.actor.createEmbeddedDocuments("Item", itemsArr);

  }

  /* -------------------------------------------- */

  async updateGrantedEntries() {
    
    // Return if no actor exists
    if (!this.actor) return;

    // Shortcuts
    const benefits = this.system.benefits;
    const level = this.actor.system.stats.level;

    // Get actor list entries granted by the character option
    const aDetails = {
      descriptors: await this.actor.system.details.descriptors.filter(i => {
        return i.grantedBy === this._id;
      }),
      senses: await this.actor.system.details.senses.filter(i => {
        return i.grantedBy === this._id;
      }),
      languages: await this.actor.system.details.languages.filter(i => {
        return i.grantedBy === this._id;
      }),
      immune: await this.actor.system.details.immune.filter(i => {
        return i.grantedBy === this._id;
      }),
      traditions: await this.actor.system.details.traditions.filter(i => {
        return i.grantedBy === this._id;
      })
    }

    // Create aDetails to store existing actor details
    const newDetails = {
      descriptors: await this.actor.system.details.descriptors,
      senses: await this.actor.system.details.senses,
      languages: await this.actor.system.details.languages,
      immune: await this.actor.system.details.immune,
      traditions: await this.actor.system.details.traditions
    };

    // Loop through each benefit
    for (const b in benefits) {

      const benefit = benefits[b];

      if (!benefit.levelReq) benefit.levelReq = 0;
      
      // If level does not meet the requirement, ignore it
      if (level >= benefit.levelReq) {

        if (benefit.descriptors) this._addEntries(aDetails, newDetails, benefit, 'descriptors');
        
        if (benefit.senses) this._addEntries(aDetails, newDetails, benefit, 'senses');
        
        if (benefit.languages) this._addEntries(aDetails, newDetails, benefit, 'languages');

        if (benefit.immune) this._addEntries(aDetails, newDetails, benefit, 'immune');

        if (benefit.traditions) this._addEntries(aDetails, newDetails, benefit, 'traditions');

      }
      
    }

    // Update actor with new details object
    await this.actor.update({['system.details']: {...this.actor.system.details, ...newDetails} });

  }

  _addEntries(aDetails, newDetails, benefit, arrName) {
    
    const arr = [...benefit[arrName]];
    
    // For each entry
    arr.forEach((entry,id) => {
      
      // Store the char option id on grantedBy
      entry.grantedBy = this._id;

      // If entry with the same name is found, splice entry from the array
      if (aDetails[arrName].find(ae => ae.name === entry.name )) {
        arr.splice(id);
      }

    });

    // Add entries to newDetails object
    if (arr.length) newDetails[arrName] = newDetails[arrName] ? newDetails[arrName].concat(arr) : arr;

  }

  /* -------------------------------------------- */

  async deleteGrantedItems() {
    
    // Return if no actor exists
    if (!this.actor) return;

    const aItems = this.actor.items.filter(i => i.flags?.weirdwizard?.grantedBy === this._id );
    const ids = aItems.map(i => i._id);
    
    // Delete items granted by the Character Option
    this.actor.deleteEmbeddedDocuments('Item', ids);

  }

  async deleteGrantedEntries() {
    
    // Return if no actor exists
    if (!this.actor) return;

    // Get actor list entries granted by the character option
    const newDetails = { ...this.actor.system.details,
      senses: this.actor.system.details.senses.filter(i => {
        return i.grantedBy !== this._id;
      }),
      languages: this.actor.system.details.languages.filter(i => {
        return i.grantedBy !== this._id;
      }),
      immune: this.actor.system.details.immune.filter(i => {
        return i.grantedBy !== this._id;
      }),
      traditions: this.actor.system.details.traditions.filter(i => {
        return i.grantedBy !== this._id;
      })
    }

    // Update actor with new details
    this.actor.update({['system.details']: newDetails});

  }

  /* -------------------------------------------- */
  /*  Properties (Getters)                        */
  /* -------------------------------------------- */

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

    if (CONFIG.WW.IS_V12) { // Is V12+

      const cls = this.implementation;

      // Identify allowed types
      let documentTypes = [];
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
        /*documentTypes.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));*/
        hasTypes = true;
      }

      // Identify destination collection
      let collection;
      if ( !parent ) {
        if ( pack ) collection = game.packs.get(pack);
        else collection = game.collections.get(this.documentName);
      }

      // Collect data
      const folders = collection?._formatFolderSelectOptions() ?? [];
      const label = game.i18n.localize(this.metadata.label);
      const title = game.i18n.format("DOCUMENT.Create", {type: label});
      const type = data.type || defaultType;

      // Render the document creation form
      const html = await renderTemplate("templates/sidebar/document-create.html", {
        folders,
        name: data.name || "",
        defaultName: cls.defaultName({type, parent, pack}),
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
          if ( !hasTypes ) return;
          html[0].querySelector('[name="type"]').addEventListener("change", e => {
            const nameInput = html[0].querySelector('[name="name"]');
            nameInput.placeholder = cls.defaultName({type: e.target.value, parent, pack});
          });
        },
        callback: html => {
          const form = html[0].querySelector("form");
          const fd = new FormDataExtended(form);
          foundry.utils.mergeObject(data, fd.object, {inplace: true});
          if ( !data.folder ) delete data.folder;
          if ( !data.name?.trim() ) data.name = cls.defaultName({type: data.type, parent, pack});
          return cls.create(data, {parent, pack, renderSheet: true});
        },
        rejectClose: false,
        options
      });
    } else { // Not V12+

      // Collect data
      const documentName = this.metadata.name;
      const types = game.documentTypes[documentName].filter(t => t !== CONST.BASE_DOCUMENT_TYPE);
      let collection;
      if ( !parent ) {
        if ( pack ) collection = game.packs.get(pack);
        else collection = game.collections.get(documentName);
      }
      const folders = collection?._formatFolderSelectOptions() ?? [];
      const label = game.i18n.localize(this.metadata.label);
      const title = game.i18n.format("DOCUMENT.Create", {type: label});
      // Render the document creation form
      const html = await renderTemplate("templates/sidebar/document-create.html", {
        folders,
        name: data.name || game.i18n.format("DOCUMENT.New", {type: label}),
        folder: data.folder,
        hasFolders: folders.length >= 1,
        type: data.type || CONFIG[documentName]?.defaultType || types[0],
        types: types.reduce((obj, t) => {
          const label = CONFIG[documentName]?.typeLabels?.[t] ?? t;
          obj[t] = game.i18n.has(label) ? game.i18n.localize(label) : t;
          return obj;
        }, {}),
        hasTypes: types.length > 1
      });

      // Render the confirmation dialog window
      return Dialog.prompt({
        title: title,
        content: html,
        label: title,
        callback: html => {
          const form = html[0].querySelector("form");
          const fd = new FormDataExtended(form);
          foundry.utils.mergeObject(data, fd.object, {inplace: true});
          if ( !data.folder ) delete data.folder;
          if ( types.length === 1 ) data.type = types[0];
          if ( !data.name?.trim() ) data.name = this.defaultName();
          return this.create(data, {parent, pack, renderSheet: true});
        },
        rejectClose: false,
        options
      });

    }
    
  }

}