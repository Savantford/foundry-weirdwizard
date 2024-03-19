import { i18n } from '../helpers/utils.mjs';

export default class WWRoll extends Roll {
  /**
   * The HTML template path used to render a complete Roll object to the chat log
   * @override
   * @type {string}
   */
  //static CHAT_TEMPLATE = "systems/weirdwizard/templates/chat/roll.hbs";
  
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
    if ( !this._evaluated ) await this.evaluate({async: true});

    const attribute = this.data.attribute;
    const against = this.data.against;
    
    const chatData = {
      formula: isPrivate ? "???" : this._formula,
      flavor: isPrivate ? null : flavor,
      user: game.user.id,
      tooltip: isPrivate ? "" : await this.getTooltip(),
      total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
      targetNo: isPrivate ? "?" : this.data.targetNo,
      attributeLabel: attribute ? i18n(CONFIG.WW.ROLL_ATTRIBUTES[attribute]) : null,
      attributeImg: attribute ? CONFIG.WW.ATTRIBUTE_ICONS[attribute] : null,
      againstLabel: against ? i18n(CONFIG.WW.ROLL_AGAINST[against]) : null,
      againstImg: against ? CONFIG.WW.ATTRIBUTE_ICONS[against] : null,
      terms: await this.terms,
      outcome: this.outcome
    };
    
    if (this.options?.template) template = this.options.template;

    return renderTemplate(template, chatData);
  }

  /** 
   * Get the outcome (None, Critical, Success or Failure)
  */
  get outcome() {
    const targetNo = this.data.targetNo;

    // Return nothing if there is no target number
    if (!targetNo) return ''; 
    
    // Determine outcome
    if (this.total >= 20 && this.total >= targetNo + 5) return 'critical';  
    else if (this.total >= targetNo) return 'success';
    else return 'failure';
  }

}