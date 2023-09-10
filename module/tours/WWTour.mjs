//import { constants } from '../constants';
import WWActor from '../documents/actor.mjs';
import WWItem from '../documents/item.mjs';

export default class WWTour extends Tour {
  //actor?: WWActor;
  //item?: WWItem;

  /** @override */
  async _preStep() {
    await super._preStep();

    const currentStep = this.currentStep;

    // First step: If we need an actor, make it and render
    if (currentStep.actor) {
      currentStep.actor.name = game.i18n.localize(currentStep.actor.name);
      for (const item of currentStep.actor.items) {
        item.name = game.i18n.localize(item.name);
      }
      this.actor = (await CONFIG.Actor.documentClass.create(
        currentStep.actor,
      ))
      //@ts-expect-error Calling _render because it's async unlike render
      await this.actor.sheet?._render(true);
    }

    // Alternatively, if we need to fetch an item from the actor
    // let's do that and potentially render the sheet
    if (currentStep.itemName) {
      if (!this.actor) {
        console.warn('No actor found for step ' + currentStep.title);
      }
      const localizedName = game.i18n.localize(currentStep.itemName);
      this.item = this.actor?.items.getName(localizedName);
      const app = this.item.sheet;
      //@ts-expect-error Calling _render because it's async unlike render
      if (!app.rendered) await app._render(true);
      // Assumption: Any given tour user might need to move back and forth between items, but only one actor is active at a time, so itemName is always specified when operating on an embedded item sheet but the framework doesn't allow bouncing back and forth between actors
      currentStep.selector = currentStep.selector?.replace(
        'itemSheetID',
        app.id,
      );
    }

    // Flip between tabs of various applications
    if (currentStep.tab) {
      switch (currentStep.tab.parent) {
        /*case constants.TOUR_TAB_PARENTS.SIDEBAR:
          ui.sidebar.activateTab(currentStep.tab.id);
          break;
        case constants.TOUR_TAB_PARENTS.GAMESETTINGS: {
          const app = game.settings.sheet;
          //@ts-expect-error Calling _render because it's async unlike render
          await app._render(true);
          app.activateTab(currentStep.tab.id);
          break;
        }
        case constants.TOUR_TAB_PARENTS.CONFIGURATOR: {
          const configurator: ClientSettings.PartialSettingSubmenuConfig =
            game.settings.menus.get('weirdwizard.setting-config');
          const app = new configurator.type();
          //@ts-expect-error Calling _render because it's async unlike render
          await app._render(true);
          app.activateTab(currentStep.tab.id);
          break;
        }
        */
        case 'actor': {
          if (!this.actor) {
            console.warn('No Actor Found');
            break;
          }
          const app = this.actor.sheet;
          app?.activateTab(currentStep.tab.id);
          break;
        }
        case 'item': {
          if (!this.item) {
            console.warn('No Item Found');
            break;
          }
          const app = this.item.sheet;
          app?.activateTab(currentStep.tab.id);
          break;
        }
      }
    }

    // Leaving to the end because we're only ever going to need one actor at a time and it's created much earlier
    currentStep.selector = currentStep.selector?.replace(
      'actorSheetID',
      this.actor?.sheet?.id,
    );
  }
}