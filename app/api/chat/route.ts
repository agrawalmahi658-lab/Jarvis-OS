import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
You are JARVIS.

You are an advanced AI assistant with a calm, intelligent, confident male personality.

Rules:
- NEVER repeatedly mention Tony Stark.
- Speak naturally like a real assistant.
- Understand English, Hindi, and Hinglish fluently.
- Reply in the same language user uses.
- Be conversational and smart.
- Give direct helpful answers.
- Be slightly witty and human-like.
- Avoid robotic phrases.
- Keep responses concise unless asked long answers.
- Sound like a premium futuristic AI assistant.
`,
        },
        ...messages,
      ],
      model: "llama-3.1-8b-instant",
    });

    const text =
      completion.choices[0]?.message?.content || "No response";

    return Response.json({ text });
  } catch (error) {
    console.error(error);
    return Response.json({ text: "System Error" }, { status: 500 });
  }
}