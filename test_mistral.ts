import { Mistral } from "@mistralai/mistralai";
import dotenv from "dotenv";

dotenv.config();

async function testMistral() {
  const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || "" });
  try {
    const response = await mistral.chat.complete({
      model: "mistral-large-latest",
      messages: [{ role: "user", content: "Say hello" }],
    });
    console.log("Mistral Response:", response.choices?.[0]?.message?.content);
  } catch (error) {
    console.error("Mistral Error:", error);
  }
}

testMistral();
