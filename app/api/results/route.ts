type D1Database = { prepare(sql:string): { bind(...values:unknown[]): ReturnType<D1Database["prepare"]>; run():Promise<unknown>; all<T>():Promise<{results:T[]}> } };
async function database(){ const runtime=await import("cloudflare:workers"); return runtime.env.DB as D1Database; }
async function ready(){
  const db=await database();
  await db.prepare(`CREATE TABLE IF NOT EXISTS results (id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT NOT NULL, score REAL NOT NULL, created_at TEXT NOT NULL)`).run();
}
export async function GET(){ await ready(); const db=await database(); const day=new Date().toISOString().slice(0,10); const {results}=await db.prepare("SELECT score FROM results WHERE day = ? ORDER BY score ASC LIMIT 1000").bind(day).all<{score:number}>(); return Response.json({scores:results.map(r=>r.score)}); }
export async function POST(request:Request){ await ready(); const db=await database(); const body=await request.json() as {score?:number}; if(!body.score||body.score<1||body.score>1000000)return Response.json({error:"Scor invalid"},{status:400}); const day=new Date().toISOString().slice(0,10); await db.prepare("INSERT INTO results (day, score, created_at) VALUES (?, ?, ?)").bind(day,body.score,new Date().toISOString()).run(); return Response.json({ok:true}); }
