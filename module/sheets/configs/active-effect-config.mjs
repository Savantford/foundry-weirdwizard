import WWSheetMixin from '../ww-sheet.mjs';
import { getEffectChangeMeta } from '../../helpers/effect-presets.mjs';
import { makeBooField, makeFloField, makePosIntField, makeStrField } from '../../data/field-presets.mjs';
import CharacterModel from '../../data/actors/character.mjs';
import WWActor from '../../documents/actor.mjs';


export default class WWActiveEffectConfig extends WWSheetMixin(foundry.applications.sheets.ActiveEffectConfig) {
  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ["weirdwizard", "sheet"],
    position: { width: 580 }
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
  async _preparePartContext(partId, context) {
    const partContext = await super._preparePartContext(partId, context);
    if ( partId in partContext.tabs ) partContext.tab = partContext.tabs[partId];
    const effect = await this.document;
    
    switch (partId) {
      // Details Tab
      case "details":
        // If effect has duration, use instant triggers since they remove "passive" option
        partContext.triggers = this.document.isTemporary ? CONFIG.WW.INSTANT_TRIGGERS : CONFIG.WW.EFFECT_TRIGGERS;
        partContext.targets = CONFIG.WW.EFFECT_TARGETS;
        break;

      // Duration tab
      case 'duration': {
        const fields = effect.system.schema.fields;

        // Prepare options for the duration preset dropdown
        partContext.durationPresetOptions = [
          {
            value: 'custom',
            label: _loc("WW.Effect.DurationPresets.Custom"),
          },
          ... Object.entries(CONFIG.WW.EFFECT_DURATION_PRESETS).map(([value, label]) => ({
            value,
            label,
            group: _loc('WW.Effect.DurationPresets.Label')
          }))
        ];

        // Other duration related variables
        partContext.systemFields = fields;
        partContext.formattedDuration = effect.formattedDuration;
        partContext.durationIsTimeBased = CONST.ACTIVE_EFFECT_TIME_DURATION_UNITS.includes(effect.duration.units);

        if (effect.start) partContext.startTime = partContext.durationIsTimeBased
          ? game.time.calendar.format(effect.start.time, 'formatDuration') : null;
        
      } break;

      // Changes tab
      case 'changes': {
        const fields = effect.system.schema.fields.changes.element.fields;
        
        // Prepare change preset options
        const changePresetOptions = [{
          value: 'custom',
          label: _loc("WW.Effect.ChangePresets.Custom")
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

          // Render change
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
  /*  Form Handling                               */
  /* -------------------------------------------- */

  /** @override */
  _onChangeForm(formConfig, event) {
    super._onChangeForm(formConfig, event);
    
    // Submit the form if a Change Preset or Duration Preset is changed
    if (event.target instanceof HTMLSelectElement && (event.target.name.endsWith(".preset")) || event.target.name.endsWith(".durationPreset")) {
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
    // Check the Duration Preset and apply modifications
    const effDur = this.document.duration;
    const submitDur = submitData.duration;
    const dur = {
      value: submitDur?.value ? submitDur?.value : (effDur.value === Infinity ? null : effDur.value),
      units: submitDur?.units ?? effDur.units,
      expiry: submitDur?.expiry ?? effDur.expiry
    };

    switch (submitData.system.durationPreset) {
      case '': submitData.duration = { value: null, units: dur.units, expiry: null }; break;
      case 'custom': submitData.duration = { value: dur.value, units: dur.units, expiry: dur.expiry }; break;

      // Combat Rounds duration (value 0 means next)
      case 'luckEnds': submitData.duration = { value: null, units: dur.units, expiry: 'luckEnds' }; break;
      case '1round': submitData.duration = { value: 0, units: 'rounds', expiry: 'roundEnd' }; break;
      case '2rounds': submitData.duration = { value: 1, units: 'rounds', expiry: 'roundEnd' }; break;
      case 'turnEnd': submitData.duration = { value: 0, units: 'rounds', expiry: 'turnEnd' }; break;
      case 'nextTriggerTurnStart': submitData.duration = { value: 0, units: 'rounds', expiry: 'turnStart' }; break;
      case 'nextTargetTurnStart': submitData.duration = { value: 0, units: 'rounds', expiry: 'turnStart' }; break;
      case 'nextTriggerTurnEnd': submitData.duration = { value: 0, units: 'rounds', expiry: 'turnEnd' }; break;
      case 'nextTargetTurnEnd': submitData.duration = { value: 0, units: 'rounds', expiry: 'turnEnd' }; break;

      // World Time duration
      case '1minute': submitData.duration = { value: 1, units: 'minutes', expiry: null }; break;
    }

    // Update Changes
    const effChanges = this.document.system.changes;

    submitData.system.changes?.forEach((change, index) => {
      // Apply preset
      if (change.preset !== effChanges[index].preset) {
        // Pass preset data to the change
        submitData.system.changes[index] = {
          ...change,
          ...getEffectChangeMeta(change.preset), // TODO - Improve this
          key: CONFIG.WW.EFFECT_CHANGE_PRESET_KEYS[change.preset] ?? change.key
        };
      }
      
    })
    
    // Submit processed data
    return super._processSubmitData(event, form, submitData, options);
  }

}