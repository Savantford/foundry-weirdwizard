/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
 export function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest("li");
  const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
  switch ( a.dataset.action ) {
    case "create":
      return owner.createEmbeddedDocuments("ActiveEffect", [{
        name: "New Effect",
        icon: "icons/svg/aura.svg",
        origin: owner.uuid,
        "duration.rounds": li.dataset.effectType === "temporary" ? 1 : undefined,
        disabled: li.dataset.effectType === "inactive"
      }]);
    case "edit":
      return effect.sheet.render(true);
    case "delete":
      return effect.delete();
    case "toggle":
      return effect.update({disabled: !effect.disabled});
  }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {

    // Define effect header categories
    const categories = {
      temporary: {
        type: "temporary",
        name: "Temporary Effects",
        effects: []
      },
      passive: {
        type: "passive",
        name: "Passive Effects",
        effects: []
      },
      inactive: {
        type: "inactive",
        name: "Inactive Effects",
        effects: []
      }
    };

    // Iterate over active effects, classifying them into categories
    for ( let e of effects ) {
      e.sourceName; // Trigger a lookup for the source name
      if ( e.disabled ) categories.inactive.effects.push(e);
      else if ( e.isTemporary ) categories.temporary.effects.push(e);
      else categories.passive.effects.push(e);
    }
    return categories;
}

/* -------------------------------------------- */
/*  Afflictions
/* -------------------------------------------- */

function plusify(x) {
  if (x == 0) return ''
  return x > 0 ? '+' + x : x
}

/* -------------------------------------------- */

const addEffect = (key, value, priority) => ({
  key: key,
  value: plusify(value),
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
  priority: priority
});

/*const concatDiceEffect = (key, value) => ({
  key: key,
  value: value ? '+' + String(value) : null,
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
});

const concatString = (key, value, separator = '') => ({
  key: key,
  value: value ? value + separator : null,
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
});*/

const overrideEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
  priority: priority
});

/*const upgradeEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
  priority: priority
});*/

const downgradeEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE,
  priority: priority
});

//const falsyChangeFilter = change => Boolean(change.value);

/* -------------------------------------------- */

const effectPriority = 110;

const _buildBaseAffliction = (label, icon, changes = [], flags = {}) => ({
  id: label, // TODO: Check corrections here?
  name: game.i18n.localize('WW.' + label),
  icon: icon,
  disabled: false,
  transfer: true,
  duration: {},
  flags: {
    sourceType: 'affliction',
    permanent: false,
    ...flags,
  },
  changes: changes,
});

export class WWAfflictions {
  /**
   * Checks if the actor can do the action he is trying to perform, with the relative attribute
   * @param actor                 The actor
   * @param actionType            The type of action: [action / challenge]
   * @param actionAttribute       The attribute name, lowercase
   * @returns {boolean}           True if the actor is blocked
   */
  static isActorBlocked(actor, actionType, actionAttribute) {
    actionAttribute = actionAttribute.toLowerCase();
    const isBlocked = actor.system.maluses.autoFail[actionType]?.[actionAttribute] > 0;
    if (isBlocked) {
      // TODO: more precise message? Currently it picks the first message
      let msg = actor.getEmbeddedCollection('ActiveEffect').find(effect => Boolean(effect.flags?.warningMessage))
        ?.flags.warningMessage;
      msg = msg ?? game.i18n.localize(`WW.AutoFail${actionType.capitalize()}s`);
      ui.notifications.error(msg);
    }
    return isBlocked
  }

  static async clearAfflictions(actor) {
    if (!actor) return
    const afflictions = actor
      .getEmbeddedCollection('ActiveEffect')
      .filter(e => e.statuses.size > 0)
      .map(e => e._id);
    await actor.deleteEmbeddedDocuments('ActiveEffect', afflictions);
  }

