const User = require("../models/user");

async function sendConversations(req, res) {
  try {
    const { email, count } = req.query;

    // Find the user with the given email
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User not found");
    }

    // Sort the user's conversations array in descending order of time
    const sortedConversations = user.conversations.sort(
      (a, b) => b.time - a.time
    );

    // Calculate the start and end indexes for the conversations to be sent
    const startIndex = count;
    const endIndex = startIndex + 5;

    // Get the next 5 conversations
    const conversations = sortedConversations.slice(startIndex, endIndex);

    res.json({ conversations });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while fetching conversations");
  }
}

module.exports = {
  sendConversations,
};
