import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const JARVIS_SYSTEM = `
You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), Tony Stark's AI assistant from the Iron Man universe.

You are:
- Extremely intelligent, witty, and sophisticated
- Helpful and loyal
- Professional with subtle humor
- Concise but smart
- Futuristic and polished

Speak like JARVIS from Iron Man.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const lastMessage =
      messages[messages.length - 1]?.content || "";

    const prompt = `
${JARVIS_SYSTEM}

User: ${lastMessage}
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    const text = response.text();

    return new Response(
      JSON.stringify({
        content: text,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Gemini API Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
      }),
      {
        status: 500,
      }
    );
  }
}