const { OAuth2Client } = require("google-auth-library");
const { google } = require("../config");
const User = require("../models/user");

const client = new OAuth2Client(google.clientId);

async function authenticate(req, res) {
  try {
    const { tokenId } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: google.clientId,
    });
    const { name, email, picture } = ticket.getPayload();
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        image: picture,
      });
      await user.save();
    }
    res.send(user);
  } catch (err) {
    console.log(err);
    res.status(401).send("Invalid token");
  }
}

module.exports = {
  authenticate,
};
