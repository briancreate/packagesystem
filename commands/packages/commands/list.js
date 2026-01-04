const { SlashCommandSubcommandBuilder, MessageFlags, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const package = require('../../../database/schemas/package');
const path = require('path');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("list")
    .setDescription("Pack Management.."),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral});

    const packs = await package.find({}).sort({ updatedAt: -1 });
    if (!packs.length) {
        return interaction.editReply({
            content: "<:crossmark:1457408456980959486> LOAD_FAILED: No Created Packs!"
        });
    }

    const limit = packs.slice(0, 8);
    const lines = limit.map((pkg, index) => {
        const rank = index + 1;
        const title = pkg.purchaseLink
          ? `[${pkg.name}](${pkg.purchaselink})`
          : pkg.name;
        const packer = pkg.packerId ? `<@${pkg.packerId}>` : "N/A";
        const asset = pkg.assetId ? `\`${pkg.assetId}\`` : "N/A";
        return `**${rank}** ${title} - By ${packer}\nASSET ID: ${asset} - PRICE: ${pkg.price}\nPACKAGE ID: ${pkg.packId}`;
    });

    const embed = new EmbedBuilder()
        .setTitle(`${packs.length} Loaded Packages`)
        .setColor(0x393A41)
        .setDescription(lines.join("\n\n"))
        .setImage('attachment://banner.png')
        .setFooter(`Viewing ${limit.length} of ${packs.length} Packages`);

    const attachment = [
        new AttachmentBuilder(
            path.join(__dirname, '../../database/assets/footer.png'),
            { name: 'banner.png' }
        )
    ];

    interaction.editReply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
        files: attachment
    });

  }
};