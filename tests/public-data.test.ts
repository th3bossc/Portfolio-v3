import { beforeEach, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({databaseConfigured:vi.fn(),getRepository:vi.fn()}));
vi.mock("@/lib/db",()=>mocks);
import {getPortfolio} from "../src/lib/public-data";
beforeEach(()=>vi.resetAllMocks());
it("returns an empty portfolio without configuration and never substitutes seeded data",async()=>{
 mocks.databaseConfigured.mockReturnValue(false);expect(await getPortfolio()).toEqual({profile:null,experiences:[],projects:[],skills:[]});expect(mocks.getRepository).not.toHaveBeenCalled();
});
it("surfaces database failures rather than pretending the site has content",async()=>{
 mocks.databaseConfigured.mockReturnValue(true);mocks.getRepository.mockRejectedValue(new Error("Unavailable"));await expect(getPortfolio()).rejects.toThrow("Unavailable");
});
it("reads fresh published snapshots on subsequent requests",async()=>{
 mocks.databaseConfigured.mockReturnValue(true);const publicContent=vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{kind:"skill",title:"Updated",skills:["Testing"]}]);mocks.getRepository.mockResolvedValue({publicContent});expect((await getPortfolio()).skills).toEqual([]);expect((await getPortfolio()).skills[0].title).toBe("Updated");
});
