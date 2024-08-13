import OpenAI from "openai";
import { Substrate, GenerateImage } from "substrate";

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
    const image = new GenerateImage({
      prompt: prompt,
      store: "hosted",
    });
    const result = await substrate.run(image);
    return result.get(image).image_uri;
  }

  const url = response.data[0].url;
  if (!url) {
    throw new Error("Image generation failed.");
  }
  return url;
}

function makeid() {
  const length = 5;
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export async function POST(req: Request) {
  const json = await req.json();
  const { caption } = json;
  const imageUrl = await generateImage(caption, true);
  return new Response(JSON.stringify({ imageUrl }));
}

// a beautiful raccoon, having finally achieved his dream (a nice cabin), only to realize that true happiness does not come from material means. in the style of munch's the scream

async function uploadImageToR2(
  imageData: Buffer,
  bucketName: string,
  fileName: string,
  accountId: string,
  authKey: string
): Promise<void> {
  const endpoint = new URL(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${bucketName}/values/${fileName}`
  );

  // b012vDwQ8iUWCLtSLWhBRHgDPssH5-090eextrSQ
  // 6db85b9de848b92ef56a7b5c08c49e6b
  // faf1f867f6b7715c2d4f642efd8508f6fc576e6e20e0c16315c45012d04faace
  const response = await fetch(endpoint.href, {
    method: "PUT",
    headers: {
      // Authorization: `Bearer ${"b012vDwQ8iUWCLtSLWhBRHgDPssH5-090eextrSQ"}`,
      "X-Auth-Email": "jflinter11@gmail.com",
      "X-Auth-Key": "b012vDwQ8iUWCLtSLWhBRHgDPssH5-090eextrSQ",
      "Content-Type": "application/octet-stream",
    },
    body: imageData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to upload to R2: ${response.statusText} ${body}`);
  }

  console.log("Upload successful!");
}
