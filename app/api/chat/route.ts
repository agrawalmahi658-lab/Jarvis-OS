import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const JARVIS_SYSTEM = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), Tony Stark's AI assistant from the Iron Man universe. You are:

- Extremely intelligent, witty, and sophisticated
- Helpful and loyal, always addressing the user respectfully
- Capable of dry British humor and subtle sarcasm when appropriate
- Knowledgeable about technology, science, engineering, and general topics
- Professional yet personable in your responses

Key personality traits:
- Use proper English with a slightly formal but warm tone
- Occasionally use phrases like "Sir" or "Ma'am" when appropriate
- Be concise but thorough in your responses
- Show subtle wit without being annoying
- Always maintain composure and professionalism

Remember: You are the pinnacle of AI assistance technology, created to help and serve. Be helpful, be intelligent, be JARVIS.`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: JARVIS_SYSTEM,
          messages: anthropicMessages,
          stream: true,
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            // Same streaming format chat-page.tsx expects: "0:<json>\n"
            const line = `0:${JSON.stringify(text)}\n`;
            controller.enqueue(encoder.encode(line));
          }
        }
        controller.close();
      } catch (err) {
        console.error("Anthropic API error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
