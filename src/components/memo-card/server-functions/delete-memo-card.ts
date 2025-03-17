"use server"
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { memoCard } from "@/db/schema";

export async function deleteMemoCard(id: string) {
    const session = await getSession();

    const result = await db.delete(memoCard)
        .where(
            and(
                eq(memoCard.id, id),
                eq(memoCard.userId, session?.user?.id ?? '')
            )
        )
        .returning();

    return JSON.stringify(result);
}
