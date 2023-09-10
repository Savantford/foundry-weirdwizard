import WWTour from './WWTour.mjs';

export default async function registerWWTours() {

  try {
    game.tours.register(
      'weirdwizard',
      'character',
      await WWTour.fromJSON('/systems/weirdwizard/tours/character.json'),
    );
  } catch (err) {
    console.log(err);
  }

  try {
    game.tours.register(
      'weirdwizard',
      'npc',
      await WWTour.fromJSON('/systems/weirdwizard/tours/npc.json'),
    );
  } catch (err) {
    console.log(err);
  }
}