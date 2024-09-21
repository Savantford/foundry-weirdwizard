import ApplyContext from '../ui/apply-context.mjs';
import { i18n } from '../helpers/utils.mjs';
import MultiChoice from '../apps/multi-choice.mjs';
import RollAttribute from '../dice/roll-attribute.mjs';
import RollDamage from '../dice/roll-damage.mjs';
import WWRoll from '../dice/roll.mjs';

/* -------------------------------------------- */
/*  Chat methods                                */
/* -------------------------------------------- */

//const tokenManager = new TokenManager()

export function initChatListeners(html, app) {
  
  // Handle chat Message Button left click
  html.on('click', '.chat-button[data-action*=roll]', _onMessageButtonRoll);
  html.on('click', '.enricher-roll', _onMessageButtonRoll);

  // Handle chat Message Button right click context menu
  html.find('.chat-button[data-action*=apply]').click(ev => _onOpenMultiChoice(ev, 'applyEffect') );
  //html.find('.enricher-call').click(ev => _onOpenMultiChoice(ev, 'callAttributeRoll') );
  //new ApplyContext(html, '.chat-button[data-action*=apply]', [], { onOpen: _onMessageButtonContext.bind('apply'), eventName:'click' });
  new ApplyContext(html, '.enricher-call', [], { onOpen: _onMessageButtonContext.bind('call'), eventName:'click' });

  // Open Sheet from chat
  html.on('click', '[data-action=open-sheet]', _onOpenSheet);

  // Collapse descriptions
  html.find('.chat-message-collapse').click(_onMessageCollapse);

}

/** 
 * Handle roll started from a chat button.
 */
function _onMessageButtonRoll(event) {

  event.preventDefault()
  const button = event.currentTarget,
    dataset = Object.assign({}, button.dataset)
  ;
  
  switch (dataset.action) {
    // Instant Effect Rolls
    case 'roll-damage': new RollDamage(dataset).render(true); break;
    case 'roll-healing': _onChatRoll(dataset, 'WW.InstantEffect.HealOf', 'apply-healing'); break;
    case 'roll-health-loss': _onChatRoll(dataset, 'WW.InstantEffect.HealthLoseOf', 'apply-health-loss'); break;
    case 'roll-health-regain': _onChatRoll(dataset, 'WW.InstantEffect.HealthRegainedBy', 'apply-health-regain'); break;
    default: _onChatRoll(dataset); break;
  }
  
}

