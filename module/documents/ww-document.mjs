import { capitalize, i18n, plusify, sysPath } from "../helpers/utils.mjs";

/**
 * A mixin which extends each Document definition with specialized client-side behaviors.
 * This mixin defines the client-side interface for database operations and common document behaviors.
 * @category Mixins
 * @param {typeof Document} Base    The base Document class to be mixed
 */
export default function WWDocumentMixin(Base) {
  
  class WWBaseDocument extends Base {

    /* -------------------------------------------- */
    /*  Data Preparation                            */
    /* -------------------------------------------- */

    /** @inheritdoc */
    static migrateData(data) {

      // 6.2.0 subtype migrations - Thanks Draw Steel for the inspiration
      if (['Character', 'NPC', 'Group', 'Vehicle', 'Equipment', 'Trait or Talent', 'Spell'].includes(data.type)) {

        switch (data.type) {
          case "Character": data.type = "character"; break;
          case "NPC": data.type = "npc"; break;
          case "Group": data.type = "group"; break;
          case "Vehicle": data.type = "vehicle"; break;
          case "Equipment": data.type = "equipment"; break;
          case "Trait or Talent": data.type = "talent"; break;
          case "Spell": data.type = "spell"; break;
        }

        foundry.utils.setProperty(data, "flags.weirdwizard.migrateType", true);
      }

      return super.migrateData(data);
    }

    /* -------------------------------------------- */
    /*  Enrichment                                  */
    /* -------------------------------------------- */

    /**
     * @override
     * Create a content link for this Document.
     * @param {Partial<EnrichmentAnchorOptions>} [options]  Additional options to configure how the link is constructed.
     * @returns {HTMLAnchorElement}
     */
    async toAnchor({attrs={}, dataset={}, classes=[], name, icon}={}) {
      // Build dataset
      const documentConfig = CONFIG[this.documentName];
      const documentName = game.i18n.localize(`DOCUMENT.${this.documentName}`);
      let anchorIcon = icon ?? documentConfig.sidebarIcon;
      
      if ( !classes.includes("content-link") ) classes.unshift("content-link");
      attrs = foundry.utils.mergeObject({ draggable: "true" }, attrs);
      dataset = foundry.utils.mergeObject({
        link: "",
        uuid: this.uuid,
        id: this.id,
        type: this.documentName,
        pack: this.pack,
        tooltip: await this.toCard() //documentName
      }, dataset);

      // If this is a typed document, add the type to the dataset
      if ( this.type ) {
        /*const typeLabel = documentConfig.typeLabels[this.type];
        const typeName = game.i18n.has(typeLabel) ? `${game.i18n.localize(typeLabel)}` : "";
        dataset.tooltipText ??= typeName ?
          game.i18n.format("DOCUMENT.TypePageFormat", {type: typeName, page: documentName}) :
          documentName;*/
        anchorIcon = icon ?? documentConfig.typeIcons?.[this.type] ?? documentConfig.sidebarIcon;
      }

      name ??= this.name;

      return foundry.applications.ux.TextEditor.implementation.createAnchor({ attrs, dataset, name, classes, icon: anchorIcon });
    }

    /* -------------------------------------------- */

    /* Prepare a fancy document card to use in tooltips. */
    async toCard(options) {
      let templateFile = this.documentName.toLowerCase();
      if (this.documentName === 'ActiveEffect') templateFile = 'effect';
      if (this.documentName === 'JournalEntryPage') templateFile = 'page';

      const card = await foundry.applications.handlebars.renderTemplate(
        sysPath(`templates/apps/tooltips/${await templateFile}.hbs`),
        await this._prepareCardContext(options)
      );
      
      return await card;
    }

    /* -------------------------------------------- */

    async toEmbed(config, options = {}) {
      // Add to config 
      config.label = this.name;

      // Prepare wrapper
      const wrapper = document.createElement('div');
      wrapper.classList.add('document-embed');

      // Prepare embed template
      let templateFile = this.documentName.toLowerCase();
      if (this.documentName === 'ActiveEffect') templateFile = 'effect';
      if (this.documentName === 'JournalEntryPage') templateFile = 'page';

      wrapper.innerHTML = await foundry.applications.handlebars.renderTemplate(
        sysPath(`templates/apps/embeds/${templateFile}.hbs`),
        await this._prepareCardContext({... options,
          rollData: this.documentName === 'Actor' ? this.getRollData() : null,
          relativeTo: this,
          async: true,
          secrets: this.isOwner,
          docLink: await CONFIG.ux.TextEditor.enrichHTML(`@UUID[${this.uuid}]`)
        })
      );

      return wrapper;
    }

    /* -------------------------------------------- */

    async _prepareCardContext(options={}) {
      // Prepare variables
      const TextEditor = CONFIG.ux.TextEditor;
      
      const context = {
        label: this.name,
        system: this.system,
        img: this instanceof JournalEntryPage ? this.src : this.img,
        type: this.type,
        usageFooter: options?.usageFooter ?? false,
        docLink: options?.docLink ?? null,

        subtitle: ''
      };
      
      switch (this.documentName) {

        case 'Actor': {
          const charOptions = this.charOptions;
          const listEntries = this.system.listEntries;

          // Prepare contextual variables
          if (this.type === 'character') {
            // Prepare subtitle
            if (charOptions.ancestry) context.subtitle = charOptions.ancestry.name;

            const sep = context.subtitle ? ' • ' : '';

            if (charOptions.master) context.subtitle += sep + charOptions.master.name;
            else if (charOptions.expert) context.subtitle += sep + charOptions.expert.name;
            else if (charOptions.novice) context.subtitle += sep + charOptions.novice.name;

            // Prepare main text
            context.text = await TextEditor.enrichHTML(this.system.details.appearance);

          } else if (this.type === 'npc') {
            // Prepare main text
            context.text = await TextEditor.enrichHTML(this.system.description);

            // Prepare list entries
            context.listEntries = {};

            for (const list in listEntries) {
              context.listEntries[list] = '';

              for (const e in listEntries[list]) {
                const entry = listEntries[list][e];
                context.listEntries[list] += (context.listEntries[list] ? ', ' : '') + entry.name;
              }
            }

            // Prepare items
            context.items = {
              equipment: [],
              weapon: [],
              talent: [],
              action: [],
              reaction: [],
              end: [],
              spells: []
            }

            for (const item of this.items) {
              const subtypes = ['weapon', 'talent', 'action', 'reaction', 'end'];
              const subtype = item.system.subtype;
              let category = item.type;
              let isShield = false;
              
              if (subtypes.includes(subtype)) category = subtype;

              // Prepare name label
              let label = item.system.magical ? `${item.name} (${i18n("WW.Talent.Magical")})` : item.name;

              // Prepare attribute label
              let attributeLabel = null;

              if (item.system.attribute == 'luck') {
                attributeLabel = `${i18n('WW.Attributes.Luck')} (+0)`;
              } else if (item.system.attribute) {
                const attribute = context.system.attributes[item.system.attribute];
                attributeLabel = `${i18n(CONFIG.WW.ATTRIBUTES[item.system.attribute])} (${plusify(attribute.mod)})`
              }

              // Prepare absolute boons
              const boons = item.system.boons;
              let boonsLabel = boons;
              
              if (item.system.boonsAlt) boonsLabel = item.system.boonsAlt;
              else {
                let boonsLoc = "WW.Boons.Boon";

                if (boons < -1) boonsLoc = "WW.Boons.Banes";
                else if (boons < 0) boonsLoc = "WW.Boons.Bane";
                else if (boons > 1) boonsLoc = "WW.Boons.Boons";

                boonsLabel = `${i18n("WW.Boons.With")} ${Math.abs(boons)} ${i18n(boonsLoc)}`;
              }
              
              // Prepare weapon fields
              if (item.system.subtype == 'weapon') {

                // Prepare traits list
                let list = '';

                for (const x of item.system.traits) {
                  let string = i18n('WW.Weapon.Traits.' + capitalize(x) + '.Label');
                  
                  if ((x === 'range') || (x === 'reach' && item.system.range) || (x === 'thrown')) string += ` ${item.system.range}`;

                  list = list.concat(list ? ', ' + string : string);
                }

                if (item.system.magical) list += ` (${i18n("WW.Talent.Magical")})`;

                item.system.traitsList = list;

                // Prepare name and grip label
                label = (item.system.traits.has('range') ? i18n('WW.Attack.Ranged') : i18n('WW.Attack.Melee')) + '—' + item.name + (item.system.traitsList ? ' • ' + item.system.traitsList : '');

                // Is shield?
                for (const e of item.effects) {
                  for (const c of e.changes) {
                    if (['defense.armored', 'defense.naturalIncrease', 'defense.bonus'].includes(c.key)) isShield = true;
                  }
                }
              }
              
              // Enrich HTML and push data
              const TextEditor = foundry.applications.ux.TextEditor.implementation;

              const itemContext = {
                name: item.name,
                label,
                system: {
                  ...item.system,
                  attributeLabel,
                  boonsLabel
                },
                desc: item.system.description ? await TextEditor.enrichHTML(item.system.description, { secrets: this.isOwner }) : null,
                attackRider: item.system.attackRider ?? null
              };

              context.items[category].push(itemContext);

              if (isShield) context.items['equipment'].push(itemContext);
            }

          }

        }; break;

        case 'Item': {
          // Prepare subtitle
          switch (this.type) {
            case 'equipment':
              context.subtitle = i18n(CONFIG.WW.EQUIPMENT_SUBTYPES[this.system.subtype]);
              if (this.system.subtype === 'weapon') context.subtitle += ` • ${i18n(CONFIG.WW.WEAPON_GRIPS[this.system.grip])}`;
            break;

            case 'talent':
              context.subtitle = i18n(CONFIG.WW.TALENT_SOURCE_LABELS[this.system.source]);
            break;

            case 'spell':
              context.subtitle = i18n(CONFIG.WW.SPELL_TIERS[this.system.tier]);
              if (this.system.tradition) context.subtitle += ` • ${this.system.tradition}`;
            break;
          }
          
          // Prepare main text
          context.text = await TextEditor.enrichHTML(this.system.description);

        }; break;

        case 'ActiveEffect': {
          // Prepare subtitle
          context.subtitle = i18n((this.duration.rounds || this.duration.seconds) ? "WW.Effect.Temporary" : "WW.Effect.Permanent");

          // Prepare main text
          context.text = await TextEditor.enrichHTML(this.description);

          // Prepare changes
          context.changes = '';

          for (const c of this.changes) {
            const label = CONFIG.WW.EFFECT_CHANGE_PRESET_LABELS[c.key] ? i18n(CONFIG.WW.EFFECT_CHANGE_PRESET_LABELS[c.key]) : 'BROKEN EFFECT CHANGE, FIX IT!';
            context.changes += `<li>${label} ${(c.value !== true) ? `${c.value}.` : ''}</li>`;
          }

        }; break;

        case 'JournalEntryPage': {
          // Prepare subtitle for Character Options
          if (this.isCharOption) context.subtitle = i18n(CONFIG.WW.CHARACTER_OPTIONS[this.type]);

          // Prepare main text
          context.text = await TextEditor.enrichHTML(this.text.content);
        }; break;
      }

      return context;

    }
  }

  return WWBaseDocument;

}