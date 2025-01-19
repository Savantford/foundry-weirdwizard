import { i18n, formatTime } from '../helpers/utils.mjs';

/**
* Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
* @extends {Actor}
*/

export default class WWActor extends Actor {
  
  async _preCreate(data, options, user) {
    const sourceId = this._stats.compendiumSource;
    // Don't change actors imported from compendia.
    if (sourceId?.startsWith("Compendium.")) return await super._preCreate(data, options, user);

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

    // Assign default Prototype Token Dispositions.
    let dispo = 1;

    switch (this.type) {

      case 'Character':
        dispo = 1;
      break;

      case 'NPC':
        dispo = -1;
      break;

    }

    // Set Protoype Token Sight by actor type.
    let sight;

    switch (this.type) {

      case 'Character':
        sight = {
          enabled: true
        };
      break;

    }

    // Set Protoype Token Actor Link by actor type.
    let actorLink = false;

    switch (this.type) {

      case 'Character':
        actorLink = true;
      break;

    }
    
    await this.updateSource({
      img: icon,
      'prototypeToken.disposition': dispo,
      'prototypeToken.sight': sight,
      'prototypeToken.actorLink': actorLink
    });

    return await super._preCreate(data, options, user);
  }

  async _onCreate(data, options, user) {

    // Fix Health and Incapacitated
    this.incapacitated = false;
    
    if (data.type === 'NPC') {
      await this.updateSource({
        'system.stats.health.current': data.system.stats.health.normal ? data.system.stats.health.normal : 10,
        'system.stats.damage.value': 0
      });
    }

    if (data.type === 'Character') {
      await this.updateSource({
        'system.stats.health.current': data.system.stats.health.normal ? data.system.stats.health.normal : 5,
        'system.stats.damage.value': 0
      });
    }

    return await super._onCreate(await data, options, user);
  }

  async _preUpdate(changed, options, user) {
    await super._preUpdate(changed, options, user);
    
    // Record Incapacitated status
    const cStats = await changed.system?.stats;

    if (cStats?.health || cStats?.damage) {
      // Get variables
      const current = await this.system.stats.health.current;
      const damage = await this.system.stats.damage.value;
      const chCurrent = cStats.health?.current;
      const chDamage = cStats.damage?.value;
      
      // Set incapactated status
      if (chDamage >= await current || await chCurrent <= await damage || await current == await damage) this.incapacitated = true; else this.incapacitated = false;
      if (await chDamage < await damage) this.incapacitated = false;
      if (this.type === 'Character' && this.system?.stats?.health?.normal <= 0) this.incapacitated = false;
    }
    
    // Update token status icons
    if ((changed.system?.stats?.damage || changed.system?.stats?.health) && this.token) {
      this.token.object.updateStatusIcons();
    }

  };

  /** @override */
  _preUpdateDescendantDocuments(parent, collection, documents, changes, options, userId) {
    // Record incapacitated status
    
    const current = this.system?.stats?.health?.current;
    const damage = this.system?.stats?.damage?.value;
    if (damage >= current) this.incapacitated = true; else this.incapacitated = false;
    if (this.type === 'Character' && this.system?.stats?.health?.normal <= 0) this.incapacitated = false;

    super._preUpdateDescendantDocuments(parent, collection, documents, changes, options, userId);
    this._onEmbeddedDocumentChange();
  }

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

