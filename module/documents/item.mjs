/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class WeirdWizardItem extends Item {
  /**
  * Augment the basic Item data model with additional dynamic data.
  */

  prepareData() {
    super.prepareData();

    // Get the Item's data
    const itemData = this.system;
    const actorData = this.actor ? this.actor.system : {};
    const system = itemData;
  }

  async _preCreate(data, options, user) {
    let icon = 'icons/svg/item-bag.svg';

    switch (this.type) {
      case 'Container':
        icon = 'icons/svg/sword.svg';
        break;

      case 'Weapon':
        icon = 'icons/svg/sword.svg';
        break;

      case 'Ancestry':
        icon = 'icons/svg/oak.svg';
        break;

      case 'Path':
        icon = 'icons/svg/stone-path.svg';
        break;

      case 'Talent':
        icon = 'icons/svg/card-hand.svg';
        break;

      case 'Spell':
        icon = 'icons/svg/lightning.svg';
        break;
      
      case 'Aura (NPC)':
        icon = 'icons/svg/aura.svg';
        break;
      
      case 'Talent (NPC)':
        icon = 'icons/svg/card-hand.svg';
        break;
      
      case 'Weapon (NPC)':
        icon = 'icons/svg/sword.svg';
        break;
      
      case 'Special Activity (NPC)':
        icon = 'icons/svg/card-hand.svg';
        break;
      
      case 'End of Round Effect (NPC)':
        icon = 'icons/svg/card-hand.svg';
        break;
    }

    await this.updateSource({ img: icon });

    return await super._preCreate(data, options, user);
  }
}