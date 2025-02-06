//import {calcEffectRemainingRounds, calcEffectRemainingSeconds, calcEffectRemainingTurn} from "../combat/combat.mjs";
import { i18n } from './utils.mjs';
import InstantEffectConfig from '../sheets/instant-effect-config.mjs'

/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
*/

export async function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest('li');
  const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
  switch ( a.dataset.action ) {
    case 'create':
      return owner
        .createEmbeddedDocuments('ActiveEffect', [{
          name: i18n('WW.Effect.New'),
          icon: /*isCharacter ? 'icons/magic/symbols/chevron-elipse-circle-blue.webp' :*/ owner.img,
          origin: owner.uuid,
          'duration.rounds': li.dataset.effectType === 'temporary' ? 1 : undefined,
          'flags.weirdwizard.selectedDuration': li.dataset.effectType === 'temporary' ? '1round' : '',
          'flags.weirdwizard.autoDelete': true,
          disabled: li.dataset.effectType === 'inactive'
        },
      ])
      .then(effects => effects[0].sheet.render(true));
    case 'edit':
      return effect.sheet.render(true);
    case 'delete':
      return await effect.delete();
    case 'toggle':
      return await effect.update({ disabled: !effect.disabled });
  }
}

/**
 * Manage Instant Effect instances through the Actor Sheet via instant control buttons.
 * @param {MouseEvent} event      The left-click event on the instant control
 * @param {Item} owner      The owning item document which manages this effect
*/

export async function onManageInstantEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest('li');
  const effectId = li.dataset.effectId;
  //const effect = effectId ? owner.system.instant[effectId] : null;
  
  switch ( a.dataset.action ) {
    case 'create': {
      let arr = owner.system.instant;
      const obj = {
        label: 'damage',
        trigger: 'onUse',
        target: 'tokens',
        value: '1d6',
        affliction: 'Blinded'
      }
    
      arr.push(obj);
      owner.update({ 'system.instant': arr });
      
      return new InstantEffectConfig(owner, arr.length-1).render(true);
    }
      
    case 'edit':
      return new InstantEffectConfig(owner, effectId).render(true);
      
    case 'delete': {
      let arr = owner.system.instant;
      arr.splice(effectId, 1);

      return owner.update({ 'system.instant': arr });
    }
      
  }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @param {Boolean} showDuration      Show effect duration on page
 * @param {Boolean} showSource        Show effect source on page
 * @param {Boolean} showControls      Show control buttons on page
 * @param {Boolean} showCreate        Show create buttons on page
 * @return {object}                   Data for rendering
*/

export function prepareActiveEffectCategories(effects, showDuration = false, showSource = true, showControls = true, showCreate = true) {

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
    // Prepare tooltips
    let tooltip = `<h2>${i18n(e.name)}</h2>
      <div>${i18n(e.description)}</div>
      <ul>`;

    for (const c of e.changes) {
      const label = CONFIG.WW.EFFECT_CHANGE_LABELS[c.key] ? i18n(CONFIG.WW.EFFECT_CHANGE_LABELS[c.key]) : 'BROKEN EFFECT CHANGE, FIX IT!';
      tooltip += `<li>${label} ${(c.value !== true) ? `${c.value}.` : ''}</li>`;
    }

    tooltip += `</ul>`;
    
    e.tooltip = tooltip;

    // Push them into categories
    if (e.disabled) categories.inactive.effects.push(e)
    else if (e.isTemporary) categories.temporary.effects.push(e)
    //else if (e.parent instanceof Item) categories.item.effects.push(e)
    else categories.permanent.effects.push(e)
  }

  return categories
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
