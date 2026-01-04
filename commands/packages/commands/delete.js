const { SlashCommandSubcommandBuilder, MessageFlags } = require('discord.js');
const package = require('../../../database/schemas/package');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("delete")
    .setDescription("Pack Management..")
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription("Choose if you're going to delete a pack using its name or id")
        .setRequired(true)
        .addChoices(
          { name: "Name", value: "name" },
          { name: "Id", value: "id" },
        )
    )
    .addStringOption((option) =>
      option
        .setName('pack')
        .setDescription("The name or id for the pack you're trying to delete")
        .setRequired(true)
    ),
  
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const type = interaction.options.getString("type");
    const pack = interaction.options.getString("pack");

    switch (type) {
        case "name":
            const deleted1 = await package.findOneAndDelete({ name: pack });
            if (!deleted1) {
                return interaction.editReply({
                    content: "<:crossmark:1457408456980959486> DELETE_FAILED: Invalid Name!"
                });
            }
            break;
        case "id":
            const deleted2 = await package.findOneAndDelete({ packId: pack });
            if (!deleted2) {
                return interaction.editReply({
                    content: "<:crossmark:1457408456980959486> DELETE_FAILED: Invalid ID!"
                });
            }
            break;
        default:
          interaction.editReply({
            content: "<:crossmark:1457408456980959486> DELETE_FAILED: Error Occured!"
          });
          return;
    }

    await interaction.editReply({
        content: "<:checkmark:1457408406607364257> DELETE_SUCCESS: Pack Deleted!"
    });

  }
};