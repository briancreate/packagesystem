const { Events, MessageFlags } = require('discord.js');
const package = require('../../database/schemas/package');

// Helper Functions
function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
} ///

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction) {
        if (interaction.isModalSubmit() && interaction.customId.startsWith("pack_create_")) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const [_, __, packId] = interaction.customId.split("_");
            const description = interaction.fields.getTextInputValue("pack_description");
            const raw = {
                description: trimString(description),
            };

            const data = await package.findOne({ packId: packId });
            if (!data) {
                return interaction.editReply({
                    content: "<:crossmark:1457408456980959486> FETCH_FAILED: Error Occured!"
                });
            }
            if (!data.name) {
                return interaction.editReply({
                    content: "<:crossmark:1457408456980959486> FETCH_FAILED: Error Occured!"
                });
            }

            try {
                data.items = raw.description;
                await data.save();

                return interaction.editReply({
                    content: `<:checkmark:1457408406607364257> SAVE_SUCCESS: ${data.name} Saved! ID:${data.packId}`
                });
            } catch (error) {
                console.log("[ERROR]", error);
                await interaction.editReply({
                    content: "<:crossmark:1457408456980959486> SAVE_FAILED: Error Occured!"
                });
            }

        }
    }
}