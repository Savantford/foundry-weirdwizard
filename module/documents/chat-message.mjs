import { i18n, capitalize } from '../helpers/utils.mjs';

/**
 * The client-side ChatMessage document which extends the common BaseChatMessage model.
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

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    
  }

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
    const isWhisper = this.whisper.length;

    // Prepare content
    const emptyContent = data.flags?.weirdwizard?.emptyContent ?? data.flags?.weirdwizard?.emptyContent;
    
    data.content = await TextEditor.enrichHTML(this.content, {
      async: true,
      rollData: this.getRollData(),
      relativeTo: item ? item : undefined
    });

    // Prepare rollHtml
    const rollHtml = data.flags?.weirdwizard?.rollHtml ? data.flags.weirdwizard.rollHtml : '';
    

    // Prepare weapon properties list
    if (item) {
      const sys = item?.system;

      item.traits = [];
      item.advantages = [];
      item.disadvantages = [];

      if (sys.traits) Object.entries(sys.traits).filter(([, val]) => val === true).map((x) => {
        item.traits.push({
          label: i18n('WW.Weapon.Traits.' + capitalize(x[0]) + '.Label'),
          tip: i18n('WW.Weapon.Traits.' + capitalize(x[0]) + '.Tip'),
        })
      })

      if (sys.advantages) Object.entries(sys.advantages).filter(([, val]) => val === true).map((x) => {
        item.advantages.push({
          label: i18n('WW.Weapon.Advantages.' + capitalize(x[0]) + '.Label'),
          tip: i18n('WW.Weapon.Advantages.' + capitalize(x[0]) + '.Tip'),
        })
      })

      if (sys.disadvantages) Object.entries(sys.disadvantages).filter(([, val]) => val === true).map((x) => {
        item.disadvantages.push({
          label: i18n('WW.Weapon.Disadvantages.' + capitalize(x[0]) + '.Label'),
          tip: i18n('WW.Weapon.Disadvantages.' + capitalize(x[0]) + '.Tip'),
        })
      })
    }
    
    // Construct message data
    const messageData = {
      message: data,
      user: game.user,
      author: this.user,
      alias: this.alias,
      avatar: this.avatar,
      item: item ? {
        img: item.img,
        type: item.system.subtype ? this.getTypeLabel(item.system.subtype) : this.getTypeLabel(item.type),
        source: item.system.source ? item.system.source : null,
        tier: item.system.tier ? item.system.tier : null,
        isWeapon: item.system.subtype ?? item.system.subtype,
        traits: item.traits,
        advantages: item.advantages,
        disadvantages: item.disadvantages
      } : null,
      rollHtml: rollHtml,
      emptyContent: emptyContent,
      cssClass: [
        this.type === CONST.CHAT_MESSAGE_TYPES.IC ? "ic" : null,
        this.type === CONST.CHAT_MESSAGE_TYPES.EMOTE ? "emote" : null,
        isWhisper ? "whisper" : null,
        this.blind ? "blind": null
      ].filterJoin(" "),
      isWhisper: this.whisper.length,
      canDelete: game.user.isGM,  // Only GM users are allowed to have the trash-bin icon in the chat log itself
      whisperTo: this.whisper.map(u => {
        let user = game.users.get(u);
        return user ? user.name : null;
      }).filterJoin(", ")
    };

    // Render message data specifically for ROLL type messages
    if ( this.isRoll ) { // This was making the Roll being rendered twice and thus losing data. No longer true?
      await this._renderRollContent(messageData);
    }

    // Define a border color
    if ( this.type === CONST.CHAT_MESSAGE_TYPES.OOC ) {
      messageData.borderColor = this.user?.color;
    }

    // Render the chat message
    let html = await renderTemplate(CONFIG.ChatMessage.template, messageData);
    html = $(html);

    // Flag expanded state of dice rolls
    if ( this._rollExpanded ) html.find(".dice-tooltip").addClass("expanded");
    Hooks.call("renderChatMessage", this, html, messageData);

    return html;
  }

  getTypeLabel(type) {
    const i18n = (s,d={}) => game.i18n.format(s,d);
    
    // Try to find a match
    if (CONFIG.WW.dropdownSubtypes[type]) return i18n(CONFIG.WW.dropdownSubtypes[type]);
    if (CONFIG.WW.itemSubtypes[type]) return i18n(CONFIG.WW.itemSubtypes[type]);
    
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