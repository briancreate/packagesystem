const { SlashCommandSubcommandBuilder, ModalBuilder, TextInputStyle, TextInputBuilder, ActionRowBuilder, MessageFlags } = require('discord.js');
const package = require('../../../database/schemas/package');
const crypto = require("node:crypto");

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
    display: splitItems.map((item) => `${item}`).join("\n"),
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
  data: new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("Pack Management..")
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription("The name of the package you're creating")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('assembler_user_id')
        .setDescription("The name of the package you're creating")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('price_integer')
        .setDescription("The name of the package you're creating")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('purchase_link_default')
        .setDescription("The name of the package you're creating")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('purchase_link_discount')
        .setDescription("The name of the package you're creating")
        .setRequired(true)
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name');
    const assembler = interaction.options.getString('assembler_user_id');
    const price = interaction.options.getString('price_integer');
    const purchase_link_default = interaction.options.getString('purchase_link_default');
    const purchase_link_discount = interaction.options.getString('purchase_link_discount');

    const raw = {
        name: trimString(name),
        assembler: trimString(assembler),
        price: trimString(price),
        purchase_link_default: trimString(purchase_link_default),
        purchase_link_discount: trimString(purchase_link_discount),
    };

    const assemblerId = parsePackerId(raw.assembler);
    const assetId = extractAssetId(raw.purchase_link_default);
    const plusassetId = extractAssetId(raw.purchase_link_discount);
    const packId = crypto.randomBytes(6).toString("hex");

    const duplicate1 = await package.findOne({ assetId });
    const duplicate2 = await package.findOne({ plusassetId });
    if (duplicate1) {
        return interaction.reply({
            content: "<:crossmark:1457408456980959486> SAVE_FAILED: Duplicate Pack!",
            flags: MessageFlags.Ephemeral
        });
    }
    if (duplicate2) {
        return interaction.reply({
            content: "<:crossmark:1457408456980959486> SAVE_FAILED: Duplicate Pack!",
            flags: MessageFlags.Ephemeral
        });
    }

    try {
        const created = await package.create({
            packId: packId,
            name: raw.name,
            purchaselink: raw.purchase_link_default,
            purchasepluslink: raw.purchase_link_discount,
            assetId: assetId,
            plusassetId: plusassetId,
            packerId: assemblerId,
            price: raw.price,
        });
        await interaction.reply({
            content: `<:checkmark:1457408406607364257> SAVE_SUCCESS: ${packName} Saved! ID:${packId}`,
            flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        console.log("[ERROR]", error);
        await interaction.reply({
            content: "<:crossmark:1457408456980959486> SAVE_FAILED: Error Occured!",
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    const modal = new ModalBuilder()
        .setCustomId(`pack_create_${packId}`)
        .setTitle("Pack Description");
    const description = new TextInputBuilder()
        .setCustomId('pack_description')
        .setLabel("Package Description:")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
    modal.addComponents(
        new ActionRowBuilder().addComponents(description)
    );

    await interaction.showModal(modal);
  }
};