import { i18n, sysPath } from './utils.mjs';
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
      <div>${i18n('WW.Item.Remove.Dialog.Msg', { name: '<b>' + i18n(effect.locLabel) + '</b>' })}</div>
      <div class="dialog-sure">${i18n('WW.Item.Remove.Dialog.Confirm', { name: i18n(effect.locLabel) })}</div>
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
  
  const name = i18n('WW.Effect.New') // Initialize a default name.
  const type = dataset.type;
  const isTemp = type === 'temporary';

  // Prepare the effect object.
  const effectData = {
    name: name,
    img: owner.img,
    origin: owner.uuid,
    disabled: type === 'inactive',
    'duration.type': type === 'temporary' ? 'seconds' : 'none',
    'duration.seconds': isTemp ? 3600 : null,
    'duration.rounds': isTemp ? 1 : undefined,
    'system.duration.selected': isTemp ? '1round' : '',
    'system.duration.autoExpire': true,
    'system.trigger': isTemp ? 'onUse' : 'passive'
  };
  
  // Create the effect
  const effects = Array.from(await owner.effects);
  effects.push(effectData);
  const createdEffect = await ActiveEffect.create(effectData, { parent: owner });

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
      <div>${i18n('WW.Item.Remove.Dialog.Msg', { name: '<b>' + effect.name + '</b>' })}</div>
      <div class="dialog-sure">${i18n('WW.Item.Remove.Dialog.Confirm', { name: effect.name })}</div>
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
export async function prepareActiveEffectCategories(effects, showDuration = false, showSource = true, showControls = true, showCreate = true) {

  // Define effect header categories
  const categories = {
    temporary: {
      type: 'temporary',
      name: 'WW.Effects.Temporary',
      showDuration: true,
      showSource: showSource,
      showControls: showControls,
      showCreate: showCreate,
      effects: [],
    },
    permanent: {
      type: 'permanent',
      name: 'WW.Effects.Permanent',
      showDuration: showDuration,
      showSource: showSource,
      showControls: showControls,
      showCreate: showCreate,
      effects: [],
    },
    inactive: {
      type: 'inactive',
      name: 'WW.Effects.Inactive',
      showDuration: showDuration,
      showSource: showSource,
      showControls: showControls,
      showCreate: false,
      effects: [],
    },
  }
  
  // Iterate over active effects
  for (const e of effects) {
    const context = {
      label: e.name,
      system: e.system,
      img: e.img,
      type: e.type,

      subtitle: i18n((e.duration.rounds || e.duration.seconds) ? "WW.Effect.Temporary" : "WW.Effect.Permanent"),
      text: await foundry.applications.ux.TextEditor.implementation.enrichHTML(e.description, { secrets: e.isOwner }),
      changes: ''
    }

    // Prepare changes
    for (const c of e.changes) {
      const label = CONFIG.WW.EFFECT_CHANGE_LABELS[c.key] ? i18n(CONFIG.WW.EFFECT_CHANGE_LABELS[c.key]) : 'BROKEN EFFECT CHANGE, FIX IT!';
      context.changes += `<li>${label} ${(c.value !== true) ? `${c.value}.` : ''}</li>`;
    }

    e.tooltip = await foundry.applications.handlebars.renderTemplate(sysPath(`templates/apps/tooltips/effect.hbs`), context);

    // Prepare source document cards
    if (e.origin) {
      const source = `@UUID[${e.origin}]`;
    
      e.sourceCard = await foundry.applications.ux.TextEditor.implementation.enrichHTML(source, { secrets: e.isOwner });
    } else {
      e.sourceCard = e.sourceName;
    }
    
    // Push them into categories
    if (await e.disabled) categories.inactive.effects.push(e);
    else if (await e.isTemporary) categories.temporary.effects.push(e);
    else categories.permanent.effects.push(e);
  }
  
  return categories;
}

export function expireFromTokens() {
  if (game.users.activeGM?.isSelf) {
    for (const t of canvas.tokens.placeables) {
      
      // Don't do anything for actors without this function (e.g. basic actors)
      if (!t.actor?.expireActiveEffects) continue;
      
      t.actor.expireActiveEffects();
    }
  }
}
