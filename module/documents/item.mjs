import WWDocumentMixin from "./ww-document.mjs";

/**
 * Extend the basic Item with some modifications.
 * @extends {Item}
*/
export default class WWItem extends WWDocumentMixin(foundry.documents.Item) {

  /* -------------------------------------------- */
  /*  Document Creation                           */
  /* -------------------------------------------- */

  /**
   * @override
   * Determine default artwork based on the provided item data.
   * @param {ItemData} itemData  The source item data.
   * @returns {{img: string}}    Candidate item image.
   */
  static getDefaultArtwork(itemData) {
    const icon = {
      equipment: 'icons/svg/item-bag.svg',
      talent: 'icons/svg/card-hand.svg',
      spell: 'icons/svg/lightning.svg'
    }[itemData.type] ?? this.DEFAULT_ICON;

    return { img: icon };
  }

  /* -------------------------------------------- */

  async _preCreate(data, options, user) {
    let icon = data.img;
    
    // If no image is provided, set default by category.
    if (!icon) {

      switch (this.type) {
        case 'equipment':
          icon = '';
        break;
   
        case 'talent':
          icon = '';
        break;
  
        case 'spell':
          icon = '';
        break;
      }

    }

    await this.updateSource({ img: icon });
    
    return await super._preCreate(await data, options, user);
  }

  /* -------------------------------------------- */
  /*  Document Update                             */
  /* -------------------------------------------- */

