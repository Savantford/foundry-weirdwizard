import ActivityUse from "../apps/activity-use.mjs";
import TargetingHelper from "../apps/targeting-helper.mjs";

export class Activity {
  constructor(options) {
    const { args = {}, actor, item = null, roll = {}, message = {}, title } = options;
    const sys = actor.system;

    // Targeting
    const targeting = item?.system?.targeting ?? null;

    // Item Properties
    const itemProperties = {
      isWeapon: item?.system?.subtype === 'weapon' ?? false,
      isAttack: (item?.system?.subtype === 'weapon' || roll?.against?.key === 'def') ?? false,
      isMagical: item?.system?.magical,
      isSpell: item?.type === 'spell' ?? false
    }

    // Roll
    roll.attribute ??= {};
    roll.attribute.key ??= item?.system?.attribute ?? null;
    const attKey = roll.attribute.key;
    roll.attribute.mod ??= sys.attributes[attKey]?.mod ? game.weirdwizard.utils.plusify(sys.attributes[attKey].mod) : '+0';
    
    // Roll Boons
    foundry.utils.mergeObject(roll.boons = {}, {
      actor: sys.boons,
      fromEffects: sys.boons.selfRoll[attKey], // Conditional boons should be added here later
      forAttacks: sys.boons.selfRoll.attacks,
      forSpells: sys.boons.selfRoll.spells,
    });

    roll.boons.fixed ??= item?.system?.boons ?? 0;
    roll.boons.applyAttack ??= itemProperties.isAttack;
    roll.boons.applySpell ??= itemProperties.isSpell;
    roll.boons.situational ??= 0;

    roll.against ??= {};
    roll.against.key ??= item?.system?.against ?? null;

    // Arguments
    args.noRoll ??= roll.attribute?.key ? false : true;
    args.noTargeting ??= targeting?.operation === 'target' ? false : true;
    args.noArea ??= targeting?.operation === 'placeArea' ? false : true;
    args.skipApp ??= args.noRoll && args.noTargeting && args.noArea;

    // Create config object
    this.config = {
      args, actor, item, roll, targeting, message, itemProperties, title,
      token: actor.token
    }

    console.log(this.config)
  }

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  /**
   * Handle the use of an Activity.
   * @param {ActivityOptions} options
   * @returns {ActivityConfig}
   */
  async use() {
    const config = this.config;
    const { args, actor, item, targeting } = config;
    
    // Open or skip ActivityUse app
    let cancel = false;

    if (args.skipApp) { // Skip Activity app, but maybe open a helper
      // Prompt Area placement
      if (targeting?.operation === 'placeArea' || (targeting?.operation === 'target' && targeting?.method === 'area')) {
        const area = await item.placeArea({ originApp: actor.sheet });

        if (!area) cancel = true;
        
      // Open Targeting Helper
      } else if (targeting?.operation === 'target') {
        const helperOptions = {
          originApp: actor.sheet,
          actor,
          item,
          cancelable: true
        };
        const targetingHelper = await TargetingHelper.wait(helperOptions);

        if (targetingHelper.cancel) cancel = true;
      } 
    } else { // Open Activity app
      const mutated = await ActivityUse.wait(config);
      if (mutated) (config, mutated); else cancel = true;
    }

    // Cancel activity if needed, otherwise proceed to roll and chat message
    if (cancel) return;

    //await this.resolveSteps();

    if (!args.noRoll) await this.rollDice(config); // Handle roll

    await this.sendMessage(config); // Handle chat message creation

    return config;
  }

  /* -------------------------------------------- */

