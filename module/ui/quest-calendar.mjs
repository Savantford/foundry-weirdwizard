const adv = (t) => game.time.advance(t),
  hour = 3600,
  rest = 21600, // 3600*6
  day = 86400, // 3600*24
  week = 604800, // 3600*24*7
  month = 2419200, // 3600*24*7*4
  i18n = (s,d={}) => game.i18n.format(s,d)
;

import QuestCalendarConfig from './quest-calendar-config.mjs';

/**
 * Extend FormApplication to make a window to edit Defense Details
 * @extends {FormApplication}
*/

export class QuestCalendar extends Application {

  static get defaultOptions() {

    return mergeObject(super.defaultOptions, {
      classes: ['form'],
      popOut: true,
      submitOnChange: true,
      closeOnSubmit: false,
      minimizable: false,
      template: 'systems/weirdwizard/templates/apps/quest-calendar.hbs',
      id: 'quest-calendar',
      title: 'Quest Calendar',
      top: 70,
      left: 120,
    });
  }

  getData(options = {}) {
    const context = super.getData()

    // Break down world time and pass to context.time
    const world = game.time.worldTime;
    this.world = game.time.worldTime;
    const h = Math.floor(world % day / hour);
    const m = Math.floor(world % hour / 60);
    this.ref = this.setting(this.setting('skipRef')) * 3600; // Store reference hour

    context.time = {
      world: world,
      secs: Math.floor(world % 60),
      mins: m,
      minsZero: ('00' + m).slice(-2),
      hours: h,
      hoursZero: ('00' + h).slice(-2),
      days: Math.floor(world % week / day),
      weeks: Math.floor(world % month / week),
      months: Math.floor(world / month)
    }

    // Calculate clock hands rotation
    context.rotation = {
      hours: 30 * context.time.hours + context.time.mins / 2,
      mins: 6 * context.time.mins,
      secs: 6 * context.time.secs
    }

    // Get forward/backward arrow type
    context.forward = this.setting('preciseSkip') ? 'forward' : 'forward-step';
    context.backward = this.setting('preciseSkip') ? 'backward' : 'backward-step';

    return context;
  }

  /** @inheritdoc */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    const canConfigure = game.user.isGM;

    if (canConfigure) {
      const closeIndex = buttons.findIndex(btn => btn.label === "Close");
      buttons.splice(closeIndex, 0, {
        label: "QC.Settings.Label",
        class: "configure-app",
        icon: "fas fa-cog",
        onclick: ev => this._onConfigureApp(ev)
      });

      buttons.splice(closeIndex, 0, {
        label: "QC.Reset.Label",
        class: "reset-app",
        icon: "fas fa-eraser",
        onclick: ev => this._reset(ev)
      });
    }

    return buttons;
  }

  /* -------------------------------------------- */
  /*  Event Listeners                             */
  /* -------------------------------------------- */

  activateListeners(html) {
    super.activateListeners(html);

    //html.find('#clock-container').click((ev) => this.render());

    // Hours manipulation
    html.find('#qc-hour-next').click((ev) => this._nextSegment(hour));
    html.find('#qc-hour-prev').click((ev) => this._prevSegment(hour));
    html.find('#qc-hour-round').click((ev) => this._roundHour());
    html.find('#qc-rest').click((ev) => adv(rest));

    // Skip to Certain Time
    html.find('#qc-sunrise').click((ev) => this._skipToHour(this.setting('sunrise')));
    html.find('#qc-midday').click((ev) => this._skipToHour(this.setting('midday')));
    html.find('#qc-sunset').click((ev) => this._skipToHour(this.setting('sunset')));
    html.find('#qc-midnight').click((ev) => this._skipToHour(this.setting('midnight')));

    // Days manipulation
    html.find('#qc-day-next').click((ev) => this._nextSegment(day));
    html.find('#qc-day-prev').click((ev) => this._prevSegment(day));

    // Weeks manipulation
    html.find('#qc-week-next').click((ev) => this._nextSegment(week));
    html.find('#qc-week-prev').click((ev) => this._prevSegment(week));

    // Months manipulation
    html.find('#qc-month-next').click((ev) => this._nextSegment(month));
    html.find('#qc-month-prev').click((ev) => this._prevSegment(month));

  }

  /**
   * Handle requests to configure the app
   * @param {PointerEvent} event      The originating click event
   * @private
   */
  _onConfigureApp(event) {
    event.preventDefault();
    const renderOptions = {
      left: Math.max(this.position.left + 100, 10),
      top: this.position.top + 50
    };

    return new QuestCalendarConfig().render(true, renderOptions);
  }

  /* Time Manipulation */

  _nextSegment(unit) {
    const preciseSkip = this.setting('preciseSkip');
    const current = this.world % unit;

    if (preciseSkip) { adv(unit) } else {
      adv(unit - current + (unit > rest ? this.ref : 0));
    }
    
  }

  _prevSegment(unit) {
    const preciseSkip = this.setting('preciseSkip');

    if (preciseSkip) { adv(-unit) } else {
      const current = this.world % unit;
      const factor = (current > this.ref) ? 0 : unit;

      adv(-((unit > rest ? (current - this.ref + factor) : unit)))
    }

  }

  _roundHour() {
    const current = this.world % hour;

    current >= hour/2 ? adv(hour - current) : adv(-current);
  }

  _skipToHour(hour) {
    const currentHour = this.world % day;

    let targetHour = hour * 3600; // Convert hours to seconds
    if (targetHour < currentHour) targetHour += 24*3600; // If target hour is lower than current, add 24 hours
    
    adv(targetHour - currentHour);
    
  }

  /* -------------------------------------------- */
  /*  Misc Functions                              */
  /* -------------------------------------------- */

  // Toggle visibility of the main window.
  static async toggleVis(mode) {
    //if (!game.modules.get('questcalendar')?.viewAuth) return;
    if (!ui?.questcalendar) ui.questcalendar = new QuestCalendar();
    
    if (mode === 'toggle') {
      // If Visible is true and app is rendered
      if (game.settings.get('questcalendar', 'visible') === true && ui.questcalendar.rendered) {
        // Stop any currently-running animations, and then animate the app
        // away before close(), to avoid the stock close() animation.
        $('#quest-calendar').stop();
        $('#quest-calendar').css({ animation: 'close 0.2s', opacity: '0' });
        setTimeout(function () {
          // Pass an object to .close() to indicate that it came from quest-calendar,
          // and not from an Escape keypress.
          ui.questcalendar.close({ questcalendar: true });
          
        }, 200);
        game.settings.set('questcalendar', 'visible', false);
      } else {
        // Make sure there isn't already an instance of the app rendered.
        // Fire off a close() just in case, clears up some stuck states.
        if (ui.questcalendar.rendered) {
          ui.questcalendar.close({ questcalendar: true });
        }

        ui.questcalendar.render(true);
        game.settings.set('questcalendar', 'visible', true);
      }
      
    } else if (game.settings.get('questcalendar', 'visible') === true) {
      ui.questcalendar.render(true);
    }
  }

  /* Utility */

  setting(name) {
    return game.settings.get('questcalendar', name)
  }

  async _reset() {
    const confirm = await Dialog.confirm({
      title: i18n('QC.Reset.Title'),
      content: i18n('QC.Reset.Msg') + '<p class="qc-dialog-sure">' + i18n('QC.Reset.Confirm') + '</p>'
    });

    if (confirm) { return adv(-this.world) } else { return };
  }

}