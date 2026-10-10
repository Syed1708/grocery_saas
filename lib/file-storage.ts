import fs from "node:fs/promises";
import path from "node:path";

/**
 * Saves a File from FormData to public/uploads/<subfolder>
 * Returns the public web path (e.g., "/uploads/categories/1728600000000-apple.webp")
 */
export async function saveUploadedFile(file: File, subfolder: string): Promise<string> {
  if (!file || file.size === 0) return "";

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Target directory: public/uploads/<subfolder>
  const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);

  // Ensure directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  // Sanitize filename and create unique timestamped name
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueFilename = `${Date.now()}-${cleanName}`;
  const filePath = path.join(uploadDir, uniqueFilename);

  // Write file to disk
  await fs.writeFile(filePath, buffer);

  return `/uploads/${subfolder}/${uniqueFilename}`;
}

/**
 * Deletes a file from public/uploads given its web path
 */
export async function deleteUploadedFile(publicUrl?: string | null): Promise<boolean> {
  if (!publicUrl || !publicUrl.startsWith("/uploads/")) return false;

  try {
    const relativePath = publicUrl.replace(/^\//, "");
    const fullPath = path.join(process.cwd(), "public", relativePath);

    // Check if file exists before deleting
    await fs.access(fullPath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    // File already gone or inaccessible
    return false;
  }
}