  /**
   * Make rolls for an Activity.
   * @param {ActivityConfig} config
   * @returns {ActivityConfig}
   */
  async rollDice() {
    const config = this.config;
    const { actor, item, itemProperties } = config;
    const { attribute, boons, against, flatMod } = config.roll;

    // Proceed to roll
    const rollData = this.getRollData();
    const rollOptions = {
      actor, item,
      template: "systems/weirdwizard/templates/sidebar/chat/roll.hbs",
      originUuid: item ? item.uuid : actor.uuid, // TODO: Replace with item/actor
      attribute: attribute.key,
      against: against.key,
      instEffs: this.getActivityInstantEffects(config),
      actEffs: this.getActiveEffects(config)
    };
    const rollsArray = [];
    const autoFailure = actor.system.autoFail;

    // Calculate final boons
    let boonsDisplay = "0";
    let boonsFinal = 0;

    if (boons.situational) boonsFinal += boons.situational; // Add situational boons input value
    if (boons.fromEffects) boonsFinal += boons.fromEffects; // If there are boons or banes applied by Active Effects, add it
    if (boons.applyAttack && boons.forAttacks) boonsFinal += boons.forAttacks;
    if (boons.applySpell && boons.forSpells) boonsFinal += boons.forSpells;
    if (boons.fixed) boonsFinal += boons.fixed; // If there are fixed boons or banes, add it

    this.config.roll.boons.final = boonsFinal;

    // Check if user has valid targets
    const validTargets = this.getTargets(config).valid;

    if (!!validTargets.length && against.key) { // If Action is Targeted and Against is filled: perform one separate roll for each target
      for (const tar of validTargets) {
        // Set boons text
        let boonsAgainst = 0;
        if (tar.boonsAgainst) boonsAgainst += tar.boonsAgainst[against.key];
        if (itemProperties.isAttack) boonsAgainst += tar.boonsAgainst.fromAttacks;
        if (itemProperties.isSpell) boonsAgainst += tar.boonsAgainst.fromSpells;
        if (itemProperties.isMagical) boonsAgainst += tar.boonsAgainst.fromMagical;

        const boonsNo = parseInt(boons.final) + boonsAgainst;

        if (boonsNo != 0) {
          boonsDisplay = (boonsNo < 0 ? "" : "+") + boonsNo + "d6kh"
        } else {
          boonsDisplay = "";
        };

        // Determine the rollFormula
        const rollFormula = [
          "1d20",
          (attribute.key && attribute.key !== 'luck') ? `${attribute.mod}[${_loc(CONFIG.WW.ATTRIBUTES_SHORT[attribute.key])}]` : null,
          flatMod ? flatMod + `[${_loc("WW.Roll.Flat")}]` : null,
          boonsDisplay ? boonsDisplay + `[${_loc(boons.final < 0 ? "WW.Roll.Banes" : "WW.Roll.Boons")}]` : null
        ].filterJoin(" + ");

        // Determine target number
        const targetNo = against.key === 'def' ? tar.defense : tar.attributes[against.key].value;

        const autoSuccess = against.key ? !!tar.autoSuccessAgainst?.[against.key] : false;
        
        // Construct the Roll instance and evaluate the roll
        const roll = await new WWRoll(rollFormula, rollData, {
          ... rollOptions,
          target: tar,
          targetNo,
          autoSuccess,
          autoFailure
        }).evaluate();
        
        // Prepare DSN data
        const index = validTargets.findIndex(obj => { return obj.id === tar.id; });
        this.prepareDSN(roll, index);

        // Push roll to roll array
        rollsArray.push(roll);
      }

    } else { // No targets and Against is false: perform a SINGLE ROLL for all targets
      // Set boons text
      if (boons.final != 0) { boonsDisplay = boons.final + "d6kh" } else { boonsDisplay = ""; };
      
      // Determine the rollFormula
      const rollFormula = [
        "1d20",
        (attribute.key && attribute.key !== 'luck') ? `${attribute.mod}[${_loc(CONFIG.WW.ATTRIBUTES_SHORT[attribute.key])}]` : null,
        flatMod ? flatMod + `[${_loc("WW.Roll.Flat")}]` : null,
        boonsDisplay ? boonsDisplay + `[${_loc(boons.final < 0 ? "WW.Roll.Banes" : "WW.Roll.Boons")}]` : null
      ].filterJoin(" + ");

      // Set targetNo to the custom; 10 is used otherwise
      const targetNo = against.customTn ?? 10;
      
      // Construct the Roll instance and evaluate the roll
      const roll = new WWRoll(rollFormula, rollData, {
        ... rollOptions,
        targetNo,
        autoFailure
      });
      await roll.evaluate();

      // Prepare DSN data
      this.prepareDSN(roll, 0);

      // Push roll to roll array
      rollsArray.push(roll);
    }

    // Add rolls array to config
    config.rollsArray = rollsArray;
    
    return config;
  }

  /* -------------------------------------------- */
  
  /**
   * Create a Chat Message for an Activity.
   * @param {ActivityConfig} config
   */
  async sendMessage() {
    const { actor, item, message, rollsArray=[] } = this.config;
    
    const messageData = {
      ...message,
      type: 'd20-roll',
      rolls: [...rollsArray],
      speaker: game.weirdwizard.utils.getSpeaker({ actor }),
      sound: CONFIG.sounds.dice,
      'flags.weirdwizard': {
        icon: message.icon ?? (item?.img ?? null),
        item: item?.uuid,
        emptyContent: !message.content ?? true
      }
    }
    console.log(messageData)
    // Apply roll mode and send to chat
    await ChatMessage.applyMode(messageData, game.settings.get('core', 'messageMode'));
    await ChatMessage.create(messageData);
  }
  
  /* -------------------------------------------- */