/**
  * Handle opening of a context menu from a chat button.
  * @param {HTMLElement} element     The element the menu opens on.
*/
function _onOpenMultiChoice(ev, purpose) {
  
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
        icon: actor.token ? actor.token.texture.src : actor.img,
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
        icon: actor.token ? actor.token.texture.src : actor.img,
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
        icon: actor.token ? actor.token.texture.src : actor.img,
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
      icon: character.img,
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
      icon: actor.token ? actor.token.texture.src : actor.img,
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
      icon: actor.token ? actor.token.texture.src : actor.img,
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
        icon: actor.token ? actor.token.texture.src : actor.img,
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
      title: i18n(CONFIG.WW.APPLY_CONTEXT_HEADERS[group]),
      icon: CONFIG.WW.APPLY_CONTEXT_ICONS[group],
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

/**
  * Handle opening of a context menu from a chat button.
  * @param {HTMLElement} element     The element the menu opens on.
*/
function _onMessageButtonContext(element) {
  
  // Get Variables
  const user = game.user;
  const character = user.character;
  
  function callRoll(dataset, target) {
    
    const { attribute, fixedBoons }  = dataset;
    
    const obj = {
      origin: target.uuid,
      label: i18n(CONFIG.WW.ROLL_ATTRIBUTES[attribute]),
      content: '',
      attKey: attribute,
      fixedBoons: parseInt(fixedBoons)
    }

    new RollAttribute(obj).render(true);
    
  }

  function _applyToTarget(dataset, target) {
    const value = dataset.value,
      effect = dataset.effectUuid;
    
    switch (dataset.action) {
      case 'apply-damage': target.applyDamage(value); break;
      case 'apply-damage-half': target.applyDamage(Math.floor(value/2)); break;
      case 'apply-damage-double': target.applyDamage(2*value); break;
      case 'apply-healing': target.applyHealing(value); break;
      case 'apply-health-loss': target.applyHealthLoss(value); break;
      case 'apply-health-regain': target.applyHealthRegain(value); break;
      case 'apply-affliction': target.applyAffliction(value); break;
      case 'apply-effect': target.applyEffect(effect); break;
    }
  }
  
  function iconToHTML(icon, id) { return `<img src="${icon}" data-tooltip="ID: ${id}" />`}

  function resolveAction({action, dataset, target}) {
    return action === 'call' ? callRoll(dataset, target) : _applyToTarget(dataset, target);
  }

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
        name: game.weirdwizard.utils.getAlias({ actor: actor }),
        icon: iconToHTML(actor.token ? actor.token.texture.src : actor.img, actor.uuid),
        group: 'pre-targets',
        uuid: actor.uuid,
        callback: li => resolveAction({ action: this, dataset: element.dataset, target: actor })
      });
    
    })
  }

  // Assign user's targets, if any exists
  if (game.user.targets.size) {
    game.user.targets.forEach(token => {
      const actor = token.document.actor;
      
      if (actor && actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) menuItems.push({
        name: game.weirdwizard.utils.getAlias({ actor: actor }),
        icon: iconToHTML(actor.token ? actor.token.texture.src : actor.img, actor.uuid),
        group: 'targets',
        uuid: actor.uuid,
        callback: li => resolveAction({ action: this, dataset: element.dataset, target: actor })
      });
    
    })
  }

  // Assign user's selected tokens, if any exists
  if (canvas.tokens.controlled) {
    
    canvas.tokens.controlled.forEach(token => {
      const actor = token.document.actor;
      
      if (actor && actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) menuItems.push({
        name: game.weirdwizard.utils.getAlias({ actor: actor }),
        icon: iconToHTML(actor.token ? actor.token.texture.src : actor.img, actor.uuid),
        group: 'selected',
        uuid: actor.uuid,
        callback: li => resolveAction({ action: this, dataset: element.dataset, target: actor })
      });
    
    })
  }

  // Assign a character if it exists
  if (character && (!menuItems.find(o => o.uuid === character.uuid))) {
    
    menuItems.push({
      name: game.weirdwizard.utils.getAlias({ actor: character }),
      icon: iconToHTML(character.img, character.uuid),
      group: 'character',
      uuid: character.uuid,
      callback: li => resolveAction({ action: this, dataset: element.dataset, target: character })
    })
  }

  // Assign combatants from current combat, if there are any
  game.combat?.combatants.forEach(c => {
    const actor = c.actor;
    
    if (actor && actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) menuItems.push({
      name: game.weirdwizard.utils.getAlias({ actor: actor }),
      icon: iconToHTML(actor.token ? actor.token.texture.src : actor.img, actor.uuid),
      group: 'combatants',
      uuid: actor.uuid,
      callback: li => resolveAction({ action: this, dataset: element.dataset, target: actor })
    });
  
  })
  
  // Add synthetic Token actors in the current scene
  for (const id in game.actors.tokens) {
    const actor = game.actors.tokens[id];
    
    if (actor && actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) menuItems.push({
      name: game.weirdwizard.utils.getAlias({ actor: actor }),
      icon: iconToHTML(actor.token ? actor.token.texture.src : actor.img, actor.uuid),
      group: 'scene-tokens',
      uuid: actor.uuid,
      callback: li => resolveAction({ action: this, dataset: element.dataset, target: actor })
    });
  
  }

  // Add actors in the actor tab
  for (const actor of game.actors) {

    if (actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) {
      
      menuItems.push({
        name: game.weirdwizard.utils.getAlias({ actor: actor }),
        icon: iconToHTML(actor.token ? actor.token.texture.src : actor.img, actor.uuid),
        group: 'actors-tab',
        uuid: actor.uuid,
        callback: li => resolveAction({ action: this, dataset: element.dataset, target: actor })
      })  
      
    }
  }

  ui.context.menuItems = menuItems;

}

/**
   * Handle opening of a related sheet
   * @param {PointerEvent} event      The originating click event
   * @private
   */
function _onOpenSheet(event) {
  console.log(event)
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
      value: dataset.value
    }
  const labelHtml = data.item?.name ? `${label ? i18n(label) + ' ' : ''}<span class="owner-only">${data.item?.name}</span><span class="non-owner-only">? ? ?</span>` : '';
  
  // Prepare roll
  const r = await new WWRoll(data.value, {},
    {
      template: "systems/weirdwizard/templates/chat/roll.hbs",
      originUuid: origin,
      target: data.target,
      dataset: data
    }
  ).evaluate();
  data.value = await r.total;
  const rollArray= [r];

  // Prepare message data
  const messageData = {
    //type: CONST.CHAT_MESSAGE_STYLES.ROLL, - no longer needed in V12
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

function _onMessageCollapse(ev) {
  
  const button = ev.currentTarget,
  icon = $(button).find('i'),
  msg = $(button).parents('.chat-message');
  
  const elements = {
    traits: msg.find('.traits-container'),
    wrapper: msg.find('.message-wrapper'),
    wrapperChildren: msg.find('.message-wrapper > *'),
    footer: msg.find('.message-footer > *'),
    bug: msg.find('.bug'),
    subheader: msg.find('.message-subheader-details')
  }
  
  // Flip states
  if (icon.hasClass('fa-square-plus')) {
    $(button).attr('data-tooltip', 'WW.Item.HideDesc')
    icon.removeClass('fa-square-plus').addClass('fa-square-minus');

    for (const el in elements) {
      elements[el].slideDown(500);
    };
    
  } else {
    $(button).attr('data-tooltip', 'WW.Item.ShowDesc')
    icon.removeClass('fa-square-minus').addClass('fa-square-plus');

    for (const el in elements) {
      elements[el].slideUp(500);
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

  if (origin?.documentName === 'Item') { // Case 1 - Origin is an Item
    return origin.parent || null;

  } else { // Case 2 - Origin is an Actor
    return origin || null;
  }
}
