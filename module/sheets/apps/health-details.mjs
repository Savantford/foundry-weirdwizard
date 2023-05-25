/**
 * Extend FormApplication to make a window to edit Defense Details
 * @extends {FormApplication}
*/

export class healthDetails extends FormApplication {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "health-details";
        options.template = "systems/weirdwizard/templates/health-details.hbs";
        options.height = "auto";
        options.width = 400;
        options.title = "Health Details";

        return options;
    }

    getData(options = {}) {
        let context = super.getData()

        // Pass down actor data to application.
        context.system = this.object.system;

        // Prepare dropdown menu objects.
        //context.armorObj = Object.fromEntries(Object.entries(CONFIG.WEIRDWIZARD.armor).map(i => [i[0], i[1].label]))

        return context
    }

    activateListeners(html) {
        super.activateListeners(html);
        let stats = this.object.system.stats // Get actor's stats
        let level = stats.level.value

        // Handle resetting the window
        html.find('#health-reset').click(() => this.render(true)) // Only kinda partially working

        // Handle closing the window without saving
        html.find('#health-cancel').click(() => this.close({ submit: false }))

        // Calculate and update Path Levels contribution to Health
        function updateField(ev) {

            function count(levels) { // Count how many of provided levels the Character has
                let newValue = 0;

                levels.forEach(function count(v) {
                    if (level >= v) { newValue += 1 }
                })

                return newValue
            }

            const parent = ev.target.closest('.health-details');

            // Novice Path calculation
            const noviceLv = count([2, 5, 8])
            const noviceBonus = noviceLv * parent.querySelector('input[type=number].novice').value;

            parent.querySelector('.health-levels.novice').innerHTML = noviceLv;
            parent.querySelector('.health-display.novice').innerHTML = noviceBonus;

            // Expert Path calculation
            const expertLv = count([3, 4, 6, 9]);
            const expertBonus = expertLv * parent.querySelector('input[type=number].expert').value;

            parent.querySelector('.health-levels.expert').innerHTML = expertLv;
            parent.querySelector('.health-display.expert').innerHTML = expertBonus;

            // Master Path calculation
            const masterLv = count([7, 8, 10])
            const masterBonus = masterLv * parent.querySelector('input[type=number].master').value

            parent.querySelector('.health-levels.master').innerHTML = masterLv;
            parent.querySelector('.health-display.master').innerHTML = masterBonus;

            // Total Health calculation
            const totalHealth = parseInt(parent.querySelector('input[type=number].starting').value) + noviceBonus + expertBonus + masterBonus + parseInt(parent.querySelector('input[type=number].bonus').value) - parseInt(parent.querySelector('input[type=number].lost').value);

            parent.querySelector('.health-display.total').innerHTML = totalHealth;
        }

        const el = html.find('input[type=number]');
        el.change((ev) => updateField(ev));
        el.change();
    }

    async _updateObject(event, formData) { // Update actor data.
        //
        this.object.update({
            'system.stats.health': {
                'starting': formData.starting,
                'novice': formData.novice,
                'expert': formData.expert,
                'master': formData.master,
                'bonus': formData.bonus,
                'lost': formData.lost
            }
        })
    }
}