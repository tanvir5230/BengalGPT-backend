// Import required modules
const express = require("express");
const bodyParser = require("body-parser");
const { authenticate } = require("./controllers/auth");
const { generateText } = require("./controllers/generateText");
const mongoose = require("mongoose");
const { sendConversations } = require("./controllers/sendConversations");
// Env configurations
require("dotenv").config();
const MONGO_URI = `mongodb+srv://${process.env.USERNAME_MONGO}:${process.env.PASSWORD_MONGO}@cluster0.3mqii6c.mongodb.net/bengalgpt?retryWrites=true&w=majority`;

mongoose.set("strictQuery", false);

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Failed to connect to MongoDB", err));

// Set up app
const app = express();

const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up POST route to receive user input
app.post("/generate-text", generateText);
// Set up POST route for authentication
app.post("/google-sign-in", authenticate);
// Set up Get route for sending last 5 conversations
app.get("/", sendConversations);

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
