import { toast } from "sonner";

export async function copyToClipboard(
  text: string,
  successMessage = "הועתק ללוח"
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
    return true;
  } catch {
    toast.error("לא ניתן להעתיק");
    return false;
  }
}
