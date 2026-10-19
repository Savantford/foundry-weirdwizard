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
   * Check if item needs targets.
   * @returns {boolean} Need targets?
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

  /* -------------------------------------------- */

  /**
   * Attempt to infer an Actor token for the item.
   * @returns {TokenDocument}
  */
  get inferToken() {
    const actorTokens = this.actor.getActiveTokens();
    const controlledTokens = canvas.tokens.controlled;

    if (this.actor.token) return this.actor.token; // Unlinked synthetic actor's token
    if (actorTokens.length) return actorTokens[0].document; // First token associated the linked Actor
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

  /* -------------------------------------------- */

  /**
   * Display the item's Range as a Scene Region and return it.
   * @returns {RegionDocument}
  */
  displayRange(options={}) {
    const { color='#000000', token=this.inferToken } = options;

    if (!token) return null;
    
    const { x: tx, y: ty, width: twidth, height: theight, shape: tshape } = token._source;
    const grid = canvas.grid ?? foundry.documents.BaseScene.defaultGrid;
    const yard = canvas.dimensions.distancePixels;
    const baseShape = grid.isSquare ? CONST.TOKEN_SHAPES.RECTANGLE_1 : CONST.TOKEN_SHAPES.ELLIPSE_1;
    const targeting = this.system.targeting;
    const range = targeting.method === 'self' ? 0 : targeting.range; // Treat as 0 if self targeted
    
    // Return earlier if range is null
    if (!range) return null;
    
    // The inner hole shape
    const holeShape = {
      type: 'emanation',
      hole: true,
      base: { type: "token", x: tx, y: ty, width: twidth, height: theight, shape: baseShape },
      radius: range * yard,
      gridBased: !grid.isGridless
    }
    
    const rangeRegion = new RegionDocument.implementation({
      name: 'rangeRegion',
      shapes: [
        {
          type: 'emanation',
          base: { type: "token", x: tx, y: ty, width: twidth, height: theight, shape: baseShape },
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

    return [rangeRegion, rangePlaceable];
  }

  /* -------------------------------------------- */

  /**
   * Prompt the placement of an area (Scene Region).
   * @param {Object} options 
   * @returns {RegionDocument} || null
   */
  async placeArea(options = {}) {
    const { originApp } = options;
    // Minimize origin app
    originApp?.minimize();

    // Prepare scene region
    const grid = canvas.grid ?? foundry.documents.BaseScene.defaultGrid;
    const yard = canvas.dimensions.distancePixels;
    const area = this.system.area;
    const baseShape = grid.isSquare ? CONST.TOKEN_SHAPES.RECTANGLE_1 : CONST.TOKEN_SHAPES.ELLIPSE_1;
    const {
      shape = area.shape ?? 'circle',
      radius: emaRadius = area.radius ?? 5, // Radius for emanation
      size = area.size ?? 5, // Size for circle or length for a Line
      width = area.width ?? 1, // Width for line
      attached = area.attached ?? true,
      color = area.color ?? game.user.color,
      restriction = area.restriction
    } = options;
    const isCircle = shape === 'circle';
    const isLine = shape === 'line';
    const radius = isCircle ? size / 2 : emaRadius; // Half Size for circle, radius for emanation

    // Prepare region data
    const regionData = {
      name: this.parent ? `${this.name} (${this.parent.name})` : this.name,
      shapes: [{
        type: shape,
        base: { type: "token", x: 0, y: 0, width: 1, height: 1, shape: baseShape },
        radius: radius * yard,
        length: isLine ? size * yard : undefined,
        width: isLine ? width * yard : undefined,
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
    const displayRange = this.displayRange();

    // Prepare placement constraints
    let warning;

    // Callback for area moving
    const onMove = (options) => {
      const { shape, position, snap } = options;
      
      // Snap is gonna be true if user is not holding shift      
      if (!snap) return;

      const grid = canvas.grid ?? foundry.documents.BaseScene.defaultGrid;
      const [rangeRegion, rangePlaceable] = displayRange;

      // Restrict snapping to vertex/center
      let mode = CONST.GRID_SNAPPING_MODES["CENTER"];
      
      switch (shape.type) {
        case 'line':
          if (width % 2 === 0) {
            mode = CONST.GRID_SNAPPING_MODES["VERTEX"]; // Vertex if even, edge midpoint if odd
          }
          else {
            // TODO: Improve this. Need help with the math!
            function getModeFromAngle(a) {
              if (a >= 337.5 || a < 22.5)   return "LEFT_SIDE_MIDPOINT";
              if (a >= 22.5  && a < 67.5)   return "TOP_LEFT_VERTEX";
              if (a >= 67.5  && a < 112.5)  return "TOP_SIDE_MIDPOINT";
              if (a >= 112.5 && a < 157.5)  return "TOP_RIGHT_VERTEX";
              if (a >= 157.5 && a < 202.5)  return "RIGHT_SIDE_MIDPOINT";
              if (a >= 202.5 && a < 247.5)  return "BOTTOM_RIGHT_VERTEX";
              if (a >= 247.5 && a < 292.5)  return "BOTTOM_SIDE_MIDPOINT";
              if (a >= 292.5 && a < 337.5)  return "BOTTOM_LEFT_VERTEX";
            }
            
            mode = CONST.GRID_SNAPPING_MODES[getModeFromAngle(shape.rotation)];
          }
          break;
        case 'circle':
          if (size % 2 === 0) mode = CONST.GRID_SNAPPING_MODES["VERTEX"]; // Vertex if even Sized
        break;
      }

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
        if (!warning || warning?.active === false) warning = ui.notifications.warn("WW.Targeting.RangeOut", { localize: true, permanent: true });
        if (rangeRegion.color.css === rangeColorIn) {
          rangeRegion.updateSource({ color: rangeColorOut });
          rangePlaceable.refresh();
        };
      } else {
        warning?.remove();
        if (rangeRegion.color.css === rangeColorOut) {
          rangeRegion.updateSource({ color: rangeColorIn });
          rangePlaceable.refresh();
        };
      }
    };

    // Callback for area rotating
    const onRotate = (options) => {
      const { event, shape, precise } = options;
      const isHex = canvas.grid.isHexagonal;
      const isGridless = canvas.grid.isGridless;

      let interval;
      switch (shape.type) {
        case "line":
          const lineReg = isGridless ? 5 : (isHex ? 30 : 90); // Regular: 5° gridless, 30° hex, 90° square
          const linePre = isGridless ? 1 : (isHex ? 15 : 45); // Precise: 1° gridless, 15° hex, 45° square
          interval = precise ? linePre : lineReg; 
          break;
        default:
          const squareReg = isGridless ? 5 : (isHex ? 60 : 90); // Regular: 5° gridless, 30° hex, 90° square
          const squarePre = isGridless ? 1 : (isHex ? 30 : 45); // Precise: 1° gridless, 15° hex, 45° square
          interval = precise ? squarePre : squareReg;
          break;
      }

      const delta = interval * Math.sign(event.delta);
      shape.rotate((shape.rotation + delta).toNearest(interval) - shape.rotation);
      return false;
    }

    // Prompt region placement
    const region = await canvas.regions.placeRegion(regionData, { attachToToken: attached, onMove, onRotate });

    // After placement
    warning?.remove();
    canvas.regions.clearPreviewContainer();

    // Maximize origin app
    originApp?.maximize();

    // Target tokens
    const forTargeting = this.system.targeting.operation === 'target';
    if (!forTargeting || !region) return region;

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
}