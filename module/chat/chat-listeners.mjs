import { chatMessageButton, diceTotalHtml } from './chat-html-templates.mjs';
import WWRoll from '../dice/roll.mjs';
import { i18n } from '../helpers/utils.mjs';
import RollDamage from '../dice/roll-damage.mjs';
import RollAttribute from '../dice/roll-attribute.mjs';

/* -------------------------------------------- */
/*  Chat methods                                */
/* -------------------------------------------- */



//const tokenManager = new TokenManager()

export function initChatListeners(html, app) {
  
  // Handle chat Message Button left click
  html.on('click', '.chat-button[data-action*=roll]', _onMessageButtonRoll);
  html.on('click', '.enricher-roll', _onMessageButtonRoll);

  // Handle chat Message Button right click context menu
  new ContextMenu(html, '.chat-button[data-action*=apply]', [], { onOpen: _onMessageButtonContext.bind('apply'), eventName:'click' });
  new ContextMenu(html, '.enricher-call', [], { onOpen: _onMessageButtonContext.bind('call'), eventName:'click' });

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
    case 'roll-health-recovery': _onChatRoll(dataset, 'WW.InstantEffect.HealthRecoverOf', 'apply-health-recovery'); break;
    
  }
  
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
      label: i18n(CONFIG.WW.rollAttributes[attribute]) + ' Roll',
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
      case 'apply-health-recovery': target.applyHealthRecovery(value); break;
      case 'apply-affliction': target.applyAffliction(value); break;
      case 'apply-effect': target.applyEffect(effect); break;
    }
  }

  function iconToHTML(icon, id) { return `<img src="${icon}" data-tooltip="ID: ${id}" />`}

  function resolveAction({action, dataset, target}) {
    return action === 'call' ? callRoll(dataset, target) : _applyToTarget(dataset, target);
  }

  const menuItems = [];
  
  // Get targets
  const targetIds = element.dataset.targetIds ? element.dataset.targetIds.split(',') : [];
  const targets = [];

  targetIds.forEach(t => {
    if(game.actors.tokens[t]) targets.push(game.actors.tokens[t]);
  })

  // Assign targets if any exist
  if (targets) {
    targets.forEach(actor => {
    
      if (actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) menuItems.push({
        name: actor.name,
        icon: iconToHTML(actor.img, actor.uuid),
        group: 'targets',
        uuid: actor.uuid,
        callback: li => resolveAction({ action: this, dataset: element.dataset, target: actor })
      });
    
    })
  }

  // Assign a character if it exists
  if (character && (!menuItems.find(o => o.uuid === character.uuid))) {
    
    menuItems.push({
      name: character.name,
      icon: iconToHTML(character.img, character.uuid),
      group: 'character',
      uuid: character.uuid,
      callback: li => resolveAction({ action: this, dataset: element.dataset, target: character })
    })
  }

  // Assign combatants from current combat, if there are any
  game.combat?.combatants.forEach(c => {
    const actor = c.actor;
    
    if (actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) menuItems.push({
      name: actor.name,
      icon: iconToHTML(actor.img, actor.uuid),
      group: 'combatants',
      uuid: actor.uuid,
      callback: li => resolveAction({ action: this, dataset: element.dataset, target: actor })
    });
  
  })
  
  // Add synthetic Token actors in the current scene
  for (const id in game.actors.tokens) {
    const actor = game.actors.tokens[id];
    
    if (actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) menuItems.push({
      name: actor.name,
      icon: iconToHTML(actor.img, actor.uuid),
      group: 'tokens',
      uuid: actor.uuid,
      callback: li => resolveAction({ action: this, dataset: element.dataset, target: actor })
    });
  
  }

  // Add actors in the actor tab
  for (const actor of game.actors) {

    if (actor.testUserPermission(user, "OBSERVER") && (!menuItems.find(o => o.uuid === actor.uuid))) {
      
      menuItems.push({
        name: actor.name,
        icon: iconToHTML(actor.img, actor.uuid),
        group: 'actors',
        uuid: actor.uuid,
        callback: li => resolveAction({ action: this, dataset: element.dataset, target: actor })
      })  
      
    }
  }

  ui.context.menuItems = menuItems;

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
      item: (origin.documentName === 'Item') ? origin : null,
      value: dataset.value
    }
  const labelHtml = i18n(label) + ' ' + '<span class="owner-only">' + data.item.name + '</span><span class="non-owner-only">? ? ?</span>';

  // Prepare roll
  const r = await new WWRoll(data.value, data.actor.system).evaluate({async:true});
  dataset.value = await r.total;
  const rollArray= [r];
  const rollHtml = await diceTotalHtml(r);

  // Prepare message data
  const messageData = {
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    rolls: rollArray,
    speaker: ChatMessage.getSpeaker({ actor: data.actor }),
    flavor: labelHtml,
    content: '<div></div>',
    sound: CONFIG.sounds.dice,
    'flags.weirdwizard': {
      item: data.item?.uuid,
      rollHtml: rollHtml + chatMessageButton(dataset),
      emptyContent: true
    }
  };
  
  await ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
  
  // Send to chat
  await ChatMessage.create(messageData);

}

function _onMessageCollapse(ev) {
  
  const button = ev.currentTarget,
    msg = $(button).parents('.chat-message'),
    desc = msg.find('.message-content'),
    footer = msg.find('.message-footer'),
    wrapper = msg.find('.message-wrapper'),
    traits = msg.find('.traits-container'),
    icon = $(button).find('i')
  ;
  
  // Flip states
  if (icon.hasClass('fa-square-plus')) {
    $(button).attr("title", i18n('WW.Item.HideDesc'))
    icon.removeClass('fa-square-plus').addClass('fa-square-minus');
    traits.slideDown(500);
    wrapper.slideDown(500);
    desc.slideDown(500);
    footer.slideDown(500);
  } else {
    $(button).attr("title", i18n('WW.Item.ShowDesc'))
    icon.removeClass('fa-square-minus').addClass('fa-square-plus');
    traits.slideUp(500);
    wrapper.slideUp(500);
    desc.slideUp(500);
    footer.slideUp(500);
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

  if (origin.documentName === 'Item') { // Case 1 - Origin is an Item
    return origin.parent || null;

  } else { // Case 2 - Origin is an Actor
    return origin || null;
  }
}