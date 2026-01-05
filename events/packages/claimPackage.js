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
        if (interaction.isButton() && interaction.customId.startsWith("pack_claim_")) {
            const [_, __, packId] = interaction.customId.split("_");

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const components = [
                    new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent("Preparing the ultimate package delivery.."),
                        ),
            ];
            await interaction.editReply({
                components: components,
                flags: MessageFlags.IsComponentsV2
            });

            const DOCK_API = process.env.DOCK_API;
            const CUSTOMER_ROLE_ID = process.env.ROLE_ID_CUSTOMER;
            const PREMIUM_ROLE_ID = process.env.ROLE_ID_PREMIUM;
            const VERIFIED_ROLE_ID = process.env.ROLE_ID_VERIFIED;
            const TERMS_ROLE_ID = process.env.ROLE_ID_TERMS;

            const member = await interaction.guild.members.fetch(interaction.user.id);

            // Confirm Data
            const data = await package.findOne({ packId: packId });
            if (!data) {
                await interaction.editReply({
                    content: "<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:D_DATA"
                });
                return;
            }

            // Verified Check
            if (!member.roles.cache.some(r => r.name === VERIFIED_ROLE_ID || r.id === VERIFIED_ROLE_ID)) {
                const components = [
                        new ContainerBuilder()
                            .addSectionComponents(
                                new SectionBuilder()
                                    .setButtonAccessory(
                                        new ButtonBuilder()
                                            .setStyle(ButtonStyle.Link)
                                            .setLabel("Verify")
                                            .setURL("https://discord.com/channels/1369377209864949770/1457182533518360596")
                                    )
                                    .addTextDisplayComponents(
                                        new TextDisplayBuilder().setContent(`<:crossmark:1457408456980959486> You are not verified! Verify your account and try again.`),
                                    ),
                            ),
                ];
                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                });
                return;
            }

            // Terms Check
            if (!member.roles.cache.some(r => r.name === TERMS_ROLE_ID || r.id === TERMS_ROLE_ID)) {
                const components = [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("## Unaccepted Terms!\nWe have detected that you are yet to accept our terms for pack purchases.\nReview the terms and accept them to be able to use our systems."),
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                            )
                            .addActionRowComponents(
                                new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setStyle(ButtonStyle.Success)
                                            .setLabel("Accept")
                                            .setCustomId("tos_accept"),
                                        new ButtonBuilder()
                                            .setStyle(ButtonStyle.Danger)
                                            .setLabel("Deny")
                                            .setCustomId("tos_deny"),
                                        new ButtonBuilder()
                                            .setStyle(ButtonStyle.Link)
                                            .setLabel("Our Terms")
                                            .setURL("https://google.com"),
                                    ),
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
            const assetId = data.assetId;

             if (!robloxId) {
                await interaction.editReply({
                    content: "<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:D_RBLX"
                });
                return;
            }
            if (!assetId) {
                await interaction.editReply({
                    content: "<:crossmark:1457408456980959486> Oops! Looks like this package has expired! Please try again later. ERR:D_ASSET"
                });
                return;
            }

            // If Premium
            if (member.roles.cache.some(r => r.name === PREMIUM_ROLE_ID || r.id === PREMIUM_ROLE_ID)) {
                const components = [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("## Discount Detected!\nWe have detected that you are eligible for a **15% Discount**."),
                            )
                            .addSeparatorComponents(
                                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
                            )
                            .addActionRowComponents(
                                new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setStyle(ButtonStyle.Success)
                                            .setLabel("Continue")
                                            .setCustomId(`pack_plus_claim_${packId}`),
                                        new ButtonBuilder()
                                            .setStyle(ButtonStyle.Danger)
                                            .setLabel("Cancel")
                                            .setCustomId(`pack_claim2_${packId}`),
                                    ),
                            ),
                ];
                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                });
                return;
            }

            // If Default
            const ownsPackage = await userHasAsset(robloxId, assetId);
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
                                        new TextDisplayBuilder().setContent(`You do not own this package! This is either because you have not bought it yet, which you can do by [**clicking here**](${data.purchaselink}) or because your Roblox inventory visibility is set to private.`),
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
                    content: "<:crossmark:1457408456980959486> Oops! Looks like this package has expired! Please try again later. ERR:D_FILE"
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
                const components = [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<:checkmark:1457408406607364257> The package has been delivered to your DM's! Need help? Open a ticket!"),
                            ),
                ];
                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                });
            } catch {
                const components = [
                        new ContainerBuilder()
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent("<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:D_DM"),
                            ),
                ];
                await interaction.editReply({
                    components: components,
                    flags: MessageFlags.IsComponentsV2
                });
            }
            ///

        }
    }
};