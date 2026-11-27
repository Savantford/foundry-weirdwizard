import ActivityApp from "../apps/activity-app.mjs";
import TargetingHelper from "../apps/targeting-helper.mjs";
import ActivityModel from "../data/activities/activity.mjs";

export class Activity {
  constructor(options) {
    const system = {
      ...options,
      steps: options.steps.map(step => step.toObject())
    };
    
    const { args = {}, actor, item = null, steps, message = {}, title } = system;
    const sys = actor.system;

    // Arguments
    /*args.noRoll ??= roll.attribute?.key ? false : true;
    args.noTargeting ??= targeting?.operation === 'target' ? false : true;
    args.noArea ??= targeting?.operation === 'placeArea' ? false : true;*/
    

    // Create system object
    this.system = new ActivityModel({
      steps, title, message,
    })

    // Add document and data references
    foundry.utils.mergeObject(this, {
      item: item,
      actor: actor,
      token: actor.token ?? item.inferToken,
      skipApp: args.skipApp ?? !!(args.noRoll && args.noTargeting && args.noArea)
    })
    
    // Add more data to steps
    if (this.system.steps && this.system.steps.length) for (const [idx, step] of this.system.steps.entries()) {
      step.index = idx;
      step.number = idx + 1;

      // Roll
      if (step.operation === 'roll') {
        const roll = step.roll;
        const attribute = roll.attribute;
        
        // Attribute Modifier
        roll.mod ??= sys.attributes[attribute]?.mod ? game.weirdwizard.utils.plusify(sys.attributes[attribute].mod) : '+0';
        
        step.rollBreakdown = {
          boons: {
            actor: sys.boons,
            fromEffects: sys.boons.selfRoll[step.roll.attribute], // Conditional boons should be added here later
            forAttacks: sys.boons.selfRoll.attacks,
            forSpells: sys.boons.selfRoll.spells,
            fixed: step.roll.boons ?? 0,
            applyAttack: sys.isAttack,
            applySpell: sys.isSpell,
            situational: 0
          }
        }
      }
    }
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
    const system = this.system;
    const { skipApp, actor, item, targeting } = system;
    
    // Open or skip ActivityApp app
    let cancel = false;

    if (skipApp) { // Skip Activity app, but maybe open a helper
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
      const mutated = await ActivityApp.wait(this);
      if (mutated) (system, mutated); else cancel = true;
    }

    // Cancel activity if needed, otherwise proceed to roll and chat message
    if (cancel) return;

    await this.resolveSteps();

    await this.sendMessage(system); // Handle chat message creation

    return system;
  }

  /* -------------------------------------------- */

  async resolveSteps() {
    for (const [idx, step] of this.system.steps) {
      console.log(step)
      if (!args.noRoll) await this.rollDice(step); // Handle roll
    }
  }

  /* -------------------------------------------- */

  /**
   * Make rolls for an Activity.
   * @param {ActivityConfig} system
   * @returns {ActivityConfig}
   */
  async rollDice(step) {
    const system = this.system;
    const { actor, item, itemProperties } = system;
    const { attribute, against, flatMod } = system.roll;
    const { attribute: attributeB, boons: boonsB } = system.rollBreakdown;

    // Proceed to roll
    const rollData = this.getRollData();
    const rollOptions = {
      actor, item,
      template: "systems/weirdwizard/templates/sidebar/chat/roll.hbs",
      originUuid: item ? item.uuid : actor.uuid, // TODO: Replace with item/actor
      attribute: attribute,
      against: against
    };
    const rollsArray = [];
    const autoFailure = actor.system.autoFail;

    // Calculate final boons
    let boonsDisplay = "0";
    let boonsFinal = 0;

    if (boonsB.situational) boonsFinal += boonsB.situational; // Add situational boons input value
    if (boonsB.fromEffects) boonsFinal += boonsB.fromEffects; // If there are boons or banes applied by Active Effects, add it
    if (boonsB.applyAttack && boonsB.forAttacks) boonsFinal += boonsB.forAttacks;
    if (boonsB.applySpell && boonsB.forSpells) boonsFinal += boonsB.forSpells;
    if (boonsB.fixed) boonsFinal += boonsB.fixed; // If there are fixed boons or banes, add it

    step.rollBreakdown.boons.final = boonsFinal;

    // Check if user has valid targets
    const validTargets = this.getTargets(step).valid;

    if (!!validTargets.length && against) { // If Action is Targeted and Against is filled: perform one separate roll for each target
      for (const tar of validTargets) {
        // Set boons text
        let boonsAgainst = 0;
        if (tar.boonsAgainst) boonsAgainst += tar.boonsAgainst[against];
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
          (attribute && attribute !== 'luck') ? `${attributeB.mod}[${_loc(CONFIG.WW.ATTRIBUTES_SHORT[attribute])}]` : null,
          flatMod ? flatMod + `[${_loc("WW.Roll.Flat")}]` : null,
          boonsDisplay ? boonsDisplay + `[${_loc(boons.final < 0 ? "WW.Roll.Banes" : "WW.Roll.Boons")}]` : null
        ].filterJoin(" + ");

        // Determine target number
        const targetNo = against === 'def' ? tar.defense : tar.attributes[against].value;

        const autoSuccess = against ? !!tar.autoSuccessAgainst?.[against] : false;
        
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
        (attribute && attribute !== 'luck') ? `${attributeB.mod}[${_loc(CONFIG.WW.ATTRIBUTES_SHORT[attribute])}]` : null,
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

    // Add rolls array to system
    system.rollsArray = rollsArray;
    
    return system;
  }

  /* -------------------------------------------- */
  
  /**
   * Create a Chat Message for an Activity.
   * @param {ActivityConfig} system
   */
  async sendMessage() {
    const { actor, item, message, rollsArray=[] } = this.system;
    
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

  getTargets(step) {
    const all = [], valid = [], invalid = [];
    const restriction = step.targeting?.restriction ?? 'any';

    // Validate disposition
    function validateDispo(tokenDispo) {
      if (restriction === 'allies' && tokenDispo === 1) return true;
      else if (restriction === 'enemies' && tokenDispo === -1) return true;
      else if (restriction === 'any') return true;
      else return false;
    }

    // If Targeting Method is Self, infer token and target it
    const item = this.system.item;
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
        againstNo: step.roll.against === 'def' ? sys.stats.defense.total : (step.roll.against ? sys.attributes[step.roll.against]?.value : null),
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

  getActiveEffects(system) {
    const effs = {
      onUse: [],
      onSuccess: [],
      onCritical: [],
      onFailure: []
    }
    
    system.item?.effects?.forEach(effect => {
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

  getActivityInstantEffects(system) {
    const effs = {
      onUse: [],
      onSuccess: [],
      onCritical: [],
      onFailure: []
    }

    // Return earlier if there is no item
    if (!system.item) return effs;

    // Add Weapon Damage
    const itemSystem = system.item.system;
    const weaponDamage = (itemSystem.subtype === 'weapon' && itemSystem.damage) ? itemSystem.damage : 0;
    
    if (weaponDamage) {
      const eff = {
        label: 'damage',
        item: system.item,
        value: weaponDamage
      };
      
      effs.onSuccess.push(eff);
      effs.onCritical.push(eff);
    }
    
    // Add Instant Effects
    system.item.system.instant.forEach(e => {
      
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