const model = "gpt-3.5-turbo";
const maxTokens = 100;
const tokenLimitNumber = 2000;
const temperature = 0.6;
const top_p = 0.3;
const frequency_penalty = 0.2;
const presence_penalty = 0.2;

const extraTokensPerMessage = 5;

module.exports = {
  tokenLimitNumber,
  extraTokensPerMessage,
  model,
  maxTokens,
  temperature,
  top_p,
  frequency_penalty,
  presence_penalty,
};
