/**
 * Extend FormApplication to make a config window for the Quest Calendar app
 * @extends {FormApplication}
*/

export default class QuestCalendarConfig extends FormApplication {

  static get defaultOptions() {

    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['form'],
      popOut: true,
      closeOnSubmit: true,
      minimizable: false,
      template: 'systems/weirdwizard/templates/config/quest-calendar-config.hbs',
      id: 'quest-calendar-config',
      title: 'QC.Settings.WindowTitle',
      width: 300
    });
  }

  getData(options = {}) {
    const context = super.getData()

    context.skipRef = this.setting('skipRef');
    context.preciseSkip = this.setting('preciseSkip');
    context.sunrise = this.setting('sunrise');
    context.midday = this.setting('midday');
    context.sunset = this.setting('sunset');
    context.midnight = this.setting('midnight');

    context.skipRefs = {
      midnight: "QC.Settings.Midnight",
      sunrise: "QC.Settings.Sunrise",
      midday: "QC.Settings.Midday",
      sunset: "QC.Settings.Sunset"
    };

    return context;
  }

  /* -------------------------------------------- */
  /*  Event Listeners                             */
  /* -------------------------------------------- */

  activateListeners(html) {
    super.activateListeners(html);

  }

  async _updateObject(event, formData) { // Update actor data.

    await this.setSetting('skipRef', formData.skipRef);
    await this.setSetting('preciseSkip', formData.preciseSkip);
    await this.setSetting('sunrise', formData.sunrise);
    await this.setSetting('midday', formData.midday);
    await this.setSetting('sunset', formData.sunset);
    await this.setSetting('midnight', formData.midnight);

    if (ui.questcalendar?.rendered) ui.questcalendar.render();

  }

  setting(name) {
    return game.settings.get('questcalendar', name);
  }

  setSetting(name, value) {
    return game.settings.set('questcalendar', name, value);
  }

}