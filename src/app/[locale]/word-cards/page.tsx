import { db } from "@/db";
import { wordCard, memoCard } from "@/db/schema";
import { WordCards } from "./_components/word-cards-layout";
import { getSession } from "@/lib/auth";
import { eq, gt, desc, and, sql } from "drizzle-orm";

type WordCardWithMemo = {
    word_card: typeof wordCard.$inferSelect;
    memo_card: typeof memoCard.$inferSelect | null;
};

export type TWordCard = typeof wordCard.$inferSelect & {
    memo_card: typeof memoCard.$inferSelect
};

export default async function WordCardsApp() {
    const session = await getSession()

    if (!session) {
        return new Error("Unauthorized")
    }

    const newCardsCount = await db.select({ count: sql<number>`count(*)` })
        .from(wordCard)
        .where(and(
            eq(wordCard.userId, session.user.id),
            eq(wordCard.reviewTimes, 0)
        ));

    console.log(newCardsCount, "newCardsCount")

    const newCardsPromise = db.select()
        .from(wordCard)
        .where(and(
            eq(wordCard.userId, session.user.id),
            eq(wordCard.reviewTimes, 0)
        ))
        .orderBy(desc(wordCard.createTime))
        .limit(10)
        .leftJoin(memoCard, eq(wordCard.memoCardId, memoCard.id))
        .then((results) => results.map((result) => ({
            ...result.word_card,
            memo_card: result.memo_card
        }))) as Promise<TWordCard[]>;

    const remainingCount = Math.max(0, 10 - newCardsCount[0].count);

    const reviewCardsPromise = remainingCount > 0 ? db.select()
        .from(wordCard)
        .where(and(
            eq(wordCard.userId, session.user.id),
            gt(wordCard.reviewTimes, 0)
        ))
        .orderBy(desc(wordCard.forgetCount))
        .limit(remainingCount)
        .leftJoin(memoCard, eq(wordCard.memoCardId, memoCard.id))
        .then((results) => results.map((result) => ({
            ...result.word_card,
            memo_card: result.memo_card
        }))) as Promise<TWordCard[]> : Promise.resolve([]);

    return (
        <div className="pr-[20px] pb-10 pl-[20px] w-full">
            <WordCards
                newCardsPromise={newCardsPromise}
                reviewCardsPromise={reviewCardsPromise}
            />
        </div>
    );
}