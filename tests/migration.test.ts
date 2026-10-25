import { describe, it, expect } from "vitest";
import { migrationSchema, planMigration } from "../scripts/migration";
import { newEntry } from "../src/lib/content";
import { fixtureContent } from "./fixtures";
const input = migrationSchema.parse({version:1,entries:fixtureContent.map(({id,content},index)=>({id,content,order:index*10}))});
describe("safe migration planning",()=>{
  it("plans creates without overwrites, and resumes drafts",()=>{
    expect(planMigration(input,[]).create).toHaveLength(input.entries.length);
    const entries=input.entries.map(e=>newEntry(e.content,e.id,e.order));
    expect(planMigration(input,entries)).toMatchObject({conflicts:[],create:[],publish:input.entries.map(e=>e.id)});
    const published=entries.map(e=>({...e,published:e.draft,publishedOrder:e.order}));
    expect(planMigration(input,published)).toMatchObject({conflicts:[],create:[],publish:[]});
  });
  it("rejects different drafts, published versions, orders, archive states and reserved identities",()=>{
    const item=input.entries[0]; const entry=newEntry(item.content,item.id,item.order);
    for(const other of [{...entry,order:99},{...entry,archived:true},{...entry,draft:{...entry.draft,name:"Edited name"}},{...entry,published:{...entry.draft,name:"Live edit"},publishedOrder:entry.order},{...entry,_id:"another-profile"}]) {
      expect(planMigration(input,[other]).conflicts.length).toBeGreaterThan(0);
    }
  });
  it("rejects duplicate IDs and project slugs before any connection",()=>{
    expect(migrationSchema.safeParse({version:1,entries:[input.entries[0],input.entries[0]]}).success).toBe(false);
    const project=input.entries.find(e=>e.content.kind==='project')!;
    expect(migrationSchema.safeParse({version:1,entries:[project,{...project,id:'other'}]}).success).toBe(false);
  });
});
