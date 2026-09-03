import { dataFromLabel } from '../sidebar/chat-html-templates.mjs';

export default class WWRoll extends Roll {
  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /**
   * Render a Roll instance to HTML
   * @override
   * @param {object} [options={}]               Options which affect how the Roll is rendered
   * @param {string} [options.flavor]             Flavor text to include
   * @param {string} [options.template]           A custom HTML template path
   * @param {boolean} [options.isPrivate=false]   Is the Roll displayed privately?
   * @returns {Promise<string>}                 The rendered HTML template as a string
   */
  
  async render({flavor, template=this.constructor.CHAT_TEMPLATE, isPrivate=false}={}) {
    if ( !this._evaluated ) await this.evaluate();

    const { outcome, outcomeLabel, isOutcomePositive, isForcedOutcome } = this;
    const outcomeData = { outcome, outcomeLabel, isOutcomePositive, isForcedOutcome };
    
    const attribute = this.options.attribute;
    const against = this.options.against;
    
    const chatData = {
      ...outcomeData,
      isPrivate: isPrivate,
      formula: isPrivate ? "???" : this._formula,
      flavor: isPrivate ? null : flavor,
      user: game.user.id,
      target: await this.options.target,
      tooltip: isPrivate ? "" : await this.getTooltip(),
      total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
      targetNo: isPrivate ? "?" : this.options.targetNo,
      attributeLabel: isPrivate ? null : (attribute ? _loc(CONFIG.WW.ROLL_ATTRIBUTES[attribute]) : null),
      attributeImg: isPrivate ? null : (attribute ? CONFIG.WW.ATTRIBUTE_ICONS[attribute] : null),
      againstLabel: isPrivate ? null : (against ? _loc(CONFIG.WW.ROLL_AGAINST[against]) : null),
      againstImg: isPrivate ? null : (against ? CONFIG.WW.ATTRIBUTE_ICONS[against] : null),
      terms: await this.terms,
      originUuid: isPrivate ? null : this.options.originUuid,
      instEffs: isPrivate ? null : await this.instEffs,
      actEffs: isPrivate ? null : await this.actEffs,
      applyButtons: isPrivate ? null : this.applyButtons
    }

    // Template with legacy support
    if (this.options?.template) template = this.options.template;
    template = template.replace('sidebar/r', 'sidebar/chat/');
    template = template.replace('templates/chat/', 'templates/sidebar/chat/');

    return foundry.applications.handlebars.renderTemplate(template, chatData);
  }
  
  /* -------------------------------------------- */

  get actEffs() {
    const effCats = this.options.actEffs;
    
    if (!effCats || Object.values(effCats).flat().every(el => el.length === 0)) return null;

    //const targetIds = _getTargetIds(targets, e.target);
    
    for (const trigger in effCats) {
      const effects = effCats[trigger];
      
      for (const e in effects) {
        effects[e] = {
          ...effects[e],
          ...{
            action: 'applyEffect'
            /*targetIds: targetIds*/
          }
        };
      }
    }

    return effCats;
  }

  /* -------------------------------------------- */

  get applyButtons() {
    const dataset = this.options.dataset;
    
    if (!dataset) return null;

    const buttons = [];
    
    switch (dataset.action) {

      case 'applyHealthLoss': {
        const actions = ['applyHealthLoss', 'applyHealthRegain'];

        actions.forEach(a => {
          buttons.push({
            ...dataset,
            ...dataFromLabel(a)
          });
        })
        
      }; break;

      case 'applyHealthRegain': {
        const actions = ['applyHealthRegain'];

        actions.forEach(a => {
          buttons.push({
            ...dataset,
            ...dataFromLabel(a)
          });
        })
        
      }; break;

      case 'applyHealing': {
        const actions = ['applyHealing'];

        actions.forEach(a => {
          buttons.push({
            ...dataset,
            ...dataFromLabel(a)
          });
        })
        
      }; break;

      default: {
        const actions = ['applyDamage', 'applyDamageHalf', 'applyDamageDouble', 'applyHealing'];
        
        actions.forEach(a => {
          buttons.push({
            ...dataset,
            ...dataFromLabel(a)
          });
        })
      }; break;
        
    }
    
    return buttons;
  }

  /* -------------------------------------------- */

  // Get target ids string
  _getTargetIds(targets, effTarget) {
    let targetIds = '';

    targets.forEach(t => {
      if (targetIds) targetIds += ',';

      targetIds += t.id;
    })

    return targetIds;
  }

  /* -------------------------------------------- */
  /*  Roll details                                */
  /* -------------------------------------------- */

  get targetNo() {
    return this.options.targetNo ?? 10;
  }

  /** 
   * Get final outcome of the roll: Failure, Success, Critical Failure or Critical Failure.
  */
  get outcome() {
    // Return nothing if there is no target number
    if (!this.targetNo) return null;

    // Determine outcome
    if (this.forcedOutcome) return this.forcedOutcome;

    if (this.isCriticalSuccess) return 'critSuccess';
    else if (this.isCriticalFailure) return 'critFailure';
    else if (this.isSuccess) return 'success';
    else return 'failure';
  }

  get outcomeLabel() {
    return CONFIG.WW.ROLL_OUTCOME_LABELS[this.outcome] ?? null;
  }

  get forcedOutcome() {
    const opt = this.options;

    if (opt.forcedOutcome) return opt.forcedOutcome;
    if (opt.autoSuccess) return 'success';
    if (opt.autoFailure?.[opt.attribute]) return 'failure';
    return null;
  }

  get isForcedOutcome() {
    return !!this.forcedOutcome;
  }

  /* -------------------------------------------- */

  get isCriticalSuccess() {
    return this.total >= 20 && this.total >= this.targetNo + 5;
  }

  get isCriticalFailure() {
    return this.total <= 0;
  }

  get isSuccess() {
    return this.total >= this.targetNo;
  }

  get isFailure() {
    return this.total < this.targetNo;
  }

  get isOutcomePositive() {
    if (this.outcome.toLowerCase().includes('success') ) return true;
    return false;
  }

  /* -------------------------------------------- */

  get instEffs() {
    const effCats = this.options.instEffs;
    
    if (!effCats || Object.values(effCats).flat().every(el => el.length === 0)) return null;
    
    for (const trigger in effCats) {
      const effects = effCats[trigger];
      
      for (const e in effects) {
        effects[e] = {
          ...effects[e],
          ...dataFromLabel(effects[e].label)
        };
      }
    }

    return effCats;
  }

}