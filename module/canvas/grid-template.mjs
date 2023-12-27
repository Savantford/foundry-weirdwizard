/**
 * A helper class for building MeasuredTemplates for WW talents and spells
 * Most code was originally written for the DnD5e system:
 * https://github.com/foundryvtt/dnd5e/blob/master/module/canvas/ability-template.mjs
 */
export default class GridTemplate extends MeasuredTemplate {

  /**
   * Track the timestamp when the last mouse move event was captured.
   * @type {number}
   */
  #moveTime = 0;

  /* -------------------------------------------- */

  /**
   * The initially active CanvasLayer to re-activate after the workflow is complete.
   * @type {CanvasLayer}
   */
  #initialLayer;

  /* -------------------------------------------- */

  /**
   * Track the bound event handlers so they can be properly canceled later.
   * @type {object}
   */
  #events;

  /* -------------------------------------------- */

  /**
   * A factory method to create an AbilityTemplate instance using provided data from an Item5e instance
   * @param {WWItem} item               The Item object for which to construct the template
   * @param {object} [options={}]       Options to modify the created template.
   * @returns {AbilityTemplate|null}    The template object, or null if the item does not produce a template
   */
  static fromItem(item, options={}) {
    const type = item.system.template.type;
    const distance = item.system.template.value;

    //const templateShape = dnd5e.config.areaTargetTypes[target.type]?.template;
    const templateShape = 'rect';
    if ( !templateShape ) return null;
    
    // Set Template Icon to the item's icon
    //CONFIG.controlIcons.template = item.img;

    // Prepare template data
    const templateData = foundry.utils.mergeObject({
      t: 'rect',
      user: game.user.id,
      distance: distance,
      direction: 0,
      x: 0,
      y: 0,
      fillColor: game.user.color,
      flags: { weirdwizard: { origin: item.uuid } }
    }, options);

    // Additional type-specific data
    switch ( templateShape ) {
      /*case "cone":
        templateData.angle = CONFIG.MeasuredTemplate.defaults.angle;
        break;*/
      case "rect": // Areas in WW are always cubes
        templateData.width = distance;
        templateData.distance = Math.hypot(distance, distance); // Diagonal distance
        templateData.direction = 45;
        break;
      /*case "ray": // 5e rays are most commonly 1 square (5 ft) in width
        templateData.width = target.width ?? canvas.dimensions.distance;
        break;*/
      default:
        break;
    }

    // Return the template constructed from the item data
    const cls = CONFIG.MeasuredTemplate.documentClass;
    const template = new cls(templateData, {parent: canvas.scene});
    const object = new this(template);
    object.item = item;
    object.actorSheet = item.actor?.sheet || null;
    return object;
  }

  /* -------------------------------------------- */

  /**
   * Creates a preview of the spell template.
   * @returns {Promise}  A promise that resolves with the final measured template if created.
   */
  async drawPreview(obj) {
    const initialLayer = canvas.activeLayer;
    
    // Draw the template and switch to the template layer
    this.draw();
    this.layer.activate();
    this.layer.preview.addChild(this);

    // Hide the sheet that originated the preview
    this.actorSheet?.minimize();

    // Activate interactivity
    return this.activatePreviewListeners(initialLayer, obj);
  }

  /* -------------------------------------------- */

  /** @override */
  async _draw() {

    // Load Fill Texture
    if ( this.document.texture ) {
      this.texture = await loadTexture(this.document.texture, {fallback: "icons/svg/hazard.svg"});
    } else {
      this.texture = null;
    }

    // Template Shape
    this.template = this.addChild(new PIXI.Graphics());

    // Control Icon
    this.controlIcon = this.addChild(this.#createControlIcon());
    await this.controlIcon.draw();

    // Ruler Text
    this.ruler = this.addChild(this.#drawRulerText());

    // Enable highlighting for this template
    canvas.grid.addHighlightLayer(this.highlightId);
  }

  /* -------------------------------------------- */

  /**
   * Draw the ControlIcon for the MeasuredTemplate
   * @override
   * @returns {ControlIcon}
   */
  #createControlIcon() {
    const size = Math.max(Math.round((canvas.dimensions.size * 0.5) / 20) * 20, 40);
    let icon = new ControlIcon({texture: this.item ? this.item.img : CONFIG.controlIcons.template, size: size});
    icon.x -= (size * 0.5);
    icon.y -= (size * 0.5);
    return icon;
  }

  /* -------------------------------------------- */

  /**
   * Draw the Text label used for the MeasuredTemplate
   * @returns {PreciseText}
   */
  #drawRulerText() {
    const style = CONFIG.canvasTextStyle.clone();
    style.fontSize = Math.max(Math.round(canvas.dimensions.size * 0.36 * 12) / 12, 36);
    const text = new PreciseText(null, style);
    text.anchor.set(0, 1);
    return text;
  }

