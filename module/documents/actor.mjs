import { i18n } from '../helpers/utils.mjs'

/**
* Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
* @extends {Actor}
*/

export default class WWActor extends Actor {

  /** @override */
  prepareData() {

    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments(),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents (including active effects) or derived data.
    super.prepareBaseData();

    // Create boons variables
    this.system.boons = {
      attributes: {
        luck: {
          global: 0,
          conditional: 0
        }
      },
      attacks: {
        global: 0,
        conditional: 0
      },
      against: {
        def: 0
      }
    };

    // Create objects
    this.system.autoFail = {};
    this.system.against = {};

    // Create halved boolean for Speed reductions
    this.system.stats.speed.halved = false;

    // Assign normal Speed to current Speed so it can be used later by Active Effects
    let normalSpeed = this.system.stats.speed.normal;
    let currentSpeed = this.system.stats.speed.current;

    // Create dynamic Defense properties
    this.system.stats.defense.armored = 0;
    this.system.stats.defense.bonus = 0;

    // Compability: If speed.normal is undefined or lower, copy current Speed to normal Speed
    if ((currentSpeed > normalSpeed) || (normalSpeed == undefined)) this.system.stats.speed.normal = currentSpeed;

    this.system.stats.speed.current = this.system.stats.speed.normal;

    // Attributes
    const attributes = this.system.boons.attributes;
    const autoFail = this.system.autoFail;
    const against = this.system.boons.against;

    ['str', 'agi', 'int', 'wil'].forEach(function (attribute) {
      attributes[attribute] = {
        global: 0,
        conditional: 0
      }

      against[attribute] = 0;

      autoFail[attribute] = false;
    })

    // Compatibility: Reset Natural Defense and Defense before Active Effects
    if (this.type == 'Character') {
      this.system.stats.defense.natural = 10;
      this.system.stats.defense.total = 0;
    }

    // Compatibility: Delete old Defense values
    const defense = this.system.stats.defense;

    if (defense.armor) delete this.system.stats.defense.armor;
    if (defense.bonuses) delete this.system.stats.defense.bonuses;
    if (defense.unarmored) delete this.system.stats.defense.unarmored;

    // Compatibility: Assign health.total value to health.current
    let health = this.system.stats.health;

    if (health.total) {
      if (this.type == 'NPC') {
        this.system.stats.health.current = health.total;
        delete this.system.stats.health.bonus;
        delete this.system.stats.health.expert;
        delete this.system.stats.health.lost;
        delete this.system.stats.health.master;
        delete this.system.stats.health.novice;
        delete this.system.stats.health.starting;
      }

      delete this.system.stats.health.total;
    }

    // Create Extra Damage variables
    this.system.extraDamage = {
      attacks: {
        globalDice: 0,
        globalMod: 0
      }
    }

  }

  async _preCreate(data, options, user) {

    let icon = data.img;

    // If no image is provided, set default by category.
    if (!icon) {

      switch (this.type) {

        case 'Character':
          icon = 'icons/svg/mystery-man.svg';
          break;

        case 'NPC':
          icon = 'icons/svg/mystery-man-black.svg';
          break;

      }

    }

    await this.updateSource({ img: icon });

    return await super._preCreate(data, options, user);
  }

  async _preUpdate(changed, options, user) {
    await super._preUpdate(changed, options, user);

    // Health Operators
    const health = this.system.stats.health.current;

    // Limit Damage to not surpass Health
    if (changed.system?.stats?.damage?.value > health) {
      changed.system.stats.damage.value = health;
    }

    // Limit Lost Health to not go below 0
    if (changed.system?.stats?.health?.lost < 0) {
      changed.system.stats.health.lost = 0;
    }

  };

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
  */

  prepareDerivedData() {
    const system = this.system;
    const flags = this.flags.weirdwizard || {};

    // Halve Speed
    if (system.stats.speed.halved) system.stats.speed.current = Math.floor(system.stats.speed.normal / 2);

    // Loop through attributes, and add their modifiers calculated with DLE rules to our sheet output.
    for (let [key, attribute] of Object.entries(system.attributes)) {
      if (key != 'luck') attribute.mod = attribute.value - 10;
    }

    // Create .statuses manually for v10
    if (this.statuses == undefined) {
      this.statuses = this.effects.reduce((acc, eff) => {
        if (!eff.modifiesActor) return acc;
        const status = eff.flags.core?.statusId;
        if (status) acc.add(status);
        return acc;
      }, new Set());
    }

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(system);
    this._prepareNpcData(system);
  }

  /**
  * Prepare Character type specific data
  */

