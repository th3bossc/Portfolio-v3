import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), getRepository: vi.fn(), updateTag: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@/auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/db", () => ({ getRepository: mocks.getRepository }));
vi.mock("next/cache", () => ({ updateTag: mocks.updateTag, revalidatePath: mocks.revalidatePath }));
import { changeState, saveEntry } from "../src/app/admin/actions";
import { fixtureContent } from "./fixtures";

beforeEach(() => { vi.resetAllMocks(); });
describe("mutation boundary", () => {
  it("denies every operation before database access without an authorized session", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    for (const operation of [
      () => saveEntry(null, 0, fixtureContent[0].content, 0),
      ...(["publish", "unpublish", "archive", "restore"] as const).map((action) => () => changeState("entry", 1, action)),
    ]) expect(await operation()).toMatchObject({ ok: false });
    expect(mocks.getRepository).not.toHaveBeenCalled();
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });
  it("invalidates public caches only after a successful publication mutation", async () => {
    mocks.requireAdmin.mockResolvedValue({ user: { id: "123" } });
    const publish = vi.fn().mockRejectedValueOnce(new Error("Connection failure")).mockResolvedValueOnce(undefined);
    mocks.getRepository.mockResolvedValue({ publish });
    expect(await changeState("entry", 1, "publish")).toMatchObject({ ok: false });
    expect(mocks.updateTag).not.toHaveBeenCalled();
    expect(await changeState("entry", 1, "publish")).toMatchObject({ ok: true });
    expect(mocks.updateTag).toHaveBeenCalledWith("portfolio");
  });
});
