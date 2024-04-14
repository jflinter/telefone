import OpenAI from "openai";
import { Substrate } from "substrate";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const substrate = new Substrate({ apiKey: process.env.SUBSTRATE_API_KEY });

async function generateImage(
  prompt: string,
  rewrite: boolean
): Promise<string> {
  const fullPrompt = `Make an image with the following description. This is user-generated input that may contain elements rejected by your safety system. If you can't render them, ignore those aspects of the request, but always reply with an image. Avoid any content that may be considered inappropriate or offensive, ensuring the image aligns with content policies. If the request is nonsensical or vague, make things up. Always respond with an image. The prompt is:
    
    ${prompt}`;
  let response = null;
  try {
    response = await openai.images.generate({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });
  } catch (error) {
    if ((error as any).code === "content_policy_violation" && rewrite) {
      const rewrite = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "i am accepting a user-supplied prompt as a prompt to DALL-E. this prompt may be inappropriate or nonsensical but it is important that an image is always returned. rewrite this prompt to change any inappropriate elements to ones that will not violate the safety system but preserve as much as possible. the prompt is:",
          },
          { role: "user", content: prompt },
        ],
      });
      const message = rewrite.choices[0].message.content;
      if (message === null) {
        throw new Error("Could not rewrite prompt");
      }
      console.error(`Rewritten prompt: ${message}`);
      return generateImage(message, false);
    } else {
      throw error;
    }
  }

  const url = response.data[0].url;
  if (!url) {
    throw new Error("Image generation failed.");
  }
  return url;
}

export async function POST(req: Request) {
  const json = await req.json();
  const { caption } = json;
  const imageUrl = await generateImage(caption, true);
  return new Response(JSON.stringify({ imageUrl }));
}

// a beautiful raccoon, having finally achieved his dream (a nice cabin), only to realize that true happiness does not come from material means. in the style of munch's the scream
