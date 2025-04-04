import React from "react";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { memoCard } from "@/db/schema";
import { and, eq, gt, count, desc } from "drizzle-orm";
import { MemoCardList } from "@/components/memo-card-list";
import { LocalCardList } from "@/components/memo-card-list";
import { InputBox } from "@/components/input-box";
import { WordCardAdder } from "@/components/word-adder";

// import Loading from "@/components/ui/loading";

export default async function MemoCardsPage() {
  const session = await getSession()

  if (!session) {
    return new Error("Unauthorized")
  }

  const [{ value: newCardsCount }] = await db.select({ 
    value: count()
  }).from(memoCard)
    .where(
      and(
        eq(memoCard.userId, session.user.id),
        eq(memoCard.reviewTimes, 0)
      )
    );

  const newCardsPromise = db.select().from(memoCard)
    .where(
      and(
        eq(memoCard.userId, session.user.id),
        eq(memoCard.reviewTimes, 0)
      )
    )
    .orderBy(desc(memoCard.id))
    .limit(10);

  const remainingCount = Math.max(0, 10 - newCardsCount);

  const forgottenCardsPromise = remainingCount > 0 ? db.select().from(memoCard)
    .where(
      and(
        eq(memoCard.userId, session.user.id),
        gt(memoCard.reviewTimes, 0)
      )
    )
    .orderBy(desc(memoCard.forgetCount))
    .limit(remainingCount) : Promise.resolve([]);

  return (
    <>
      <div className="pt-[42px] pb-[36px]">
        <MemoCardList
          newCardsPromise={newCardsPromise}
          forgottenCardsPromise={forgottenCardsPromise}
        />
        <LocalCardList />
      </div>
      <div className="bottom-2 left-[50%] z-[12] fixed w-[100%] max-w-80-680 min-h-[50px] -translate-x-1/2">
        <InputBox />
      </div>
      <WordCardAdder />
    </>
  )
}