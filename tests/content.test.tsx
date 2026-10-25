import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { fixtureContent } from "./fixtures";
import { contentSchema, experienceSchema, profileSchema, profileDescription, safeUrl, toPortfolio } from "../src/lib/content";
import { isAllowedAdmin } from "../src/lib/access";
import { Markdown } from "../src/components/markdown";
import { Home } from "../src/components/home";

describe("fixture content and validation", () => {
  it("validates every fixture entry and keeps experience descriptions empty", () => {
    fixtureContent.forEach((entry) => expect(contentSchema.safeParse(entry.content).success).toBe(true));
    const portfolio = toPortfolio(fixtureContent.map((entry) => entry.content));
    expect(portfolio.projects).toHaveLength(3);
    expect(portfolio.experiences).toHaveLength(2);
    expect(portfolio.experiences.every((entry) => entry.description === "")).toBe(true);
    expect(portfolio.projects.filter((entry) => entry.featured).map((entry) => entry.slug)).toEqual(["example-pipeline", "example-webpage", "example-summary"]);
  });
  it("accepts optional descriptions and rejects invalid date ranges", () => {
    const role = { kind: "experience", organization: "Company", role: "Engineer", start: "2025-06", end: "" };
    expect(experienceSchema.parse(role).description).toBe("");
    expect(experienceSchema.safeParse({ ...role, end: "2024-05" }).success).toBe(false);
    expect(experienceSchema.safeParse({ ...role, start: "2025-13" }).success).toBe(false);
  });
  it("rejects unsafe URLs", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,test", "http://example.com", "https://user:pass@example.com"]) expect(safeUrl.safeParse(url).success).toBe(false);
    expect(safeUrl.safeParse("https://github.com/example").success).toBe(true);
  });
});
describe("access control", () => {
  it("fails closed without a numeric immutable account ID", () => {
    expect(isAllowedAdmin("example", "example")).toBe(false);
    expect(isAllowedAdmin(undefined, "")).toBe(false);
    expect(isAllowedAdmin("123", "456")).toBe(false);
    expect(isAllowedAdmin(123, "123")).toBe(true);
  });
});
describe("public rendering", () => {
  it("does not execute raw HTML or unsafe Markdown links", () => {
    const markup = renderToStaticMarkup(<Markdown text={'<script>alert(1)</script> [unsafe](javascript:alert) **Safe** [GitHub](https://github.com)'} />);
    expect(markup).not.toContain("<script>");
    expect(markup).not.toContain('href="javascript:');
    expect(markup).toContain("<strong>Safe</strong>");
    expect(markup).toContain('rel="noopener noreferrer"');
  });
  it("omits absent media and experience descriptions and supports adding a description", () => {
    const data = toPortfolio(fixtureContent.map((entry) => structuredClone(entry.content)));
    let html = renderToStaticMarkup(<Home data={data} />);
    expect(html).not.toContain('class="portrait"');
    expect(html).not.toContain("Résumé");
    expect(html).not.toContain("Education");
    expect(html).toContain("Oct 2026 — Present");
    data.experiences[0].description = "An optional description.";
    html = renderToStaticMarkup(<Home data={data} />);
    expect(html).toContain("An optional description.");
  });
});


describe("personal introduction", () => {
  it("supports optional hero fields and metadata fallback for older profiles", () => {
    const profile = toPortfolio(fixtureContent.map((entry) => entry.content)).profile!;
    expect(profileDescription(profile)).toBe("Backend engineering and developer tools.");
    const { intro, supportingLine, ...legacy } = profile;
    expect(profileSchema.safeParse(legacy).success).toBe(true);
    expect(profileDescription(legacy)).toBe(legacy.headline);
    expect(profileDescription({ ...profile, supportingLine: "" })).toBe(profile.headline);
    expect(profileSchema.safeParse({ ...profile, intro: "x".repeat(301) }).success).toBe(false);
    expect(intro).toBeTruthy(); expect(supportingLine).toBeTruthy();
  });
  it("renders readable hero content on the server without animation or JavaScript", () => {
    const data = toPortfolio(fixtureContent.map((entry) => structuredClone(entry.content)));
    let html = renderToStaticMarkup(<Home data={data} />);
    expect(html).toContain("Hello, I’m Alex.");
    expect(html).toContain("I build useful software.");
    expect(html).not.toContain("Software, thoughtfully engineered");
    expect(html).not.toContain("opacity:0");
    delete data.profile!.intro; delete data.profile!.supportingLine;
    html = renderToStaticMarkup(<Home data={data} />);
    expect(html).not.toContain('class="hero-intro"');
    expect(html).not.toContain('class="hero-support"');
  });
});

describe("database-controlled presentation",()=>{
  it("validates marks and preserves legacy project defaults",()=>{
    const profile=fixtureContent[0].content;
    expect(contentSchema.safeParse({...profile,brandMark:"123456789"}).success).toBe(false);
    const project=fixtureContent.find(e=>e.content.kind==='project')!.content;
    if(project.kind!=='project')throw new Error('Expected project');
    const {visualVariant,homepageCaseStudy,...legacy}=project;
    expect(contentSchema.parse(legacy)).toMatchObject({visualVariant:'generic',homepageCaseStudy:false});
    expect(contentSchema.safeParse({...project,visualVariant:'invalid'}).success).toBe(false);
  });
  it("selects the homepage case study through fields rather than known project slugs",()=>{
    const data=toPortfolio(fixtureContent.map(e=>structuredClone(e.content)));
    data.projects[0].slug='a-completely-new-slug';
    data.projects[0].title='A new database title';
    let html=renderToStaticMarkup(<Home data={data}/>);
    expect(html).toContain('A few lessons from building A new database title.');
    data.projects.forEach(project=>{project.homepageCaseStudy=false;});
    html=renderToStaticMarkup(<Home data={data}/>);
    expect(html).not.toContain('A few lessons from building');
  });
});