  async _onUpdate(changed, options, user) {
    await super._onUpdate(changed, options, user);
    
    // Update token status icons
    if ((changed.system?.stats?.damage || changed.system?.stats?.health) && this.token) {
      this.token.object.updateStatusIcons();
    }
    
    // Update Character Options if Level updates
    if (changed.system?.stats?.level) {
      
      for (const i of this.items) {
        if (user !== game.user.id) return;
        if (i.charOption) i.updateBenefitsOnActor();
      }
      
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
    
    // Calculate Health
    this._calculateHealth(system);

    // Calculate total Defense
    this._calculateDefense(system);

    // Calculate Speed
    this._calculateSpeed(system);

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
      cur: sys.stats.defense.current,
      nrm: sys.stats.defense.normal,
      lost: sys.stats.defense.lost,
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
    delete data.attributes;
    delete data.stats;
    delete data.currency;
    delete data.details;
    delete data.description;
    
    return data;
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

  _calculateHealth(system) {
    // Get variables
    const health = system.stats.health;
    const current = health.current;
    const damage = system.stats.damage.value;

    // Set Damage to Health while incapacitated or when Damage is higher than Health   
    if (this.incapacitated === undefined) this.incapacitated = (damage >= current) ? true : false;
    
    if (this.incapacitated || (damage > current)) {
      this.system.stats.damage.value = this.system.stats.health.current;
    }
    
    if (this.system.stats.damage.value >= current) this.incapacitated = true;
    
    // Health override effect exists
    if (health.override) {
      health.normal = health.override;
    }
    
    // Calculate temporary Health and assign it
    health.temp = health.current - this.toObject().system?.stats.health.current;

    // Calculate lost Health and assign it
    if (health.normal - health.current >= 0) health.lost = health.normal - health.current; else health.lost = 0;

    // Assign Current Health to Max Damage for Token Bars
    system.stats.damage.max = current;

    // Do not set incapacitated status to true if a Character with normal Health 0
    if (this.type === 'Character' && health.normal <= 0) this.incapacitated = false;
    
  }

  _calculateSpeed(system) {
    const speed = system.stats.speed;
    
    // Halve Speed
    if (speed.halved) speed.current = Math.floor(speed.normal / 2)

    // Assign normal Speed
    else speed.current = speed.normal;
    
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
      <p style="display: inline"><b>${game.weirdwizard.utils.getAlias({ actor: this })}</b> ${i18n('WW.InstantEffect.Apply.Took')} ${damage} ${i18n('WW.InstantEffect.Apply.DamageLc')}.</p>
      <p>${i18n('WW.InstantEffect.Apply.DamageTotal')}: ${oldTotal} <i class="fas fa-arrow-right"></i> ${newTotal}</p>
    `;

    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
      content: content,
      sound: CONFIG.sounds.notification
    })

    this.incapacitated = (newTotal >= health) ? true : false;
    this.update({ 'system.stats.damage.value': newTotal });
  }

  async applyHealing(healing) {

    // Get values
    const oldTotal = this.system.stats.damage.value;
    const newTotal = ((oldTotal - parseInt(healing)) > 0) ? oldTotal - parseInt(healing) : 0;

    const content = `
      <p style="display: inline"><b>${game.weirdwizard.utils.getAlias({ actor: this })}</b> ${i18n('WW.InstantEffect.Apply.Healed')} ${healing} ${i18n('WW.InstantEffect.Apply.DamageLc')}.</p>
      <p>${i18n('WW.InstantEffect.Apply.DamageTotal')}: ${oldTotal} <i class="fas fa-arrow-right"></i> ${newTotal}</p>
    `;

    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
      content: content,
      sound: CONFIG.sounds.notification
    })

    this.incapacitated = (newTotal >= this.system.stats.health.current) ? true : false;
    this.update({ 'system.stats.damage.value': newTotal });
  }

  /* Apply loss to Health */
  async applyHealthLoss(loss) {
    const oldCurrent = this.system.stats.health.current;
    loss = parseInt(loss);
    const current = (oldCurrent - loss) > 0 ? oldCurrent - loss : 0;

    const content = `
      <p style="display: inline"><b>${game.weirdwizard.utils.getAlias({ actor: this })}</b> ${i18n('WW.InstantEffect.Apply.Lost')} ${loss} ${i18n('WW.InstantEffect.Apply.Health')}.</p>
      <p>${i18n('WW.InstantEffect.Apply.CurrentHealth')}: ${oldCurrent} <i class="fas fa-arrow-right"></i> ${current}</p>
    `;

    ChatMessage.create({
      speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
      content: content,
      sound: CONFIG.sounds.notification
    })

    //this.update({ 'system.stats.health.lost': lost + loss });
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
      <p style="display: inline"><b>${game.weirdwizard.utils.getAlias({ actor: this })}</b> ${i18n('WW.InstantEffect.Apply.Regained')} ${regained} ${i18n('WW.InstantEffect.Apply.Health')}.</p>
      <p>${i18n('WW.InstantEffect.Apply.CurrentHealth')}: ${oldCurrent} <i class="fas fa-arrow-right"></i> ${current}</p>
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
      return
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
  async applyEffect(effectUuid, external) {
    
    let obj = fromUuidSync(effectUuid).toObject();

    obj.flags.weirdwizard.trigger = 'passive';
    if (external) obj.flags.weirdwizard.external = true;

    const content = `<p><b class="info" data-tooltip="${obj.description}">${obj.name}</b> ${i18n('WW.Effect.AppliedTo')} <b>${game.weirdwizard.utils.getAlias({ actor: this })}</b>.</p>`;

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

  *allApplicableEffects() {
    for (let effect of super.allApplicableEffects()) {
      if (!effect.determineTransfer(this)) continue;
      yield effect;
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
      }/* else if (rounds > 0 && combat) {
        
        const elapsed = combat.round - (startRound ?? 0),
          remaining = rounds - elapsed;
        
        return remaining <= 0;
      }*/
      else return false;
    });

    const disableActiveEffects = [],
      deleteActiveEffects = [],
      disableBuffs = [],
      actorUpdate = {};

    const v11 = game.release.generation >= 11;
    
    for (const ae of temporaryEffects) {

      //const re = ae.origin?.match(/Item\.(?<itemId>\w+)/);
      //const item = this.items.get(re?.groups.itemId);
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

        if (ae.autoDelete) {
          deleteActiveEffects.push(ae.id);
        } else {
          disableActiveEffects.push({ _id: ae.id, disabled: true });
        }
      }
    }

    // Add context info for why this update happens to allow modules to understand the cause.
    //context.pf1 ??= {};
    //context.pf1.reason = "duration";
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
