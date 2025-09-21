import { getEffectChangeMeta } from '../../helpers/effect-options.mjs'

export default class WWActiveEffectConfig extends ActiveEffectConfig {

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    // classes: ["weirdwizard"],
    position: { width: 580 },
    form: {
      closeOnSubmit: false,
      submitOnChange: true,
    }
  }

  /** @inheritdoc */
  static PARTS = {
    ...super.PARTS,
    
    changes: {
      template: "systems/weirdwizard/templates/configs/active-effect-config/changes.hbs",
      scrollable: ["ol[data-changes]"],
    }
  }

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    // context.buttons = [
    //   {type: "submit", icon: "fa-solid fa-floppy-disk", label: "EFFECT.Submit", action: "close"},
    // ];
    return context;
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context) {
    const partContext = await super._preparePartContext(partId, context);
    if ( partId in partContext.tabs ) partContext.tab = partContext.tabs[partId];

    switch (partId) {
      case 'changes': {
        partContext.effectChangeOptions = CONFIG.WW.EFFECT_OPTIONS;
        partContext.source.changes = partContext.source.changes.map(change => {
          change.valueType = getEffectChangeMeta(change.key)?.valueType ?? 'str';
          return change
        })
      } break;
    }

    return context;
  }

  /** @inheritDoc */
  async _processSubmitData(event, form, submitData, options={}) {
    console.debug("WWActiveEffectConfig | _processSubmitData", {event, form, submitData, options});
    // if (submitData?.changes) {
    //   submitData.changes.mode = getEffectChangeMeta(submitData.changes.key)?.mode ?? CONST.ACTIVE_EFFECT_MODES.ADD;
    //   submitData.changes.priority = getEffectChangeMeta(submitData.changes.key)?.priority ?? null;
    // }
    return super._processSubmitData(event, form, submitData, options);
  }

  /** @override */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);

    // Re-submit the form if a change key is changed to update the value input type
    if (event.target instanceof HTMLSelectElement && event.target.name.endsWith(".key")) {
      this.submit({ preventClose: true });
    }
  }

  //// OLD STUFF BELOW FROM V12 / APPV1 VERSION, DELETE BEFORE PR ////

  // /** @inheritDoc */
  // async _prepareContext(options) {
  //   const doc = this.document;

  //   const data = {
  //     effect: doc,
  //     system: doc.system,
  //     triggers: doc.isTemporary ? CONFIG.WW.INSTANT_TRIGGERS : CONFIG.WW.EFFECT_TRIGGERS, // Use instant triggers if effect has a duration
  //     targets: CONFIG.WW.EFFECT_TARGETS,
  //     isActorEffect: doc.parent.documentName === 'Actor',
  //     isItemEffect: doc.parent.documentName === 'Item',
  //     submitText: 'EFFECT.Submit',
  //     modes: Object.entries(CONST.ACTIVE_EFFECT_MODES).reduce((obj, e) => {
  //       obj[e[1]] = game.i18n.localize(`EFFECT.MODE_${e[0]}`);
  //       return obj;
  //     }, {})
  //   };

  //   const context = foundry.utils.mergeObject(await super.getData(options), data);

  //   // Prepare durationSelect dropdown
  //   context.durationOptions = CONFIG.WW.EFFECT_DURATIONS;

  //   // Pass down durations to display
  //   context.formattedStartTime = formatTime(doc.duration.startTime,1);

  //   // Prepare Effect Options to display on key dropdown menu
  //   const optionsObj = foundry.utils.deepClone(CONFIG.WW.EFFECT_OPTIONS);
    
  //   for (const [key, value] of Object.entries(optionsObj)) {
  //     optionsObj[key].options = Object.entries(optionsObj[key].options).reduce((all,[k,data]) => { all[k] = data.label; return all; }, {});
  //   }
    
  //   context.effOptions = optionsObj;
    
  //   // Pass down the value type
  //   let i = 0;

  //   for (const c of context.data.changes) {
  //     const change = c.key.split('.').reduce((o, i) => o[i], effChanges);
      
  //     context.data.changes[i] = {
  //       ...c,
  //       ...change
  //     }

  //     i++;
  //   }
    
  //   return context;
  // }

  // activateListeners(html) {
  //   super.activateListeners(html);

  //   // Update dropdown selections
  //   html.find('.key > select').change((ev) => this._updateValueInput(ev, this.document));
  //   html.find('select.duration-selection').change((ev) => this.submit({preventClose: true}).then(() => this.render()));

  //   // Close window when Submit is clicked
  //   html.find('button[type=submit]').click((ev) => this.close());

  // }

  // async _updateObject(event, formData) { // Update actor data.
  //   const sysDur = formData.system.duration;
  //   switch (formData.system.duration.selected) {
  //     case 'minutes': formData.duration = { seconds: sysDur.inMinutes ? sysDur.inMinutes * 60 : 60, rounds: null }; break;
  //     case 'hours': formData.duration = { seconds: sysDur.inHours ? sysDur.inHours * 3600 : 3600, rounds: null }; break;
  //     case 'days': formData.duration = { seconds: sysDur.inDays ? sysDur.inDays * 3600*24 : 3600*24, rounds: null }; break;
  //     case 'none': formData.duration = { seconds: null, rounds: null }; break;
  //   }

  //   // Prepare custom mode change data
  //   const changes = formData.changes;
  //   let altChanges = [];
    
  //   changes.forEach(c => {
      
  //     const change = c.key.split('.').reduce((o, i) => o[i], effChanges);
      
  //     c = {
  //       ...c,
  //       ...change
  //     }

  //     delete c.valueLabel;
  //     delete c.valueType;

  //     altChanges.push(c)
      
  //   })

  //   // Assign to formData
  //   formData.changes = altChanges;

  //   return super._updateObject(event, formData);
  // }

  // // Update change.value input to reflect the corresponding change.key
  // _updateValueInput(ev, doc) {
  //   const select = ev.currentTarget;
  //   const parent = ev.currentTarget.closest('.effect-change');
  //   const div = parent.querySelector('.value');
  //   let ele = parent.querySelector('.value input');
    
  //   const valueRef = select.value.split('.').reduce((o, i) => o[i], effChanges);
  //   const valueType = valueRef?.valueType ?? '';
  //   ele.remove();
    
  //   if (valueType === "int") {
  //     if (isNaN(ele.value) || !ele.value) ele.value = 0;
  //     ele = '<input type="number" name="' + ele.name + '" value="' + ele.value + '" min="0"/>';
  //   } else if (valueType === "str") {
  //     ele = '<input type="text" name="' + ele.name + '" value="' + ele.value + '"/>';
  //   } else if (valueType === "boo") {
  //     ele = '<input type="checkbox" name="' + ele.name + '" checked>'
  //   } else {
  //     ele = '<input style="display: none;" type="text" name="' + ele.name + '" value="' + ele.value + '"/>';
  //   }

  //   div.insertAdjacentHTML('beforeend', ele);
  // }

  // /**
  //  * Handle adding a new change to the changes array.
  //  * @private
  //  */
  // async _updateDurationSelect() {
  //   return this.submit({preventClose: true, updateData: {
  //     ['systemm.duration.selected']: {key: "", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: ""}
  //   }});
  // }

}


