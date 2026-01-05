const package = require('../../database/schemas/package');
const { getRobloxInfo } = require('../../database/utilities/packageAPI');
const path = require('path');
require('dotenv').config({ quiet: true });

// Helper
async function userHasAsset(robloxId, assetId) {
  try {
    const res = await fetch(
      `https://inventory.roblox.com/v1/users/${robloxId}/items/0/${assetId}/is-owned`
    );

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json();
    return data === true;
  } catch (err) {
    console.error("🟣 BCH - claimPackage.js - ERROR: ", err.message);
    return false;
  }
} ///

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction) {
        if (!interaction.isButton() && interaction.customId.startsWith("pack_plus_claim_")) {
            const [_, __, ___, packId] = interaction.customId.split("_");

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const DOCK_API = process.env.DOCK_API;
            const CUSTOMER_ROLE_ID = process.env.ROLE_ID_CUSTOMER;
            const member = await interaction.guild.members.fetch(interaction.user.id);

            // Confirm Data
            const data = await package.findOne({ packId: packId });
            if (!data) {
                await interaction.editReply({
                    content: "<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:P_DATA"
                });
                return;
            }

            // Get Info
            const robloxId = getRobloxInfo(
                interaction.user.id,
                interaction,
                DOCK_API
            );
            const plusassetId = data.plusassetId;
            
            if (!robloxId) {
                await interaction.editReply({
                    content: "<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:P_RBLX"
                });
                return;
            }
            if (!plusassetId) {
                await interaction.editReply({
                    content: "<:crossmark:1457408456980959486> Oops! Looks like this package has expired! Please try again later. ERR:P_ASSET"
                });
                return;
            }

            const ownsPackage = await userHasAsset(robloxId, plusassetId);
            if (!ownsPackage) {
                const components = [
                        new ContainerBuilder()
                            .addSectionComponents(
                                new SectionBuilder()
                                    .setButtonAccessory(
                                        new ButtonBuilder()
                                            .setStyle(ButtonStyle.Link)
                                            .setLabel("Get Help")
                                            .setEmoji({
                                                name: "<:click:1457456025383735378>",
                                            })
                                            .setURL("https://discord.com/channels/1369377209864949770/1457165374884810813")
                                    )
                                    .addTextDisplayComponents(
                                        new TextDisplayBuilder().setContent(`You do not own this package! This is either because you have not bought it yet, which you can do by [**clicking here**](${data.purchasepluslink}) or because your Roblox inventory visibility is set to private.`),
                                    ),
                            ),
                ];
                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                });
                return;
            }
            if (!data.downloadFile) {
                await interaction.editReply({
                    content: "<:crossmark:1457408456980959486> Ooops! Looks like this package has expired! Please try again later. ERR:P_FILE"
                });
            }

            const fileAttachment = new AttachmentBuilder(data.downloadFile.url, {
                name: data.downloadFile.name,
            });

            // Deliver
            try {
                const dm = await interaction.user.send({
                    files: [fileAttachment]
                });                    
                data.claims = data.claims ?? [];
                data.claims.push({
                    userId: interaction.user.id,
                    claimedAt: new Date(),
                });
                await data.save();

                if (member && CUSTOMER_ROLE_ID) {
                    await member.roles.add(CUSTOMER_ROLE_ID);
                }
                await interaction.editReply({
                    content: "claimed"
                });
            } catch {
                await interaction.editReply({
                    content: "<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:P_DM"
                });
            }


        }
    }
};