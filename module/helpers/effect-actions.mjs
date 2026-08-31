import { sysPath } from './utils.mjs';
import InstantEffectConfig from '../sheets/configs/instant-effect-config.mjs';
import WWDialog from '../apps/dialog.mjs';

/* -------------------------------------------- */
/*  Instant Effect handling actions             */
/* -------------------------------------------- */

/**
  * Handle creating a new Owned Effect for the actor using initial data defined in the HTML dataset
  * @param {Actor|Item}  owner    The owning entity which manages this effect
*/
export async function createInstantEffect(owner) {
  const arr = owner.system.instant;

  const effectData = {
    label: 'damage',
    trigger: 'onUse',
    target: 'tokens',
    value: '1d6',
    affliction: 'Blinded'
  }
    
  arr.push(effectData);

  await owner.update({ 'system.instant': arr });
  
  return new InstantEffectConfig(arr.length-1, owner).render(true);
}

/**
 * Handle editing an Owned Effect for the actor using initial data defined in the HTML dataset
  * @param {InstantEffect} effect    The effect being edited
  * @param {Actor|Item}   owner     The owning entity which manages this effect
*/
export function editInstantEffect(effect, owner) {
  new InstantEffectConfig(effect.id, owner).render(true);
}

/**
  * Handle delete of an Owned Effect for the actor using initial data defined in the HTML dataset
  * @param {InstantEffect} effect    The effect being editedt
  * @param {Actor|Item}   owner     The owning entity which manages this effect
*/
export async function deleteInstantEffect(effect, owner) {
  const arr = owner.system.instant;

  // Confirm Dialog
  const confirm = await WWDialog.confirm({
    window: {
      title: 'WW.Item.Remove.Dialog.Title',
      icon: 'fa-solid fa-trash'
    },
    content: `
      <div>${_loc('WW.Item.Remove.Dialog.Msg', { name: '<b>' + _loc(effect.labelLoc) + '</b>' })}</div>
      <div class="dialog-sure">${_loc('WW.Item.Remove.Dialog.Confirm', { name: _loc(effect.labelLoc) })}</div>
    `
  });

  if (!confirm) return;

  if (effect.id > -1) { // only splice array when item is found
    arr.splice(effect.id, 1); // 2nd parameter means remove one item only
  }

  return owner.update({ 'system.instant': arr });
}

/* -------------------------------------------- */
/*  Active Effect handling actions              */
/* -------------------------------------------- */

/**
  * Handle creating a new Owned Effect for the actor using initial data defined in the HTML dataset
  * @param {Object}      dataset  The dataset provided for the new effect
  * @param {Actor|Item}  owner    The owning entity which manages this effect
*/
export async function createActiveEffect(dataset, owner) {
  const name = _loc('WW.Effect.New') // Initialize a default name.
  const type = dataset.type;
  const isTemp = type === 'temporary';

  // Prepare the effect object.
  const effectData = {
    name: name,
    img: owner.img,
    origin: owner.uuid,
    disabled: type === 'inactive',

    // Duration (Until the end of the round)
    duration: {
      value: isTemp ? 0 : null,
      units: 'rounds',
      expiry: isTemp ? 'roundEnd' : null
    },
    
    // System
    system: {
      durationPreset: isTemp ? '1round' : '',
      trigger: isTemp ? 'onUse' : 'passive'
    }
  };
  
  // Create the effect
  const effects = Array.from(await owner.effects);
  effects.push(effectData);
  const createdEffect = await ActiveEffect.create(effectData, { parent: owner, keepId: true });

  // Render the created effect's template
  createdEffect.sheet.render(true);

  return;
}

/**
 * Handle editing an Owned Effect for the actor using initial data defined in the HTML dataset
  * @param {ActiveEffect} effect    The effect being edited
  * @param {Actor|Item}   owner     The owning entity which manages this effect
*/
export function editActiveEffect(effect, owner) {
  effect.sheet.render(true);
}

/**
  * Handle delete of an Owned Effect for the actor using initial data defined in the HTML dataset
  * @param {ActiveEffect} effect    The effect being editedt
  * @param {Actor|Item}   owner     The owning entity which manages this effect
*/
export async function deleteActiveEffect(effect, owner) {

  // Confirm Dialog
  const confirm = await WWDialog.confirm({
    window: {
      title: 'WW.Item.Remove.Dialog.Title',
      icon: 'fa-solid fa-trash'
    },
    content: `
      <div>${_loc('WW.Item.Remove.Dialog.Msg', { name: '<b>' + effect.name + '</b>' })}</div>
      <div class="dialog-sure">${_loc('WW.Item.Remove.Dialog.Confirm', { name: effect.name })}</div>
    `
  });

  if (!confirm) return;

  effect.delete();
}