  prepareDSN(roll, index) {
    for (let i = 0; i < roll.dice.length; i++) {
      roll.dice[i].options.rollOrder = index;

      const exp = roll.dice[i].expression;
      if (exp.includes('d20')) {
        roll.dice[i].options.appearance = {
          colorset: 'wwd20',
          texture: 'stars',
          material: 'metal',
          font: 'Amiri',
          foreground: '#FFAE00', // Label Color
          background: "#AE00FF", // Dice Color
          outline: '#FF7B00',
          edge: '#FFAE00',
          material: 'metal',
          font: 'Amiri',
          default: true
        };
      }

      if (exp.includes('d6')) {
        const sub = roll.formula.substring(0, roll.formula.indexOf(exp)).trim();
        const sign = sub.slice(-1);

        if (sign === '+') { // Boon dice
          roll.dice[i].options.appearance = {
            colorset: 'wwboon',
            texture: 'stars',
            material: 'metal',
            font: 'Amiri',
            foreground: '#FFAE00', // Label Color
            background: "#4394FE", // Dice Color
            outline: '#FF7B00',
            edge: '#FFAE00',
            material: 'metal',
            font: 'Amiri'
          };

        } else if (sign === '-') { // Bane dice
          roll.dice[i].options.appearance = {
            colorset: 'wwbane',
            texture: 'stars',
            material: 'metal',
            font: 'Amiri',
            foreground: '#FFAE00', // Label Color
            background: "#C70000", // Dice Color
            outline: '#FF7B00',
            edge: '#FFAE00',
            material: 'metal',
            font: 'Amiri'
          };
        }
      }
    }
  }

  /* -------------------------------------------- */

  getTargets(config) {
    const all = [], valid = [], invalid = [];
    const restriction = config.targeting?.restriction ?? 'any';

    // Validate disposition
    function validateDispo(tokenDispo) {
      if (restriction === 'allies' && tokenDispo === 1) return true;
      else if (restriction === 'enemies' && tokenDispo === -1) return true;
      else if (restriction === 'any') return true;
      else return false;
    }

    // If Targeting Method is Self, infer token and target it
    const item = config.item;
    if (item?.system?.targeting?.method === 'self' && item?.inferToken) canvas.tokens.setTargets([item.inferToken.object.id]);

    // Loop through targets
    game.user.targets.forEach(target => {
      const tokenDoc = target.document;
      const actor = tokenDoc.actor;
      const sys = actor?.system;

      // Prepare shared actor data
      const targetData = {
        id: target.id,
        uuid: tokenDoc.uuid,
        img: tokenDoc.texture.src,
        name: game.weirdwizard.utils.getAlias({ token: tokenDoc, actor: actor }),
        dispostion: tokenDoc.disposition,
        isCreature: actor.type === 'character' || actor.type === 'npc'
      };

      // Add Creature specific data
      if (targetData.isCreature) foundry.utils.mergeObject(targetData, {
        attributes: sys.attributes,
        defense: sys.stats.defense.total,
        againstNo: config.roll.against.key === 'def' ? sys.stats.defense.total : (config.roll.against.key ? sys.attributes[config.roll.against.key]?.value : null),
        boons: sys.boons.selfRoll,
        boonsAgainst: sys.boons.against,
        autoSuccessAgainst: sys.autoSuccess.against
      })

      // Push to correct arrays
      all.push(targetData);

      if (targetData.isCreature && validateDispo(tokenDoc.disposition)) valid.push(targetData);
      else invalid.push(targetData);
    });

    return { all, valid, invalid };
  }

  /* -------------------------------------------- */

  getActiveEffects(config) {
    const effs = {
      onUse: [],
      onSuccess: [],
      onCritical: [],
      onFailure: []
    }
    
    config.item?.effects?.forEach(effect => {
      const e = {...effect};
      e.uuid = effect.uuid;

      switch (e.system.trigger) {
        case 'onUse': {
          effs.onUse.push(e);
          effs.onSuccess.push(e);
          effs.onCritical.push(e);
          effs.onFailure.push(e);
        }; break;
        case 'onSuccess': effs.onSuccess.push(e); effs.onCritical.push(e); break;
        case 'onCritical': effs.onCritical.push(e); break;
        case 'onFailure': effs.onFailure.push(e); break;
      }

    })
    
    return effs;
  }

  /* -------------------------------------------- */

  getActivityInstantEffects(config) {
    const effs = {
      onUse: [],
      onSuccess: [],
      onCritical: [],
      onFailure: []
    }

    // Return earlier if there is no item
    if (!config.item) return effs;

    // Add Weapon Damage
    const itemSystem = config.item.system;
    const weaponDamage = (itemSystem.subtype === 'weapon' && itemSystem.damage) ? itemSystem.damage : 0;
    
    if (weaponDamage) {
      const eff = {
        label: 'damage',
        item: config.item,
        value: weaponDamage
      };
      
      effs.onSuccess.push(eff);
      effs.onCritical.push(eff);
    }
    
    // Add Instant Effects
    config.item.system.instant.forEach(e => {
      
      if (!e.trigger) e.trigger = e.flags.weirdwizard.trigger;

      switch (e.trigger) {
        case 'onUse': {
          effs.onUse.push(e);
          effs.onSuccess.push(e);
          effs.onCritical.push(e);
          effs.onFailure.push(e);
        }; break;
        case 'onSuccess': effs.onSuccess.push(e); effs.onCritical.push(e); break;
        case 'onCritical': effs.onCritical.push(e); break;
        case 'onFailure': effs.onFailure.push(e); break;
      }

    })
    
    return effs;
  }
}