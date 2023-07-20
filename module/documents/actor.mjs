/**
* Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
* @extends {Actor}
*/

export class WeirdWizardActor extends Actor {

    /** @override */
    prepareData() {
      // Prepare data for the actor. Calling the super version of this executes
      // the following, in order: data reset (to clear active effects),
      // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
      // prepareDerivedData().
      super.prepareData();
    }
  
    /** @override */
    prepareBaseData() {
      // Data modifications in this step occur before processing embedded
      // documents or derived data.
    }
  
    /**
     * @override
     * Augment the basic actor data with additional dynamic data. Typically,
     * you'll want to handle most of your calculated/derived data in this step.
     * Data calculated in this step should generally not exist in template.json
     * (such as ability modifiers rather than ability scores) and should be
     * available both inside and outside of character sheets (such as if an actor
     * is queried and has a roll executed directly from it).
    */

    prepareDerivedData() {
      const system = this.system;
      const flags = this.flags.weirdwizard || {};
  
      // Make separate methods for each Actor type (character, npc, etc.) to keep
      // things organized.
      this._prepareCharacterData(system);
      this._prepareNpcData(system);
    }

    /**
    * Prepare Character type specific data
    */

    _prepareCharacterData(system) {
        if (this.type !== 'Character') return;
    
        // Make modifications to data here. For example:
        //const system = actorData;
    
        // Loop through attributes, and add their modifiers calculated with DLE rules to our sheet output.
        for (let [key, attribute] of Object.entries(system.attributes)) {
            attribute.mod = Math.floor(attribute.value - 10);
        }
    }

    /**
    * Prepare NPC type specific data.
    */

    _prepareNpcData(actorData) {
        if (this.type !== 'NPC') return;
    
        // Make modifications to data here. For example:
        /*const data = system.data;
        data.xp = (data.cr * data.cr) * 100;*/
    }

    /**
    * Override getRollData() that's supplied to rolls.
    */

    getRollData() {
        const data = super.getRollData();
    
        // Prepare character roll data.
        this._getCharacterRollData(data);
        this._getNpcRollData(data);
    
        return data;
    }
  
    /**
    * Prepare character roll data.
    */
    _getCharacterRollData(system) {
        if (this.type !== 'Character') return;
    
        // Copy the attribute scores to the top level, so that rolls can use
        // formulas like `@str.mod + 4`.
        if (system.attributes) {
            for (let [k, v] of Object.entries(system.attributes)) {
                system[k] = foundry.utils.deepClone(v);
            }
        }
    
        // Add level for easier access, or fall back to 0.
        if (system.stats.level) {
            system.lvl = system.stats.level.value ?? 0;
        }
    }
  
    /**
    * Prepare NPC roll data.
    */
    _getNpcRollData(system) {
        if (this.type !== 'NPC') return;
    
        // Process additional NPC data here.
    }

}



