/**
* Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
* @extends {Actor}
*/

export class WeirdWizardActor extends Actor {

    /** @override */
    prepareData() {
        // Prepare data for the actor. Calling the super version of this executes
        // the following, in order: data reset (to clear active effects),
        // prepareBaseData(), prepareEmbeddedDocuments(),
        // prepareDerivedData().
        super.prepareData();
    }

    /** @override */
    prepareBaseData() {
        // Data modifications in this step occur before processing embedded
        // documents (including active effects) or derived data.
        super.prepareBaseData();

        // Create boons variables
        this.system.boons = {
            attributes: {
                luck: {
                    global: 0,
                    conditional: 0
                }
            },
            attacks: {
                global: 0,
                conditional: 0
            }
        };

        // Create autoFail object
        this.system.autoFail = {};

        // Create halved boolean for Speed reductions
        this.system.stats.speed.halved = false;

        // Assign raw Speed to value so it can be used later by Active Effects
        let raw = this.system.stats.speed.raw;
        let speed = this.system.stats.speed.value;

        if ((speed > raw) || (raw == undefined)) this.system.stats.speed.raw = speed; // Compability: If speed.raw is undefined or lower, copy value to raw
        
        this.system.stats.speed.value = this.system.stats.speed.raw;

        // Attributes
        const attributes = this.system.boons.attributes;
        const autoFail = this.system.autoFail;

        ['str', 'agi', 'int', 'wil'].forEach(function (attribute){
            attributes[attribute] = {
                global: 0,
                conditional: 0
            }

            autoFail[attribute] = false;
        })

        // Reset Natural Defense and Defense before Active Effects
        if (this.type == 'Character') {
            this.system.stats.defense.natural = 10;
            this.system.stats.defense.total = 0;
        }

    }

    async _preCreate(data, options, user) {
    
        let icon = data.img;
        
        // If no image is provided, set default by category.
        if (!icon) {
    
          switch (this.type) {
            
            case 'Character':
              icon = 'icons/svg/mystery-man.svg';
            break;
       
            case 'NPC':
              icon = 'icons/svg/mystery-man-black.svg';
            break;
      
            }
    
        }
    
        await this.updateSource({ img: icon });
    
        return await super._preCreate(data, options, user);
    }

    async _preUpdate(changed, options, user) {
        await super._preUpdate(changed, options, user);
        
        // Health Operators
        const health = this.system.stats.health.total;
        
        // Limit Damage to not surpass Health
        if (changed.system?.stats?.damage?.value > health) {
            changed.system.stats.damage.value = health;
        }

    };

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

        // Halve Speed
        if (system.stats.speed.halved) system.stats.speed.value = Math.floor(system.stats.speed.raw / 2);

        // Loop through attributes, and add their modifiers calculated with DLE rules to our sheet output.
        for (let [key, attribute] of Object.entries(system.attributes)) {
            if (key != 'luck') attribute.mod = attribute.value - 10;
        }
        
        // Create .statuses manually for v10
        if (this.statuses == undefined) {
            this.statuses = this.effects.reduce((acc, eff) => {
                if(!eff.modifiesActor) return acc;
                const status = eff.flags.core?.statusId;
                if(status) acc.add(status);
                return acc;
            }, new Set());
        }

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

        ///////// HEALTH ///////////

        // Calculate and update Path Levels contribution to Health
        let health = system.stats.health; // Get actor's stats
        let level = system.stats.level.value;

        function count(levels) { // Count how many of provided levels the Character has
        let newValue = 0;

        levels.forEach(function count(v) {
            if (level >= v) { newValue += 1 }
        })

        return newValue
        }

        // Novice Path calculation
        const noviceLv = count([2, 5, 8])
        const noviceBonus = noviceLv * health.novice;

        // Expert Path calculation
        const expertLv = count([3, 4, 6, 9]);
        const expertBonus = expertLv * health.expert;

        // Master Path calculation
        const masterLv = count([7, 8, 10])
        const masterBonus = masterLv * health.master;

        // Total Health calculation
        const totalHealth = health.starting + noviceBonus + expertBonus + masterBonus + health.bonus - health.lost;

        system.stats.health.total = totalHealth;

        // Assign Health as Max Damage
        system.stats.damage.max = system.stats.health.total;

        // Calculate total Defense
        const defense = system.stats.defense;
        
        if ((defense.natural) > defense.total) {
            defense.total = defense.natural;
        };
    }

    /**
    * Prepare NPC type specific data.
    */

    _prepareNpcData(system) {
        if (this.type !== 'NPC') return;
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
        /*if (system.attributes) {
            for (let [k, v] of Object.entries(system.attributes)) {
                system[k] = foundry.utils.deepClone(v);
            }
        }

        // Add level for easier access, or fall back to 0.
        if (system.stats.level) {
            system.lvl = system.stats.level.value ?? 0;
        }*/
    }

    /**
    * Prepare NPC roll data.
    */

    _getNpcRollData(system) {
        if (this.type !== 'NPC') return;

        // Process additional NPC data here.
    }

}




