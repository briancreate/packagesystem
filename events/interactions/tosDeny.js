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
                            new TextDisplayBuilder().setContent("<:crossmark:1457408456980959486> You denied our terms which has resulted in you being unable to purchase this pack!"),
                        ),
            ];
            await interaction.editReply({
                components: components,
                flags: MessageFlags.IsComponentsV2
            });

        }
    }
};