import { i18n, sysPath } from "./utils.mjs";

export default async function embedCard(doc, config, options) {
    // Add to config 
    config.label = doc.name;

    // Add to options
    options.rollData = doc.documentName === 'Actor' ? doc.getRollData() : null;
    options.relativeTo = doc;
    options.async = true;
    options.secrets = doc.isOwner;

    // Prepare variables
    const context = {
        ...config,
        system: doc.system,
        img: doc instanceof JournalEntryPage ? doc.src : doc.img,
        type: doc.type,
        
        subtitle: ''
    }

    switch (doc.documentName) {

        case 'Actor': {
            const listEntries = doc.system.listEntries;
    
            // Prepare contextual variables
            if (doc.type === 'Character') {
                // Prepare subtitle
                if (listEntries.ancestry) context.subtitle = listEntries.ancestry;

                const sep = context.subtitle ? ' • ' : '';

                if (listEntries.master) context.subtitle += sep + listEntries.master;
                else if (listEntries.expert) context.subtitle += sep + listEntries.expert;
                else if (listEntries.novice) context.subtitle += sep + listEntries.novice;

                // Prepare main text
                context.text = await TextEditor.enrichHTML(doc.system.details.appearance.value, options);
            
            } else {
                // Prepare subtitle
                for (const d in listEntries.descriptors) {
                    const descriptor = listEntries.descriptors[d];
                    context.subtitle += (context.subtitle ? ', ' : '') + descriptor.name;
                }

                // Prepare main text
                context.text = await TextEditor.enrichHTML(doc.system.description.value, options);
            }

        }; break;

        case 'Item': {
            // Prepare subtitle
            context.subtitle = doc.system.subtype ?? doc.type;

            // Prepare main text
            context.text = await TextEditor.enrichHTML(doc.description, options);
            
        }; break;

        case 'ActiveEffect': {
            // Prepare subtitle
            context.subtitle = i18n((doc.duration.rounds || doc.duration.seconds) ? "WW.Effect.Temporary" : "WW.Effect.Permanent");
            
            // Prepare main text
            context.text = await TextEditor.enrichHTML(doc.description, options);

            // Prepare changes
            context.changes = '';
            
            for (const c of doc.changes) {
                const label = CONFIG.WW.EFFECT_CHANGE_LABELS[c.key] ? i18n(CONFIG.WW.EFFECT_CHANGE_LABELS[c.key]) : 'BROKEN EFFECT CHANGE, FIX IT!';
                context.changes += `<li>${label} ${(c.value !== true) ? `${c.value}.` : ''}</li>`;
            }

        }; break;

        case 'JournalEntryPage': {
            // Prepare subtitle
            context.subtitle = i18n(CONFIG.WW.CHARACTER_OPTIONS[doc.type]);

            // Prepare main text
            context.text = await TextEditor.enrichHTML(doc.text.content, options);
        }; break;
    }

    if (!context.text) context.text = 'No description available.'

    // Prepare wrapper
    const wrapper = document.createElement('div');
    wrapper.classList.add('document-card-inline');

    // Prepare document card
    let templateFile = doc.documentName.toLowerCase();
    if (doc.documentName === 'ActiveEffect') templateFile = 'effect';
    if (doc.documentName === 'JournalEntryPage') templateFile = 'page';
    
    if (config.inline) {
        wrapper.innerHTML = await renderTemplate(sysPath(`templates/apps/tooltips/${templateFile}.hbs`), await context);
    } else {
        wrapper.innerHTML = await renderTemplate(sysPath(`templates/apps/embeds/${templateFile}.hbs`), await context);
    }
    
    return wrapper;
}