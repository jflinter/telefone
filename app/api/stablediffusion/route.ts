import { Substrate, StableDiffusionXLLightning } from "substrate";
import { saveImage } from "../saveImage";

export const runtime = "edge";

const substrate = new Substrate({ apiKey: process.env.SUBSTRATE_API_KEY });

async function generateImage(prompt: string): Promise<string> {
  const image = new StableDiffusionXLLightning({
    prompt: prompt,
    store: "hosted",
    height: 1024,
    width: 1024,
    num_images: 1,
  });
  const result = await substrate.run(image);
  return result.get(image).outputs[0].image_uri;
}

export async function POST(req: Request) {
  const json = await req.json();
  const { caption } = json;
  const imageUrl = await generateImage(caption);
  const savedImageURL = await saveImage(imageUrl);
  return new Response(JSON.stringify({ imageUrl: savedImageURL }));
}
