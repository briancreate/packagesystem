const { TextDisplayBuilder, ContainerBuilder, Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction) {
        if (interaction.isButton() && interaction.customId === "tos_deny") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const components = [
                    new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent("<:crossmark:1457408456980959486> You must accept our terms to purchase this package!"),
                        ),
            ];
            await interaction.editReply({
                components: components,
                flags: MessageFlags.IsComponentsV2
            });

        }
    }
};