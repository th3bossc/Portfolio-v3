"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z, ZodError } from "zod";
import { requireAdmin } from "@/auth";
import { getRepository } from "@/lib/db";
import { ContentError } from "@/lib/repository";

export type ActionResult = { ok: boolean; message: string; id?: string };
const identity = z.object({ id: z.string().min(1).max(100), revision: z.number().int().positive() });
function refresh() {
  updateTag("portfolio");
  revalidatePath("/", "layout");
}
async function run(operation: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    await requireAdmin();
    return await operation();
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, message: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") };
    if (error instanceof ContentError) return { ok: false, message: error.message };
    return { ok: false, message: error instanceof Error && error.message === "Unauthorized" ? "Your session is not authorized. Sign in again." : "The operation could not be completed. Check database connectivity and retry. Your live content has not been replaced by a draft." };
  }
}
export async function saveEntry(id: string | null, revision: number, content: unknown, order: number) {
  return run(async () => {
    const repo = await getRepository();
    const entryId = id ?? crypto.randomUUID();
    if (id !== null) identity.parse({ id, revision });
    if (id) await repo.save(id, revision, content, order);
    else await repo.create(content, entryId, order);
    revalidatePath("/admin");
    return { ok: true, message: "Draft saved. Published content is unchanged.", id: entryId };
  });
}
export async function changeState(id: string, revision: number, action: "publish" | "unpublish" | "archive" | "restore") {
  return run(async () => {
    if (!["publish", "unpublish", "archive", "restore"].includes(action)) throw new ContentError("Unknown action.");
    identity.parse({ id, revision });
    const repo = await getRepository();
    await repo[action](id, revision);
    refresh();
    return { ok: true, message: ({ publish: "Published. The site now shows this version.", unpublish: "Unpublished. The draft is retained.", archive: "Archived and removed from the public site.", restore: "Restored as a draft." })[action] };
  });
}
