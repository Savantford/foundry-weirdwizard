import { i18n, capitalize } from '../helpers/utils.mjs'
import { effChanges } from './effect-options.mjs'

export default class WWActiveEffectConfig extends ActiveEffectConfig {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['sheet', 'active-effect-sheet'],
      template: 'systems/weirdwizard/templates/apps/active-effect-config.hbs',
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
        name: game.i18n.localize(`EFFECT.Transfer${legacyTransfer ? 'Legacy' : ''}`),
        hint: game.i18n.localize(`EFFECT.TransferHint${legacyTransfer ? 'Legacy' : ''}`)
      }
    };

    const data = {
      labels,
      effect: this.document, // Backwards compatibility
      data: this.document,
      trigger: this.document.trigger,
      target: this.document.target,
      triggers: CONFIG.WW.effectTriggers,
      targets: CONFIG.WW.effectTargets,
      isActorEffect: this.document.parent.documentName === 'Actor',
      isItemEffect: this.document.parent.documentName === 'Item',
      submitText: 'EFFECT.Submit',
      modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
        obj[e[1]] = game.i18n.localize(`EFFECT.MODE_${e[0]}`);
        return obj;
      }, {})
      
    };

    context = foundry.utils.mergeObject(context, data);

    context.descriptionHTML = await TextEditor.enrichHTML(this.document.description, {async: true, secrets: this.document.isOwner});

    // Prepare Effect Options to display on key dropdown menu
    const optionsObj = deepClone(CONFIG.WW.effOptions);
    
    for (const [key, value] of Object.entries(optionsObj)) {
      optionsObj[key].options = Object.entries(optionsObj[key].options).reduce((all,[k,data]) => { all[k] = data.label; return all; }, {});
    }
    
    context.effOptions = optionsObj;

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html)
    // Change the duration in rounds based on seconds and vice-versa
    // const inputSeconds = html.find('input[name='duration.seconds']')
    // const inputRounds = html.find('input[name='duration.rounds']')
    // inputSeconds.change(_ => inputRounds.val(Math.floor(inputSeconds.val() / 10)))
    // inputRounds.change(_ => inputSeconds.val(inputRounds.val() * 10))
  }

  async _updateObject(event, formData) { // Update actor data.
    super._updateObject(event, formData)

    // Set needed flags
    this.document.setFlag('weirdwizard', 'trigger', formData.trigger)
    this.document.setFlag('weirdwizard', 'target', formData.target)

    // Prepare custom mode change data
    const changes = formData.changes;
    let altChanges = [];
    
    changes.forEach(c => {
      const change = c.key.split('.').reduce((o, i) => o[i], effChanges);
      
      c = {
        ...c,
        ...change
      }

      delete c.valueLabel;
      delete c.valueType;

      altChanges.push(c)
      
    })

    // Assign to formData
    formData.changes = altChanges;
  }

  static initializeRealChangeKeys() {
    const refObj = CONFIG.WW.effOptions;
    let obj = {};
    
    for (const [key, value] of Object.entries(refObj)) {
      console.log(refObj[key])
      console.log(value)
      obj = {
        ...obj,
        ...Object.entries(value.options).reduce((all,[k,data]) => { all[k] = data.key; return all;}, {}
        )
      }
    }
    
    CONFIG.WW.effectChangeKeys = obj;
  }

  get realChangeKeys() {
    
  }

  static initializeChangeLabels() {
    const refObj = CONFIG.WW.effOptions;
    let obj = {};
    
    for (const [key, value] of Object.entries(refObj)) {
      obj = {
        ...obj,
        ...Object.entries(value.options).reduce((all,[k,data]) => { all[k] = data.label; return all;}, {}
        )
      }
    }

    CONFIG.WW.effectChangeLabels = obj;
  }
    
  static initializeChangeKeys() {
    const refObj = CONFIG.WW.effOptions;
    let obj = {};
    
    for (const [key, value] of Object.entries(refObj)) {
      obj = {
        ...obj,
        ...Object.entries(value.options).reduce((all,[k,data]) => { all[k] = data.key; return all;}, {}
        )
      }
    }

    CONFIG.WW.effectChangeKeys = obj;
  }

  static initializeChangePriorities() {
    WWActiveEffectConfig._availableChangePriorities = {
      // value : <name>
      // Default
      null: i18n('WW.Effect.Priority.Auto'),

      // Constant Priorities
      0: '0: ' + i18n('WW.Effect.Priority.0'),
      1: '1: ' + i18n('WW.Effect.Priority.1'),
      10: '10: ' + i18n('WW.Effect.Priority.10'),
      20: '20: ' + i18n('WW.Effect.Priority.20'),
      30: '30: ' + i18n('WW.Effect.Priority.30'),
      40: '40: ' + i18n('WW.Effect.Priority.40'),
      50: '50: ' + i18n('WW.Effect.Priority.50')
    }

    // Save the keys-labels object in the CONFIG constant
    CONFIG.WW.effectChangePriorities = WWActiveEffectConfig._availableChangePriorities;
  }

}


