import { i18n } from '../helpers/utils.mjs';
import { dataFromLabel } from '../sidebar/chat-html-templates.mjs';

export default class WWRoll extends Roll {
  
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
    
    const attribute = this.options.attribute;
    const against = this.options.against;
    
    const chatData = {
      isPrivate: isPrivate,
      formula: isPrivate ? "???" : this._formula,
      flavor: isPrivate ? null : flavor,
      user: game.user.id,
      target: await this.options.target,
      tooltip: isPrivate ? "" : await this.getTooltip(),
      total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
      targetNo: isPrivate ? "?" : this.options.targetNo,
      attributeLabel: isPrivate ? null : (attribute ? i18n(CONFIG.WW.ROLL_ATTRIBUTES[attribute]) : null),
      attributeImg: isPrivate ? null : (attribute ? CONFIG.WW.ATTRIBUTE_ICONS[attribute] : null),
      againstLabel: isPrivate ? null : (against ? i18n(CONFIG.WW.ROLL_AGAINST[against]) : null),
      againstImg: isPrivate ? null : (against ? CONFIG.WW.ATTRIBUTE_ICONS[against] : null),
      terms: await this.terms,
      originUuid: isPrivate ? null : this.options.originUuid,
      outcome: isPrivate ? null : this.outcome,
      instEffs: isPrivate ? null : await this.instEffs,
      actEffs: isPrivate ? null : await this.actEffs,
      applyButtons: isPrivate ? null : this.applyButtons
    }

    if (this.options?.template) template = this.options.template;
    template = template.replace('sidebar', 'chat');

    return renderTemplate(template, chatData);
  }

  /** 
   * Get the outcome (None, Critical, Success or Failure)
  */
  get outcome() {
    const targetNo = this.options.targetNo;

    // Return nothing if there is no target number
    if (!targetNo) return ''; 
    
    // Determine outcome
    if (this.total >= 20 && this.total >= targetNo + 5) return 'critical';  
    else if (this.total >= targetNo) return 'success';
    else return 'failure';
  }

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
            action: 'apply-effect'
            /*targetIds: targetIds*/
          }
        };
      }
    }

    return effCats;
  }

  get applyButtons() {
    const dataset = this.options.dataset;
    
    if (!dataset) return null;

    const buttons = [];
    
    switch (dataset.action) {

      case 'apply-health-loss': {
        const actions = ['apply-health-loss', 'apply-health-regain'];

        actions.forEach(a => {
          buttons.push({
            ...dataset,
            ...dataFromLabel(a)
          });
        })
        
      }; break;

      case 'apply-health-regain': {
        const actions = ['apply-health-regain'];

        actions.forEach(a => {
          buttons.push({
            ...dataset,
            ...dataFromLabel(a)
          });
        })
        
      }; break;

      case 'apply-healing': {
        const actions = ['apply-healing'];

        actions.forEach(a => {
          buttons.push({
            ...dataset,
            ...dataFromLabel(a)
          });
        })
        
      }; break;

      default: {
        const actions = ['apply-damage', 'apply-damage-half', 'apply-damage-double', 'apply-healing'];
        
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

  // Get target ids string
  _getTargetIds(targets, effTarget) {
    let targetIds = '';

    targets.forEach(t => {
      if (targetIds) targetIds += ',';

      targetIds += t.id;
    })

    return targetIds;
  }

}