import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { content, prompt } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: `You are an intelligent writing assistant. The user is editing a document. 
             Help them improve their writing, suggest completions, or answer questions about their content.`,
    messages: [
      {
        role: "user",
        content: `Document content:\n${JSON.stringify(content)}\n\nUser request: ${prompt}`,
      },
    ],
  });

  return result.toTextStreamResponse();
}
