import { contentSchema, type Content } from "../src/lib/content";
export const fixtureContent: { id: string; content: Content }[] = [
  { id: "profile", content: contentSchema.parse({kind:"profile",name:"Alex Example",role:"Software Engineer",headline:"Hello, I’m Alex.",intro:"I build useful software.",supportingLine:"Backend engineering and developer tools.",about:"An example biography.",links:[{label:"GitHub",url:"https://github.com/example"}]}) },
  ...["lead", "intern"].map((id,index)=>({id,content:contentSchema.parse({kind:"experience",organization:"Example Company",role:index ? "Intern":"Engineer",start:index ? "2024-05":"2026-10",end:index ? "2024-07":"",group:id})})),
  ...["pipeline", "webpage", "summary"].map((variant,index)=>({id:variant,content:contentSchema.parse({kind:"project",title:`Example ${variant}`,slug:`example-${variant}`,category:"Backend",context:"Personal project",summary:"An example project.",stack:["TypeScript"],links:[],featured:true,visualVariant:variant,homepageCaseStudy:index===0,caseStudy:[{title:"A design choice",body:"A considered tradeoff."}]})})),
  {id:"skills",content:contentSchema.parse({kind:"skill",title:"Backend",skills:["API design"]})},
];
