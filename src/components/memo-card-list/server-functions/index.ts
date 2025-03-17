"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { memoCard } from "@/db/schema";
import { cookies, headers } from 'next/headers';

export async function importSampleMemoCards() {
    const session = await getSession();
    const userId = session?.user.id;
    //   const headersList = await headers()
    //   const referer = headersList.get('referer')

    if (!userId) {
        throw new Error("用户未登录");
    }

    const now = new Date().toISOString();
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

    const sampleCards = [
        {
            translation: locale === 'zh' ?
                "福冈美女众多的传闻已经不再是传说，可以说是定论了。" :
                "The rumor that there are many beautiful women in Fukuoka is no longer just a legend, it can be said to be a definitive conclusion.",
            createTime: now,
            updateTime: now,
            originalText: "福岡に美人が多いという噂は伝説でもなんでもなく、もはや定説と言ってもいいでしょう。",
            reviewTimes: 0,
            userId: userId,
            kanaPronunciation: "ふくおかにびじんがおおいといううわさはでんせつでもなんでもなく、もはやていせつといってもいいでしょう。",
            contextUrl: "https://gokant-go.sawarise.co.jp/fukuoka-cute/?scrollY=1046&text=%25E7%25A6%258F%25E5%25B2%25A1%25E3%2581%25AB%25E7%25BE%258E%25E4%25BA%25BA%25E3%2581%258C%25E5%25A4%259A%25E3%2581%2584%25E3%2581%25A8%25E3%2581%2584%25E3%2581%2586%25E5%2599%2582%25E3%2581%25AF%25E4%25BC%259D%25E8%25AA%25AC%25E3%2581%25A7%25E3%2582%2582%25E3%2581%25AA%25E3%2582%2593%25E3%2581%25A7%25E3%2582%2582%25E3%2581%25AA%25E3%2581%258F%25E3%2580%2581%25E3%2582%2582%25E3%2581%25AF%25E3%2582%2584%25E5%25AE%259A%25E8%25AA%25AC%25E3%2581%25A8%25E8%25A8%2580%25E3%2581%25A3%25E3%2581%25A6%25E3%2582%2582%25E3%2581%2584%25E3%2581%2584%25E3%2581%25A7%25E3%2581%2597%25E3%2582%2587%25E3%2581%2586%25E3%2580%2582"
        },
        {
            translation: locale === 'zh' ?
                "你是不是在没有磨合的情况下就使用了负荷很高的植入物？" :
                "Did you use a high-load implant without breaking it in?",
            createTime: now,
            updateTime: now,
            originalText: "負荷の高いインプラントを、慣らしもせずに使ったんでしょ",
            reviewTimes: 0,
            userId: userId,
            kanaPronunciation: "ふかのたかいいんぷらんとを、ならしもせずにつかったんでしょ。",
            contextUrl: "https://www.netflix.com/watch/81056739?t=670.682081"
        },
        {
            translation: locale === 'zh' ?
                "每次都完全抄袭封面的搭配，真是时尚。" :
                "Every time you completely copy the cover's coordination, it's so fashionable.",
            createTime: now,
            updateTime: now,
            originalText: "毎回表紙のコーディネート丸パクリしてておしゃれ",
            reviewTimes: 0,
            userId: userId,
            kanaPronunciation: "まいかいひょうしのこーでぃねーとまるぱくりしてておしゃれ",
            contextUrl: "https://www.youtube.com/watch?v=CDNzs1Nr-FA&t=271"
        },
        {
            translation: locale === 'zh' ?
                "探索Cursor的项目和规则运用的最佳实践。" :
                "Explore best practices for Cursor's project and rules implementation.",
            createTime: now,
            updateTime: now,
            originalText: "CursorのProject、Rules運用のベストプラクティスを探る",
            reviewTimes: 0,
            userId: userId,
            kanaPronunciation: "くるそるのぷろじぇくと、るーるすうんようのべすとぷらくてぃすをさぐる，",
            contextUrl: "https://zenn.dev/ks0318/articles/b8eb2c9396f9cb?scrollY=0&text=Cursor%25E3%2581%25AEProject%2520Rules%25E9%2581%258B%25E7%2594%25A8%25E3%2581%25AE%25E3%2583%2599%25E3%2582%25B9%25E3%2583%2588%25E3%2583%2597%25E3%2583%25A9%25E3%2582%25AF%25E3%2583%2586%25E3%2582%25A3%25E3%2582%25B9%25E3%2582%2592%25E6%258E%25A2%25E3%2582%258B#1.-project-rules%E3%81%AF%E6%97%A5%E3%80%85%E3%82%A2%E3%83%83%E3%83%97%E3%83%87%E3%83%BC%E3%83%88%E3%81%99%E3%82%8B"
        }
    ];

    await Promise.all(
        sampleCards.map(cardData =>
            db.insert(memoCard).values(cardData)
        )
    );

    return { success: true };
}
