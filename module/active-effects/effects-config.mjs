import { i18n } from '../helpers/utils.mjs'

export class WWActiveEffectConfig extends ActiveEffectConfig {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['sheet', 'active-effect-sheet'],
      template: 'systems/weirdwizard/templates/effects-config.hbs',
      width: 580,
      height: 'auto',
      tabs: [{ navSelector: '.tabs', contentSelector: 'form', initial: 'details' }],
    })
  }

  /** @override */
  async getData(options={}) {

    let context = await super.getData(options);

    const legacyTransfer = CONFIG.ActiveEffect.legacyTransferral;

    const labels = {
      transfer: {
        name: game.i18n.localize(`EFFECT.Transfer${legacyTransfer ? "Legacy" : ""}`),
        hint: game.i18n.localize(`EFFECT.TransferHint${legacyTransfer ? "Legacy" : ""}`)
      }
    };

    const data = {
      labels,
      effect: this.object, // Backwards compatibility
      data: this.object,
      isActorEffect: this.object.parent.documentName === "Actor",
      isItemEffect: this.object.parent.documentName === "Item",
      submitText: "EFFECT.Submit",
      modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
        obj[e[1]] = game.i18n.localize(`EFFECT.MODE_${e[0]}`);
        return obj;
      }, {})
      
    };

    context = foundry.utils.mergeObject(context, data);

    context.descriptionHTML = await TextEditor.enrichHTML(this.object.description, {async: true, secrets: this.object.isOwner});
    context.availableChangeKeys = await WWActiveEffectConfig._availableChangeKeys;

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html)
    // Change the duration in rounds based on seconds and vice-versa
    // const inputSeconds = html.find('input[name="duration.seconds"]')
    // const inputRounds = html.find('input[name="duration.rounds"]')
    // inputSeconds.change(_ => inputRounds.val(Math.floor(inputSeconds.val() / 10)))
    // inputRounds.change(_ => inputSeconds.val(inputRounds.val() * 10))
  }

  static initializeChangeKeys() {
    WWActiveEffectConfig._availableChangeKeys = {
      // <key> : <name>
      // No change
      '': '-',

      // Boons and Banes
      'system.boons.attributes.str.global': i18n('WW.Strength') + ': ' + i18n('WW.Boons.Or'),
      'system.boons.attributes.agi.global': i18n('WW.Agility') + ': ' + i18n('WW.Boons.Or'),
      'system.boons.attributes.int.global': i18n('WW.Intellect') + ': ' + i18n('WW.Boons.Or'),
      'system.boons.attributes.wil.global': i18n('WW.Will') + ': ' + i18n('WW.Boons.Or'),
      'system.boons.attributes.luck.global': i18n('WW.Luck') + ': ' + i18n('WW.Boons.Or'),
      'system.boons.attacks.global': i18n('WW.Attacks') + ': ' + i18n('WW.Boons.Or'),
      
      //  Defense
      'system.stats.defense.total': i18n('WW.Defense.Score'),
      'system.stats.defense.natural': i18n('WW.Defense.Natural'),
      /*'stats.defense.armor': i18n('WW.'),
      'system.stats.defense.bonuses': i18n('WW.Defense.Bonus'),*/

      // Health
      'system.stats.health.total': i18n('WW.Health.Score'),
      /*'stats.health.starting': i18n('WW.'),
      'stats.health.novice': i18n('WW.'),
      'stats.health.expert': i18n('WW.'),
      'stats.health.master': i18n('WW.'),
      'stats.health.bonus': i18n('WW.'),
      'stats.health.lost': i18n('WW.'),*/

      // Damage
      /*'stats.damage.value': i18n('WW.Damage'),
      'stats.damage.max': i18n('WW.'),*/

      // Stats
      /*'stats.level': i18n('WW.'),
      'stats.size': i18n('WW.'),*/
      'system.stats.speed.value': i18n('WW.SpeedScore'),
      /*'stats.speed.special': i18n('WW.'),
      'stats.bonusdamage': i18n('WW.'),*/

      // Attributes
      'system.attributes.str.value': i18n('WW.StrengthScore'),
      'system.attributes.agi.value': i18n('WW.AgilityScore'),
      'system.attributes.int.value': i18n('WW.IntellectScore'),
      'system.attributes.wil.value': i18n('WW.WillScore'),

      // Details
      /*'details.type': i18n('WW.'),
      'details.senses': i18n('WW.'),
      'details.languages': i18n('WW.'),
      'details.immune': i18n('WW.'),
      'details.ancestry': i18n('WW.'),
      'details.novice': i18n('WW.'),
      'details.expert': i18n('WW.'),
      'details.master': i18n('WW.'),
      'details.features.value': i18n('WW.'),
      'details.personality.value': i18n('WW.'),
      'details.belief.value': i18n('WW.'),
      'details.professions': i18n('WW.'),
      'details.information.value': i18n('WW.'),
      'details.bg_ancestry.value': i18n('WW.'),
      'details.deeds.value': i18n('WW.'),
      'details.reputation': i18n('WW.'),
      'details.traditions': i18n('WW.'),
      'description.value': i18n('WW.'),*/

      // Currency
      /*'currency.gp': i18n('WW.'),
      'currency.sp': i18n('WW.'),
      'currency.cp': i18n('WW.'*/
    }

    // Save the keys-labels object in the CONFIG constant
    CONFIG.WW.effectChangeKeys = WWActiveEffectConfig._availableChangeKeys;
  }
}