import OpenAI from "openai";
import { Substrate, StableDiffusionXL } from "substrate";

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
    // if dall-e fails try substrate
    const image = new StableDiffusionXL({
      prompt: prompt,
      store: "hosted",
      height: 1024,
      width: 1024,
      num_images: 1,
    });
    const result = await substrate.run(image);
    return result.get(image).outputs[0].image_uri;
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
