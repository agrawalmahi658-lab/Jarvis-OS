import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY!
);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const JARVIS_SYSTEM = `
You are J.A.R.V.I.S. from Iron Man.
Intelligent, futuristic, witty, professional.
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

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const line = `0:${JSON.stringify(text)}\n`;

        controller.enqueue(
          encoder.encode(line)
        );

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Gemini API Error:", error);

    return new Response("Error", {
      status: 500,
    });
  }
}