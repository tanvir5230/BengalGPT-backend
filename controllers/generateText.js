const { Translate } = require("@google-cloud/translate").v2;
const { Configuration, OpenAIApi } = require("openai");
const {
  model,
  maxTokens,
  temperature,
  top_p: topP,
  frequency_penalty: frequencyPenalty,
  presence_penalty: presencePenalty,
} = require("../constants");
const User = require("../models/user");
// Env configurations
require("dotenv").config();
// credentials of google translate
const CREDENTIALS = require(process.env.CREDENTIALS);

// credentials of openai
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Configuration for the client
const translate = new Translate({
  credentials: CREDENTIALS,
  projectId: CREDENTIALS.project_id,
});

// Function to detect the language of a text
async function detectLanguage(text) {
  try {
    let [detection] = await translate.detect(text);
    let { language } = detection;
    return language;
  } catch (error) {
    console.error(error);
    throw new Error("Language detection failed");
  }
}

// Function to translate a text to English if it's in Bengali
async function translateToEnglish(text) {
  try {
    let language = await detectLanguage(text);
    if (language === "bn") {
      let [translation] = await translate.translate(text, "en");
      return translation;
    } else {
      return text;
    }
  } catch (error) {
    console.error(error);
    throw new Error("Translation failed");
  }
}
async function saveConversation(email, question, answer) {
  try {
    let conversation = {
      question: question,
      answer: answer,
    };

    // Find the user with the given email
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User not found");
    }

    // Add the conversation to the user's conversations array
    user.conversations.push(conversation);

    // Save the user to the database
    await user.save();
  } catch (error) {
    console.error(error);
    throw new Error("Conversation saving failed");
  }
}

// Function to process the user's text input and send it to OpenAI for completion
async function processText(inputText, email) {
  try {
    let outputText = "";
    const question = inputText;
    let language = await detectLanguage(inputText);
    // If the input text is in Bengali, translate it to English
    if (language === "bn") {
      inputText = await translateToEnglish(inputText);
    }
    // Send the input text to OpenAI for completion
    const prompt = inputText;
    const openAImodel = model;
    const maxTokensOfModel = maxTokens;
    const response = await openai.createChatCompletion({
      messages: [
        {
          role: "user",
          content: `${prompt}. Tell the answer precisely within 400 characters.`,
        },
      ],
      model: openAImodel,
      max_tokens: maxTokensOfModel,
      temperature: temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
    });
    // Get the output text from the OpenAI response
    outputText = response.data.choices[0].message.content.trim();
    const totalTokens = response.data.usage.total_tokens;
    // If the input text was in Bengali, translate the output text back to Bengali
    if (language === "bn") {
      outputText = await translate.translate(outputText, "bn");
      outputText = outputText[0];
    }
    saveConversation(email, question, outputText);
    return { outputText, totalTokens };
  } catch (error) {
    console.error(error);
    throw new Error("Text processing failed");
  }
}

// Main function call when the user sends a request
async function generateText(req, res) {
  try {
    const { email, prompt, appVersion } = req.body;
    if (appVersion !== 1.0) {
      res.send({
        generated_text:
          "You are using the older version of the app. Go to the playstore to update the app.",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    let { outputText, totalTokens } = await processText(prompt, email);
    // Check if user has enough tokens to generate output text
    await user.checkTokens(totalTokens);
    res.json({
      generated_text: outputText,
      tokenLimit: user.tokenLimit,
      tokenUsed: user.tokenUsed,
    });
  } catch (error) {
    if (error.message === "Token limit reached") {
      // Token limit reached, send appropriate response to client
      res.status(403).json({
        generated_text:
          "You have reached your daily token limit. Can't talk more today.",
      });
    } else {
      // Other error occurred, send 500 error response
      res.status(500).send("An error occurred while processing your text");
    }
  }
}

module.exports = {
  generateText,
};
