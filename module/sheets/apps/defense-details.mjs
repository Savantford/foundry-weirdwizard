/**
 * Extend FormApplication to make a window to edit Defense Details
 * @extends {FormApplication}
*/

export class defenseDetails extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "defense-details";
    options.template = "systems/weirdwizard/templates/apps/defense-details.hbs";
    options.height = "auto";
    options.width = 450;
    options.title = "Defense Details";
    return options;
  }
  
  getData(options = {}) {
    let context = super.getData()
    //context.choices = game.settings.get('ooct','choices').map(({label,icon}) => ({label,icon,rendered:iconToHTML({icon,label})}))
    // Pass down actor data to application.
    context.system = this.object.system;

    // Prepare dropdown menu objects.
    context.armorObj = Object.fromEntries(Object.entries(CONFIG.WW.armor).map(i => [i[0], i[1].label]))

    return context
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Handle resetting the window
    html.find('#def-reset').click(() => this.render(true)) // Only kinda partially working

    // Handle closing the window without saving
    html.find('#def-cancel').click(() => this.close({ submit: false })) // Let the Cancel button close without saving

    // Handle deleting the row
    html.find('li a .fa-trash').click(ev => ev.target.parentElement.parentElement.remove())

    // Handle adding a row
    html.find('.add-row').click(ev => {
      let currentcount = html[0].querySelectorAll(".action").length
      let new_row = $(`<li class="flexrow"><input name="bonuses.${currentcount}.name" class="action def-name" type="text"/><input name="bonuses.${currentcount}.bonus" class="def-bonus" type="number"/><a class="def-remove"><i class="fa-solid fa-trash" data-tooltip="Delete"></i></a></li>`)
      new_row.insertBefore(ev.currentTarget)
      //new_row.find('.icon-text').change(configIconUpdate)
      //html.find('.label-text').change(configTextUpdate)
      new_row.find('a .fa-trash').click(ev => ev.target.parentElement.parentElement.remove())
    })

    function updateField(ev) {
      //const totalHealth = parseInt(parent.querySelector('input[type=number].starting').value) + noviceBonus + expertBonus + masterBonus + parseInt(parent.querySelector('input[type=number].bonus').value) - parseInt(parent.querySelector('input[type=number].lost').value);

      //parent.querySelector('.health-display.total').innerHTML = totalHealth;
    };

    const el = html.find('input[type=number]');
    el.change((ev) => updateField(ev));
    el.change();
  }

  async _updateObject(event, formData) { // Update actor data.

    this.object.update({
      'system.stats.defense': {
        'natural': formData.natural,
        'armor': formData.armor,
        'bonuses': Object.values(expandObject(formData)?.bonuses ?? { 0: { 'name': 'Unknown', 'bonus': '0' } }).filter(c => c.name && c.bonus)
      }
    })
  }
}