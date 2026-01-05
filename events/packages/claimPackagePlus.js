const { SectionBuilder, TextDisplayBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, SeparatorBuilder, SeparatorSpacingSize, ContainerBuilder, Events, MessageFlags, AttachmentBuilder } = require('discord.js');
const package = require('../../database/schemas/package');
const { getRobloxInfo } = require('../../database/utilities/packageAPI');
const path = require('path');
require('dotenv').config({ quiet: true });
const { get } = require("http");

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
        if (interaction.isButton() && interaction.customId.startsWith("pack_plus_claim_")) {
            const [_, __, ___, packId] = interaction.customId.split("_");

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const components = [
                    new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent("<a:loading:1457777985431015618> Preparing the ultimate package delivery.."),
                        ),
            ];
            await interaction.editReply({
                components: components,
                flags: MessageFlags.IsComponentsV2
            });

            const DOCK_API = process.env.DOCK_API;
            const CUSTOMER_ROLE_ID = process.env.ROLE_ID_CUSTOMER;
            const member = await interaction.guild.members.fetch(interaction.user.id);

            // Confirm Data
            const data = await package.findOne({ packId: packId });
            if (!data) {
                const components = [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:P_DATA"),
                            ),
                ];
                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                });
                return;
            }

            // Get Info
            const robloxId = await getRobloxInfo(
                interaction.user.id,
                DOCK_API
            );
            const plusassetId = data.plusassetId;
            
            if (!robloxId) {
                const components = [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:P_RBLX"),
                            ),
                ];
                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                });
                return;
            }
            if (!plusassetId) {
                const components = [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<:crossmark:1457408456980959486> Oops! Looks like this package has expired! Please try again later. ERR:P_ASSET"),
                            ),
                ];
                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
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
                                            .setURL("https://discord.com/channels/1369377209864949770/1457165374884810813")
                                    )
                                    .addTextDisplayComponents(
                                        new TextDisplayBuilder().setContent(`<a:loading:1457777985431015618> You do not own this package! This is either because you have not bought it yet, which you can do by [**clicking here**](${data.purchasepluslink}) or because your Roblox inventory visibility is set to private.`),
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
                const components = [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<:crossmark:1457408456980959486> Ooops! Looks like this package has expired! Please try again later. ERR:P_FILE"),
                            ),
                ];
                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                });
            }

            const fileAttachment = new AttachmentBuilder(data.downloadFile.url, {
                name: data.downloadFile.name,
            });
            const attachment = new AttachmentBuilder(
                path.join(__dirname, '../../database/assets/banner_delivery.png'),
                { name: 'banner.png' }
            );

            // Deliver
            try {
                const components2 = [
                        new ContainerBuilder()
                            .addMediaGalleryComponents(
                                new MediaGalleryBuilder()
                                    .addItems(
                                        new MediaGalleryItemBuilder()
                                            .setURL('attachment://banner.png'),
                                    ),
                            )
                            .addFileComponents(
                                new FileBuilder().setURL(`attachment://${data.downloadFile.name}`),
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                            )
                            .addSectionComponents(
                                new SectionBuilder()
                                    .setButtonAccessory(
                                        new ButtonBuilder()
                                            .setStyle(ButtonStyle.Danger)
                                            .setLabel("Leave a review!")
                                            .setCustomId(`pack_review_${packId}`)
                                    )
                                    .addTextDisplayComponents(
                                        new TextDisplayBuilder().setContent("Please consider leaving a review!\nNeed Support? Open a ticket at discord.gg/pulzepacks"),
                                    ),
                            ),
                ];
                const dm = await interaction.user.send({
                    components: components2,
                    flags: MessageFlags.IsComponentsV2,
                    files: [attachment, fileAttachment]
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
                const components = [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<:checkmark:1457408406607364257> The package has been delivered to your DM's, Enjoy!"),
                            ),
                ];
                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                });
            } catch (error) {
                const components = [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:P_DM"),
                            ),
                ];
                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                });
            }


        }
    }
};