import { addEffect, multiplyEffect, downgradeEffect, overrideEffect } from '../helpers/item-effects.mjs'
import { i18n } from "../helpers/utils.mjs";

const addPriority = 120;
const overridePriority = 150;

const _buildBaseAffliction = (label, icon, changes = [], flags = {}) => ({
  id: label, // TODO: Check corrections here?
  name: i18n('WW.Affliction.' + label),
  icon: icon,
  description: label.includes('Impaired') ? i18n('WW.Affliction.ImpairedDesc') : i18n('WW.Affliction.' + label + 'Desc'),
  disabled: false,
  transfer: true,
  duration: { seconds: 3600 },
  tint: '#FF0900',
  flags: {
    sourceType: 'affliction',
    permanent: false,
    weirdwizard: {
      selectedDuration: 'luckEnds'
    },
    ...flags
  },
  changes: changes,
  system: {
    duration: {
      selected: '1minute'
    }
  }
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
      msg = msg ?? i18n(`WW.AutoFail${actionType.capitalize()}s`);
      ui.notifications.error(msg);
    }
    return isBlocked
  }

  static async clearAfflictions(actor) {
    if (!actor) return
    
    const afflictions = actor
      .getEmbeddedCollection('ActiveEffect')
      .filter(e => e.statuses.size > 0)
      .filter(e => e.flags.sourceType = 'affliction')
      .map(e => e._id);
    await actor.deleteEmbeddedDocuments('ActiveEffect', afflictions);
  }

  /**
   * Builds the Afflictions Active Effects for the token quick menu
   * @returns list of active effect data
  */

  static buildAll() {
    const effectsDataList = [];

    const baneAllAttributes = function(v) { return [
      addEffect('banes.str', v, addPriority),
      addEffect('banes.agi', v, addPriority),
      addEffect('banes.int', v, addPriority),
      addEffect('banes.wil', v, addPriority)
    ];}

    const againstAll = function(v) { return [
      addEffect('boonsAgainst.def', v, addPriority),
      addEffect('boonsAgainst.str', v, addPriority),
      addEffect('boonsAgainst.agi', v, addPriority),
      addEffect('boonsAgainst.int', v, addPriority),
      addEffect('boonsAgainst.wil', v, addPriority)
    ];}

    // Blinded
    effectsDataList.push(_buildBaseAffliction(
      'Blinded',
      'icons/svg/blind.svg',
      [
        overrideEffect('speed.halved', true, overridePriority)
        // Cannot see, line of sight to nothing, must guess the target
      ]
    ));

    // Confused
    effectsDataList.push(_buildBaseAffliction(
      'Confused',
      'icons/svg/stoned.svg',
      [
        addEffect('banes.int', 1, addPriority),
        addEffect('banes.wil', 1, addPriority)
        // Cannot use reactions
      ]
    ));

    // Controlled
    effectsDataList.push(_buildBaseAffliction(
      'Controlled',
      '/systems/weirdwizard/assets/icons/puppet.svg'
    ));
    /* You fall under control of the source of this affliction. You take your
    turn when your controller does and it decides what you do on your
    turn. If you have already taken a turn when you gain this affliction,
    you take a turn as described during the next round. */

    // Cursed
    effectsDataList.push(_buildBaseAffliction(
      'Cursed',
      '/systems/weirdwizard/assets/icons/bleeding-eye.svg',
      [addEffect('banes.luck', 1, addPriority)]
    ));

    // Deafened
    effectsDataList.push(_buildBaseAffliction('Deafened', 'icons/svg/deaf.svg'));
    // You cannot hear.

    // Frightened
    effectsDataList.push(
      _buildBaseAffliction(
        'Frightened',
        'icons/svg/terror.svg',
        [].concat(baneAllAttributes(1))
          .concat(againstAll(1))
      ),
    );

    // Held
    effectsDataList.push(_buildBaseAffliction(
      'Held',
      '/systems/weirdwizard/assets/icons/manacles.svg',
      [
        downgradeEffect('speed.override', 0, overridePriority),
        overrideEffect('autoSuccessAgainst.agi', true, addPriority),
      ]
    ));

    // Strength Impaired
    effectsDataList.push(
      _buildBaseAffliction(
        'ImpairedStr',
        '/systems/weirdwizard/assets/icons/biceps-impaired.svg',
        [
          addEffect('banes.str', 1, addPriority),
          addEffect('boonsAgainst.str', 1, addPriority)
        ]
      ),
    );

    // Agility Impaired
    effectsDataList.push(
      _buildBaseAffliction(
        'ImpairedAgi',
        '/systems/weirdwizard/assets/icons/agility-impaired.svg',
        [
          addEffect('banes.agi', 1, addPriority),
          addEffect('boonsAgainst.agi', 1, addPriority)
        ]
      ),
    );

    // Intellect Impaired
    effectsDataList.push(
      _buildBaseAffliction(
        'ImpairedInt',
        '/systems/weirdwizard/assets/icons/open-book-impaired.svg',
        [
          addEffect('banes.int', 1, addPriority),
          addEffect('boonsAgainst.int', 1, addPriority)
        ]
      ),
    );

    // Will Impaired
    effectsDataList.push(
      _buildBaseAffliction(
        'ImpairedWil',
        '/systems/weirdwizard/assets/icons/burning-star-impaired.svg',
        [
          addEffect('banes.wil', 1, addPriority),
          addEffect('boonsAgainst.wil', 1, addPriority)
        ]
      ),
    );

    // On Fire
    effectsDataList.push(_buildBaseAffliction(
      'OnFire',
      '/systems/weirdwizard/assets/icons/flaming-claw.svg',
      []/*You catch fire. You take 1d6 damage at the end of each round until
      the fire is extinguished, which is normally accomplished with a
      successful luck roll (see Luck Rolls). You can also use an action to
      overcome the flames by making a successful Agility roll or by using
      an action to douse the flames with water or smother them with a
      blanket or similar object. A creature that drops prone before trying 
      to overcome the flames makes the roll with 1 boon.*/));

    // Poisoned
    effectsDataList.push(_buildBaseAffliction(
      'Poisoned',
      '/systems/weirdwizard/assets/icons/poison.svg',
      [].concat(baneAllAttributes(1))
        .concat(againstAll(1))
      // 1d6 Health lost each round
    ));

    // Prone
    effectsDataList.push(
      _buildBaseAffliction('Prone', '/systems/weirdwizard/assets/icons/fallen.svg', [
        /*You are lying on the ground. You cannot use reactions. You grant 1
        boon on rolls made to attack you with melee weapons, but impose
        1 bane on rolls made to attack you with ranged weapons. You can
        use your move to crawl or stand up only.*/
      ]),
    );

    // Slowed
    effectsDataList.push(
      _buildBaseAffliction(
        'Slowed',
        '/systems/weirdwizard/assets/icons/snail.svg',
        [
          downgradeEffect('speed.override', 2, overridePriority)
      ]),
    );

    // Stunned
    effectsDataList.push(
      _buildBaseAffliction(
        'Stunned',
        'icons/svg/daze.svg',
        [downgradeEffect('speed.override', 0, overridePriority)]
          .concat(baneAllAttributes(-2))
          .concat(againstAll(2))
          /*You cannot use actions or reactions. Your Speed drops to 0 and
          you cannot benefit from increases to Speed until this affliction
          ends. You grant 2 boons on rolls against you, and you make attribute rolls with 2 banes.*/
        
      ),
    );

    // Unconscious
    effectsDataList.push(
      _buildBaseAffliction(
        'Unconscious',
        'icons/svg/unconscious.svg',
        [
          downgradeEffect('speed.override', 0, overridePriority),
          overrideEffect('autoFail.str', true, addPriority),
          overrideEffect('autoFail.agi', true, addPriority),
          overrideEffect('autoFail.int', true, addPriority),
          overrideEffect('autoFail.wil', true, addPriority)
        ].concat(againstAll(3))
          /* You cannot use actions or reactions. Your Speed drops 0 and you
          cannot benefit from increases to Speed until this affliction ends.
          You receive no information from your senses. You grant 3 boons
          on rolls against you, and you automatically fail all attribute rolls.
          When you take damage, you first lose Health equal to the
          amount of damage you would take and then take the damage. For
          example, if you have Health 12 and take 6 damage while you are
          unconscious, you would reduce your Health to 6 and then take 6
          damage, which would cause you to become incapacitated. */
        
      ),
    );

    // Asleep
    effectsDataList.push(_buildBaseAffliction('Asleep', 'icons/svg/sleep.svg'));
    /* If you are unconscious because you are sleeping naturally, you stop
    being unconscious when a creature uses an action to shake you,
    kick you, or do something else to waken you. A loud noise might
    remove the affliction if you succeed on a luck roll. Time spent
    sleeping counts as resting for the purpose of healing damage (see
    “Rest” below). If your sleep is uninterrupted, you wake up naturally whenever you choose after you fall asleep. 
    */

    // Vulnerable
    effectsDataList.push(_buildBaseAffliction(
      'Vulnerable',
      '/systems/weirdwizard/assets/icons/broken-shield.svg',
      [].concat(againstAll(1))
    ));

    // Weakened
    effectsDataList.push(_buildBaseAffliction(
      'Weakened',
      '/systems/weirdwizard/assets/icons/back-pain.svg',
      [
        addEffect('banes.str', 1, addPriority),
        addEffect('banes.agi', 1, addPriority),
        addEffect('boonsAgainst.str', 1, addPriority),
        addEffect('boonsAgainst.agi', 1, addPriority),
        overrideEffect('speed.halved', true, addPriority)
      ]
    ));

    // ----------------------- ACTIONS -------------------------- //
    /*
    // Concentrate
    effectsDataList.push(_buildBaseAffliction('concentrate', 'systems/weirdwizard/assets/icons/effects/concentrate.svg'));

    // Defend
    effectsDataList.push(
      _buildBaseAffliction('defend', 'systems/weirdwizard/assets/icons/effects/defend.svg', [
        addEffect('system.bonuses.defense.boons.defense', 1, addPriority),
        addEffect('system.bonuses.defense.boons.strength', 1, addPriority),
        addEffect('system.bonuses.defense.boons.agility', 1, addPriority),
        addEffect('system.bonuses.defense.boons.will', 1, addPriority),
        addEffect('system.bonuses.defense.boons.intellect', 1, addPriority),
        addEffect('system.bonuses.defense.boons.perception', 1, addPriority),
        // TODO: Auto disable when Dazed, Stunned or Unconscious
      ]),
    );

    // Help
    effectsDataList.push(
      _buildBaseAffliction(
        'help',
        'systems/weirdwizard/assets/icons/effects/help.svg',
        [], // TODO: Add boons? Aka help should be applied to the receiver
      ),
    );

    // Prepare
    effectsDataList.push(
      _buildBaseAffliction('prepare', 'systems/weirdwizard/assets/icons/effects/prepare.svg', [
        addEffect('system.bonuses.challenge.boons.strength', 1, addPriority),
        addEffect('system.bonuses.challenge.boons.agility', 1, addPriority),
        addEffect('system.bonuses.challenge.boons.intellect', 1, addPriority),
        addEffect('system.bonuses.challenge.boons.will', 1, addPriority),
        addEffect('system.bonuses.challenge.boons.perception', 1, addPriority),
        addEffect('system.bonuses.attack.boons.strength', 1, addPriority),
        addEffect('system.bonuses.attack.boons.agility', 1, addPriority),
        addEffect('system.bonuses.attack.boons.intellect', 1, addPriority),
        addEffect('system.bonuses.attack.boons.will', 1, addPriority),
        addEffect('system.bonuses.attack.boons.perception', 1, addPriority),
      ]),
    );

    // Reload
    effectsDataList.push(_buildBaseAffliction('reload', 'systems/weirdwizard/assets/icons/effects/reload.svg'));

    // Retreat
    effectsDataList.push(_buildBaseAffliction('retreat', 'systems/weirdwizard/assets/icons/effects/retreat.svg'));

    // Rush
    effectsDataList.push(_buildBaseAffliction('rush', 'systems/weirdwizard/assets/icons/effects/rush.svg'));

    // Stabilize
    effectsDataList.push(_buildBaseAffliction('stabilize', 'systems/weirdwizard/assets/icons/effects/stabilize.svg'));

    // ----------------------- DAMAGE EFFECTS -------------------------- //

    // Injured
    effectsDataList.push(_buildBaseAffliction('injured', 'icons/svg/blood.svg'));

    // Incapacitated
    effectsDataList.push(
      _buildBaseAffliction('incapacitated', 'systems/weirdwizard/assets/icons/effects/incapacitated.svg'),
    );

    // Disabled
    effectsDataList.push(_buildBaseAffliction('disabled', 'systems/weirdwizard/assets/icons/effects/disabled.svg', [], {'core.overlay': true}));

    // Dying
    effectsDataList.push(_buildBaseAffliction('dying', 'systems/weirdwizard/assets/icons/effects/dying.svg', [], {'core.overlay': true}));
    */

    return effectsDataList
  }
}