import WWRoll from '../dice/roll.mjs';
import { plusify } from '../helpers/utils.mjs';
import TargetingHelper from './targeting-helper.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * A powerful general app to handle general activity use and dice rolling.
 * @extends {ApplicationV2}
*/
export default class ActivityUse extends HandlebarsApplicationMixin(ApplicationV2) {
  debounceRender = foundry.utils.debounce(this.render, 50);
  
  constructor(options={}) {
    super(options); // Required for "this." to work

    // Minimize related Actor sheet
    if (options.actor) options.actor.sheet.minimize();

    // Enable token targeting listener
    Hooks.on("targetToken", () => this.debounceRender() );
  }

  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['weirdwizard', 'activity-use'],
    window: {
      //title: this.title,
      icon: 'fa-regular fa-dice-d20',
      resizable: true
    },
    actions: {
      // Roll actions
      toggleRollDetails: ActivityUse.#onToggleRollDetails,
      situationalUp: ActivityUse.#changeSituationalBoons,
      situationalDown: ActivityUse.#changeSituationalBoons,
      confirm: ActivityUse.#confirm,

      // Targeting actions
      selectTargets: ActivityUse.#selectTargets,
      placeArea: ActivityUse.#placeArea,
      targetingRestriction: ActivityUse.#onChangeTargetingRestriction,

      // Other actions
      messageMode: ActivityUse.#onChangeMessageMode
    },
    position: {
      width: 425,
      height: "auto"
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _initializeApplicationOptions(options) {
    this.config = options;

    return options = super._initializeApplicationOptions(options);
  }

  /* -------------------------------------------- */

  static PARTS = {
    /*header: {
      template: 'systems/weirdwizard/templates/apps/activity/header.hbs'
    },*/
    body: {
      template: 'systems/weirdwizard/templates/apps/activity/body.hbs',
      scrollable: ['.standard-form'],
      templates: [
        'systems/weirdwizard/templates/apps/activity/roll.hbs',
        'systems/weirdwizard/templates/apps/activity/roll-details.hbs',
        'systems/weirdwizard/templates/apps/activity/targeting.hbs',
        'systems/weirdwizard/templates/apps/activity/area.hbs'
      ]
    },
    footer: {
      template: 'systems/weirdwizard/templates/apps/activity/footer.hbs'
    }
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    const { actor, item, title } = this.config;
    const { constructor: id, name, type } = item ?? actor;
    return title ?? `${_loc("WW.Activity.Label")}: ${name ?? id}`;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async _prepareContext(options = {}) {
    const context = {
      ...await super._prepareContext(options),
      ...this.config
    };
    
    const item = context.item;
    const sys = context.actor.system;

    // Attribute variables
    const attKey = context.roll.attribute.key;
    const attMod = sys.attributes[attKey]?.mod ? plusify(sys.attributes[attKey].mod) : '+0';
    const attLabel = _loc(CONFIG.WW.ROLL_ATTRIBUTES[attKey]);
    const flatMod = context.roll.flatMod;

    // Prepare attribute display
    const attDisplay = (attLabel ? `${attLabel} (${attMod})` : '1d20 + 0') + (flatMod ? ` + ${flatMod}` : '');

    // Boons
    const boons = this.config.roll.boons;

    // Calculate and display final boons
    let boonsFinal = 0;

    if (boons.situational) boonsFinal += boons.situational; // Add situational boons input value
    if (boons.fromEffects) boonsFinal += boons.fromEffects; // If there are boons or banes applied by Active Effects, add it
    if (boons.applyAttack && boons.forAttacks) boonsFinal += boons.forAttacks;
    if (boons.applySpell && boons.forAttacks) boonsFinal += boons.forSpells;
    if (boons.fixed) boonsFinal += boons.fixed; // If there are fixed boons or banes, add it

    // Prepare boons display
    let boonsDisplay = '';

    if (boonsFinal > 1) {
      boonsDisplay = " " + _loc("WW.Boons.With") + " " + parseInt(boonsFinal) + " " + _loc("WW.Boons.Boons");
    } else if (boonsFinal > 0) {
      boonsDisplay = " " + _loc("WW.Boons.With") + " " + parseInt(boonsFinal) + " " + _loc("WW.Boons.Boon");
    } else if (boonsFinal < -1) {
      boonsDisplay = " " + _loc("WW.Boons.With") + " " + boonsFinal * -1 + " " + _loc("WW.Boons.Banes");
    } else if (boonsFinal < 0) {
      boonsDisplay = " " + _loc("WW.Boons.With") + " " + boonsFinal * -1 + " " + _loc("WW.Boons.Bane");
    }

    // Merge boons
    context.roll.boons = {
      ...context.roll.boons,
      ...boons,
      final: boonsFinal,
      abs: Math.abs(boonsFinal),
      display: plusify(boonsFinal)
    };

    // Prepare against display
    const against = context.roll.against;
    const customTn = context.roll.against.customTn;
    let againstDisplay = ` ${_loc('WW.Roll.Against.Label').toLowerCase()} `;
    
    if (customTn) againstDisplay += customTn;
    else if (against.key) {
      switch (against.key) {
        case 'def': {
          againstDisplay += _loc('WW.Defense.Label');
          break;
        }
        case 'str': {
          againstDisplay += _loc('WW.Attributes.Strength');
          break;
        }
        case 'agi': {
          againstDisplay += _loc('WW.Attributes.Agility');
          break;
        }
        case 'int': {
          againstDisplay += _loc('WW.Attributes.Intellect');
          break;
        }
        case 'wil': {
          againstDisplay += _loc('WW.Attributes.Will');
          break;
        }
      }
    } else againstDisplay = '';

    // Merge roll context
    foundry.utils.mergeObject(context.roll, {
      expression: attDisplay + boonsDisplay + againstDisplay,
      flatModAbs: Math.abs(context.roll.flatMod),
      attribute: {
        mod: attMod,
        icon: CONFIG.WW.ATTRIBUTE_ICONS[attKey] ?? null,  
        label: attLabel
      },
      against: {
        tn: context.roll.against.customTn ?? 10,
        icon: CONFIG.WW.ATTRIBUTE_ICONS[against.key] ?? 'systems/weirdwizard/assets/ui/badges/octagonal.svg',
        label: CONFIG.WW.ROLL_AGAINST[against.key]
      }
    });

    // Prepare targets
    context.needTargets = item?.needTargets;

    if (this.targets.valid.length) {
      const valid = [];
      
      this.targets.valid.forEach(tar => {
        // Boons against count
        let boonsAgainst = 0;
        if (tar.boonsAgainst) boonsAgainst += tar.boonsAgainst[against.key];
        if (context.itemProperties.isAttack) boonsAgainst += tar.boonsAgainst.fromAttacks;
        if (context.itemProperties.isSpell) boonsAgainst += tar.boonsAgainst.fromSpells;
        if (context.itemProperties.isMagical) boonsAgainst += tar.boonsAgainst.fromMagical + tar.boons.resistMagical;

        valid.push({
          img: tar.img,
          name: tar.name,
          boonsAgainst: boonsAgainst,
          boonsIcon: `systems/weirdwizard/assets/icons/rolling-${boonsAgainst > 0 ? 'boons' : 'banes'}-colored.svg`,
          boonsTip: boonsAgainst > 0 ? _loc('WW.Boons.ExtraBoons') : _loc('WW.Boons.ExtraBanes'),
          againstNo: tar.againstNo,
          autoSuccess: against.key ? !!tar.autoSuccessAgainst?.[against.key] : false
        })

      });

      context.validTargets = valid;
    }

    // Prepare valid targets
    if (this.targets.invalid.length) {
      const invalid = [];
      
      this.targets.invalid.forEach(tar => {
        // Boons against count

        invalid.push({
          img: tar.img,
          name: tar.name
        })

      });

      context.invalidTargets = invalid;
    }

    // Targeting Modes
    if (context.targeting) {
      const targetingRestriction = context.targeting.restriction;
      context.targetingRestrictions = Object.entries(CONFIG.WW.TARGETING_RESTRICTIONS).map(([action, label]) => {
        return {label, action, active: action === targetingRestriction};
      });
    }
    
    // Message Modes
    const messageMode = game.settings.get("core", "messageMode");
    context.messageModes = Object.entries(CONFIG.ChatMessage.modes).map(([action, {label, icon}]) => {
      return {icon, label, action, active: action === messageMode};
    });

    // Dropdown select options
    context.attributeMods = Object.fromEntries(Object.entries(CONFIG.WW.ROLL_ATTRIBUTES).map(([key, loc]) => {
      const attributes = context.actor.system.attributes;
      const label = `${_loc(loc)} (${plusify(attributes[key]?.mod) ?? '+0'})`;

      return [key, key ? label : _loc(loc)];
    }));

    context.againstKeys = CONFIG.WW.ROLL_AGAINST;
    
    return context;
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static #onToggleRollDetails(event, target) {
    const open = target.parentNode.open;
    
    this.config.args.rollDetailsOpen = !open;
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static #changeSituationalBoons(event, target) {
    const parent = target.closest('.adjustment-widget');
    const action = target.dataset.action;

    if (action === 'situationalUp') {
      this.config.roll.boons.situational++;
    } else {
      this.config.roll.boons.situational--;
    }
    
    this.render();
  }

  /* -------------------------------------------- */
  /*  Targeting actions                           */
  /* -------------------------------------------- */

  /**
   * Prompt target selection.
   */
  static #selectTargets() {
    const context = {
      originApp: this,
      actor: this.config.actor
    }

    // Activate TargetingHelper app
    const targetingHelper = new TargetingHelper(context);
    targetingHelper.render(true);
    this.targetingHelper = targetingHelper;
  }

  /* -------------------------------------------- */

  /**
   * Scene region selection.
   */
  static #placeArea() {
    this.config.item.placeArea({ originApp: this });
  }

