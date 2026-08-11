import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getD1Database } from "@/db";
import { isPuzzleAdmin } from "@/db/admin";

export async function authorizedAdmin() {
  const user = await getChatGPTUser();
  if (!user) return { error: Response.json({ error: "Autentificare necesară." }, { status: 401 }) } as const;
  const database = await getD1Database();
  if (!await isPuzzleAdmin(database, user.email)) return { error: Response.json({ error: "Nu ai acces la administrarea Ochiometric." }, { status: 403 }) } as const;
  return { database, user } as const;
}
