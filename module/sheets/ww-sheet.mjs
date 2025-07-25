const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * A mixin which extends each Document definition with specialized client-side behaviors.
 * This mixin defines the client-side interface for database operations and common document behaviors.
 * @category Mixins
 * @param DocumentSheetV2   The base DocumentSheetV2 class to be mixed
 */
export default function WWSheetMixin(DocumentSheetV2) {
  
  class WWBaseSheet extends HandlebarsApplicationMixin(DocumentSheetV2) {

    /** @override */
    static DEFAULT_OPTIONS = {
      window: {
        title: this.title, // Custom title display
        icon: 'fa-regular fa-scroll',
        resizable: true,
        contentClasses: ['scrollable'],
        controls: [
          {
            action: "embedInChat",
            icon: "fa-solid fa-scroll",
            label: "WW.System.Embed",
            ownership: "OWNER"
          },
          {
            action: "linkInChat",
            icon: "fa-solid fa-link",
            label: "WW.System.Link",
            ownership: "OWNER"
          }
        ]
      },
      actions: {
        embedInChat: this.#embedInChat,
        linkInChat: this.#linkInChat
      }
    }

    /* -------------------------------------------- */
    /*  Getters                                     */
    /* -------------------------------------------- */

    /** @override */
    get title() {
      const {constructor: cls, id, name, type} = this.document;
      const prefix = cls.hasTypeData && type !== "base" ? CONFIG[cls.documentName].typeLabels[type] : cls.metadata.label;
      return `${name ?? id} - ${game.i18n.localize(prefix)}`;
    }

    /* -------------------------------------------- */
    /*  Actions                                     */
    /* -------------------------------------------- */

    static async #embedInChat(_event, target) {
      ChatMessage.create({
        speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
        content: `@Embed[${this.document.uuid}]`
      })
    }

    static async #linkInChat(_event, target) {
      ChatMessage.create({
        speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
        content: `@UUID[${this.document.uuid}]`
      })
    }
  }

  return WWBaseSheet;

}