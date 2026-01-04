const { AttachmentBuilder, SlashCommandSubcommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const path = require('path');
const package = require('../../../database/schemas/package');
const forumChannels = {
  liveries: process.env.FORUM_LIVERIES,
  clothing: process.env.FORUM_CLOTHING,
  code: process.env.FORUM_BOTCODE
};

// Helper Functions
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

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("send")
    .setDescription("Pack Management..")
    .addStringOption((option) =>
      option
        .setName('package')
        .setDescription("ID of the package you are attempting to publish")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('forum')
        .setDescription("The forum you want to publish the package in")
        .setRequired(true)
        .addChoices(
          { name: "Liveries Forum", value: "liveries" },
          { name: "Clothing Forum", value: "clothing" },
          { name: "Bot Code Forum", value: "code" },
        )
    )
    .addAttachmentOption((option) =>
      option
        .setName('image')
        .setDescription("Attach a product image/ video for the package")
        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName('file')
        .setDescription("Attach the delivery file for the package")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const packId = interaction.options.getString("package");
    const forumChoice = interaction.options.getString("forum");
    const image = interaction.options.getAttachment("image");
    const file = interaction.options.getAttachment("file");

    const data = await package.findOne({ packId: packId });
    if (!data) {
        return interaction.editReply({
            content: "<:crossmark:1457408456980959486> POST_FAILED: Invalid Pack ID!"
        });
    }
    if (!data.assetId) {
        data.assetId = extractAssetId(data.purchaselink);
        await data.save();
    }

    const forum = await interaction.guild.channels.fetch(
        forumChannels[forumChoice]
    );

    const post = await forum.threads.create({
        name: data.name,
        message: { files: [image.url] }
    });

    const items = data.items
        ? data.items.split(/\r?\n|,/).map(i => `${i.trim()}`).join("\n")
        : "‎ ";

    const embed = new EmbedBuilder()
        .setDescription(`## [${data.name}](${data.purchaselink})\n<:person:1457455676212252693> **Assembler:** <@${data.packerId}>\n<:logo:1457182362956730540> **Price:** ${data.price}R$`)
        .addFields(
            { name: "‎ ", value: items, inline: false }
        )
        .setImage('attachment://footer.png')
        .setColor(0x393A41);
    const claimButton = new ButtonBuilder()
        .setLabel("Claim Package")
        .setEmoji("<:click:1457456025383735378>")
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`pack_claim_${data.packId}`);
    const row = new ActionRowBuilder().addComponents(claimButton);

    const attachment = [
        new AttachmentBuilder(
            path.join(__dirname, '../../../database/assets/banner_footer.png'),
            { name: 'footer.png' }
        )
    ];

    const message = await post.send({
        embeds: [embed],
        components: [row],
        files: attachment
    });

    data.messageId = message.id;
    data.downloadFile = {
        url: file.url,
        name: file.name,
    };
    await data.save();

    return interaction.editReply({
        content: `<:checkmark:1457408406607364257> PACK_POSTED! Pack Published To ${post.url}!`
    });

  }
};