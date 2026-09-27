import { currentAdmin } from "@/lib/api";
import { AppError, toErrorResponse } from "@/lib/errors";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DEFAULT_CLOUD_NAME = "tbqkgomc";
const DEFAULT_UPLOAD_PRESET = "commercecraft_uploads";

export async function POST(request: Request) {
  try {
    await currentAdmin();
    const submitted = await request.formData();
    const file = submitted.get("file");
    if (!(file instanceof File)) throw new AppError("Choose an image to upload", 400, "IMAGE_REQUIRED");
    if (!ACCEPTED_TYPES.has(file.type)) throw new AppError("Choose a JPG, PNG, or WebP image", 400, "IMAGE_TYPE_INVALID");
    if (file.size > MAX_FILE_SIZE) throw new AppError("The image must be 5 MB or smaller", 400, "IMAGE_TOO_LARGE");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || DEFAULT_UPLOAD_PRESET;
    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", uploadPreset);
    body.append("folder", "commercecraft");
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
    const payload = await response.json() as { secure_url?: string; error?: { message?: string } };
    if (!response.ok || !payload.secure_url) {
      throw new AppError(payload.error?.message ?? "Cloudinary could not upload this image", 502, "IMAGE_UPLOAD_FAILED");
    }
    return Response.json({ data: { imageUrl: payload.secure_url } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
