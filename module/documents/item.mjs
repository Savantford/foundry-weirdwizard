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
          icon = 'icons/svg/book.svg';
        break;
  
        case 'Path':
          icon = 'icons/svg/stone-path.svg';
        break;
      }

    }
    
    await this.updateSource({ img: icon });

    return await super._preCreate(data, options, user);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);

    // If character option
    if (this.charOption) {
      this.updateBenefitsOnActor();
    }
  }

  /* -------------------------------------------- */

  async _preUpdate(changed, options, user) {
    await super._preUpdate(changed, options, user);
    
    if(changed.system?.tier) {
      this._onTierChange(changed);
    }

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
      this.updateBenefitsOnActor();
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);
    
    // Delete granted Items
    if (this.charOption) {
      this.deleteGrantedItems();
      this.deleteGrantedEntries();
    }

  }

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  async _onTierChange(data) {
    
    const tier = data.system.tier;
    const benefits = {...await this.system.benefits};

    for(const key in benefits) {
      
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

    data.system.benefits = benefits;

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
      mode: 4,
      priority: 1
    })

    if (this.system.tier === 'novice') changes.push({
      key: 'health.starting',
      value: stats.healthStarting,
      mode: 4,
      priority: 1
    })

    if (stats.naturalIncrease) changes.push({
      key: 'defense.naturalIncrease',
      value: stats.naturalIncrease
    })

    if (stats.armoredIncrease) changes.push({
      key: 'defense.armoredIncrease',
      value: stats.armoredIncrease
    })
    
    if (stats.healthIncrease) changes.push({
      key: 'health.increase',
      value: stats.healthIncrease
    })

    if (stats.sizeNormal) changes.push({
      key: 'size.normal',
      value: stats.sizeNormal
    })

    if (stats.speedNormal) changes.push({
      key: 'speed.normal',
      value: stats.speedNormal
    })

    if (stats.speedIncrease) changes.push({
      key: 'speed.increase',
      value: stats.speedIncrease
    })

    if (stats.bonusDamage) changes.push({
      key: 'bonusDamage.increase',
      value: stats.bonusDamage
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
    
    const benefits = this.system.benefits;
    const level = this.actor.system.stats.level;
    const aItems = this.actor.items.filter(i => {
      return i.flags?.weirdwizard?.grantedBy === this._id;
    })
    
    for (const b in benefits) {

      const benefit = benefits[b];
      
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
          if (!aItems.find(i => i.name === itemData.name )) this.actor.createEmbeddedDocuments("Item", [itemData]);
        }

      }
      
    }

  }

  /* -------------------------------------------- */

  async updateGrantedEntries() {
    
    // Return if no actor exists
    if (!this.actor) return;
    
    const benefits = this.system.benefits;
    const level = this.actor.system.stats.level;

    // Get actor list entries granted by the character option
    const aDetails = {
      senses: this.actor.system.details.senses.filter(i => {
        return i.grantedBy === this._id;
      }),
      languages: this.actor.system.details.languages.filter(i => {
        return i.grantedBy === this._id;
      }),
      immune: this.actor.system.details.immune.filter(i => {
        return i.grantedBy === this._id;
      }),
      traditions: this.actor.system.details.traditions.filter(i => {
        return i.grantedBy === this._id;
      })
    }
    
    for (const b in benefits) {

      const benefit = benefits[b];
      if (!benefit.levelReq) benefit.levelReq = 0;
      
      // If level does not meet the requirement, ignore it
      if (level >= benefit.levelReq) {

        if (benefit.senses) await benefit.senses.forEach(e => this._addEntry(aDetails, e, 'senses'));

        if (benefit.languages) await benefit.languages.forEach(e => this._addEntry(aDetails, e, 'languages'));

        if (benefit.immune) await benefit.immune.forEach(e => this._addEntry(aDetails, e, 'immune'));

        if (benefit.traditions) await benefit.traditions.forEach(e => this._addEntry(aDetails, e, 'traditions'));

      }
      
    }

  }

  async _addEntry(actorDetails, entry, arrName) {

    // If entry with the same name is not found, add it to the actor's entries list
    if (!actorDetails[arrName].find(ae => ae.name === entry.name )) {

      // Store the char option id on grantedBy
      entry.grantedBy = this._id;

      // Create new array
      const arr = [...this.actor.system.details[arrName], entry];

      // Update actor with new array
      await this.actor.update({['system.details.' + arrName]: arr});

    }

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

}