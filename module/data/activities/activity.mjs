import { makeBooField, makeHtmlField, makeIntField, makeRequiredStrField, makeStrField } from '../field-presets.mjs';
import AutomationStepModel from './automation-step.mjs';
import WWItem from '../../documents/item.mjs';
import WWActor from '../../documents/actor.mjs';

export default class ActivityModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    console.log(fields)
    
    const schema = {
      // Message
      title: makeStrField(),
      message: new fields.SchemaField({
        flavor: makeHtmlField(),
        content: makeHtmlField()
      }),

      // Automation Steps
      steps: new fields.ArrayField(new fields.EmbeddedDataField(AutomationStepModel))
    }
    
    return schema;
  }

  get itemProperties() {
    const sys = this.item.system;

    return {
      isAttack: sys.isAttack,
      isWeapon: sys.isWeapon,
      isSpell: sys.isSpell,
      isMagical: sys.magical
    }
  }
}