  /**
   * Activate listeners for the template preview
   * @param {CanvasLayer} initialLayer  The initially active CanvasLayer to re-activate after the workflow is complete
   * @param {Object} obj                The data object used to make the roll and chat message.
   * @returns {Promise}                 A promise that resolves with the final measured template if created.
   */
  activatePreviewListeners(initialLayer, obj) {
    return new Promise((resolve, reject) => {
      this.obj = obj;
      this.#initialLayer = initialLayer;
      this.#events = {
        cancel: this._onCancelPlacement.bind(this),
        confirm: this._onConfirmPlacement.bind(this),
        move: this._onMovePlacement.bind(this),
        resolve,
        reject
      };

      // Activate listeners
      canvas.stage.on("mousemove", this.#events.move);
      canvas.stage.on("mousedown", this.#events.confirm);
      canvas.app.view.oncontextmenu = this.#events.cancel;
    });
  }

  /* -------------------------------------------- */

  /**
   * Shared code for when template placement ends by being confirmed or canceled.
   * @param {Event} event  Triggering event that ended the placement.
   */
  async _finishPlacement(event) {
    this.layer._onDragLeftCancel(event);
    canvas.stage.off("mousemove", this.#events.move);
    canvas.stage.off("mousedown", this.#events.confirm);
    canvas.app.view.oncontextmenu = null;
    canvas.app.view.onwheel = null;
    this.#initialLayer.activate();
  }

  /* -------------------------------------------- */

  /**
   * Move the template preview when the mouse moves.
   * @param {Event} event  Triggering mouse event.
   */
  _onMovePlacement(event) {
    event.stopPropagation();
    const now = Date.now(); // Apply a 20ms throttle
    if ( now - this.#moveTime <= 20 ) return;
    const center = event.data.getLocalPosition(this.layer);
    const interval = canvas.grid.type === CONST.GRID_TYPES.GRIDLESS ? 0 : 1; // was 2
    const snapped = canvas.grid.getSnappedPosition(center.x, center.y, interval);
    this.document.updateSource({x: snapped.x, y: snapped.y});
    this.refresh();
    this.#moveTime = now;
  }

  /* -------------------------------------------- */

  /**
   * Rotate the template preview by 3˚ increments when the mouse wheel is rotated.
   * @param {Event} event  Triggering mouse event.
   */
  _onRotatePlacement(event) {
    if ( event.ctrlKey ) event.preventDefault(); // Avoid zooming the browser window
    event.stopPropagation();
    const delta = canvas.grid.type > CONST.GRID_TYPES.SQUARE ? 30 : 15;
    const snap = event.shiftKey ? delta : 5;
    const update = {direction: this.document.direction + (snap * Math.sign(event.deltaY))};
    this.document.updateSource(update);
    this.refresh();
  }

  /* -------------------------------------------- */

  /**
   * Confirm placement when the left mouse button is clicked.
   * @param {Event} event  Triggering mouse event.
   */
  async _onConfirmPlacement(event) {
    await this._finishPlacement(event);
    const interval = canvas.grid.type === CONST.GRID_TYPES.GRIDLESS ? 0 : 1;
    const destination = canvas.grid.getSnappedPosition(this.document.x, this.document.y, interval);
    const user = game.user;
    this.document.updateSource(destination);

    // This is only needed if the template needs to be placed down, like lingering areas of effect
    //this.#events.resolve(canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [this.document.toObject()]));
    
    // Target tokens
    const {width, height} = this.shape;
    const {x, y} = this.document;
    const rect = new PIXI.Rectangle(x, y, width, height);

    // Narrow down candidates
    const candidates = canvas.tokens.quadtree.getObjects(rect);

    // Pick tokens that intersects with the rectangle
    const targets = candidates.filter(t => {
      if ( !t.visible ) return false;
      if ( (t.document.disposition === CONST.TOKEN_DISPOSITIONS.SECRET) && !t.isOwner ) return false;
      
      const b = t.bounds;

      return rect.intersects(b)
    });
    
    // Release other targets
    for ( let t of user.targets ) {
      if ( !targets.has(t) ) t.setTarget(false, {releaseOthers: false, groupSelection: true});
    }

    // Acquire targets for tokens which are not yet targeted
    targets.forEach(t => {
      if ( !user.targets.has(t) ) t.setTarget(true, {releaseOthers: false, groupSelection: true});
    });

  }

  /* -------------------------------------------- */

  /**
   * Cancel placement when the right mouse button is clicked.
   * @param {Event} event  Triggering mouse event.
   */
  async _onCancelPlacement(event) {
    await this._finishPlacement(event);
    this.#events.reject();
  }

}