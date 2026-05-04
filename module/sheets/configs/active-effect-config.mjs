import WWSheetMixin from '../ww-sheet.mjs';
import { getEffectChangeMeta } from '../../helpers/effect-presets.mjs';
import { makeBooField, makeFloField, makePosIntField, makeStrField } from '../../data/field-presets.mjs';
import CharacterModel from '../../data/actors/character.mjs';
import WWActor from '../../documents/actor.mjs';


export default class WWActiveEffectConfig extends WWSheetMixin(foundry.applications.sheets.ActiveEffectConfig) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ["weirdwizard", "sheet"],
    position: { width: 580 },
    form: {
      closeOnSubmit: false,
      submitOnChange: true,
    }
  }

  /** @inheritdoc */
  static PARTS = {
    ...super.PARTS,
    
    tabs: {
      template: 'systems/weirdwizard/templates/generic/side-tabs.hbs'
    },
    details: {
      template: "systems/weirdwizard/templates/sheets/active-effects/details.hbs",
    },
    duration: {
      template: "systems/weirdwizard/templates/sheets/active-effects/duration.hbs",
    },
    changes: {
      template: "systems/weirdwizard/templates/sheets/active-effects/changes.hbs",
      templates: ["systems/weirdwizard/templates/sheets/active-effects/change.hbs"],
      scrollable: ["ol[data-changes]"]
    }
  }

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        {id: "details", tooltip: 'EFFECT.TABS.details', icon: "systems/weirdwizard/assets/icons/scroll-quill.svg", iconType: 'img'},
        {id: "duration", tooltip: 'EFFECT.TABS.duration', icon: "systems/weirdwizard/assets/icons/empty-hourglass.svg", iconType: 'img'},
        {id: "changes", tooltip: 'EFFECT.TABS.changes', icon: "systems/weirdwizard/assets/icons/sparkles.svg", iconType: 'img'}
      ],
      initial: "details",
      labelPrefix: "EFFECT.TABS"
    }
  };

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.buttons = [];
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _preparePartContext(partId, context) {
    const partContext = await super._preparePartContext(partId, context);
    if ( partId in partContext.tabs ) partContext.tab = partContext.tabs[partId];
    const effect = this.document;
    
    switch (partId) {
      // Details Tab
      case "details":
        // If effect has duration, use instant triggers since they remove "passive" option
        partContext.triggers = this.document.isTemporary ? CONFIG.WW.INSTANT_TRIGGERS : CONFIG.WW.EFFECT_TRIGGERS;
        partContext.targets = CONFIG.WW.EFFECT_TARGETS;
        break;

      // Duration tab
      case 'duration': {
        // Prepare options for the duration preset dropdown
        partContext.durationOptions = CONFIG.WW.EFFECT_DURATIONS;

        // Pass down durations to display - not needed anymore?
        partContext.formattedStartTime = game.weirdwizard.utils.formatTime(this.document.duration.startTime, 1);
      } break;

      // Changes tab
      case 'changes': {
        const fields = effect.system.schema.fields.changes.element.fields;
        
        // Prepare change preset options
        const changePresetOptions = [{
          value: 'custom',
          label: _loc("WW.Effect.Keys.Custom")
        }];

        for (const [groupKey, groupData] of Object.entries(CONFIG.WW.EFFECT_CHANGE_PRESET_DATA)) {
          const group = _loc(groupData.header);

          for (const [presetKey, presetData] of Object.entries(groupData.options)) {  
            changePresetOptions.push({
              value: presetKey,
              label: _loc(presetData.label),
              group
            })
          }
        }

        // Prepare changeTypes
        const changeTypes = Object.entries(ActiveEffect.CHANGE_TYPES)
          .map(([type, {label}]) => ({type, label: _loc(label)}))
          .sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang))
          .reduce((types, {type, label}) => {
            types[type] = label;
            return types;
          }, {});
        
        // Prepare changes
        partContext.changes = await Promise.all(foundry.utils.deepClone(context.source.changes).map((change, index) => {
          const defaultPriority = ActiveEffect.CHANGE_TYPES[change.type]?.defaultPriority;
          
          const changeDataPreset = getEffectChangeMeta(change.preset); // TODO - Remove this intermediary function
          const valueType = changeDataPreset?.valueType ?? 'str';
          
          // Pass preset data to the change
          change = {
            ... change,
            ... changeDataPreset,
            key: CONFIG.WW.EFFECT_CHANGE_PRESET_KEYS[change.preset] ?? change.key
          };

          // Assign field
          switch (valueType) { // TODO - Automate somehow using character.schema.getField(change.key) or something else
            case 'boo': change.field = makeBooField(true); break;
            case 'flo': change.field = makeFloField(); break;
            case 'int': change.field = makePosIntField(); break;
            case 'str': change.field = makeStrField(); break;
            default: change.field = makeStrField(); break;
          }
          
          // Ensure integer field does not have true or false as value
          if (valueType === 'int' && (change.value === 'true' || change.value === 'false')) change.value = 1;

          change.typedValue = change.field.clean(change.value);

          return this._renderChange({change, index, fields, defaultPriority, changeTypes, changePresetOptions});
        }));
        
      } break;
    }

    return context;
  }

  /* ----------------------------------------- */

  /**
   * @override
   * Prepare render context for a single change object.
   * @param {object} context                   Data for rendering the change row
   * @param {EffectChangeData} context.change  A copy of the change from the Effect's source array
   * @param {number} context.index             The change object's index in the array
   * @param {DataSchema} context.fields        The defined fields of the change data
   * @param {number} context.defaultPriority   The change type's default priority
   * @param {Record<string, string>} context.changeTypes All change types and their localized labels
   * @returns {Promise<string>}
   * @protected
   */
  async _renderChange(context) {
    const {change, index} = context;

    if ( typeof change.value !== "string" ) change.value = JSON.stringify(change.value);
    Object.assign(
      change,
      ["key", "type", "value", "phase", "priority", "preset"].reduce((paths, fieldName) => {
        paths[`${fieldName}Path`] = `system.changes.${index}.${fieldName}`;
        return paths;
      }, {}));
    
    return ActiveEffect.CHANGE_TYPES[change.type].render?.(context)
      ?? foundry.applications.handlebars.renderTemplate("systems/weirdwizard/templates/sheets/active-effects/change.hbs", context);
  }

  /* -------------------------------------------- */
  /*  Form Submission                             */
  /* -------------------------------------------- */

  /** @override */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);

    // Re-submit the form if a change key is changed to update the change on the Actor
    if (event.target instanceof HTMLSelectElement && event.target.name.endsWith(".key")) {
      this.submit({ preventClose: true });
    }
  }

  /* -------------------------------------------- */

  /**
   * @override
   * Submit a document update or creation request based on the processed form data.
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {object} submitData                   Processed and validated form data to be used for a document update
   * @param {Partial<DatabaseCreateOperation|DatabaseUpdateOperation>} [options] Additional options altering the request
   * @returns {Promise<void>}
   * @protected
   */
  async _processSubmitData(event, form, submitData, options={}) {
    // Update duration
    const sysDur = submitData.system.duration;
    let inSeconds = null;
    
    if (!submitData.duration) submitData.duration = {};
    
    switch (submitData.system.duration.selected) {
      case 'minutes': 
        inSeconds = sysDur.inMinutes ? sysDur.inMinutes * 60 : 60;
        submitData.duration = { seconds: inSeconds, rounds: null };
        if (!sysDur.inMinutes) sysDur.inMinutes = 1;
      break;

      case 'hours':
        inSeconds = sysDur.inHours ? sysDur.inHours * 60*60 : 60*60;
        submitData.duration = { seconds: inSeconds, rounds: null };
        if (!sysDur.inHours) sysDur.inHours = 1;
      break;

      case 'days':
        inSeconds = sysDur.inDays ? sysDur.inDays * 60*60*24 : 60*60*24;
        submitData.duration = { seconds: inSeconds, rounds: null };
        if (!sysDur.inDays) sysDur.inDays = 1;
      break;

      case 'none':
        submitData.duration = { seconds: null, rounds: null };
      break;
    }
    
    // Submit processed data
    return super._processSubmitData(event, form, submitData, options);
  }

}