  /* -------------------------------------------- */

  /**
   * Handle changing the targeting restriction.
   * @type {ApplicationClickAction}
   */
  static #onChangeTargetingRestriction(event, target) {
    const restriction = target.dataset.restriction;
    
    this.config.targeting.restriction = restriction;
    this.render();
  }

  /* -------------------------------------------- */
  /*  Other actions                               */
  /* -------------------------------------------- */

  /**
   * Handle changing the message mode.
   * @type {ApplicationClickAction}
   */
  static #onChangeMessageMode(event, target) {
    const mode = target.dataset.mode;
    game.settings.set("core", "messageMode", mode);
    this.render();
  }

  /* -------------------------------------------- */
  /*  Lifecycle & Form handling                   */
  /* -------------------------------------------- */

  #resolvers = Promise.withResolvers();

  get promise() { return this.#resolvers.promise; };

  /* -------------------------------------------- */

  /**
   * Create an Activity app instance and wait for it to be closed or confirmed.
   * @param config
   * @returns {Promise<any>}
   */

  static async wait(options) {
    const app = new this(options);
    app.render(true);
    return app.promise;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    
    const formData = foundry.utils.expandObject(new foundry.applications.ux.FormDataExtended(this.element).object);

    this._refreshInputs(formData);

    // Ensures the next input can be selected before re-rendering, maintaining focus while transitioning inputs.
    setTimeout(() => this.render(), 20);
  }

  /* -------------------------------------------- */

  /**
   * Refresh all inputs based on changed values.
   * @param {Record<string, unknown>} formData
   */
  _refreshInputs(formData) {
    for (const [key1, value1] of Object.entries(formData)) {
      for (const [key2, value2] of Object.entries(value1)) {
        this.config[key1][key2] = value2;
      }
    }
  }
  
  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
   * @this {ActivityUse}
   */
  static async #confirm(event, target) {
    this.#resolvers.resolve(this.config);
    this.close();
  }

  /* -------------------------------------------- */

  /** @override */
  _onClose(options) {
    this.#resolvers.resolve(null);

    // Turn off targeting hook
    Hooks.off('targetToken');

    // Close Targeting Helper
    if (this.targetingHelper) this.targetingHelper.close();

    // Maximize related Actor sheet
    if (this.config.actor) this.config.actor.sheet.maximize();
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  get targets() {
    return this.config.actor.getActivityTargets(this.config);
  }

  /* -------------------------------------------- */

  get actEffs() {
    return this.config.actor.getActivityActiveEffects(this.config);
  }

  /* -------------------------------------------- */

  get instEffs() {
    return this.config.actor.getActivityInstantEffects(this.config);
  }

}