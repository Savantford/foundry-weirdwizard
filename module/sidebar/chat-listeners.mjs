import { i18n } from '../helpers/utils.mjs';
import MultiChoice from '../apps/multi-choice.mjs';
import RollDamage from '../dice/roll-damage.mjs';
import WWRoll from '../dice/roll.mjs';

/* -------------------------------------------- */
/*  Chat methods                                */
/* -------------------------------------------- */

//const tokenManager = new TokenManager()

export function initChatListeners(html, message, context) {
  // Rolling for Instant Effects
  html.querySelectorAll('.chat-button[data-action*=roll]').forEach((el, i) => { el.addEventListener('click', _onInstantEffectRoll); });
  html.querySelectorAll('.enricher-roll').forEach((el, i) => { el.addEventListener('click', _onInstantEffectRoll); });

  // Attribute Call (Enricher)
  html.querySelectorAll('.enricher-call').forEach((el, i) => { el.addEventListener('click', (ev) => { _onMultiChoice(ev, 'attributeCall') }); });

  // Effect Application Multi-Choice
  html.querySelectorAll('.chat-button[data-action*=apply]').forEach((el, i) => { el.addEventListener('click', (ev) => { _onMultiChoice(ev, 'applyEffect') }); });

  // Open Sheet from chat
  html.querySelectorAll('[data-action=open-sheet]').forEach((el, i) => { el.addEventListener('click', _onOpenSheet); });

  // Collapse descriptions
  html.querySelector('.chat-message-collapse')?.addEventListener('click', (ev) => _onMessageCollapse(html));
}

/* -------------------------------------------- */

/** 
 * Handle roll started from a chat button.
 */
function _onInstantEffectRoll(event) {
  event.preventDefault()
  const button = event.currentTarget;
  const dataset = Object.assign({}, button.dataset);
  
  switch (dataset.action) {
    // Instant Effect Rolls
    case 'rollDamage': new RollDamage(dataset).render(true); break;
    case 'rollHealing': _onChatRoll(dataset, 'WW.InstantEffect.HealOf', 'applyHealing'); break;
    case 'rollHealthLoss': _onChatRoll(dataset, 'WW.InstantEffect.HealthLoseOf', 'applyHealthLoss'); break;
    case 'rollHealthRegain': _onChatRoll(dataset, 'WW.InstantEffect.HealthRegainedBy', 'applyHealthRegain'); break;
    default: _onChatRoll(dataset); break;
  }
  
}

/* -------------------------------------------- */

/**
  * Handle opening of a context menu from a chat button.
  * @param {HTMLElement} element     The element the menu opens on.
*/
function _onMultiChoice(ev, purpose) {
  
  const element = ev.currentTarget;
  const user = game.user;
  const menuItems = [];
  
  // Get pre-selected targets
  const preTargetIds = element.dataset.targetIds ? element.dataset.targetIds.split(',') : [];
  const preTargets = [];
  
  preTargetIds.forEach(t => {
    if(game.actors.tokens[t]) preTargets.push(game.actors.tokens[t]);
  })

  // Assign pre-selected Targets, if any exists
  if (preTargets) {
    preTargets.forEach(actor => {
      
      if (actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) menuItems.push({
        label: game.weirdwizard.utils.getAlias({ actor: actor }),
        img: actor.token ? actor.token.texture.src : actor.img,
        tip: `ID: ${actor.uuid}`,
        group: 'pre-targets',
        uuid: actor.uuid
      });
    
    })
  }

  // Assign user's targets, if any exists
  if (game.user.targets.size) {
    game.user.targets.forEach(token => {
      const actor = token.document.actor;
      
      if (actor && actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) menuItems.push({
        label: game.weirdwizard.utils.getAlias({ actor: actor }),
        img: actor.token ? actor.token.texture.src : actor.img,
        tip: `ID: ${actor.uuid}`,
        group: 'targets',
        uuid: actor.uuid
      });
    
    })
  }

  // Assign user's selected tokens, if any exists
  if (canvas.tokens.controlled) {
    
    canvas.tokens.controlled.forEach(token => {
      const actor = token.document.actor;
      
      if (actor && actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) menuItems.push({
        label: game.weirdwizard.utils.getAlias({ actor: actor }),
        img: actor.token ? actor.token.texture.src : actor.img,
        tip: `ID: ${actor.uuid}`,
        group: 'selected',
        uuid: actor.uuid
      });
    
    })
  }

  // Assign a character if it exists
  const character = user.character;

  if (character && (!menuItems.find(o => o.uuid === character.uuid))) {
    
    menuItems.push({
      label: game.weirdwizard.utils.getAlias({ actor: character }),
      img: character.img,
      tip: `ID: ${character.uuid}`,
      group: 'character',
      uuid: character.uuid
    })
  }

  // Assign combatants from current combat, if there are any
  game.combat?.combatants.forEach(c => {
    const actor = c.actor;
    
    if (actor && actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) menuItems.push({
      label: game.weirdwizard.utils.getAlias({ actor: actor }),
      img: actor.token ? actor.token.texture.src : actor.img,
      tip: `ID: ${actor.uuid}`,
      group: 'combatants',
      uuid: actor.uuid
    });
  
  })
  
  // Add synthetic Token actors in the current scene
  for (const id in game.actors.tokens) {
    const actor = game.actors.tokens[id];
    
    if (actor && actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) menuItems.push({
      label: game.weirdwizard.utils.getAlias({ actor: actor }),
      img: actor.token ? actor.token.texture.src : actor.img,
      tip: `ID: ${actor.uuid}`,
      group: 'scene-tokens',
      uuid: actor.uuid
    });
  
  }

  // Add actors in the actor tab
  for (const actor of game.actors) {

    if (actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) {
      
      menuItems.push({
        label: game.weirdwizard.utils.getAlias({ actor: actor }),
        img: actor.token ? actor.token.texture.src : actor.img,
        tip: `ID: ${actor.uuid}`,
        group: 'actors-tab',
        uuid: actor.uuid
      })  
      
    }
  }

  // Convert ContextMenu data to MultiChoice data
  const groups = menuItems.reduce((acc, entry) => {
    acc[entry.group] ??= [];
    acc[entry.group].push(entry);
    return acc;
  }, {}) 

  // Create sections
  const sections = [];
  
  for (const group in groups) {
    sections.push({
      title: i18n(CONFIG.WW.MULTI_CHOICE_TARGET_HEADERS[group]),
      img: CONFIG.WW.MULTI_CHOICE_TARGET_HEADER_ICONS[group],
      choices: groups[group],
      collapsed: (group === 'actors-tab' && Object.keys(groups).length > 1) ? true : false
    })
  }

  // Create MultiChoice instance
  const rect = element.getBoundingClientRect();
  
  new MultiChoice({
    purpose: purpose,
    dataset: element.dataset,
    position: {
      left: rect.left - 410,
      top: rect.top - 300
    },
    sections: sections
  }).render(true);

}

