import { i18n } from '../helpers/utils.mjs';

// Prepare Dice Total html template
export async function diceTotalHtml(roll) {
  return '<span class="owner-only">' + await roll.render() + '</span><h4 class="secret-dice-total non-owner-only">' + await roll.total + '</h4>';
}

// Prepare html header for a target
export function targetHeader(target, html, noItem) {
  if ((target.id === undefined) || noItem) return (html ? html : '');

  else return `<p class="owner-only chat-target">${i18n('WW.Targeting.Target')}: ${target.name}</p><p class="non-owner-only chat-target">${i18n('WW.Targeting.Target')}: ???</p><div class="chat-target-content">${html}</div>`;
}

// Prepare html header for a target
export function buttonsHeader(html, label, noItem) {
  return `<div class="chat-target">${label}</div><div class="chat-target-content"><div class="chat-buttons">${html}</div></div>`;
}

// Prepare Html Button for a chat message
export function chatMessageButton({action, value, effectUuid, originUuid, targetIds}) {
  let icon = 'dice';
  let img = '';
  let loc = 'WW.InstantEffect.Button.';
  let showNo = true;

  switch (action) {
    /* Roll Actions */
    case 'roll-damage': {
      loc += 'Damage';
      break;
    }
    case 'roll-healing': {
      loc += 'Healing';
      break;
    }
    case 'roll-health-loss': {
      loc += 'HealthLoss';
      break;
    }
    case 'roll-health-recovery': {
      loc += 'HealthRecovery';
      break;
    }
    case 'apply-affliction': {
      icon = 'skull-crossbones';
      loc = 'WW.InstantEffect.Affliction';
      break;
    }
    /* Apply Actions */
    case 'apply-damage': {
      img = '/systems/weirdwizard/assets/icons/rough-wound-black.svg';
      loc += 'Damage';
      showNo = false;
      break;
    }
    case 'apply-damage-half': {
      img = '/systems/weirdwizard/assets/icons/slashed-shield-black.svg';
      loc += 'Half';
      showNo = false;
      break;
    }
    case 'apply-damage-double': {
      img = '/systems/weirdwizard/assets/icons/cross-mark-black.svg';
      loc += 'Double';
      showNo = false;
      break;
    }
    case 'apply-healing': {
      img = '/systems/weirdwizard/assets/icons/caduceus-black.svg';
      loc += 'Healing';
      showNo = false;
      break;
    }
    case 'apply-health-loss': {
      img = '/systems/weirdwizard/assets/icons/health-decrease-black.svg';
      loc += 'LoseHealth';
      showNo = false;
      break;
    }
    case 'apply-health-recovery': {
      img = '/systems/weirdwizard/assets/icons/health-increase-black.svg';
      loc += 'RecoverHealth';
      showNo = false;
      break;
    }
    case 'apply-effect': {
      icon = 'hand-holding-magic';
      loc = 'WW.Effect.Apply';
      showNo = false;
      break;
    }
  }
  
  let html = '';
  
  if (img) { // Vertical Button
    html = '<div class="chat-button flexcol" data-action="' + action +
    (value ? '" data-value="' + value : '') +
    (effectUuid ? '" data-effect-uuid="' + effectUuid : '') +
    '" data-origin-uuid="' + originUuid +
    '" data-target-ids="' + targetIds + '">' +
    '<img src="' + img + '"/>' + 
    '<div>' + i18n(loc) + (effectUuid ? ': ' + fromUuidSync(effectUuid)?.name : '') +
    (showNo ? (': ' + value) : '') + '</div></div>'
  } else { // Inline Button
    html = '<div class="chat-button" data-action="' + action +
    (value ? '" data-value="' + value : '') +
    (effectUuid ? '" data-effect-uuid="' + effectUuid : '') +
    '" data-origin-uuid="' + originUuid +
    '" data-target-ids="' + targetIds + '">' +
    '<i class="fas fa-' + icon + '"></i>' +
    i18n(loc) + (effectUuid ? ': ' + fromUuidSync(effectUuid)?.name : '') +
    (showNo ? (': ' + value) : '') + '</div>';
  }
  
  return html;
}

export function chatMessageButtonArray({value, originUuid, targetId}) {
  const actions = ['apply-damage', 'apply-damage-half', 'apply-damage-double', 'apply-healing']
  let html = '<div class="chat-button-container">';

  actions.forEach(a => {
    html += chatMessageButton({action: a, value, originUuid, targetId});
  })

  html += '</div>';
  
  return html;
}


/* Prepare action string from label string */
export function actionFromLabel(label) {
  let action = '';

  switch (label) {
    case ('damage'): action = 'roll-damage'; break;
    case ('heal'): action = 'roll-healing'; break;
    case ('healthLose'): action = 'roll-health-loss'; break;
    case ('healthRecover'): action = 'roll-health-recovery'; break;
    case ('affliction'): action = 'apply-affliction'; break;
  }
  
  return action;
}

// Add intant effects to chat message html
export function addInstEffs(effects, origin, target) {
    
  if (!target) target = '';

  let finalHtml = '';

  effects = effects.filter(e => e.trigger === 'onUse');
  
  effects.forEach(e => {
    if (!e.value && !e.affliction) return ui.notifications.warn(i18n("WW.Roll.AgainstWrn"));
    let html = '';
    
    if (e.target === 'self') target = this.token.uuid;
    
    if (e.label === 'affliction') html = chatMessageButton({
      action: actionFromLabel(e.label),
      value: e.affliction,
      originUuid: origin,
      targetId: target
    });

    else html = chatMessageButton({
      action: actionFromLabel(e.label),
      value: e.value,
      originUuid: origin,
      targetId: target
    });
    
    finalHtml += html;
  })
  
  return finalHtml;
}