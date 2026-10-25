import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), databaseConfigured: vi.fn(), getRepository: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth, signIn: mocks.signIn, signOut: mocks.signOut }));
vi.mock("@/lib/db", () => ({ databaseConfigured: mocks.databaseConfigured, getRepository: mocks.getRepository }));
import AdminPage from "../src/app/admin/page";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AUTH_SECRET", "test-secret");
  vi.stubEnv("AUTH_GITHUB_ID", "test-client");
  vi.stubEnv("AUTH_GITHUB_SECRET", "test-client-secret");
  vi.stubEnv("ADMIN_GITHUB_ID", "123");
  mocks.databaseConfigured.mockReturnValue(true);
});
async function render(error?: string) {
  return renderToStaticMarkup(await AdminPage({ searchParams: Promise.resolve({ error }) }));
}
describe("admin authentication feedback", () => {
  it("separates account rejection from callback or configuration failure without exposing error input", async () => {
    mocks.auth.mockResolvedValue(null);
    expect(await render("AccessDenied")).toContain("Access denied.");
    const configuration = await render("Configuration");
    expect(configuration).toContain("OAuth configuration or network error");
    expect(configuration).not.toContain("Access denied.");
    const unknown = await render("private-error-detail");
    expect(unknown).toContain("Please try again");
    expect(unknown).not.toContain("private-error-detail");
    expect(mocks.getRepository).not.toHaveBeenCalled();
  });
  it("rejects a session from another account before any database access", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "456" } });
    expect(await render()).toContain("Continue with GitHub");
    expect(mocks.databaseConfigured).not.toHaveBeenCalled();
    expect(mocks.getRepository).not.toHaveBeenCalled();
  });
  it("confirms authorized sign-in and retains sign-out with no database configured", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "123" } });
    mocks.databaseConfigured.mockReturnValue(false);
    const html = await render();
    expect(html).toContain("GitHub authentication succeeded");
    expect(html).toContain("Database not connected.");
    expect(html).toContain("Sign out");
    expect(mocks.getRepository).not.toHaveBeenCalled();
  });
  it("keeps authentication success distinct from a failed database read", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "123" } });
    mocks.getRepository.mockResolvedValue({ list: vi.fn().mockRejectedValue(new Error("private connection details")) });
    const html = await render();
    expect(html).toContain("GitHub authentication succeeded");
    expect(html).toContain("Database unavailable.");
    expect(html).toContain("Sign out");
    expect(html).not.toContain("private connection details");
    expect(html).not.toContain("Continue with GitHub");
  });
});
