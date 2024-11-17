import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Your OpenAI API key
});

export async function POST(req) {
  const { prompt } = await req.json();

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",  // or the model you want to use
    messages: [{ role: "user", content: prompt }],
  });

  return new Response(JSON.stringify({ message: response.choices[0].message.content }), {
    headers: { "Content-Type": "application/json" },
  });
}
