const express = require("express");
const router = express.Router();

const { cleanTweetText } = require("../services/llmService");
const { suggestImages } = require("../services/imageService");

router.post("/clean-tweet", async (req, res) => {
  try {
    console.log("req.body:", req.body);

    const rawText = req.body?.rawText;

    if (!rawText) {
      return res.status(400).json({ error: "rawText is required" });
    }

    const result = await cleanTweetText(rawText);
    res.json(result);
  } catch (error) {
    console.error("clean-tweet error:", error);
    res.status(500).json({ error: "Failed to clean tweet text" });
  }
});

router.post("/suggest-images", async (req, res) => {
  try {
    console.log("req.body:", req.body);

    const description = req.body?.description;

    if (!description) {
      return res.status(400).json({ error: "description is required" });
    }

    const result = await suggestImages(description);
    res.json(result);
  } catch (error) {
    console.error("suggest-images error:", error);
    res.status(500).json({ error: "Failed to suggest images" });
  }
});

module.exports = router;