  _prepareCharacterData(system) {
    if (this.type !== 'Character') return;

    ///////// HEALTH ///////////

    // Calculate and update Path Levels contribution to Health
    this._calculateHealth(system);

    // Calculate total Defense
    this._calculateDefense(system);
  }

  /**
  * Prepare NPC type specific data.
  */

  _prepareNpcData(system) {
    if (this.type !== 'NPC') return;

    // Assign Current Health to Max Damage for Token Bars
    system.stats.damage.max = system.stats.health.current;
  }

  /**
  * Override getRollData() that's supplied to rolls.
  */

  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
  * Prepare character roll data.
  */

  _getCharacterRollData(system) {
    if (this.type !== 'Character') return;

    // Copy the attribute scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    /*if (system.attributes) {
        for (let [k, v] of Object.entries(system.attributes)) {
            system[k] = foundry.utils.deepClone(v);
        }
    }

    // Add level for easier access, or fall back to 0.
    if (system.stats.level) {
        system.lvl = system.stats.level.value ?? 0;
    }*/
  }

  /**
  * Prepare NPC roll data.
  */

  _getNpcRollData(system) {
    if (this.type !== 'NPC') return;

    // Process additional NPC data here.
  }

  async applyDamage(damage) {
    const oldTotal = this.system.stats.damage.value;
    const health = this.system.stats.health.current;
    let newTotal = oldTotal + damage;
    let lostHealth = 0;

    if (newTotal > health) {
      lostHealth = newTotal - health;
      newTotal = health;
    }

    //const newHp = Math.max(0, Math.min(health.max, Math.floor(health.value + increment)));

    /*if (increment > 0) {
      // Check if hit is an instant death
      if (increment >= health.max) {
        await findAddEffect(this, 'dead', true);
      }
 
      // If character is incapacitated, die
      else if (this.effects.find(e => e.statuses.has("incapacitated"))) {
        await findAddEffect(this, 'dead', true);
      }
    }*/

    let content = '<span style="display: inline"><span style="font-weight: bold">' + this.name + '</span> ' + 
    i18n('WW.InstantEffect.Apply.Took') + ' ' + damage + ' ' + i18n('WW.InstantEffect.Apply.Damage') + '.</span><div>' + 
    i18n('WW.InstantEffect.Apply.DamageTotal') +': ' + oldTotal + ' <i class="fas fa-arrow-right"></i> ' + newTotal;

    if (lostHealth) content += ' (' + 'Health Lost' + ': ' +  lostHealth + ')</div>'; else content += '</div>';

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: content,
      sound: CONFIG.sounds.notification
    })

    this.update({ 'system.stats.damage.value': newTotal })

    // Carry over surplus damage as Health Loss
    //if (lostHealth) applyHealthLoss(lostHealth)
  }

  _calculateDefense(system) {
    const defense = system.stats.defense;

    // Defense override effect exists
    if (defense.override) defense.total = defense.override;
    else {
      (defense.natural > defense.armored) ? defense.total = defense.natural : defense.total = defense.armored;
      defense.total += defense.bonus;
    }
    
  }

  _calculateHealth(system) {
    const health = system.stats.health;
    const level = system.stats.level;

    // Health override effect exists
    if (health.override) {
      health.normal = health.override;
    } else {
      function count(levels) { // Count how many of provided levels the Character has
        let newValue = 0;

        levels.forEach(function count(v) {
          if (level >= v) { newValue += 1 }
        })

        return newValue
      }

      // Novice Path calculation
      const noviceLv = count([2, 5, 8])
      const noviceBonus = noviceLv * health.novice;

      // Expert Path calculation
      const expertLv = count([3, 4, 6, 9]);
      const expertBonus = expertLv * health.expert;

      // Master Path calculation
      const masterLv = count([7, 8, 10])
      const masterBonus = masterLv * health.master;

      // Calculate normal Health
      health.normal = health.starting + noviceBonus + expertBonus + masterBonus;
    }
    
    // Assign current health
    health.current = health.normal + health.bonus - health.lost;
    
    // Assign Current Health to Max Damage for Token Bars
    system.stats.damage.max = health.current;
    
  }

  *allApplicableEffects() {
    for (let effect of super.allApplicableEffects()) {
      if (!effect.determineTransfer(this)) continue;
      yield effect;
    }
  }

  /*async applyHealing(fullHealingRate) {
      let rate = this.system.characteristics.health?.healingrate || 0;
      rate = fullHealingRate ? rate : rate / 2;
      return await this.increaseDamage(-rate)
  }*/

}
