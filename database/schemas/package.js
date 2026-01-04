const mongoose = require("mongoose");

const x = new mongoose.Schema(
  {
    packId: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true },
    purchaselink: { type: String, required: true },
    purchasepluslink: { type: String, required: true },
    assetId: { type: Number, required: true },
    packerId: { type: String, required: true },
    price: { type: String, required: true },
    items: { type: String, required: true },
    messageId: { type: String, required: false },
    downloadFile: {
      url: { type: String, required: false },
      name: { type: String, required: false },
    },
    claims: {
      type: [
        {
          userId: { type: String, required: true },
          dmChannelId: { type: String, required: true },
          dmMessageId: { type: String, required: true },
          claimedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("package", x);
