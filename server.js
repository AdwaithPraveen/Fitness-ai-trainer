process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require("express");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/api/generate-plan", async (req, res) => {
  try {
    const user = req.body;

    const systemPrompt = `
You are a friendly Indian gym trainer.
Tone must be casual, simple, helpful.
Use words like “Boss”, “Bro”, “Don’t worry”.

Output format:
1) Health Summary
2) Workout Plan
3) Diet Plan (Try to keep under ₹300 but not required)
4) Cost Summary
5) Final Motivation

No follow-up questions. Just generate the plan.
    `;

    const userPrompt = `
Generate a complete personalized fitness plan for this user:

Age: ${user.age}
Sex: ${user.sex}
Height: ${user.height_cm} cm
Weight: ${user.weight_kg} kg
Body shape: ${user.body_shape}
Activity level: ${user.activity_level}
Goal: ${user.goal}
Diet preference: ${user.diet_pref}
Equipment: ${user.equipment}
Difficulty: ${user.difficulty}

Provide the best possible:
- Workout
- Diet
- Simple analysis
    `;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800
      })
    });

    const groqData = await groqRes.json();

    const fullText =
      groqData?.choices?.[0]?.message?.content ||
      "AI error.";

    const sections = fullText.split(/\n\s*\n/).filter(Boolean);

    res.json({ formattedSections: sections });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);
