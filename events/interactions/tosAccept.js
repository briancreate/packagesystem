const { TextDisplayBuilder, ContainerBuilder, Events, MessageFlags } = require('discord.js');
require('dotenv').config({ quiet: true });

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction) {
        if (interaction.isButton() && interaction.customId === "tos_accept") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const member = await interaction.guild.members.fetch(interaction.user.id);
            termsrole = process.env.ROLE_ID_TERMS;
            try {
                await member.roles.add(termsrole);
                const components = [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<:crossmark:1457408456980959486> You accepted our terms! Click the claim package button to restart!"),
                            ),
                ];
                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                });
            } catch (error) {
                await interaction.editReply({
                    content: "<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:TOS_ROLE"
                });
            }

            return;
        }
    }
};