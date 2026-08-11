import { getD1Database } from "@/db";
import { ensureAnonymousPlayer } from "@/db/anonymous-player";
import { bucharestDate } from "@/db/attempts";
import { lockAnswer } from "@/db/game";
export async function POST(request:Request){const db=await getD1Database();const player=await ensureAnonymousPlayer(request,db);let body:{position?:number;guess?:number};try{body=await request.json()}catch{return Response.json({error:"Cerere invalidă."},{status:400})}try{const reveal=await lockAnswer(db,player.id,bucharestDate(),body.position!,body.guess!);return Response.json({reveal},{headers:{"cache-control":"no-store"}})}catch(error){const code=error instanceof Error?error.message:"";return Response.json({error:code==="RASPUNS_DEJA_BLOCAT"?"Răspunsul a fost deja blocat.":"Estimare invalidă."},{status:code==="RASPUNS_DEJA_BLOCAT"?409:400})}}
