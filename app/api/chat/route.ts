import { OpenAI } from 'openai'; // Assuming OpenAI package is being used

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '', // Make sure API key is available
});

export async function POST(req: Request) {
  try {
    // Parse the incoming request body
    const { message } = await req.json();

    // Call OpenAI API (ensure your setup matches OpenAI's API structure)
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: message }],
      model: 'gpt-3.5-turbo', // Ensure the correct model is specified
    });

    // Return the OpenAI response as JSON
    return new Response(
      JSON.stringify({ response: completion.choices[0].message.content }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing OpenAI API request:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate response from OpenAI' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
