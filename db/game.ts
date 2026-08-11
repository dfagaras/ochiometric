export type GameDatabase = { prepare(sql: string): { bind(...v: unknown[]): ReturnType<GameDatabase["prepare"]>; first<T>(): Promise<T|null>; all<T>(): Promise<{results:T[]}>; run(): Promise<{meta?:{changes?:number}}> } };

export function scoreFactor(guess:number, answer:number){
  if(!Number.isFinite(guess)||guess<=0) throw new Error("ESTIMARE_INVALIDA");
  return Math.max(guess/answer,answer/guess);
}

export async function publicPuzzle(db:GameDatabase,date:string){
  const {results}=await db.prepare(`SELECT p.edition,p.publish_date,q.position,q.prompt,q.unit FROM puzzles p JOIN questions q ON q.puzzle_id=p.id WHERE p.publish_date=? AND p.status='published' ORDER BY q.position`).bind(date).all<{edition:number;publish_date:string;position:number;prompt:string;unit:string}>();
  if(!results.length)return null;
  return {edition:results[0].edition,publishDate:results[0].publish_date,questions:results.map(({position,prompt,unit})=>({position,prompt,unit}))};
}

export async function lockAnswer(db:GameDatabase,playerId:string,date:string,position:number,guess:number){
  if(!Number.isInteger(position)||position<1||position>3)throw new Error("POZITIE_INVALIDA");
  if(!Number.isFinite(guess)||guess<=0||guess>1e15)throw new Error("ESTIMARE_INVALIDA");
  const row=await db.prepare(`SELECT a.id attempt_id,q.id question_id,q.answer,q.explanation FROM attempts a JOIN puzzles p ON p.id=a.puzzle_id JOIN questions q ON q.puzzle_id=p.id AND q.position=? WHERE a.player_id=? AND p.publish_date=? AND p.status='published' AND a.completed_at IS NULL`).bind(position,playerId,date).first<{attempt_id:number;question_id:number;answer:number;explanation:string}>();
  if(!row)throw new Error("INCERCARE_INDISPONIBILA");
  const factor=scoreFactor(guess,row.answer);
  const inserted=await db.prepare(`INSERT INTO attempt_answers(attempt_id,question_id,guess,factor) SELECT ?,?,?,? WHERE (SELECT count(*) FROM attempt_answers WHERE attempt_id=?)=? ON CONFLICT(attempt_id,question_id) DO NOTHING`).bind(row.attempt_id,row.question_id,guess,factor,row.attempt_id,position-1).run();
  if(!inserted.meta?.changes)throw new Error("RASPUNS_DEJA_BLOCAT");
  const aggregate=await db.prepare(`SELECT count(*) count,avg(factor) score FROM attempt_answers WHERE attempt_id=?`).bind(row.attempt_id).first<{count:number;score:number}>();
  const completed=aggregate?.count===3;
  if(completed)await db.prepare(`UPDATE attempts SET completed_at=CURRENT_TIMESTAMP,score=? WHERE id=? AND completed_at IS NULL`).bind(aggregate.score,row.attempt_id).run();
  return {position,guess,answer:row.answer,factor,explanation:row.explanation,completed,score:completed?aggregate!.score:null};
}
