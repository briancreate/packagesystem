const { Events, SlashCommandSubcommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("Pack Management..")
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription("The name of the package you're creating")
        .setRequired(true)
    ),

  async execute(interaction) {

    const name = interaction.options.getString("name");

    const modal = new ModalBuilder()
      .setCustomId(`pack_create_${name}`)
      .setTitle("Create Package");

    const link = new TextInputBuilder()
      .setCustomId("pack:link")
      .setLabel("Purchase Link")
      .setPlaceholder("Link for Normal Users")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    const pluslink = new TextInputBuilder()
      .setCustomId("pack:pluslink")
      .setLabel("Purchase Link 2")
      .setPlaceholder("Link for Premium Users")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    const packer = new TextInputBuilder()
      .setCustomId("pack:packer")
      .setLabel("Assembler ID")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    const price = new TextInputBuilder()
      .setCustomId("pack:price")
      .setLabel("Package Price")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    const description = new TextInputBuilder()
      .setCustomId("pack:description")
      .setLabel("Package Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(link),
        new ActionRowBuilder().addComponents(pluslink),
        new ActionRowBuilder().addComponents(packer),
        new ActionRowBuilder().addComponents(price),
        new ActionRowBuilder().addComponents(description)
    );

    await interaction.showModal(modal);
  }
};