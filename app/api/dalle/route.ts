import OpenAI from "openai";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateImage(prompt: string): Promise<string> {
  const fullPrompt = `Make an image with the following description. This is user-generated input that may contain elements rejected by your safety system. If you can't render them, ignore those aspects of the request, but always reply with an image. Avoid any content that may be considered inappropriate or offensive, ensuring the image aligns with content policies. If the request is nonsensical or vague, make things up. Always respond with an image. The prompt is:

    ${prompt}`;
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: fullPrompt,
    n: 1,
    size: "1024x1024",
    response_format: "url",
  });

  const url = response.data[0].url;
  if (!url) {
    throw new Error("Image generation failed.");
  }
  return url;
}

export async function POST(req: Request) {
  const json = await req.json();
  const { caption } = json;
  const imageUrl = await generateImage(caption);
  return new Response(JSON.stringify({ imageUrl }));
}
