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

    async _preCreate(data, options, user) {
        let icon = 'icons/svg/mystery-man.svg';

        switch (this.type) {
            case 'NPC':
                icon = 'icons/svg/mystery-man-black.svg';
                break;
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

        // Loop through attributes, and add their modifiers calculated with DLE rules to our sheet output.
        for (let [key, attribute] of Object.entries(system.attributes)) {
            attribute.mod = Math.floor(attribute.value - 10);
        }

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

        ///////// DEFENSE ///////////

        // Calculate total Defense
        const defense = system.stats.defense
        const equipped = CONFIG.WW.armor[defense.armor]
        let armorTotal = defense.natural;

        // Select the higher Defense value from Armor flat Defense or Armor Bonus and assign to armorTotal.
        if (equipped.def) {

            if ((defense.natural + equipped.bonus) > equipped.def) {
                armorTotal = defense.natural + equipped.bonus;
            } else {
                armorTotal = equipped.def;
            };
            
        };

        // Add Defense bonuses to armorTotal to get defense total.
        const defBonuses = CONFIG.Global.sum(defense.bonuses.map(i => i.bonus));

        if (defBonuses != 0) {
            system.stats.defense.total = armorTotal + defBonuses;
        } else {
            system.stats.defense.total = armorTotal;
        }
    }

    /**
    * Prepare NPC type specific data.
    */

    _prepareNpcData(system) {
        if (this.type !== 'NPC') return;

        // Loop through attributes, and add their modifiers calculated with DLE rules to our sheet output.
        for (let [key, attribute] of Object.entries(system.attributes)) {
            attribute.mod = Math.floor(attribute.value - 10);
        }
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



