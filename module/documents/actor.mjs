import { i18n, formatTime } from '../helpers/utils.mjs';

/**
* Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
* @extends {Actor}
*/

export default class WWActor extends Actor {

  /* -------------------------------------------- */
  /*  Document Creation                           */
  /* -------------------------------------------- */

  /**
   * @override
   * Determine default artwork based on the provided actor data.
   * @param {ActorData} actorData                      The source actor data.
   * @returns {{img: string, texture: {src: string}}}  Candidate actor image and prototype token artwork.
   */
  static getDefaultArtwork(actorData) {
    const icon = {
      Character: 'icons/svg/mystery-man.svg',
      NPC: 'icons/svg/mystery-man-black.svg',
    }[actorData.type] ?? this.DEFAULT_ICON;

    return { img: icon, texture: { src: icon } };
  };
  
  async _preCreate(data, options, user) {
    const sourceId = this._stats.compendiumSource;

    // Don't change actors imported from compendia.
    if (sourceId?.startsWith("Compendium.")) return await super._preCreate(data, options, user);

    // Assign default Prototype Token values
    await this.updateSource({
      'prototypeToken.disposition': this.type === 'Character' ? 1 : -1,
      'prototypeToken.sight.enabled': this.type === 'Character' ? true : false,
      'prototypeToken.actorLink': this.type === 'Character' ? true : false
    });

    return await super._preCreate(data, options, user);
  }

  async _onCreate(data, options, user) {
    
    // Fix Health and Incapacitated
    this.incapacitated = false;
    
    if (data.type === 'NPC') {
      await this.updateSource({
        'system.stats.health.current': data.system.stats.health.normal ? data.system.stats.health.normal : 10,
        'system.stats.damage.raw': 0
      });
    }

    if (data.type === 'Character') {
      await this.updateSource({
        'system.stats.health.current': data.system.stats.health.normal ? data.system.stats.health.normal : 5,
        'system.stats.damage.raw': 0
      });
    }

    return await super._onCreate(await data, options, user);
  }

  /* -------------------------------------------- */
  /*  Document Update                             */
  /* -------------------------------------------- */

  async _preUpdate(changes, options, user) {
    await super._preUpdate(changes, options, user);
    
    const damage = foundry.utils.getProperty(this, 'system.stats.damage.value');

    // Update token status icons
    if (( damage || foundry.utils.getProperty(changes, 'system.stats.health')) && this.token ) {
      this.token.object?.updateStatusIcons();
    }

  }

  /* -------------------------------------------- */

  async _onUpdate(changed, options, user) {
    await super._onUpdate(changed, options, user);
    
    // Check for changed variables
    const health = foundry.utils.getProperty(changed, 'system.stats.health');
    const damage = foundry.utils.getProperty(changed, 'system.stats.damage');

    // Calculate Damage and Health
    this._calculateDamageHealth(this.system, foundry.utils.getProperty(changed, 'system.stats.health.current') ? true : false);
    
    // Update token status icons
    if ((damage || health) && this.token) {
      this.token.object.updateStatusIcons();
    }
    
    // Update Character Options if Level updates
    if (foundry.utils.getProperty(changed, 'system.stats.level')) {
      
      if (user !== game.user.id) return;
      const cOpts = this.system.charOptions;
      
      for (const o in cOpts) {
        const cOpt = cOpts[o];
        
        if (typeof cOpt !== 'string') {
          for (const e in cOpt) {
            this.updateCharOptionBenefits(cOpt[e]);
          }

        } else {
          this.updateCharOptionBenefits(cOpt);
        }
      }
      
    }

  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents (including active effects) or derived data.
    super.prepareBaseData();
    
    // Create boons variables
    this.system.boons = {
      selfRoll: {
        luck: 0,
        attacks: 0,
        spells: 0,
        resistMagical: 0
      },

      against: {
        def: 0,
        fromAttacks: 0,
        fromSpells: 0,
        fromMagical: 0
      }

    };

    // Create objects
    this.system.autoFail = {};
    //this.system.against = {}; - no longer needed

    // Create halved boolean for Speed reductions
    this.system.stats.speed.halved = false;

    // Create dynamic Defense properties
    this.system.stats.defense.armored = 0;
    this.system.stats.defense.bonus = 0;

    // Attributes
    ['str', 'agi', 'int', 'wil'].forEach(attribute => {
      this.system.boons.selfRoll[attribute] = 0;

      this.system.boons.against[attribute] = 0;

      this.system.autoFail[attribute] = false;
      
    })
    
  }

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
    
