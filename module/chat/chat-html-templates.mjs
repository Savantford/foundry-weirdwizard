import { i18n } from '../helpers/utils.mjs';

// Prepare Dice Total html template
export async function diceTotalHtml(roll) {
  return '<span class="owner-only">' + await roll.render() + '</span><h4 class="secret-dice-total non-owner-only">' + await roll.total + '</h4>';
}

// Prepare Html Button for a chat message
export function chatMessageButton({action, value, originUuid, targetId}) {
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
      img = '/systems/weirdwizard/assets/icons/broken-shield-black.svg';
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
  }
  
  let html = '';
  
  if (img) { // Vertical Button
    html = '<div class="chat-button flexcol" data-action="' + action +
    '" data-value="' + value +
    '" data-origin-uuid="' + originUuid +
    '" data-target-id="' + targetId + '">' +
    '<img src="' + img + '"/>' + 
    '<div>' + i18n(loc) +
    (showNo ? (': ' + value) : '') + '</div></div>'
  } else { // Inline Button
    html = '<div class="chat-button" data-action="' + action +
    '" data-value="' + value +
    '" data-origin-uuid="' + originUuid +
    '" data-target-id="' + targetId + '">' +
    '<i class="fas fa-' + icon + '"></i>' +
    i18n(loc) +
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