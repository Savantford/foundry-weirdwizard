import { effChanges } from '../../helpers/effect-options.mjs'
import { formatTime } from '../../helpers/utils.mjs';

export default class WWActiveEffectConfig extends ActiveEffectConfig {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['sheet', 'active-effect-sheet'],
      template: 'systems/weirdwizard/templates/configs/active-effect-config.hbs',
      width: 580,
      height: 'auto',
      submitOnChange: true,
      closeOnSubmit: false,
      tabs: [{ navSelector: '.tabs', contentSelector: 'form', initial: 'details' }],
    })
  }

  /** @override */
  async getData(options={}) {

    const doc = this.document;

    const data = {
      effect: doc,
      system: doc.system,
      triggers: doc.isTemporary ? CONFIG.WW.INSTANT_TRIGGERS : CONFIG.WW.EFFECT_TRIGGERS, // Use instant triggers if effect has a duration
      targets: CONFIG.WW.EFFECT_TARGETS,
      isActorEffect: doc.parent.documentName === 'Actor',
      isItemEffect: doc.parent.documentName === 'Item',
      submitText: 'EFFECT.Submit',
      modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
        obj[e[1]] = game.i18n.localize(`EFFECT.MODE_${e[0]}`);
        return obj;
      }, {})
      
    };

    const context = foundry.utils.mergeObject(await super.getData(options), data);

    // Prepare durationSelect dropdown
    context.durationOptions = CONFIG.WW.EFFECT_DURATIONS;

    // Pass down durations to display
    context.formattedStartTime = formatTime(doc.duration.startTime,1);

    // Prepare Effect Options to display on key dropdown menu
    const optionsObj = foundry.utils.deepClone(CONFIG.WW.EFFECT_OPTIONS);
    
    for (const [key, value] of Object.entries(optionsObj)) {
      optionsObj[key].options = Object.entries(optionsObj[key].options).reduce((all,[k,data]) => { all[k] = data.label; return all; }, {});
    }
    
    context.effOptions = optionsObj;
    
    // Pass down the value type
    let i = 0;

    for (const c of context.data.changes) {
      const change = c.key.split('.').reduce((o, i) => o[i], effChanges);
      
      context.data.changes[i] = {
        ...c,
        ...change
      }

      i++;
    }
    
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Update dropdown selections
    html.find('.key > select').change((ev) => this._updateValueInput(ev, this.document));
    html.find('select.duration-selection').change((ev) => this.submit({preventClose: true}).then(() => this.render()));

    // Close window when Submit is clicked
    html.find('button[type=submit]').click((ev) => this.close());

  }

  async _updateObject(event, formData) { // Update actor data.
    const sysDur = formData.system.duration;
    switch (formData.system.duration.selected) {
      case 'minutes': formData.duration = { seconds: sysDur.inMinutes ? sysDur.inMinutes * 60 : 60, rounds: null }; break;
      case 'hours': formData.duration = { seconds: sysDur.inHours ? sysDur.inHours * 3600 : 3600, rounds: null }; break;
      case 'days': formData.duration = { seconds: sysDur.inDays ? sysDur.inDays * 3600*24 : 3600*24, rounds: null }; break;
      case 'none': formData.duration = { seconds: null, rounds: null }; break;
    }

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

    return super._updateObject(event, formData);
  }

  // Update change.value input to reflect the corresponding change.key
  _updateValueInput(ev, doc) {
    const select = ev.currentTarget;
    const parent = ev.currentTarget.closest('.effect-change');
    const div = parent.querySelector('.value');
    let ele = parent.querySelector('.value input');
    
    const valueRef = select.value.split('.').reduce((o, i) => o[i], effChanges);
    const valueType = valueRef?.valueType ?? '';
    ele.remove();
    
    if (valueType === "int") {
      if (isNaN(ele.value) || !ele.value) ele.value = 0;
      ele = '<input type="number" name="' + ele.name + '" value="' + ele.value + '" min="0"/>';
    } else if (valueType === "str") {
      ele = '<input type="text" name="' + ele.name + '" value="' + ele.value + '"/>';
    } else if (valueType === "boo") {
      ele = '<input type="checkbox" name="' + ele.name + '" checked>'
    } else {
      ele = '<input style="display: none;" type="text" name="' + ele.name + '" value="' + ele.value + '"/>';
    }

    div.insertAdjacentHTML('beforeend', ele);
  }

  /**
   * Handle adding a new change to the changes array.
   * @private
   */
  async _updateDurationSelect() {
    return this.submit({preventClose: true, updateData: {
      ['systemm.duration.selected']: {key: "", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: ""}
    }});
  }

  /* Initialization functions */

  static initializeChangeKeys() {
    const refObj = CONFIG.WW.EFFECT_OPTIONS;
    let obj = {};
    
    for (const [key, value] of Object.entries(refObj)) {
      obj = {
        ...obj,
        ...Object.entries(value.options).reduce((all,[k,data]) => { all[k] = data.key; return all;}, {}
        )
      }
    }

    CONFIG.WW.EFFECT_CHANGE_KEYS = obj;
  }
  
  static initializeRealChangeKeys() {
    const refObj = CONFIG.WW.EFFECT_OPTIONS;
    let obj = {};
    
    for (const [key, value] of Object.entries(refObj)) {
      obj = {
        ...obj,
        ...Object.entries(value.options).reduce((all,[k,data]) => { all[k] = data.key; return all;}, {}
        )
      }
    }
    
    CONFIG.WW.EFFECT_CHANGE_KEYS = obj;
  }

  static initializeChangeLabels() {
    const refObj = CONFIG.WW.EFFECT_OPTIONS;
    let obj = {};
    
    for (const [key, value] of Object.entries(refObj)) {
      obj = {
        ...obj,
        ...Object.entries(value.options).reduce((all,[k,data]) => { all[k] = data.label; return all;}, {}
        )
      }
    }

    CONFIG.WW.EFFECT_CHANGE_LABELS = obj;
  }

}


