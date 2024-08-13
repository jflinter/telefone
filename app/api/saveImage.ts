import { createClient } from "@supabase/supabase-js";

const supabaseURL = process.env.SUPABASE_URL;
if (!supabaseURL) {
  throw new Error("Missing SUPABASE_URL");
}
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseURL, supabaseKey);

function dateToString(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    (date.getUTCMonth() + 1).toString().padStart(2, "0") +
    date.getUTCDate().toString().padStart(2, "0")
  );
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

async function fetchImageData(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.blob();
}

export async function saveImage(imageUrl: string) {
  return imageUrl;
  // const imageData = await fetchImageData(imageUrl);
  // const today = new Date();
  // const yesterday = new Date(
  //   today.getUTCFullYear(),
  //   today.getUTCMonth(),
  //   today.getUTCDate() - 1
  // );
  // const todayDate = dateToString(today);
  // const id = `${todayDate}/${makeid()}.png`;
  // const { data, error } = await supabase.storage
  //   .from("images")
  //   .upload(id, imageData);
  // if (error) {
  //   return imageUrl;
  // }
  // return `https://rmzyesumpxgghronunfu.supabase.co/storage/v1/object/public/images/${data.path}`;
}
