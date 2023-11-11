export default class InstantEffectConfig extends FormApplication {
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "health-details";
    options.template = "systems/weirdwizard/templates/apps/instant-effect-config.hbs";
    options.height = "auto";
    options.width = 400;
    options.title = "Instant Effect Details";

    return options;
  }

  constructor(item, effectId, options={}) {
    const effect = effectId ? item.system.instant[effectId] : null;
    super(effect, options);

    this.item = item;
    this.effectId = effectId;
    this.effect = effect;
    this.label = null;
  }

  /* -------------------------------------------- */

  async getData(options = {}) {
    const context = super.getData();

    const eff = this.effect;
    context.trigger = eff?.trigger;
    context.target = eff?.target;
    context.value = eff?.value;
    context.affliction = eff?.affliction;

    context.labels = CONFIG.WW.instantLabels;
    context.triggers = CONFIG.WW.instantTriggers;
    context.targets = CONFIG.WW.effectTargets;
    context.afflictions = CONFIG.WW.bestowAfflictions;

    // Pass down the dynamic label
    if (!this.label) this.label = eff?.label;
    context.label = this.label;
    
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Update the dynamic label
    html.find('select[name=label]').change(ev => {
      this.label = ev.currentTarget.value;
      this.render();
    });

  }

  /* -------------------------------------------- */

  async _updateObject(event, formData) { // Update item data.
    
    let arr = this.item.system.instant;

    // Get formData and define the undefined properties
    const newData = formData;
    if (!newData.value) newData.value = '';
    if (!newData.affliction) newData.affliction = '';

    arr[this.effectId] = newData;
    
    this.item.update({ 'system.instant': arr });
  }
}

