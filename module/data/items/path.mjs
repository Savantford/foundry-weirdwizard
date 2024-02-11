import {
  fields,
  base,
  makeIntField,
  makeStrField
} from './charoptions_base.mjs'

export default class PathData extends foundry.abstract.DataModel {

  static defineSchema() {
    const type = 'Path';
    
    return {
      ...base(type),

      tier: makeStrField('novice'),

      benefits: new fields.SchemaField({
        benefit1: makeBenefitField(1),
        benefit2: makeBenefitField(2),
        benefit3: makeBenefitField(5),
        benefit4: makeBenefitField()
      })

    }
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {
    
    // Make sure Range is a number
    /*if ('range' in source && isNaN(source.range)) source.range = 0;

    // Migrate weapon properties
    if ('properties' in source && !Object.values(source.properties).every(item => item === false)) {
      const properties = source.properties;
      
      let traits = source.traits ? source.traits : {};
      let advantages = source.advantages ? source.advantages : {};
      let disadvantages = source.disadvantages ? source.disadvantages : {};

      const traitsList = ['ammunition', 'brutal', 'firearm', 'long', 'nimble', 'precise', 'range', 'sharp', 'shattering', 'thrown', 'versatile'];
      const advantagesList = ['disarming', 'driving'];
      const disadvantagesList = ['light', 'reload', 'slow'];

      for (const p of Object.keys(properties)) {
        
        // Assign traits
        if (p === 'concussing' && properties[p]) traits['shattering'] = true;
        if (p === 'fast' && properties[p]) traits['precise'] = true;
        if (p === 'great' && properties[p]) traits['forceful'] = true;
        if (p === 'painful' && properties[p]) traits['special'] = true;
        if (p === 'unbalancing' && properties[p]) traits['forceful'] = true;
        if (traitsList.includes(p) && properties[p]) traits[p] = true;
        
        // Assign advantages
        if (advantagesList.includes(p) && properties[p]) advantages[p] = true;
        
        // Assign disadvantages
        if (disadvantagesList.includes(p) && properties[p]) disadvantages[p] = true;
        
      }

      source.traits = traits;
      source.advantages = advantages;
      source.disadvantages = disadvantages;

    }*/

    return super.migrateData(source);
  }

}

const makeBenefitField = (level = 99) => new fields.SchemaField({
  levelReq: makeIntField(level),

  stats: new fields.SchemaField({
    naturalSet: makeIntField(),
    naturalIncrease: makeIntField(),
    armoredIncrease: makeIntField(),
    healthStarting: makeIntField(),
    healthIncrease: makeIntField(),
    speedIncrease: makeIntField(),
    bonusDamage: makeIntField(),
  }),

  traditions: makeStrField(),
  spells: makeStrField(),
  items: new fields.ArrayField(makeStrField())
})