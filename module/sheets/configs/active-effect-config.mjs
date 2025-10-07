import { getEffectChangeMeta } from '../../helpers/effect-presets.mjs';
import WWSheetMixin from '../ww-sheet.mjs';

export default class WWActiveEffectConfig extends WWSheetMixin(foundry.applications.sheets.ActiveEffectConfig) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ["weirdwizard", "sheet"],
    position: { width: 580 },
    form: {
      closeOnSubmit: false,
      submitOnChange: true,
    }
  }

  /** @inheritdoc */
  static PARTS = {
    ...super.PARTS,
    
    tabs: {
      template: 'systems/weirdwizard/templates/generic/side-tabs.hbs'
    },
    details: {
      template: "systems/weirdwizard/templates/configs/active-effect/details.hbs",
    },
    duration: {
      template: "systems/weirdwizard/templates/configs/active-effect/duration.hbs",
    },
    changes: {
      template: "systems/weirdwizard/templates/configs/active-effect/changes.hbs",
      scrollable: ["ol[data-changes]"],
    }
  }

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        {id: "details", tooltip: 'EFFECT.TABS.details', icon: "systems/weirdwizard/assets/icons/scroll-quill.svg", iconType: 'img'},
        {id: "duration", tooltip: 'EFFECT.TABS.duration', icon: "systems/weirdwizard/assets/icons/empty-hourglass.svg", iconType: 'img'},
        {id: "changes", tooltip: 'EFFECT.TABS.changes', icon: "systems/weirdwizard/assets/icons/sparkles.svg", iconType: 'img'}
      ],
      initial: "details",
      labelPrefix: "EFFECT.TABS"
    }
  };

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.buttons = [];
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _preparePartContext(partId, context) {
    const partContext = await super._preparePartContext(partId, context);
    if ( partId in partContext.tabs ) partContext.tab = partContext.tabs[partId];
    
    switch (partId) {
      case 'details': {
        partContext.triggers = CONFIG.WW.EFFECT_TRIGGERS;
        // If effect has duration, use instant triggers since they remove "passive" option
        // disabled due to issues with isTemporary and duration input/outputs for now
        partContext.triggers = this.document.isTemporary ? CONFIG.WW.INSTANT_TRIGGERS : CONFIG.WW.EFFECT_TRIGGERS;
        //partContext.targets = CONFIG.WW.EFFECT_TARGETS
      } break;
      case 'duration': {
        // Prepare durationSelect dropdown
        partContext.durationOptions = CONFIG.WW.EFFECT_DURATIONS;

        // Pass down durations to display
        partContext.formattedStartTime = game.weirdwizard.utils.formatTime(this.document.duration.startTime, 1);
      } break;
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

  /* -------------------------------------------- */
  /*  Form Submission                             */
  /* -------------------------------------------- */

  /** @override */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);

    // Re-submit the form if a change key is changed to update the value input type
    /*if (event.target instanceof HTMLSelectElement && event.target.name.endsWith(".key")) {
      this.submit({ preventClose: true });
    }*/
  }

  /* -------------------------------------------- */

  /**
   * @override
   * Submit a document update or creation request based on the processed form data.
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {object} submitData                   Processed and validated form data to be used for a document update
   * @param {Partial<DatabaseCreateOperation|DatabaseUpdateOperation>} [options] Additional options altering the request
   * @returns {Promise<void>}
   * @protected
   */
  async _processSubmitData(event, form, submitData, options={}) {
    const sysDur = submitData.system.duration;
    let inSeconds = null;
    
    if (!submitData.duration) submitData.duration = {};
    
    switch (submitData.system.duration.selected) {
      case 'minutes': 
        inSeconds = sysDur.inMinutes ? sysDur.inMinutes * 60 : 60;
        submitData.duration = { seconds: inSeconds, rounds: null };
        if (!sysDur.inMinutes) sysDur.inMinutes = 1;
      break;

      case 'hours':
        inSeconds = sysDur.inHours ? sysDur.inHours * 60*60 : 60*60;
        submitData.duration = { seconds: inSeconds, rounds: null };
        if (!sysDur.inHours) sysDur.inHours = 1;
      break;

      case 'days':
        inSeconds = sysDur.inDays ? sysDur.inDays * 60*60*24 : 60*60*24;
        submitData.duration = { seconds: inSeconds, rounds: null };
        if (!sysDur.inDays) sysDur.inDays = 1;
      break;

      case 'none':
        submitData.duration = { seconds: null, rounds: null };
      break;
    }
    
    return super._processSubmitData(event, form, submitData, options);
  }

}