module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("send")
    .setDescription("‎ ")
    .addStringOption((option) =>
      option
        .setName('package')
        .setDescription("ID of the package you are attempting to publish")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('forum')
        .setDescription("The forum you want to publish the package in")
        .setRequired(true)
        .addChoices(
          { name: "Liveries Forum", value: "liveries" },
          { name: "Clothing Forum", value: "clothing" },
          { name: "Bot Code Forum", value: "code" },
        )
    )
    .addAttachmentOption((option) =>
      option
        .setName('image')
        .setDescription("Attach a product image/ video for the package")
        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName('file')
        .setDescription("Attach the delivery file for the package")
        .setRequired(true)
    )

  async execute(interaction) {
    s

  }
};