  async _preUpdate(changes, options, user) {
    // Null heldBy if item has no actor
    if (!this.actor && this.system.heldBy) this.system.heldBy = null;

    await super._preUpdate(changes, options, user);
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
  */
  prepareDerivedData() {
    const sys = this.system;

    switch (this.type) {
      case 'spell':
        // Prepare castings label
        this.system.castingsLabel = sys.casting && (sys.casting.replace(/\s/g,'') !== '<p></p>') ? sys.casting : `<p>${sys.uses.max}</p>`;
      break;
    }
    
  }

  /* -------------------------------------------- */
  /*  Properties (Getters)                        */
  /* -------------------------------------------- */

  get isActivity() {
    return (i.system.attribute || i.effects.size || i.system.instant.length);
  }

  /* -------------------------------------------- */

  /**
   * Check if item needs targets
   * @returns needTargets
  */ 
  get needTargets() {
    let need = false;
  
    // Check if an against attribute is checked
    if (this.system?.against) need = true;
  
    // Check if any Active Effect needs tokens as targets
    if (this.effects) {
      for (const e of this.effects) {
        if (e.target != 'none') need = true;
      }
    }
  
    // Check if any Active Effect needs tokens as targets
    if (this.system?.instant) {
      for (const e of this.system.instant) {
        if (e.target != 'none') need = true;
      }
    }
  
    return need;
  }

  get inferToken() {
    const controlledTokens = canvas.tokens.controlled;
    if (this.actor.token) return this.actor.token; // Unlinked synthetic actor's token
    if (controlledTokens.length) return controlledTokens[0].document; // First controlled token
    return null;
  }

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  /* A shortcut for macros to use an Item belonging to an Actor as an activity. */
  async useActivity(options = {}) {
    if (!this.parent) return console.error('In order to be used, the Item must be embedded to an Actor!');
    this.parent.useActivity({
      ...options,
      item: this
    })
  }

  async placeTemplate(options = {}) {
    // Minimize origin app
    options.origin?.minimize();

    // Prepare region template
    const grid = canvas.grid ?? foundry.documents.BaseScene.defaultGrid;
    const yard = canvas.dimensions.distancePixels;
    const temp = this.system.template;
    const emanationShape = grid.isSquare ? CONST.TOKEN_SHAPES.RECTANGLE_1 : CONST.TOKEN_SHAPES.ELLIPSE_1;
    const {
      radius = temp.radius ?? 5,
      attached = temp.attached ?? true,
      color = temp.color ?? game.user.color,
      restriction = temp.restriction,
      isSpace = true,
      ... params
    } = options;

    // Prepare region data
    const regionData = {
      name: this.parent ? `${this.name} (${this.parent.name})` : this.name,
      shapes: [{
        type: isSpace ? 'circle' : 'emanation',
        base: { type: "token", x: 0, y: 0, width: 1, height: 1, shape: emanationShape },
        radius: radius * yard,
        x: 0,
        y: 0,
        gridBased: !grid.isGridless
      }],
      color,
      restriction,
      levels: [canvas.level.id],
      highlightMode: "coverage",
      displayMeasurements: true,
      visibility: CONST.REGION_VISIBILITY.ALWAYS,
      ownership: { [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }
    };

    // Toggle region display
    const rangeRegion = this.displayRange();

    // Prepare placement constraints
    let msg;

    const onMove = ({shape, position, snap}) => {
      // Snap is gonna be true if user is not holding shift
      if ( !snap ) return;

      // Restrict snapping to vertex/center
      const mode = CONST.GRID_SNAPPING_MODES[(isSpace && radius * 2 % 2 === 0) ? "VERTEX" : "CENTER"];
      const { x, y } = shape.grid.getSnappedPoint(position, { mode });
      position.x = x;
      position.y = y;

      // Restrict placement to range region
      const hole = rangeRegion.shapes[1];
      const left = hole.origin.x >= position.x;
      const top = hole.origin.y >= position.y;

      // Square grid
      const offsetPos = {
        x: left ? position.x - radius * yard : position.x + (radius - 1) * yard, // Left / Right
        y: top ? position.y - radius * yard : position.y + (radius - 1) * yard // Top / Bottom
      }

      // Hexagonal grid (Rows)
      if (grid.isHexagonal && !grid.columns) {
        offsetPos.x = left ? position.x - (radius - 2.5) * yard : position.x + (radius - 2.5) * yard, // Left / Right
        offsetPos.y = top ? position.y - (radius - 1) * yard : position.y + (radius - 1) * yard; // Top / Bottom
      }

      // Hexagonal grid (Columns)
      if (grid.isHexagonal && grid.columns) {
        offsetPos.x = left ? position.x - (radius - 1) * yard : position.x + (radius - 1) * yard, // Left / Right
        offsetPos.y = top ? position.y - (radius - 2.5) * yard : position.y + (radius - 2.5) * yard; // Top / Bottom
      }

      // Hexagonal grid (Columns)
      if (grid.isHexagonal && grid.columns) {
        offsetPos.x = left ? position.x - (radius - 1) * yard : position.x + (radius - 1) * yard, // Left / Right
        offsetPos.y = top ? position.y - (radius - 2.5) * yard : position.y + (radius - 2.5) * yard; // Top / Bottom
      }

      // Gridless - Not perfect, as the grid does not round it
      if (grid.isGridless) {
        offsetPos.x = left ? position.x - (radius - 0.9) * yard : position.x + (radius - 0.9) * yard, // Left / Right
        offsetPos.y = top ? position.y - (radius - 0.9) * yard : position.y + (radius - 0.9) * yard; // Top / Bottom
      }

      // Out of Range warning
      const outOfRange = !hole.testPoint(offsetPos);
      const rangeColorIn = '#000000', rangeColorOut = '#400800';
      
      if (outOfRange) {
        if (!msg || msg?.active === false) msg = ui.notifications.warn("WW.Targeting.RangeOut", { permanent: true });
        if (rangeRegion.color.css === rangeColorIn) {
          rangeRegion.updateSource({ color: rangeColorOut });
          rangeRegion.object.draw();
        };
      } else {
        msg?.remove();
        if (rangeRegion.color.css === rangeColorOut) {
          rangeRegion.updateSource({ color: rangeColorIn });
          rangeRegion.object.draw();
        };
      }
    };
    
    // Prompt region placement
    const region = await canvas.regions.placeRegion(regionData, { attachToToken: attached, onMove });

    // After placement
    msg?.remove();
    canvas.regions.clearPreviewContainer();
    options.origin?.maximize();

    // Target tokens
    const targeting = this.system.targeting.mode === 'areaTarget';
    if (!targeting || !region) return region;

    // Select and filter tokens
    const candidates = canvas.tokens.quadtree.getObjects(region.bounds);
    const targetIds = candidates.filter(token => {
      if (!token.visible) return false; // Exclude invisible
      if (token.document.disposition === CONST.TOKEN_DISPOSITIONS.SECRET && !token.isOwner) return false; // Exclude secret

      return token.document.testInsideRegion(region);
    }).map(token => token.id);

    // Replace selected targets
    if (targetIds.size) canvas.tokens.setTargets(targetIds);

    region.delete();

    return region;
  }

  /**
   * Display the item's Range as a Scene Region and return it.
   * @returns RegionDocument
  */
  displayRange(options={}) {
    const { color='#000000', token=this.inferToken } = options;
    console.log(token)
    if (!token) return null;
    const { x: tx, y: ty, width: twidth, height: theight, shape: tshape } = token._source;
    const grid = canvas.grid ?? foundry.documents.BaseScene.defaultGrid;
    const yard = canvas.dimensions.distancePixels;
    const emanationShape = grid.isSquare ? CONST.TOKEN_SHAPES.RECTANGLE_1 : CONST.TOKEN_SHAPES.ELLIPSE_1;
    const range = this.system.targeting.range;

    const holeShape = {
      type: 'emanation',
      hole: true,
      base: { type: "token", x: tx, y: ty, width: twidth, height: theight, shape: emanationShape },
      radius: range * yard,
      gridBased: !grid.isGridless
    }
    
    const rangeRegion = new RegionDocument.implementation({
      name: 'rangeRegion',
      shapes: [
        {
          type: 'emanation',
          base: { type: "token", x: tx, y: ty, width: twidth, height: theight, shape: emanationShape },
          radius: 1000 * yard,
          gridBased: !grid.isGridless
        },
        holeShape
      ],
      color: color,
      levels: [canvas.level.id],
      highlightMode: "coverage",
      displayMeasurements: false,
      visibility: CONST.REGION_VISIBILITY.OBSERVER,
      ownership: { [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }
    }, { parent: canvas.scene });

    const holeRegion = new RegionDocument.implementation({
      name: 'rangeHole',
      shapes: [
        holeShape
      ],
      levels: [canvas.level.id],
      highlightMode: "coverage",
      displayMeasurements: true,
      visibility: CONST.REGION_VISIBILITY.OBSERVER,
      ownership: { [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }
    }, { parent: canvas.scene });
    
    // Create placeables
    const PlaceableClass = foundry.utils.getPlaceableObjectClass("Region");
    const rangePlaceable = new PlaceableClass(rangeRegion);
    const holePlaceable = new PlaceableClass(holeRegion);

    // Add placeables as a child to previews
    canvas.regions.preview.addChild(rangePlaceable);
    canvas.regions.preview.addChild(holePlaceable);

    // Draw regions
    rangePlaceable.draw();
    holePlaceable.draw();

    return rangeRegion;
  }

}