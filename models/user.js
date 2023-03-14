const mongoose = require("mongoose");
const { tokenLimitNumber, extraTokensPerMessage } = require("../constants");

const conversationSchema = new mongoose.Schema({
  question: String,
  answer: String,
  time: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  name: String,
  image: String,
  email: { type: String, unique: true },
  conversations: [conversationSchema],
  created_at: { type: Date, default: Date.now },
  tokenLimit: { type: Number, default: tokenLimitNumber },
  tokenUsed: { type: Number, default: 0 },
  lastTokenReset: { type: Date, default: Date.now },
});

userSchema.methods.checkTokens = function (total_tokens) {
  const now = new Date();
  const timeSinceReset = now - this.lastTokenReset;
  const hoursSinceReset = timeSinceReset / (1000 * 60 * 60);

  if (hoursSinceReset >= 24) {
    // Reset tokens if 24 hours have passed since last reset
    this.tokenUsed = 0;
    this.lastTokenReset = now;
  }

  const tokensUsed = this.tokenUsed + total_tokens + extraTokensPerMessage;

  if (tokensUsed > this.tokenLimit) {
    // User has reached token limit, can't send message
    throw new Error("Token limit reached");
  }

  // Update token used count and save user
  this.tokenUsed = tokensUsed;
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
