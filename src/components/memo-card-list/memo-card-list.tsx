"use client"
import React, { Suspense, use } from "react";
import { MemoCard } from "@/components/memo-card";
import { useTranslations } from 'next-intl';
import LoadingButton from '@/components/ui/loading-button';
import { importSampleMemoCards } from "./server-functions"
import { useAudioPermission } from "@/hooks/audio";
import Loading from "@/components/ui/loading";
import { useAtomValue } from "jotai";
import { localCardListAtom } from "@/lib/atom";
import { memoCard } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";

interface IProps {
    newCardsPromise: Promise<InferSelectModel<typeof memoCard>[]>
    forgottenCardsPromise: Promise<InferSelectModel<typeof memoCard>[]>
}

export function MemoCardList(props: IProps) {
    const { newCardsPromise, forgottenCardsPromise } = props;
    const [isLoading, setIsLoading] = React.useState(false);
    const localCards = useAtomValue(localCardListAtom)
    const t = useTranslations('memoCards');

    const newCards = use(newCardsPromise) || [];
    const forgottenCards = use(forgottenCardsPromise) || [];

    const memoCards = Array.isArray(newCards) && Array.isArray(forgottenCards) ? [...newCards, ...forgottenCards] : [];

    function handleDelete(id: string) {
        window.location.reload();
    }

    async function handleImportSampleData() {
        try {
            setIsLoading(true);
            await importSampleMemoCards();
            window.location.reload();
        } catch (error) {
            console.error('导入示例数据失败:', error);
        }
    }

    return (
        <Suspense fallback={<Loading />}>
            {memoCards?.map(card => (
                <div className="mx-auto mb-14 max-w-92-675 text-[18px] sm:text-base memo-card" key={card.id}>
                    <MemoCard {...card} onDelete={handleDelete} />
                </div>
            ))}
            {
                localCards.length === 0 && memoCards.length === 0 ? (
                    <div className="flex justify-center items-center bg-gradient-to-b from-blue-50 dark:from-blue-900 to-white dark:to-blue-800 mt-[80px]">
                        <div className="mx-auto px-4 lg:px-8 sm:py-24 lg:py-32 text-center">
                            <h1 className="font-bold text-black sm:text-[2.2rem] dark:text-white text-3xl tracking-tight">
                                {t('noDataFound')}
                            </h1>
                            <div className="flex flex-col items-center gap-4 mt-6">
                                <LoadingButton
                                    onClick={handleImportSampleData}
                                    className="mt-2"
                                    isLoading={isLoading}
                                >
                                    {t('importSampleData')}
                                </LoadingButton>
                            </div>
                        </div>
                    </div>
                ) : null
            }
        </Suspense>
    )
}