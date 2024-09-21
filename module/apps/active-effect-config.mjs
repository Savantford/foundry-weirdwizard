import { effChanges } from '../helpers/effect-options.mjs'
import { formatTime } from '../helpers/utils.mjs';

export default class WWActiveEffectConfig extends ActiveEffectConfig {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['sheet', 'active-effect-sheet'],
      template: 'systems/weirdwizard/templates/apps/active-effect-config.hbs',
      width: 580,
      height: 'auto',
      submitOnChange: true,
      closeOnSubmit: false,
      tabs: [{ navSelector: '.tabs', contentSelector: 'form', initial: 'details' }],
    })
  }

  /** @override */
  async getData(options={}) {

    let context = await super.getData(options);

    const doc = this.document;

    const data = {
      //labels,
      effect: doc, // Backwards compatibility
      data: doc,
      trigger: doc.trigger,
      target: doc.target,
      triggers: (doc.duration.rounds || doc.duration.seconds) ? CONFIG.WW.INSTANT_TRIGGERS : CONFIG.WW.EFFECT_TRIGGERS, // Use instant triggers if effect has a duration
      targets: CONFIG.WW.EFFECT_TARGETS,
      isActorEffect: doc.parent.documentName === 'Actor',
      isItemEffect: doc.parent.documentName === 'Item',
      submitText: 'EFFECT.Submit',
      modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
        obj[e[1]] = game.i18n.localize(`EFFECT.MODE_${e[0]}`);
        return obj;
      }, {})
      
    };

    context = foundry.utils.mergeObject(context, data);

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
    // Change the duration in rounds based on seconds and vice-versa
    // const inputSeconds = html.find('input[name='duration.seconds']')
    // const inputRounds = html.find('input[name='duration.rounds']')
    // inputSeconds.change(_ => inputRounds.val(Math.floor(inputSeconds.val() / 10)))
    // inputRounds.change(_ => inputSeconds.val(inputRounds.val() * 10))
    
    html.find('.key > select').change((ev) => this._updateValueInput(ev, this.document));
    html.find('select[name=selectedDuration]').change((ev) => this._updateDurationProperties(ev, this.document));

    // Close window when Submit is clicked
    html.find('button[type=submit]').click((ev) => this.close());

  }

  async _updateObject(event, formData) { // Update actor data.
    super._updateObject(event, formData); // Triggering an infinite loop

    /*const wwflags = this.flags.weirdwizard;

    // Set external flag if it does not exist. Must have a non-passive trigger flag set and a different parent UUID
    if (!wwflags?.external && wwflags?.trigger != 'passive' && this.origin && !this.origin.includes(this.parent.uuid)) {
      this.setFlag('weirdwizard', 'external', true)
    }*/

    // Set needed flags
    formData.flags = {
      weirdwizard: {
        'trigger': formData.trigger,
        'target': formData.target,
        'selectedDuration': formData.selectedDuration ? formData.selectedDuration : '',
        'autoDelete': formData.autoDelete ? formData.autoDelete : true,
        'durationInMinutes': formData.durationInMinutes,
        'durationInHours': formData.durationInHours,
        'durationInDays': formData.durationInDays
      }
    }

    switch (formData.selectedDuration) {
      case 'minutes': formData.duration = { seconds: formData.durationInMinutes * 3600 }; break;
      case 'hours': formData.duration = { seconds: formData.durationInHours * 3600 }; break;
      case 'days': formData.duration = { seconds: formData.durationInDays * 3600*24 }; break;
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
  }

  // Update change.value input to reflect the corresponding change.key
  _updateValueInput(ev, doc) {
    const select = ev.currentTarget;
    const parent = ev.currentTarget.closest('.effect-change');
    const div = parent.querySelector('.value');
    let ele = parent.querySelector('.value input');
    
    const valueRef = select.value.split('.').reduce((o, i) => o[i], effChanges);
    const valueType = valueRef ? valueRef.valueType : '';
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

  // Update duration properties according to the selectedDuration dropdown value
  _updateDurationProperties(ev, doc) {
    const select = ev.currentTarget;
    const parent = ev.currentTarget.closest('section [data-tab=duration]');

    // Set Flag
    doc.setFlag('weirdwizard', 'selectedDuration', select.value)

    // Check the selected value and set duration values
    switch (select.value) {
      case '': {
        doc.update({ 'duration.rounds': null, 'duration.seconds': null });
      }; break;

      case 'luckEnds': doc.update({ 'duration.rounds': 1337, 'duration.seconds': null }); break;

      case '1round': doc.update({ 'duration.rounds': 1, 'duration.seconds': null }); break;
      case '2rounds': doc.update({ 'duration.rounds': 2, 'duration.seconds': null }); break;

      case 'Xrounds': doc.update({ 'duration.rounds': 1, 'duration.seconds': null }); break;

      case 'turnEnd': doc.update({ 'duration.rounds': 1, 'duration.seconds': null }); break;
      case 'nextTriggerTurnStart': doc.update({ 'duration.rounds': 1, 'duration.seconds': null }); break;
      case 'nextTargetTurnStart': doc.update({ 'duration.rounds': 1, 'duration.seconds': null }); break;
      case 'nextTriggerTurnEnd': doc.update({ 'duration.rounds': 1, 'duration.seconds': null }); break;
      case 'nextTargetTurnEnd': doc.update({ 'duration.rounds': 1, 'duration.seconds': null }); break;

      /* World Time */
      case '1minute': doc.update({ 'duration.seconds': 60, 'duration.rounds': null }); break;

      case 'minutes': {
        doc.update({ 'duration.rounds': null });

        if (!doc.flags.weirdwizard?.durationInMinutes) {
          doc.setFlag('weirdwizard', 'durationInMinutes', 1);
          doc.update({ 'duration.seconds': 60 });
        }
      }; break;

      case 'hours': {
        doc.update({ 'duration.rounds': null });

        if (!doc.flags.weirdwizard?.durationInHours) {
          doc.setFlag('weirdwizard', 'durationInHours', 1);
          doc.update({ 'duration.seconds': 3600 });
        }
      }; break;

      case 'days': {
        doc.update({ 'duration.rounds': null });

        if (!doc.flags.weirdwizard?.durationInDays) {
          doc.setFlag('weirdwizard', 'durationInDays', 1);
          doc.update({ 'duration.seconds': 3600*24 });
        }
      }; break;
      
    }

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

  /*static initializeChangePriorities() { // No longer needed
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
  }*/

}


