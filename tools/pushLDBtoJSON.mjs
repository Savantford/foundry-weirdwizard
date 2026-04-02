import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { promises as fs } from "fs";
import path from "path";

const PACKAGE_ID = process.cwd();
const yaml = false;
const expandAdventures = false;
const folders = true;

const packs = await fs.readdir("./packs");
for (const pack of packs) {
  if (pack.startsWith(".")) continue;
  console.log("Unpacking " + pack);
  await extractPack(
    path.join(PACKAGE_ID, 'packs', pack),
    path.join(PACKAGE_ID, 'src', 'packs', pack),
    {
      yaml,
      transformName,
      expandAdventures,
      folders,
      clean: true
    }
  );
}
/**
 * Prefaces the document with its type
 * @param {object} doc - The document data
 */
function transformName(doc, context) {
  const safeFileName = doc.name.replace(/[^a-zA-Z0-9А-я]/g, "_");

  const prefix = ["Actor", "Item", "JournalEntryPage"].includes(context.documentType) ? doc.type : context.documentType;

  let name = `${doc.name ? `${prefix}_${safeFileName}_${doc._id}` : doc._id}.${yaml ? "yml" : "json"}`;
  if ( context.folder ) name = path.join(context.folder, name);
  return name;
}