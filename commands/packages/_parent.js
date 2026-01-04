const fs = require("fs");
const path = require("path");
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: (() => {
    const builder = new SlashCommandBuilder()
      .setName("pack")
      .setDescription("...")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    const subFolder = path.join(__dirname, "commands");
    const subFiles = fs.readdirSync(subFolder).filter(f => f.endsWith(".js"));

    for (const file of subFiles) {
      const sub = require(path.join(subFolder, file));
      builder.addSubcommand(sub.data); // Assuming sub.data is a builder instance
    }

    return builder;
  })(),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const handler = require(`./commands/${sub}.js`);
    return handler.execute(interaction);
  }
};
