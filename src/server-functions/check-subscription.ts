"use server"
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { userSubscription } from "@/db/schema";
import { eq } from "drizzle-orm";

// 定义返回类型接口
export interface SubscriptionStatus {
    isSubscribed: boolean;
    expiryTime: Date | null;
}

export async function checkSubscription(): Promise<SubscriptionStatus> {
    const session = await getSession();
    const userId = session?.user.id;

    if (!userId) {
        throw new Error("用户未登录");
    }

    const subscription = await db.query.userSubscription.findFirst({
        where: eq(userSubscription.userId, userId),
    });

    if (!subscription) {
        return {
            isSubscribed: false,
            expiryTime: null
        };
    }

    const currentTime = new Date();
    const endTime = new Date(subscription.endTime);
    const isSubscribed = endTime > currentTime;

    return {
        isSubscribed,
        expiryTime: endTime
    };
}
