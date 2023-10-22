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

    // Prepare properties list for weapons
    if (system.subtype == 'weapon') {

      // Prepare traits list
      let traits = system.traits;
      let list = '';

      Object.entries(traits).map((x) => {
        
        if (x[1]) {
          let string = i18n('WW.Properties.' + capitalize(x[0]) + '.Label');
          
          if ((x[0] == 'range') || (x[0] == 'thrown')) {string += ' ' + system.range;}

          list = list.concat(list ? ', ' + string : string);
        }
        
      })

      this.system.traitsList = list;

      // Prepare advantages list
      let advantages = system.advantages;
      list = '';

      Object.entries(advantages).map((x) => {
        
        if (x[1]) {
          let string = i18n('WW.Properties.' + capitalize(x[0]) + '.Label');

          list = list.concat(list ? ', ' + string : string);
        }
        
      })

      this.system.advantagesList = list;

      // Prepare disadvantages list
      let disadvantages = system.disadvantages;
      list = '';

      Object.entries(disadvantages).map((x) => {
        
        if (x[1]) {
          let string = i18n('WW.Properties.' + capitalize(x[0]) + '.Label');

          list = list.concat(list ? ', ' + string : string);
        }
        
      })

      this.system.disadvantagesList = list;
    }

  }

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
  
        case 'Path':
          icon = 'icons/svg/stone-path.svg';
        break;
      }

    }
    
    await this.updateSource({ img: icon });

    return await super._preCreate(data, options, user);
  }

}