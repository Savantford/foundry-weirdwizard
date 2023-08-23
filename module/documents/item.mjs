/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
*/

import { capitalize, i18n } from '../helpers/utils.mjs';

export class WeirdWizardItem extends Item {
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
      let properties = system.properties;
      
      // Compatibility: Convert old string data to object
      if (typeof properties == 'string') properties = {};
      
      let list = '';

      //console.log(Object.entries(properties))
      Object.entries(properties).map((x) => {
        
        if (x[1]) list = list.concat(
          list ? 
            ', ' + i18n('WW.Properties.' + capitalize(x[0]) + '.Label') : 
            i18n('WW.Properties.' + capitalize(x[0]) + '.Label')
        
          )
        
      })

      this.system.propertiesList = list;
      
      console.log(this.system)
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