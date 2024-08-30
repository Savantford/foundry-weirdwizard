import { i18n, capitalize } from '../helpers/utils.mjs';

/**
 * A custom chat message that extends the client-side ChatMessage document.
 *
 * @extends ChatMessage
 *
 */
export default class WWChatMessage extends ChatMessage {

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * Return the speaker's actor avatar image.
   * @type {string}
   */
  get avatar() {
    const actor = game.actors.get(this.speaker.actor);
    if ( actor ) return actor.img;
  }

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  /**
   * Render the HTML for the ChatMessage which should be added to the log
   * @override
   * @returns {Promise<jQuery>}
   */
  async getHTML() {   
    
    // Determine some metadata
    const data = this.toObject(false);
    const itemUuid = (data.flags?.weirdwizard?.item && (typeof data.flags?.weirdwizard?.item === 'string')) ? data.flags.weirdwizard.item : null;
    const item = await fromUuid(itemUuid);
    const icon = (data.flags?.weirdwizard?.icon && (typeof data.flags?.weirdwizard?.icon === 'string')) ? data.flags.weirdwizard.icon : null;
    const isWhisper = this.whisper.length;
    
    // Prepare content
    const emptyContent = data.flags?.weirdwizard?.emptyContent ?? data.flags?.weirdwizard?.emptyContent;
    
    data.content = await TextEditor.enrichHTML(this.content, {
      async: true,
      rollData: this.getRollData(),
      relativeTo: item ? item : undefined
    });

    // Prepare rollHtml
    //const rollHtml = data.flags?.weirdwizard?.rollHtml ? data.flags.weirdwizard.rollHtml : '';

    // Prepare item
    if (item) {
      const sys = item?.system;

      // Prepare traits list
      item.traits = [];

      if (sys.traits) Object.entries(sys.traits).filter(([, val]) => val === true).map((x) => {
        item.traits.push({
          label: i18n('WW.Weapon.Traits.' + capitalize(x[0]) + '.Label'),
          tip: i18n('WW.Weapon.Traits.' + capitalize(x[0]) + '.Tip'),
        })
      })

      // Prepare attack Rider
      item.attackRider = item.system.attackRider ? await TextEditor.enrichHTML(item.system.attackRider?.value, { async: true }) : '';

      // Prepare spell header
      if (item.type == 'Spell') {
        let header = '';

        header += sys.casting ? `<b>${i18n("WW.Spell.Castings")}:</b> ${sys.uses.max}, ${sys.casting}` : `<b>${i18n("WW.Spell.Castings")}:</b> ${sys.uses.max}`;
        if (sys.target) header += `<br/><b>${i18n("WW.Spell.Target")}:</b> ${sys.target}`;
        if (sys.duration) header += `<br/><b>${i18n("WW.Spell.Duration")}:</b> ${sys.duration}`;

        item.spellHeader = header;
      }

    }
    
    // V11 legacy support; delete in V13
    const styles = game.release.generation >= 12 ? CONST.CHAT_MESSAGE_STYLES : CONST.CHAT_MESSAGE_TYPES;
    
    // Construct message data
    const messageData = {
      message: data,
      user: game.user,
      author: this.author,
      alias: this.alias,
      avatar: this.avatar,
      icon: icon,
      item: item ? {
        type: this.getTypeLabel(item.type),
        subtype: item.system.subtype ? this.getTypeLabel(item.system.subtype) : '',
        magical: item.system.magical ? 'magical' : '',
        source: item.system.source ? item.system.source : null,
        tier: item.system.tier ? item.system.tier : null,
        isWeapon: item.system.subtype ?? item.system.subtype,
        traits: item.traits,
        attackRider: item.attackRider,
        isSpell: item.type === 'Spell',
        spellHeader: item.spellHeader
      } : null,
      rollHtml: await this._renderRollHTML(false),//rollHtml, -- rollHtml no longer needed
      emptyContent: emptyContent,
      cssClass: [
        this.style === styles.IC ? "ic" : null,
        this.style === styles.EMOTE ? "emote" : null,
        isWhisper ? "whisper" : null,
        this.blind ? "blind": null
      ].filterJoin(" "),
      isWhisper: this.whisper.length,
      showPrivate: this.isContentVisible,
      canDelete: game.user.isGM,  // Only GM users are allowed to have the trash-bin icon in the chat log itself
      whisperTo: this.whisper.map(u => {
        let user = game.users.get(u);
        return user ? user.name : null;
      }).filterJoin(", ")
    };

    // Render message data specifically for ROLL type messages
    if ( this.isRoll ) await this._renderRollContent(messageData);
    
    // Define a border color
    if ( this.style === styles.OOC ) messageData.borderColor = this.author?.color.css;

    // Render the chat message
    let html = await renderTemplate(CONFIG.ChatMessage.template, messageData);
    html = $(html);

    // Flag expanded state of dice rolls
    if ( this._rollExpanded ) html.find(".dice-tooltip").addClass("expanded");
    Hooks.call("renderChatMessage", this, html, messageData);
    
    return html;
  }

  /* -------------------------------------------- */

  /**
   * Render the inner HTML content for ROLL type messages.
   * @param {object} messageData      The chat message data used to render the message HTML
   * @returns {Promise}
   * @private
   */
  async _renderRollContent(messageData) {
    const data = messageData.message;

    // Suppress the "to:" whisper flavor for private rolls
    if ( this.blind || this.whisper.length ) messageData.isWhisper = false;
    
    // Display standard Roll HTML content
    if ( this.isContentVisible ) {
      const el = document.createElement("div");
      el.innerHTML = data.content;  // Ensure the content does not already contain custom HTML
      //if ( !el.childElementCount && this.rolls.length ) data.content = await this._renderRollHTML(false); // Render Public Rolls
    }
    
    // Otherwise, show "rolled privately" messages for Roll content
    else {
      const name = this.author?.name ?? game.i18n.localize("CHAT.UnknownUser");
      data.flavor = game.i18n.format("CHAT.PrivateRollContent", {user: name});
      //data.content += await this._renderRollHTML(true); // Render Private Rolls
      messageData.alias = name;
      messageData.icon = null;
    }

  }

  /* -------------------------------------------- */

  /**
   * Render HTML for the array of Roll objects included in this message.
   * @param {boolean} isPrivate   Is the chat message private?
   * @returns {Promise<string>}   The rendered HTML string
   * @private
   */
  async _renderRollHTML(isPrivate) {
    let html = "";
    
    for ( const roll of this.rolls ) {
      html += await roll.render({isPrivate});
    }
    return html;
  }

  /* -------------------------------------------- */

  getTypeLabel(type) {
    const i18n = (s,d={}) => game.i18n.format(s,d);
    
    // Try to find a match
    if (CONFIG.WW.TALENT_SUBTYPES[type]) return i18n(CONFIG.WW.TALENT_SUBTYPES[type]);
    if (CONFIG.WW.EQUIPMENT_SUBTYPES[type]) return i18n(CONFIG.WW.EQUIPMENT_SUBTYPES[type]);
    
    // If no match is found, return the original string
    return type;
  }

  /* -------------------------------------------- */
  /*  Event Handlers                              */
  /* -------------------------------------------- */

  /** @override */
  /*async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    
  }*/

  /* -------------------------------------------- */
  /*  Importing and Exporting                     */
  /* -------------------------------------------- */

}
