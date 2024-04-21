//import {calcEffectRemainingRounds, calcEffectRemainingSeconds, calcEffectRemainingTurn} from "../combat/combat.mjs";
import { i18n } from "./utils.mjs";
import InstantEffectConfig from '../apps/instant-effect-config.mjs'

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
  let categories = {
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

  // Iterate over active effects, classifying them into categories.
  for (let e of effects) {
    // Also set the 'remaining time' in seconds or rounds depending on if in combat
    /*if (e.isTemporary && (e.duration.seconds || e.duration.rounds || e.duration.turns)) {
      if (game.combat) {
        if (e.duration.turns > 0) {
          const rr = calcEffectRemainingRounds(e, game.combat.round)
          const rt = calcEffectRemainingTurn(e, game.combat.turn)
          const sr = `${rr} ${Math.abs(rr) > 1 ? i18n('COMBAT.Rounds') : i18n('COMBAT.Round')}`
          const st = `${rt} ${Math.abs(rt) > 1 ? i18n('COMBAT.Turns') : i18n('COMBAT.Turn')}`
          e.dlRemaining = sr + ' ' + st
        }
        else {
          const r = calcEffectRemainingRounds(e, game.combat.round)
          e.dlRemaining = `${r} ${Math.abs(r) > 1 ? i18n('COMBAT.Rounds') : i18n('COMBAT.Round')}`
        }
      } else {
        const r = calcEffectRemainingSeconds(e, game.time.worldTime)
        e.dlRemaining = `${r} ${i18n('TIME.Seconds')}`
      }
    } else {
      e.dlRemaining = e.duration.label
    }*/

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
      // Skip tokens in combat to avoid too early expiration
      //if (t.combatant?.combat?.started) continue;
      
      // Don't do anything for actors without this function (e.g. basic actors)
      if (!t.actor?.expireActiveEffects) continue;
      
      t.actor.expireActiveEffects();
    }
  }
}