/* -------------------------------------------- */

/**
   * Handle opening of a related sheet
   * @param {PointerEvent} event      The originating click event
   * @private
   */
function _onOpenSheet(event) {
  
  const el = event.currentTarget,
    dataset = el.dataset;

  // Fetch document and try to open it
  const doc = fromUuidSync(dataset.uuid);
  if (doc instanceof TokenDocument) { doc.actor.sheet.render(true) } else doc.sheet.render(true);
  
}

/* -------------------------------------------- */
/*  Chat Roll function                          */
/* -------------------------------------------- */

async function _onChatRoll(dataset, label, nextAction) {
  
  // Prepare following action
  dataset.action = nextAction;

  const origin = fromUuidSync(dataset.originUuid),
    data = {
      actor: _getActorFromOrigin(origin),
      target: canvas.tokens.get(dataset.targetId),
      item: (origin?.documentName === 'Item') ? origin : null,
      value: dataset.value,
      action: dataset.action
    }
  const labelHtml = data.item?.name ? `${label ? i18n(label) + ' ' : ''}<span class="owner-only">${data.item?.name}</span><span class="non-owner-only">? ? ?</span>` : '';
  
  // Prepare roll
  const r = await new WWRoll(data.value, data.actor?.getRollData(),
    {
      template: "systems/weirdwizard/templates/sidebar/chat/roll.hbs",
      originUuid: origin,
      target: data.target,
      dataset: data,
      action: data.action
    }
  ).evaluate();
  data.value = await r.total;
  const rollArray= [r];
  
  // Prepare message data
  const messageData = {
    type: 'd6-roll',
    rolls: rollArray,
    speaker: game.weirdwizard.utils.getSpeaker({ actor: data.actor }),
    flavor: labelHtml,
    content: '',
    sound: CONFIG.sounds.dice,
    'flags.weirdwizard': {
      icon: data.item?.img,
      item: data.item?.uuid,
      emptyContent: true
    }
  };
  
  await ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
  
  // Send to chat
  await ChatMessage.create(messageData);

}

/* -------------------------------------------- */

function _onMessageCollapse(msg) {
  const button = msg.querySelector('.chat-message-collapse');
  const icon = msg.querySelector('.chat-message-collapse > i');
  
  // List elements to toggle collapse
  const elements = {
    wrapperChildren: msg.querySelector('.message-wrapper > *:not(.flavor-container)'),
    traits: msg.querySelector('.traits-container'),
    content: msg.querySelector('.message-content'),
    subheader: msg.querySelector('.message-subheader-details'),
    bug: msg.querySelector('.bug')
  }
  
  // Flip states
  if (icon.classList.contains('fa-square-plus')) {
    button.setAttribute('data-tooltip', 'WW.Item.HideDesc')
    icon.classList.remove('fa-square-plus')
    icon.classList.add('fa-square-minus');

    for (const el in elements) {
      $(elements[el]).slideDown(500); // Remove jQuery when possible
    };
    
  } else {
    button.setAttribute('data-tooltip', 'WW.Item.ShowDesc')
    icon.classList.remove('fa-square-minus')
    icon.classList.add('fa-square-plus');

    for (const el in elements) {
      $(elements[el]).slideUp(500); // Remove jQuery when possible
    };
    
  }
  
}

/* -------------------------------------------- */
/*  Utility functions                           */
/* -------------------------------------------- */

/**
 * Get the Actor from the Origin document
 * @param {Document} origin    The origin document
 * @return {Actor|null}         The Actor entity or null
 * @private
*/
function _getActorFromOrigin(origin) {
  // Case 1 - Origin is an Item
  if (origin?.documentName === 'Item') return origin.parent || null; 
  // Case 2 - Origin is an Actor
  else return origin || null; 
}