    // Loop through attributes, and add their modifiers calculated with DLE rules to our sheet output.
    for (let [key, attribute] of Object.entries(system.attributes)) {
      if (key != 'luck') attribute.mod = attribute.value - 10;
    }
    
    // Calculate derived Health variables
    this._calculateHealthVariables(system);

    // Calculate total Defense
    this._calculateDefense(system);

    // Calculate Speed
    this._calculateSpeed(system);

    // Prepare CharOptions
    this._prepareCharOptions(system);

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(system);
    this._prepareNpcData(system);

  }

  /* Prepare Char Options */
  async _prepareCharOptions(system) {
    // Prepare Character Options
    const cOpts = system.charOptions;
    const charOptions = {};

    for (const o in cOpts) {
      const opt = cOpts[o];

      // Assign array of pages
      if (opt && opt.constructor === Array) {
        charOptions[o] = [];

        for (const idx in opt) {
          const page = await fromUuid(opt[idx]);
          
          charOptions[o].push(await page ? page : opt[idx]);
        }
      }
      // Assign page
      else if (typeof opt === 'string' && opt.includes('.')) charOptions[o] = await fromUuid(opt) ? await fromUuid(opt) : opt;
    }

    return this.charOptions = charOptions;
  }

  /**
  * Prepare Character type specific data
  */
  _prepareCharacterData(system) {
    if (this.type !== 'Character') return;
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
   * @override
   * Return a data object which defines the data schema against which dice rolls
   * can be evaluated. By default, this is directly the Actor's system data, but
   * systems may extend this to include additional properties. If overriding or
   * extending this method to add additional properties, care must be taken not
   * to mutate the original object.
  */
  getRollData() {
    const sys = this.system;
    const atts = this.system.attributes;
    const data = {...sys};
    
    // Attribute Modifiers and Scores
    data.str = {
      mod: atts.str.mod,
      scr: atts.str.value
    }

    data.agi = {
      mod: atts.agi.mod,
      scr: atts.agi.value
    }
    
    data.int = {
      mod: atts.int.mod,
      scr: atts.int.value
    }
    
    data.wil = {
      mod: atts.wil.mod,
      scr: atts.wil.value
    }

    // Defense
    data.def = {
      nat: sys.stats.defense.natural,
      arm: sys.stats.defense.armored,
      total: sys.stats.defense.total,
    }

    // Health
    data.hth = {
      cur: sys.stats.health.current,
      nrm: sys.stats.health.normal,
      lost: sys.stats.health.lost,
    }

    // Damage Total
    data.dmg = {
      total: sys.stats.damage.value,
      half: Math.floor(sys.stats.damage.value / 2)
    }

    // Speed
    data.spd = {
      cur: sys.stats.speed.current,
      nrm: sys.stats.speed.normal,
    }

    // Other stats
    data.lvl = sys.stats.level;
    data.size = sys.stats.size;
    data.bd = sys.stats.bonusdamage;

    // Clean unused data
    delete data.description;
    delete data.attributes;
    delete data.stats;
    delete data.currency;
    delete data.details;
    delete data.listEntries;
    
    return data;
  }

  /* -------------------------------------------- */

  /**
    * A method that can be overridden by subclasses to customize inline embedded HTML generation.
    * @param {HTMLElement|HTMLCollection} content  The embedded content.
    * @param {DocumentHTMLEmbedConfig} config      Configuration for embedding behavior.
    * @param {EnrichmentOptions} [options]         The original enrichment options for cases where the Document embed
    *                                              content also contains text that must be enriched.
    * @returns {Promise<HTMLElement|null>}
    * @protected
    * @override
  */
  async _createInlineEmbed(content, config, options) {
    const anchor = this.toAnchor();
    
    anchor.setAttribute("data-tooltip", content.outerHTML);

    return anchor;
  }

  /* -------------------------------------------- */

  /**
   * A method that can be overridden by subclasses to customize the generation of the embed figure.
   * @param {HTMLElement|HTMLCollection} content  The embedded content.
   * @param {DocumentHTMLEmbedConfig} config      Configuration for embedding behavior.
   * @param {EnrichmentOptions} [options]         The original enrichment options for cases where the Document embed
   *                                              content also contains text that must be enriched.
   * @returns {Promise<HTMLElement|null>}
   * @protected
   * @override
   */
  async _createFigureEmbed(content, config, options) {
    const section = document.createElement("section");
    
    if ( content instanceof HTMLCollection ) section.append(...content);
    else section.append(content);
    
    return section;
  }

  /* -------------------------------------------- */
  /*  Calculations                                */
  /* -------------------------------------------- */

  _calculateDefense(system) {
    const defense = system.stats.defense;
    
    // Defense override effect exists
    if (defense.override) defense.total = defense.override;

    // Regular Defense calculation
    else {
      (defense.natural > defense.armored) ? defense.total = defense.natural : defense.total = defense.armored;
      defense.total += defense.bonus;
    }
    
  }

  _calculateHealthVariables(system) {
    // Get variables
    const health = system.stats.health;
    const current = health.current;
    const damage = system.stats.damage.value;

    if (damage > current) {
      this.system.stats.damage.value = current;
      system.stats.damage.value = current;
    };

    // Health override effect exists
    if (health.override) {
      health.normal = health.override;
    }
    
    // Calculate temporary Health and assign it
    health.temp = health.current - this.toObject().system?.stats.health.current;

    // Calculate lost Health and assign it
    if (health.normal - health.current >= 0) health.lost = health.normal - health.current; else health.lost = 0;

    // Assign Current Health to Max Damage for Token Bars
    this.system.stats.damage.max = current;

    // Update incapacitated status
    if (this.incapacitated === undefined) this.incapcitated = false;
    if (!this.incapacitated) this.incapacitated = damage >= current;

  }

  _calculateDamageHealth(system, healthChanged) {
    // Get variables
    const health = system.stats.health;
    const current = health.current;
    const damage = /*this.*/system.stats.damage.value;

    // Set corrected damage value to stay incapacitated or
    // to not allow raw input value to surpass current Health
    // Stay incapacitated if Health went up while incapacitated
    
    const damageNew = (damage > current || this.incapacitated && healthChanged) ? current : damage;

    // Set Damage to Health while incapacitated or when Damage is higher than Health   
    this.system.stats.damage.value = damageNew;
    this.incapacitated = damageNew >= current;
  }

  _calculateSpeed(system) {
    const speed = system.stats.speed;
    
    // Halve Speed
    if (speed.halved) speed.current = Math.floor(speed.normal / 2)

    // Assign normal Speed
    else speed.current = speed.normal;
    
  }

  /* -------------------------------------------- */
  /*  Character Options Handling                  */
  /* -------------------------------------------- */

  async updateCharOptionBenefits(uuid, settings={dropped: false}) {
    if (!uuid) return;
    const cOption = await fromUuid(uuid);
    
    // Return if invalid uuid or a tradition
    if (!cOption) return ui.notifications.error(`"${uuid}" is not a valid Character Option UUID. Please remove it from the sheet!`);
    if (cOption.type === 'tradition') return;

    // Handle char option's main effect, granted list entries and granted items
    this._updateMainEffect(uuid);
    this._updateGrantedEntries(uuid);

    // Only grant items to professions if it's a drop and no other professions exist
    if (cOption.type === 'profession') {
      const professions = [...this.system.charOptions.professions].filter(x => x !== uuid); 
      const noOtherProfessions = professions.length > 0 ? false : true;
      
      if (settings.dropped && noOtherProfessions) this._updateGrantedItems(uuid);
    } else this._updateGrantedItems(uuid);

    ui.notifications.info(`${cOption.name}'s benefits updated.`);

  }

  /* -------------------------------------------- */

  async _updateMainEffect(uuid) {
    const cOpt = await fromUuid(uuid);

    if (cOpt.type === 'profession' || cOpt.type === 'tradition') return;
    console.log('updating main effect')
    const benefits = cOpt.system.benefits;
    const level = this.system.stats.level ?? 0;

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
        console.log(bStats)
        if (bStats.naturalSet !== undefined) stats.naturalSet = bStats.naturalSet;
        stats.naturalIncrease += bStats.naturalIncrease;
        stats.armoredIncrease += bStats.armoredIncrease;

        if (cOpt.system.tier === 'novice' && benefit.levelReq === 1) stats.healthStarting = bStats.healthStarting;
        stats.healthIncrease += bStats.healthIncrease;

        if (bStats.sizeNormal !== undefined) stats.sizeNormal = bStats.sizeNormal;
        if (bStats.speedNormal !== undefined) stats.speedNormal = bStats.speedNormal;
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

    if (cOpt.system.tier === 'novice') changes.push({
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
    const eff = this.effects.find(e => { return e.system.grantedBy === cOpt.uuid });

    const effectData = {
      name: cOpt.name,
      icon: cOpt.src,
      type: 'benefit',
      description: cOpt.text.content,

      origin: this.uuid,
      changes: changes,
      'system.grantedBy': cOpt.uuid
    };
    console.log(changes)

    // Create or update main effect
    if (eff) this.updateEmbeddedDocuments("ActiveEffect", [{ _id: eff.id, ...effectData }]);
    else this.createEmbeddedDocuments("ActiveEffect", [effectData]);

  }

  /* -------------------------------------------- */

  async _updateGrantedItems(uuid, settings={isDragDrop: false}) {
    const cOption = await fromUuid(uuid);
    
    if (!cOption) return ;
    
    const benefits = cOption.system.benefits,
      level = this.system.stats.level,
      aItems = this.items.filter(i => { return i.system.grantedBy === uuid; });

    const itemsArr = [];
    
    for (const b in benefits) {

      const benefit = benefits[b];
      
      // If level does not meet the requirement, ignore it
      if (level >= benefit.levelReq) {
        const bItems = benefit.items;

        for (const iUuid of bItems) {
          
          const item = await fromUuid(iUuid);
          const itemData = await game.items.fromCompendium(item);
          
          // Store the char option's UUID in grantedBy
          itemData.system.grantedBy = uuid;

          // If item with the same name is not found, create it on the actor
          if (!aItems.find(i => i.name === itemData.name )) itemsArr.push(itemData);
          
        }

      }
      
    }

    // Create items on actor
    return await this.createEmbeddedDocuments("Item", itemsArr);

  }

  /* -------------------------------------------- */

  async _updateGrantedEntries(uuid) {
    const cOption = await fromUuid(uuid);

    if (!cOption) return ;

    const benefits = cOption.system.benefits,
    listEntries = this.system.listEntries,
    level = this.system.stats.level;

    // Get list entries granted by the character option existing on the actor
    const grantedEntries = this._entriesToGrant(uuid);
    
    // Create newEntries to store the updated list entries
    const newEntries = {
      descriptors: listEntries.descriptors,
      senses: listEntries.senses,
      languages: listEntries.languages,
      immunities: listEntries.immunities,
      traditions: listEntries.traditions
    };

    // Loop through each benefit
    for (const b in benefits) {

      const benefit = benefits[b];
      
      // If level does not meet the requirement, ignore it
      if (level >= benefit.levelReq) {

        if (benefit.descriptors) this._addEntries(uuid, grantedEntries, newEntries, benefit, 'descriptors');
        
        if (benefit.senses) this._addEntries(uuid, grantedEntries, newEntries, benefit, 'senses');
        
        if (benefit.languages) this._addEntries(uuid, grantedEntries, newEntries, benefit, 'languages');

        if (benefit.immune) this._addEntries(uuid, grantedEntries, newEntries, benefit, 'immune');

        if (benefit.traditions) this._addEntries(uuid, grantedEntries, newEntries, benefit, 'traditions');

      }
      
    }
    
    // Update actor with new listEntries object
    await this.update({['system.listEntries']: {...listEntries, ...newEntries} });

  }

  /* -------------------------------------------- */

  _addEntries(uuid, grantedEntries, newEntries, benefit, listName) {
    const list = {...benefit[listName]};
    
    // For each entry
    for (const entryId in list) {
      const entry = list[entryId];
      console.log(list)
      console.log(entryId)
      console.log(entry)
      // Store the character option's UUID in grantedBy
      entry.grantedBy = uuid;

      // If entry with the same key is found, delete the entry from the list object
      if (Object.keys(grantedEntries[listName]).find(e => e === entryId)) {
        delete list[entryId];
      }

    };
    
    // Add entries to newEntries object
    if (Object.keys(list).length) newEntries[listName] = newEntries[listName] ? { ...list, ...newEntries[listName] } : list;

  }

  /* -------------------------------------------- */
  
  async clearCharOptionBenefits(uuid) {
    const cOption = await fromUuid(uuid);

    /* Benefit Main Effect */

    // Delete main effect
    const eff = this.effects.find(e => { return e.system.grantedBy === cOption.uuid });

    // Create or update main effect
    if (eff) this.deleteEmbeddedDocuments("ActiveEffect", [eff.id]);

    /* Granted Items */

    // Get granted items
    const aItems = this.items.filter(i => i.system.grantedBy === uuid );
    const ids = aItems.map(i => i._id);
    
    // Delete items granted by the Character Option
    this.deleteEmbeddedDocuments('Item', ids);

    /* Granted List Entries */

    // Get list entries granted by the character option existing on the actor
    const newEntries = this._removeEntriesGrantedBy(uuid);

    // Update actor with new listEntries
    this.update({['system.listEntries']: newEntries});

    ui.notifications.info(`${cOption.name}'s benefits were cleared from the actor.`);
  }

  /* -------------------------------------------- */

  _entriesToGrant(uuid) {
    const entries = this.system.listEntries;
    const objFilter = list => Object
      .fromEntries(Object.entries(entries[list])
    .filter(([k, v]) => v.grantedBy === uuid ));

    const obj = {
      descriptors: objFilter('descriptors'),
      immunities: objFilter('immunities'),
      languages: objFilter('languages'),
      senses: objFilter('senses')
    }

    if (this.type === 'Character') obj.traditions = objFilter('traditions');

    return obj;

  }

  /* -------------------------------------------- */

  _removeEntriesGrantedBy(uuid) {
    const entries = this.system.listEntries;
    
    const objFilter = list => Object
      .fromEntries(Object.entries(entries[list])
      .filter(([k, v]) => v.grantedBy === uuid )
    .map(([k]) => [`-=${k}`, null]));
    
    const obj = {
      descriptors: objFilter('descriptors'),
      immunities: objFilter('immunities'),
      languages: objFilter('languages'),
      senses: objFilter('senses')
    }

    if (this.type === 'Character') obj.traditions = objFilter('traditions');

    return obj;

  }

  /* -------------------------------------------- */
  /*  Apply Methods                               */
  /* -------------------------------------------- */

  async applyDamage(damage) {
    // If incapacitated, turn damage into Health loss
    if (this.incapacitated) return this.applyHealthLoss(damage);

    // Get values
    const oldTotal = this.system.stats.damage.value;
    const health = this.system.stats.health.current;
    let newTotal = oldTotal + parseInt(damage);
    let healthLost = 0;

    if (newTotal > health) {
      healthLost = newTotal - health;
      newTotal = health;
    }

    const content = `
      <div style="display: inline"><b>${game.weirdwizard.utils.getAlias({ actor: this })}</b> ${i18n('WW.InstantEffect.Apply.Took')} ${damage} ${i18n('WW.InstantEffect.Apply.DamageLc')}.</div>
      <div>${i18n('WW.InstantEffect.Apply.DamageTotal')}: ${oldTotal} <i class="fa-solid fa-arrow-right"></i> ${newTotal}</div>
    `;

    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
      content: content,
      sound: CONFIG.sounds.notification
    })
    
    this.update({ 'system.stats.damage.value': await newTotal });
  }

  async applyHealing(healing) {

    // Get values
    const oldTotal = this.system.stats.damage.value;
    const newTotal = ((oldTotal - parseInt(healing)) > 0) ? oldTotal - parseInt(healing) : 0;

    const content = `
      <div style="display: inline"><b>${game.weirdwizard.utils.getAlias({ actor: this })}</b> ${i18n('WW.InstantEffect.Apply.Healed')} ${healing} ${i18n('WW.InstantEffect.Apply.DamageLc')}.</div>
      <div>${i18n('WW.InstantEffect.Apply.DamageTotal')}: ${oldTotal} <i class="fa-solid fa-arrow-right"></i> ${newTotal}</div>
    `;

    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
      content: content,
      sound: CONFIG.sounds.notification
    })

    //this.incapacitated = newTotal >= this.system.stats.health.current; - probably overwritten
    this.update({ 'system.stats.damage.value': newTotal });
  }

  /* Apply loss to Health */
  async applyHealthLoss(loss) {
    const oldCurrent = this.system.stats.health.current;
    loss = parseInt(loss);
    const current = (oldCurrent - loss) > 0 ? oldCurrent - loss : 0;

    const content = `
      <div style="display: inline"><b>${game.weirdwizard.utils.getAlias({ actor: this })}</b> ${i18n('WW.InstantEffect.Apply.Lost')} ${loss} ${i18n('WW.InstantEffect.Apply.Health')}.</div>
      <div>${i18n('WW.InstantEffect.Apply.CurrentHealth')}: ${oldCurrent} <i class="fa-solid fa-arrow-right"></i> ${current}</div>
    `;

    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
      content: content,
      sound: CONFIG.sounds.notification
    })

    this.update({ 'system.stats.health.current': current });
  }

  /* Apply lost Health regain */
  async applyHealthRegain(max) {
    const lost = this.system.stats.health.lost;
    const oldCurrent = this.system.stats.health.current;
    max = parseInt(max);
    const regained = max > lost ? lost : max;
    const current = oldCurrent + regained;
    
    const content = `
      <div style="display: inline"><b>${game.weirdwizard.utils.getAlias({ actor: this })}</b> ${i18n('WW.InstantEffect.Apply.Regained')} ${regained} ${i18n('WW.InstantEffect.Apply.Health')}.</div>
      <div>${i18n('WW.InstantEffect.Apply.CurrentHealth')}: ${oldCurrent} <i class="fa-solid fa-arrow-right"></i> ${current}</div>
    `;

    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
      content: content,
      sound: CONFIG.sounds.notification
    })

    this.update({ 'system.stats.health.current': current });
  }

  /* Apply Affliction */
  async applyAffliction(key) {
    
    // Get affliction
    const effect = CONFIG.statusEffects.find(a => a.id === key);
    effect['statuses'] = [effect.id];
  
    if (!effect) {
      console.warn('Weird Wizard | applyAffliction | Affliction not found!')
      return;
    }

    let content = '';

    // Check if the actor already has the affliction
    if (this.statuses.has(key)) {
      content = `<b>${game.weirdwizard.utils.getAlias({ actor: this })}</b> ${i18n('WW.Affliction.Already')} <b class="info" data-tooltip="${effect.description}">${effect.name}</b>.`;
    } else {
      await ActiveEffect.create(effect, {parent: this});
      content = `<b>${game.weirdwizard.utils.getAlias({ actor: this })}</b> ${i18n('WW.Affliction.Becomes')} <b class="info" data-tooltip="${effect.description}">${effect.name}</b>.`;
    }

    // Send chat message
    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
      content: content,
      sound: CONFIG.sounds.notification
    })

  }

  /* Apply Active Effect */
  async applyEffect(effectUuid) {
    
    const obj = fromUuidSync(effectUuid).toObject();

    // Swap trigger to passive for it to take effect immediately
    obj.system.trigger = 'passive';

    const content = `<p>
      <b class="info" data-tooltip="${obj.description}">${obj.name}</b>
      ${i18n('WW.Effect.AppliedTo')}
      <b>${game.weirdwizard.utils.getAlias({ actor: this })}</b>.
    </p>`;

    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
      content: content,
      sound: CONFIG.sounds.notification
    })

    this.createEmbeddedDocuments("ActiveEffect", [obj]);

  }

  /* -------------------------------------------- */
  /*  Active Effects                              */
  /* -------------------------------------------- */

  /**
   * Get all ActiveEffects that may apply to this Actor.
   * If CONFIG.ActiveEffect.legacyTransferral is true, this is equivalent to actor.effects.contents.
   * If CONFIG.ActiveEffect.legacyTransferral is false, this will also return all the transferred ActiveEffects on any
   * of the Actor's owned Items.
   * @yields {ActiveEffect}
   * @returns {Generator<ActiveEffect, void, void>}
   */
  *allApplicableEffects() {
    for ( const effect of this.effects ) {
      yield effect;
    }
    if ( CONFIG.ActiveEffect.legacyTransferral ) return;
    for ( const item of this.items ) {
      for ( const effect of item.effects ) {
        if (!effect.determineTransfer(this)) continue;
        yield effect;
      }
    }
  }

  /**
   * Deletes expired temporary active effects and disables linked expired buffs.
   * Code borrowed from Pathfinder 1e system.
   *
   * @param {object} [options] Additional options
   * @param {Combat} [options.combat] Combat to expire data in, if relevant
   * @param {number} [options.timeOffset=0] Time offset from world time
   * @param {DocumentModificationContext} [context] Document update context
   */
  async expireActiveEffects({ combat, timeOffset = 0 } = {}, context = {}) {
    if (!this.isOwner) throw new Error("Must be owner");
    const worldTime = game.time.worldTime + timeOffset;
    
    const temporaryEffects = this.temporaryEffects.filter((ae) => {
      const { seconds, rounds, startTime, startRound } = ae.duration;
      // Calculate remaining duration.
      // AE.duration.remaining is updated by Foundry only in combat and is unreliable.
      
      if (seconds > 0) {
        const elapsed = worldTime - (startTime ?? 0),
          remaining = seconds - elapsed;
        return remaining <= 0;
      }
      else return false;
    });

    const disableActiveEffects = [],
      deleteActiveEffects = [],
      disableBuffs = [],
      actorUpdate = {};

    const v11 = game.release.generation >= 11;
    
    for (const ae of temporaryEffects) {
      const conditionId = v11 ? ae.statuses.first() : ae.getFlag("core", "statusId");

      if (conditionId) {
        // Disable expired conditions
        actorUpdate[`system.attributes.conditions.-=${conditionId}`] = null;
      } else {
        const duration = ae.duration.seconds ? formatTime(ae.duration.seconds) : ae.duration.rounds + ' ' + (ae.duration.rounds > 1 ? i18n('WW.Effect.Duration.Rounds') : i18n('WW.Effect.Duration.Round'));

        await ChatMessage.create({
          speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
          flavor: this.label,
          content: '<div><b>' + ae.name + '</b> ' + i18n("WW.Effect.Duration.ExpiredMsg") + ' ' + duration + '.</div>',
          sound: CONFIG.sounds.notification
        });

        if (ae.system.duration.autoExpire) {
          deleteActiveEffects.push(ae.id);
        } else {
          disableActiveEffects.push({ _id: ae.id, disabled: true });
        }
      }
    }

    // Add context info for why this update happens to allow modules to understand the cause.
    const hasActorUpdates = !foundry.utils.isEmpty(actorUpdate);

    const deleteAEContext = foundry.utils.mergeObject(
      { render: !disableBuffs.length && !disableActiveEffects.length && !hasActorUpdates },
      context
    );
    if (deleteActiveEffects.length)
      await this.deleteEmbeddedDocuments("ActiveEffect", deleteActiveEffects, deleteAEContext);

    const disableAEContext = foundry.utils.mergeObject({ render: !disableBuffs.length && !hasActorUpdates }, context);
    if (disableActiveEffects.length)
      await this.updateEmbeddedDocuments("ActiveEffect", disableActiveEffects, disableAEContext);

    const disableBuffContext = foundry.utils.mergeObject({ render: !hasActorUpdates }, context);
    if (disableBuffs.length) await this.updateEmbeddedDocuments("Item", disableBuffs, disableBuffContext);

    if (hasActorUpdates) await this.update(actorUpdate, context);
  }

  /* -------------------------------------------- */
  /*  Properties (Getters)                        */
  /* -------------------------------------------- */

  /**
   * Determine whether the character is injured.
   * @type {boolean}
   */
  get injured() {
    const health = this.system.stats.health;
    const current = health.current;
    const damage = this.system.stats.damage.value;

    let isInjured = damage >= Math.floor(current / 2);
    if (this.type === 'Character' && health.normal <= 0) isInjured = false;

    return isInjured ? true : false;
  }

  /**
   * Determine whether the character is dead or destroyed.
   * @type {boolean}
   */
  get dead() {
    const health = this.system.stats.health;
    
    let isDead = health.current <= 0;
    if (this.type === 'Character' && health.normal <= 0) isDead = false;

    return isDead ? true : false;
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
    data.type ??= "NPC";
    
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