/* -------------------------------------------- */
/*  Other effect actions                        */
/* -------------------------------------------- */

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @param {Boolean} showDuration      Show effect duration on page
 * @param {Boolean} showSource        Show effect source on page
 * @param {Boolean} showControls      Show control buttons on page
 * @param {Boolean} showCreate        Show create buttons on page
 * @return {Object}                   Data for rendering
*/
export async function prepareActorEffectCategories(document, options={}) {
  const { showDuration = false, showSource = true, showControls = true, showCreate = false } = options;
  const base = {
    showDuration,
    showSource,
    showControls,
    showCreate
  };

  // Define effect categories
  const categories = {
    afflictions: { ...base,
      id: 'afflictions',
      name: 'WW.Affliction.Label',
      showDuration: true,
      effects: []
    },
    temporary: { ...base,
      id: 'temporary',
      name: 'WW.Effects.Temporary',
      showCreate: true,
      showDuration: true,
      effects: []
    },
    benefits: { ...base,
      id: 'benefits',
      name: 'WW.Effects.Benefits',
      showControls: false,
      effects: []
    },
    item: { ...base,
      id: 'item',
      name: 'WW.Effects.Item',
      showControls: false,
      effects: []
    },
    actor: { ...base,
      id: 'actor',
      name: 'WW.Effects.Actor',
      showCreate: true,
      effects: []
    },
    disabled: { ...base,
      id: 'disabled',
      name: 'WW.Effects.Inactive',
      effects: []
    }
  }

  // Iterate through applied effects, then push them to categories
  for (const effect of document.appliedEffects) {
    const e = await getEffectData(effect);

    // Assign to correct category
    if (e.type === 'affliction') categories.afflictions.effects.push(e);
    else if (e.isTemporary) categories.temporary.effects.push(e);
    else if (e.type === 'benefit') categories.benefits.effects.push(e);
    else if (e.item) categories.item.effects.push(e);
    else categories.actor.effects.push(e);
  }
  
  // Iterate through effects, then push them to categories
  for (const effect of document.effects) {
    const e = await getEffectData(effect);

    // Assign to disabled
    if (e.disabled) categories.disabled.effects.push(e);
  }
  
  return categories;
}

/* -------------------------------------------- */

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @param {Boolean} showDuration      Show effect duration on page
 * @param {Boolean} showSource        Show effect source on page
 * @param {Boolean} showControls      Show control buttons on page
 * @param {Boolean} showCreate        Show create buttons on page
 * @return {Object}                   Data for rendering
*/
export async function prepareItemEffectCategories(document, options={}) {
  const { showDuration = false, showSource = true, showControls = true, showCreate = true } = options;
  const base = {
    showDuration,
    showSource,
    showControls,
    showCreate
  };

  // Define effect categories
  const categories = {
    temporary: { ...base,
      id: 'temporary',
      name: 'WW.Effects.Temporary',
      showDuration: true,
      effects: []
    },
    permanent: { ...base,
      id: 'permanent',
      name: 'WW.Effects.Permanent',
      effects: []
    }
  }

  // Iterate through effects, then push them to categories
  for (const effect of document.effects) {
    const e = await getEffectData(effect);

    // Assign to correct category
    if (e.isTemporary) categories.temporary.effects.push(e);
    else categories.permanent.effects.push(e);
  }
  
  return categories;
}

/* -------------------------------------------- */

/**
 * Modify effect data to include new prepared data.
 * @param {ActiveEffect} effect 
 * @returns {ActiveEffect}
 */
const getEffectData = async (effect) => {
  const context = {
    label: effect.name,
    system: effect.system,
    img: effect.img,
    type: effect.type,

    subtitle: _loc((effect.duration.rounds || effect.duration.seconds) ? "WW.Effect.Temporary" : "WW.Effect.Permanent"),
    text: await foundry.applications.ux.TextEditor.implementation.enrichHTML(effect.description, { secrets: effect.isOwner }),
    changes: ''
  }

  // Prepare changes
  for (const c of effect.changes) {
    const label = CONFIG.WW.EFFECT_CHANGE_PRESET_LABELS[c.preset] ? _loc(CONFIG.WW.EFFECT_CHANGE_PRESET_LABELS[c.preset]) : c.key;
    context.changes += `<li>${label} ${(c.value !== true) ? `${c.value}.` : ''}</li>`;
  }

  effect.tooltip = await foundry.applications.handlebars.renderTemplate(sysPath(`templates/apps/tooltips/effect.hbs`), context);

  // Prepare source document cards
  if (effect.origin) {
    const source = `@UUID[${effect.origin}]`;

    effect.sourceCard = await foundry.applications.ux.TextEditor.implementation.enrichHTML(source, { secrets: effect.isOwner });
  } else {
    effect.sourceCard = effect.sourceName;
  }

  return effect;
}