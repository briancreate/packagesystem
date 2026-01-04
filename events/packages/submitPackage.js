const { Events, MessageFlags } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const package = require('../../database/schemas/package');

// Helper Functions
function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
} ///
function extractAssetId(raw) {
  if (!raw) return null;
  const link = String(raw).trim();

  try {
    const url = new URL(link);

    const segments = url.pathname.split("/").filter(Boolean);
    for (const segment of segments) {
      if (/^\d+$/.test(segment)) return Number(segment);
    }

    const searchKeys = ["assetId", "id", "itemId", "gamepassId"];
    for (const key of searchKeys) {
      const value = url.searchParams.get(key);
      if (value && /^\d+$/.test(value)) return Number(value);
    }
  } catch (_) {}
  const fallback = link.match(/(\d{4,})/);
  return fallback ? Number(fallback[1]) : null;
} ///
function formatItems(rawValue) {
  const cleanValue = trimString(rawValue);
  if (!cleanValue) return { itemsList: [], display: "" };

  const splitItems = cleanValue
    .split(/[\r\n]+|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!splitItems.length) return { itemsList: [], display: "" };

  return {
    itemsList: splitItems,
    display: splitItems.map((item) => `<:dot:1410535739766341674> ${item}`).join("\n"),
  };
} ///
function parsePackerId(rawValue) {
  const value = trimString(rawValue);
  if (!value) return "";

  const mentionMatch = value.match(/<@!?(?<id>\d{5,})>/);
  if (mentionMatch?.groups?.id) return mentionMatch.groups.id;

  const digitsMatch = value.match(/\d{5,}/);
  if (digitsMatch) return digitsMatch[0];

  return "";
} ///

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  async execute(interaction) {
    if (interaction.isModalSubmit() && interaction.customId === "pack:modal:create") {

        // Get Options
        const packName = interaction.fields.getTextInputValue("pack:name");
        const purchaseLink = interaction.fields.getTextInputValue("pack:link");
        const purchasePlusLink = interaction.fields.getTextInputValue("pack:pluslink");
        const packer = interaction.fields.getTextInputValue("pack:packer");
        const price = interaction.fields.getTextInputValue("pack:price");
        const description = interaction.fields.getTextInputValue("pack:description");

        const raw = {
            name: trimString(packName),
            link: trimString(purchaseLink),
            pluslink: trimString(purchasePlusLink),
            packer: trimString(packer),
            price: trimString(price),
            description: trimString(description),
        }; //

        const packerId = parsePackerId(raw.packer);
        const assetId = extractAssetId(raw.link);



        // Duplicate Pack Check
        const duplicate = await package.findOne({ assetId });
        if (duplicate) {
            return interaction.reply({
                content: "Duplicate Package",
                flags: MessageFlags.Ephemeral
            });
        }

        // Save Created Pack
        try {
            const created = await package.create({
                name: raw.name,
                purchaselink: raw.link,
                purchasepluslink: raw.pluslink,
                assetId: assetId,
                packerId: packerId,
                price: raw.price,
                items: raw.description,
            });

            await interaction.reply({
                content: "saved",
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error("failed", error);
            await interaction.reply({
                content: "error",
                flags: MessageFlags.Ephemeral
            });
        }

    }
  }
};