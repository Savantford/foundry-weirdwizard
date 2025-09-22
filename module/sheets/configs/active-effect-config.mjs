import { getEffectChangeMeta } from '../../helpers/effect-options.mjs'

export default class WWActiveEffectConfig extends ActiveEffectConfig {

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
    
    details: {
      template: "systems/weirdwizard/templates/configs/active-effect-config/details.hbs",
    },
    changes: {
      template: "systems/weirdwizard/templates/configs/active-effect-config/changes.hbs",
      scrollable: ["ol[data-changes]"],
    }
  }

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.verticalTabs = true;
    context.buttons = [];
    return context;
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context) {
    const partContext = await super._preparePartContext(partId, context);
    if ( partId in partContext.tabs ) partContext.tab = partContext.tabs[partId];

    switch (partId) {
      case 'details': {
        partContext.triggers = CONFIG.WW.EFFECT_TRIGGERS;
        // // If effect has duration, use instant triggers since they remove "passive" option
        // // disabled due to issues with isTemporary and duration input/outputs for now
        // partContext.triggers = this.document.isTemporary 
        //   ? CONFIG.WW.INSTANT_TRIGGERS 
        //   : CONFIG.WW.EFFECT_TRIGGERS
        partContext.targets = CONFIG.WW.EFFECT_TARGETS
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

  /** @override */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);

    // Re-submit the form if a change key is changed to update the value input type
    if (event.target instanceof HTMLSelectElement && event.target.name.endsWith(".key")) {
      this.submit({ preventClose: true });
    }
  }

}


