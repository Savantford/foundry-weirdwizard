import WWDocumentMixin from "./ww-document.mjs";

/**
 * Extend the core JournalEntryPage with Weird Wizard modifications.
 * @extends {JournalEntryPage}
*/
export default class WWJournalPage extends WWDocumentMixin(JournalEntryPage) {

  /* -------------------------------------------- */
  /*  Document Creation                           */
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

    if (this.isProfession) await this.updateSource({ 'title.level': 3 });
    
    return await super._preCreate(await data, options, user);
  }

  /* -------------------------------------------- */
  /*  Document Update                             */
  /* -------------------------------------------- */

  async _preUpdate(changes, options, user) {

    // If Path and Tier changed, apply on tier change flow
    if (this.isPath && changes.system?.tier && (this.system.tier !== changes.system?.tier)) {
      await this._onTierChange(await changes);
    }
    
    // If Profession category is changes and the icon is one of the default ones, change base icon
    if (this.isProfession && changes.system?.category !== this.system.category && (this.src === 'icons/svg/book.svg' || this.src.includes('systems/weirdwizard/assets/icons/professions'))) {
      await this._onProfessionCategoryChange(await changes);
    }

    return await super._preUpdate(changes, options, user);
  }

  /*async _onUpdate(changed, options, user) {
    await super._onUpdate(changed, options, user);

  }*/

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  async _onTierChange(changes) {
    const tier = await changes.system?.tier ? changes.system.tier : await this.system.tier;
    const benefits = {...await this.system.benefits};

    // If changes.system does not exist, create it
    if (!changes.system) changes.system = {};
    
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

    return changes.system.benefits = benefits;
    
  }

  /* -------------------------------------------- */

  async _onProfessionCategoryChange(changes) {
    const category = await changes.system?.category ? changes.system.category : await this.system.category;
    const path = 'systems/weirdwizard/assets/icons/professions/';
    
    switch (category) {
      case 'academic': changes.src = 'icons/svg/book.svg'; break;
      case 'aristocratic': changes.src = path + 'wax-seal.svg'; break;
      case 'commoner': changes.src = path + 'dig-dug.svg'; break;
      case 'criminal': changes.src = path + 'manacles.svg'; break;
      case 'entertainment': changes.src = path + 'banjo.svg'; break;
      case 'military': changes.src = path + 'saber-and-pistol.svg'; break;
      case 'religious': changes.src = path + 'fire-shrine.svg'; break;
      case 'wilderness': changes.src = path + 'compass.svg'; break;
    }
    
  }

  /* -------------------------------------------- */
  
  /**
   * Creates an app to display a single JournalEntryPageSheet in view mode.
   * Useful for Character Sheets and other places where a single page should be displayed without the parent JournalEntrySheet.
  */
  async viewPage() {
    const sheetClass = this._getSheetClass();

    const sheet = new sheetClass({
      document: this,
      classes: ['view-mode', 'weirdwizard'],
      window: {
        contentClasses: ['scrollable'],
      },
      position: {
        width: 570,
        height: 600
      },
      mode: "view"
    });
    
    sheet.render(true);
  }

  /* -------------------------------------------- */
  /*  Properties (Getters)                        */
  /* -------------------------------------------- */

  get isAncestry() {
    return this.type === 'ancestry';
  }

  get isPath() {
    return this.type === 'path';
  }

  get isProfession() {
    return this.type === 'profession';
  }

  get isTradition() {
    return this.type === 'tradition';
  }

}