  /**
   * Builds the Afflictions Active Effects for the token quick menu
   * @returns list of active effect data
   */
  static buildAll() {
    const effectsDataList = [];

    // Blinded
    effectsDataList.push(
      _buildBaseAffliction(
        'Blinded',
        'icons/svg/blind.svg',
        /*[
          addEffect('system.bonuses.defense.boons.defense', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.agility', -1, effectPriority),
          downgradeEffect('system.characteristics.speed', 2, effectPriority),
          // overrideEffect('system.maluses.autoFail.challenge.perception', 1)  fails only perc challenges based on SIGHT
        ],
        {
          warningMessage: game.i18n.localize('WW.DialogWarningBlindedChallengeFailer'),
        },*/
      ),
    );

    // Confused
    effectsDataList.push(_buildBaseAffliction('Confused', 'icons/svg/stoned.svg'));

    // Controlled
    effectsDataList.push(_buildBaseAffliction('Controlled', 'icons/svg/eye.svg'));

    // Cursed
    effectsDataList.push(_buildBaseAffliction('Cursed', 'icons/svg/ruins.svg'));

    // Deafened
    effectsDataList.push(
      _buildBaseAffliction('Deafened', 'icons/svg/deaf.svg', [
        //overrideEffect('system.maluses.autoFail.challenge.perception', 1) fails only perc challenges based on HEARING
      ]),
    );

    const challengeBane = [
      addEffect('system.bonuses.challenge.boons.strength', -1, effectPriority),
      addEffect('system.bonuses.challenge.boons.agility', -1, effectPriority),
      addEffect('system.bonuses.challenge.boons.intellect', -1, effectPriority),
      addEffect('system.bonuses.challenge.boons.will', -1, effectPriority),
      addEffect('system.bonuses.challenge.boons.perception', -1, effectPriority),
    ];

    const attackBane = [
      addEffect('system.bonuses.attack.boons.strength', -1, effectPriority),
      addEffect('system.bonuses.attack.boons.agility', -1, effectPriority),
      addEffect('system.bonuses.attack.boons.intellect', -1, effectPriority),
      addEffect('system.bonuses.attack.boons.will', -1, effectPriority),
      addEffect('system.bonuses.attack.boons.perception', -1, effectPriority),
    ];

    // Frightened
    effectsDataList.push(
      _buildBaseAffliction(
        'Frightened',
        'icons/svg/terror.svg',
        [/*overrideEffect('system.maluses.noFastTurn', 1)*/]/*.concat(challengeBane, attackBane)*/, //FIXME: can take fast turns?
      ),
    );

    // Held
    effectsDataList.push(
      _buildBaseAffliction('Held', 'icons/svg/padlock.svg', [
        /*downgradeEffect('system.characteristics.speed', 0, effectPriority),
        addEffect('system.bonuses.defense.boons.defense', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.strength', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.agility', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.will', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.intellect', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.perception', -1, effectPriority),*/
      ]),
    );

    // Strength Impaired
    effectsDataList.push(
      _buildBaseAffliction(
        'ImpairedStr',
        'icons/svg/downgrade.svg',
        /*[].concat(challengeBane, attackBane),*/
      ),
    );

    // Agility Impaired
    effectsDataList.push(
      _buildBaseAffliction(
        'ImpairedAgi',
        'icons/svg/anchor.svg',
        /*[].concat(challengeBane, attackBane),*/
      ),
    );

    // Intellect Impaired
    effectsDataList.push(
      _buildBaseAffliction(
        'ImpairedInt',
        'icons/svg/light-off.svg',
        /*[].concat(challengeBane, attackBane),*/
      ),
    );

    // Will Impaired
    effectsDataList.push(
      _buildBaseAffliction(
        'ImpairedWil',
        'icons/svg/invisible.svg',
        /*[].concat(challengeBane, attackBane),*/
      ),
    );

    // On Fire
    effectsDataList.push(_buildBaseAffliction('OnFire', 'icons/svg/fire.svg', []/*.concat(challengeBane, attackBane)*/));

    // Poisoned
    effectsDataList.push(_buildBaseAffliction('Poisoned', 'icons/svg/poison.svg', []/*.concat(challengeBane, attackBane)*/));

    // Prone
    effectsDataList.push(
      _buildBaseAffliction('Prone', 'icons/svg/falling.svg', [
        /*addEffect('system.bonuses.attack.boons.strength', -1, effectPriority),
        addEffect('system.bonuses.attack.boons.agility', -1, effectPriority),
        addEffect('system.bonuses.challenge.boons.strength', -1, effectPriority),
        addEffect('system.bonuses.challenge.boons.agility', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.defense', -1, effectPriority),
        // FIXME: depends if the attacker is nearby or not
        addEffect('system.bonuses.defense.boons.strength', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.agility', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.will', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.intellect', -1, effectPriority),
        addEffect('system.bonuses.defense.boons.perception', -1, effectPriority),*/
      ]),
    );

    // Stunned
    effectsDataList.push(
      _buildBaseAffliction(
        'Stunned',
        'icons/svg/daze.svg',
        /*[
          overrideEffect('system.maluses.autoFail.challenge.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.perception', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.perception', 1, effectPriority),
          addEffect('system.bonuses.defense.boons.defense', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.strength', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.agility', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.will', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.intellect', -1, effectPriority),
          addEffect('system.bonuses.defense.boons.perception', -1, effectPriority),
        ],
        {
          warningMessage: game.i18n.localize('WW.DialogWarningStunnedFailer'),
        },*/
      ),
    );

    // Unconscious
    effectsDataList.push(
      _buildBaseAffliction(
        'Unconscious',
        'icons/svg/unconscious.svg',
        /*[
          overrideEffect('system.maluses.autoFail.challenge.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.challenge.perception', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.strength', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.agility', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.intellect', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.will', 1, effectPriority),
          overrideEffect('system.maluses.autoFail.action.perception', 1, effectPriority),
          downgradeEffect('system.characteristics.speed', 0, effectPriority),
          overrideEffect('system.bonuses.armor.override', 5, effectPriority),
        ],
        {
          warningMessage: game.i18n.localize('WW.DialogWarningUnconsciousFailer'),
        },*/
      ),
    );

    // Asleep
    effectsDataList.push(_buildBaseAffliction('Asleep', 'icons/svg/sleep.svg'));

    // Weakened
    effectsDataList.push(_buildBaseAffliction('Weakened', 'icons/svg/downgrade.svg'));

    // ----------------------- ACTIONS -------------------------- //
    /*
    // Concentrate
    effectsDataList.push(_buildBaseAffliction('concentrate', 'systems/demonlord/assets/icons/effects/concentrate.svg'));

    // Defend
    effectsDataList.push(
      _buildBaseAffliction('defend', 'systems/demonlord/assets/icons/effects/defend.svg', [
        addEffect('system.bonuses.defense.boons.defense', 1, effectPriority),
        addEffect('system.bonuses.defense.boons.strength', 1, effectPriority),
        addEffect('system.bonuses.defense.boons.agility', 1, effectPriority),
        addEffect('system.bonuses.defense.boons.will', 1, effectPriority),
        addEffect('system.bonuses.defense.boons.intellect', 1, effectPriority),
        addEffect('system.bonuses.defense.boons.perception', 1, effectPriority),
        // TODO: Auto disable when Dazed, Stunned or Unconscious
      ]),
    );

    // Help
    effectsDataList.push(
      _buildBaseAffliction(
        'help',
        'systems/demonlord/assets/icons/effects/help.svg',
        [], // TODO: Add boons? Aka help should be applied to the receiver
      ),
    );

    // Prepare
    effectsDataList.push(
      _buildBaseAffliction('prepare', 'systems/demonlord/assets/icons/effects/prepare.svg', [
        addEffect('system.bonuses.challenge.boons.strength', 1, effectPriority),
        addEffect('system.bonuses.challenge.boons.agility', 1, effectPriority),
        addEffect('system.bonuses.challenge.boons.intellect', 1, effectPriority),
        addEffect('system.bonuses.challenge.boons.will', 1, effectPriority),
        addEffect('system.bonuses.challenge.boons.perception', 1, effectPriority),
        addEffect('system.bonuses.attack.boons.strength', 1, effectPriority),
        addEffect('system.bonuses.attack.boons.agility', 1, effectPriority),
        addEffect('system.bonuses.attack.boons.intellect', 1, effectPriority),
        addEffect('system.bonuses.attack.boons.will', 1, effectPriority),
        addEffect('system.bonuses.attack.boons.perception', 1, effectPriority),
      ]),
    );

    // Reload
    effectsDataList.push(_buildBaseAffliction('reload', 'systems/demonlord/assets/icons/effects/reload.svg'));

    // Retreat
    effectsDataList.push(_buildBaseAffliction('retreat', 'systems/demonlord/assets/icons/effects/retreat.svg'));

    // Rush
    effectsDataList.push(_buildBaseAffliction('rush', 'systems/demonlord/assets/icons/effects/rush.svg'));

    // Stabilize
    effectsDataList.push(_buildBaseAffliction('stabilize', 'systems/demonlord/assets/icons/effects/stabilize.svg'));

    // ----------------------- DAMAGE EFFECTS -------------------------- //

    // Injured
    effectsDataList.push(_buildBaseAffliction('injured', 'icons/svg/blood.svg'));

    // Incapacitated
    effectsDataList.push(
      _buildBaseAffliction('incapacitated', 'systems/demonlord/assets/icons/effects/incapacitated.svg'),
    );

    // Disabled
    effectsDataList.push(_buildBaseAffliction('disabled', 'systems/demonlord/assets/icons/effects/disabled.svg', [], {'core.overlay': true}));

    // Dying
    effectsDataList.push(_buildBaseAffliction('dying', 'systems/demonlord/assets/icons/effects/dying.svg', [], {'core.overlay': true}));
    */
    return effectsDataList
  }
}
