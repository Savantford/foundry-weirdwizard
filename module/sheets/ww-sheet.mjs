const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * A mixin which extends each Document definition with specialized client-side behaviors.
 * This mixin defines the client-side interface for database operations and common document behaviors.
 * @category Mixins
 * @param BaseSheet   The base DocumentSheetV2 class to be mixed
 */
export default function WWSheetMixin(BaseSheet) {
  const MiddleClass = BaseSheet.PARTS ? BaseSheet : HandlebarsApplicationMixin(BaseSheet);
  
  class WWBaseSheet extends MiddleClass {
    
    /**
     * The operational mode in which a newly created instance of this sheet starts
     * @type {"edit"|"view"}
     */
    static #DEFAULT_MODE = "view";

    /** @override */
    static DEFAULT_OPTIONS = {
      window: {
        title: this.title, // Custom title display
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
        linkInChat: this.#linkInChat,
        changeMode: this.#onChangeMode
      }
      
    }

    /* -------------------------------------------- */
    /*  Getters and Setters                         */
    /* -------------------------------------------- */

    /**
     * The operational mode of this sheet
     * @type {"edit"|"view"}
     */
    get mode() {
      return this.#mode;
    }

    /**
     * Change the operational mode of this sheet. Changing this value will also change the mode in which subsequent
     * WWBaseSheet instances first render.
     * @param {"edit"|"view"} value
     */
    set mode(value) {
      this.#mode = WWBaseSheet.#DEFAULT_MODE = value;
    }

    #mode = WWBaseSheet.#DEFAULT_MODE;

    /**
     * Is the sheet in edit mode?
     * @type {boolean}
     */
    get isEditMode() {
      return this.#mode === "edit";
    }

    /* -------------------------------------------- */

    /** @override */
    get title() {
      const {constructor: cls, id, name, type} = this.document;
      const prefix = cls.hasTypeData && type !== "base" ? CONFIG[cls.documentName].typeLabels[type] : cls.metadata.label;
      return `${name ?? id} - ${game.i18n.localize(prefix)}`;
    }

    /* -------------------------------------------- */

    /**
     * Prepare application rendering context data for a given render request.
     * @param {RenderOptions} options                 Options which configure application rendering behavior
     * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
     */
    async _prepareContext(options = {}) {
      const context = await super._prepareContext(options);
      
      context.isEditMode = this.isEditMode;

      return context;
    }

    /* -------------------------------------------- */
    /*  Life-Cycle Handlers                         */
    /* -------------------------------------------- */

    /** @inheritDoc */
    async _preRender(context, options) {
      await super._preRender(context, options);

      // Wipe the window content after the first render and swap the mode CSS class
      if ( !options.isFirstRender ) {
        await this.element.classList.toggle("edit-mode", this.isEditMode);
        await this.element.classList.toggle("view-mode", !this.isEditMode);
        this.element.querySelector(".window-content").innerHTML = "";
      }
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    async _onFirstRender(context, options) {
      this.element.classList.add(`${this.mode}-mode`);

      return super._onFirstRender(context, options);
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    async _onRender(context, options) {
      await super._onRender(context, options);

      // Drag and Drop
      /*new foundry.applications.ux.DragDrop.implementation({
        dropSelector: ".window-content",
        permissions: {
          dragstart: () => false,
          drop: () => this.isEditMode
        },
        callbacks: {
          drop: this._onDrop.bind(this)
        }
      }).bind(this.element);*/
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

    /* -------------------------------------------- */

    static async #linkInChat(_event, target) {
      ChatMessage.create({
        speaker: game.weirdwizard.utils.getSpeaker({ actor: this.actor }),
        content: `@UUID[${this.document.uuid}]`
      })
    }

    /* -------------------------------------------- */

    /**
     * Alternate between view and edit modes.
     * @this {WWBaseSheet}
     * @type {ApplicationClickAction}
     */
    static async #onChangeMode() {
      this.mode = this.isEditMode ? "view" : "edit";
      console.log('changing mode')
      await this.render(true);
    }

  }

  return WWBaseSheet;

}