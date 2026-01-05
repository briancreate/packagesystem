const { MessageFlags, EmbedBuilder } = require("discord.js");
require('dotenv').config({ quiet: true });

const RATE_LIMIT_DELAY = 2000;
const CACHE_TTL_MS = 5 * 60 * 1000;

let requestQueue = [];
let isProcessing = false;

const robloxCache = new Map();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;

  isProcessing = true;
  const { userId, KEY, resolve, reject } = requestQueue.shift();

  try {
    const cached = robloxCache.get(userId);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      resolve(cached.robloxId);
      isProcessing = false;
      processQueue();
      return;
    }

    const guildId = process.env.GUILDID;

    const response = await fetch(
      `https://api.docksys.xyz/api/v1/public/discord-to-roblox?discordId=${userId}&guildId=${guildId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || "Unknown API Error";

      let replyMessage;
      if (errorData.status === 429) {
        replyMessage = "<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:API_LIMIT429";
      } else if (errorData.status === 403) {
        replyMessage = "<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:API_GUILD403";
      } else if (errorData.status === 400) {
        replyMessage =
          "<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:API_PARAM400";
      } else {
        replyMessage = `<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:API_UNKWN:${errorMessage}:STATUS:${errorData.status}`;
      }

      if (interaction.deferred) {
        await interaction.followUp({
          content: replyMessage,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: replyMessage,
          flags: MessageFlags.Ephemeral,
        });
      }

      resolve(null);
    } else {
      const data = await response.json();

      if (!data.data || !data.data.robloxId) {
        const components = [
                new ContainerBuilder()
                    .addSectionComponents(
                        new SectionBuilder()
                            .setButtonAccessory(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Link)
                                    .setLabel("Verify")
                                    .setEmoji({
                                        name: "<:click:1457456025383735378>",
                                    })
                                    .setURL("https://discord.com/channels/1369377209864949770/1457182533518360596")
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`<:crossmark:1457408456980959486> You are not verified! Verify your account and try again.`),
                            ),
                    ),
        ];
        if (interaction.deferred) {
          await interaction.followUp({
            components: components,
            flags: MessageFlags.IsComponentsV2,
          });
        } else {
          await interaction.reply({
            components: components,
            flags: MessageFlags.IsComponentsV2,
          });
        }
        resolve(null);
      } else {
        robloxCache.set(userId, {
          robloxId: data.data.robloxId,
          expiresAt: now + CACHE_TTL_MS,
        });

        resolve(data.data.robloxId);
      }
    }
  } catch (error) {
    console.error("Error fetching Roblox info:", error.message);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:API_FETCH",
        flags: MessageFlags.Ephemeral,
      });
    } else if (interaction.deferred && !interaction.replied) {
      await interaction.followUp({
        content: "<:crossmark:1457408456980959486> Hmm.. Something went wrong! Please try again later. ERR:API_FETCH",
        flags: MessageFlags.Ephemeral,
      });
    }
    resolve(null);
  }

  await delay(RATE_LIMIT_DELAY);
  isProcessing = false;
  processQueue();
}

async function getRobloxInfo(userId, KEY) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ userId, KEY, resolve, reject });
    processQueue();
  });
}

module.exports = { getRobloxInfo };
