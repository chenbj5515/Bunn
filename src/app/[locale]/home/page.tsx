"use client"
import Image from "next/image"
import { useTranslations, useLocale } from 'next-intl';
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import React from "react"
import { DemoCard } from "@/components/memo-card/demo-card"
import { DemoWordCard } from "@/components/word-card/demo-word-card"
import { MemoCard } from "@/components/memo-card/memo-card"
import DemoDailyReport from "@/components/daily-report/demo-daily-report";
// import DemoExam from "@/components/exam/demo-exam"


function createDefaultWordCardInfo(t: (key: string) => string) {
    return {
        "id": "",
        "word": "捻じ曲げろ",
        "meaning": t('wordCards.demoMeaning'),
        "createTime": new Date("2025-02-08T14:03:03.631Z").toISOString(),
        "userId": "",
        "reviewTimes": 1,
        "memoCardId": "",
        "forgetCount": 0,
        "memo_card": {
            "id": "",
            "translation": t('memoCards.demoTranslation2'),
            "createTime": new Date("2025-02-08T14:02:46.828Z").toISOString(),
            "updateTime": new Date("2025-02-12T08:57:52.715Z").toISOString(),
            "recordFilePath": "",
            "originalText": "え、私情で真相捻じ曲げろって事ですか？",
            "reviewTimes": 0,
            "userId": "",
            "kanaPronunciation": "え、わたしじょうでしんそうねじまげろってことですか？",
            "contextUrl": "https://www.youtube.com/watch?v=QrwxVi9hWJg&t=374",
            "forgetCount": 0
        }
    };
}

export default function LandingPage() {
    const router = useRouter()
    const t = useTranslations();
    const locale = useLocale();
    // 添加状态管理
    const [showDemo, setShowDemo] = React.useState<null | 'memo' | 'word' | 'exam' | 'daily'>(null)
    // 添加MemoCard状态
    const [showMemoCard, setShowMemoCard] = React.useState(false)
    // 引用容器元素
    const containerRef = React.useRef<HTMLDivElement>(null)

    const defaultWordCardInfo = createDefaultWordCardInfo(t);

    // 添加点击外部关闭弹窗的效果
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target;
            if (target instanceof Node) {
                // 检查点击是否在Demo卡片之外
                const demoCardElement = document.querySelector('.demo-card-container');
                if (demoCardElement && !demoCardElement.contains(target as Node)) {
                    setShowDemo(null);
                    setShowMemoCard(false);
                }
            }
        };

        document.addEventListener("mouseup", handleClickOutside);
        return () => {
            document.removeEventListener("mouseup", handleClickOutside);
        };
    }, []);

    // 添加滚动锁定效果
    React.useEffect(() => {
        if (showDemo) {
            // 锁定body滚动
            document.body.style.overflow = 'hidden';
        } else {
            // 恢复body滚动
            document.body.style.overflow = 'auto';
        }

        // 组件卸载时恢复滚动
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showDemo]);

    // 处理卡片点击事件
    const handleCardClick = (cardType: 'memo' | 'word' | 'exam' | 'daily') => {
        setShowDemo(cardType);
        setShowMemoCard(false);
    };

    // 处理WordCard的"不认识"按钮点击事件
    const handleUnRecognize = () => {
        setShowMemoCard(true);
    };

    // 处理WordCard的"认识"按钮点击事件
    const handleRecognize = () => {
        setShowDemo(null);
    };

    return (
        <div className="min-h-screen">
            {/* 添加毛玻璃弹窗 */}
            {showDemo ? (
                <div className="top-[0] left-[0] z-[10] fixed flex justify-center items-center backdrop-blur-[3px] backdrop-saturate-[180%] w-[100vw] h-[100vh]">
                    <div
                        ref={containerRef}
                        className={`demo-card-container ${showDemo === 'word' && !showMemoCard ? 'w-auto min-w-[228px]' : showDemo === 'exam' || showDemo === 'daily' ? 'border border-[#1d283a] rounded-[12px] bg-[#fcfcfd] w-[740px] h-[calc(100vh-2px)] overflow-hidden scrollbar-hide' : 'w-[628px]'} relative transform`}
                        style={{
                            scrollbarWidth: 'none', /* Firefox */
                            msOverflowStyle: 'none', /* IE and Edge */
                        }}
                    >
                        {
                            showDemo === 'memo'
                                ? <DemoCard />
                                : showDemo === 'exam'
                                    ? null //<DemoExam />
                                    : showDemo === 'daily'
                                        ? <DemoDailyReport />
                                        : showDemo === "word"
                                            ? <DemoWordCard onUnRecognize={handleUnRecognize} defaultWordCardInfo={defaultWordCardInfo} />
                                            : null
                        }
                        {
                            showMemoCard
                                ? <MemoCard {...defaultWordCardInfo.memo_card} onDelete={() => { }} />
                                : null
                        }
                    </div>
                </div>
            ) : null}

            {/* Hero Section */}
            <div className="relative mx-auto px-4 pt-16 pb-24 max-w-7xl text-center">
                {/* Hero content */}
                <h1 className="mb-6 font-bold text-6xl leading-[1.2] tracking-tight">
                    {locale === 'en' ? (
                        <>
                            Your Personal Japanese
                            <br />
                            Learning Journey
                        </>
                    ) : (
                        t('home.personalJourney')
                    )}
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-gray-600 text-xl">
                    {t('home.stopScattering')}
                    <br />
                    {t('home.bunnWillHeloYou')}
                </p>
                <Button
                    className="bg-[#18181B] hover:bg-[#27272A] px-8 py-6 text-white text-lg"
                    onClick={() => router.push(`/${locale}/login`)}
                >
                    {t('home.getStartedFree')}
                </Button>

                {/* Feature Cards */}
                <div className="relative mx-auto mt-16 max-w-6xl h-[420px] font-NewYork">
                    <div className="group left-1/2 absolute flex -space-x-4 rotate-[-5deg] -translate-x-1/2 transform">
                        {/* 第一张卡片：Memo Card */}
                        <div
                            className="hover:z-10 bg-white shadow-lg hover:shadow-xl rounded-2xl w-[300px] h-[400px] hover:rotate-0 hover:scale-110 transition-all hover:-translate-y-4 group-hover:translate-x-[0px] duration-500 ease-out transform"
                            style={{
                                transform: 'rotate(0deg)',
                                transformOrigin: 'center center'
                            }}
                        >
                            <div className="p-6 border border-[#1d283a] rounded-[12px] h-[100%]">
                                <h3 className="font-medium text-lg">{t('home.cards.memoCard.title')}</h3>
                                <div
                                    className="flex justify-center mt-8 max-h-[236px] cursor-pointer"
                                    onClick={() => handleCardClick('memo')}
                                >
                                    <Image
                                        src="/assets/slogans/memo_card.png"
                                        alt="Memo Card"
                                        width={260}
                                        height={260}
                                        className="object-contain hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <p className="mt-10 text-[#49494b] text-sm leading-snug">
                                    {t('home.cards.memoCard.description')}
                                </p>
                            </div>
                        </div>

                        {/* 第二张卡片：Word Card */}
                        <div
                            className="hover:z-10 bg-white shadow-lg hover:shadow-xl rounded-2xl w-[300px] h-[400px] hover:rotate-0 hover:scale-110 transition-all hover:-translate-y-4 group-hover:translate-x-[40px] duration-500 ease-out transform"
                            style={{
                                transform: 'rotate(5deg)',
                                transformOrigin: 'center center'
                            }}
                        >
                            <div className="p-6 border border-[#1d283a] rounded-[12px] h-[100%]">
                                <h3 className="font-medium text-lg">{t('home.cards.wordCard.title')}</h3>
                                <div
                                    className="flex justify-center mt-8 max-h-[236px] cursor-pointer"
                                    onClick={() => handleCardClick('word')}
                                >
                                    <Image
                                        src="/assets/slogans/word_card.png"
                                        alt="Word Card"
                                        width={260}
                                        height={260}
                                        className="object-contain hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <p className="mt-10 text-[#49494b] text-sm leading-snug">
                                    {t('home.cards.wordCard.description')}
                                </p>
                            </div>
                        </div>

                        {/* 第三张卡片：Exam */}
                        {/* <div
                            className="hover:z-10 bg-white shadow-lg hover:shadow-xl rounded-2xl w-[300px] h-[400px] hover:rotate-0 hover:scale-110 transition-all hover:-translate-y-4 group-hover:translate-x-[80px] duration-500 ease-out transform"
                            style={{
                                transform: 'rotate(10deg)',
                                transformOrigin: 'center center'
                            }}
                        >
                            <div className="p-6 border border-[#1d283a] rounded-[12px] h-[100%]">
                                <h3 className="font-medium text-lg">{t('home.cards.exam.title')}</h3>
                                <div
                                    className="flex justify-center mt-4 max-h-[236px] cursor-pointer"
                                    onClick={() => handleCardClick('exam')}
                                >
                                    <Image
                                        src="/assets/slogans/exam.png"
                                        alt="Exam"
                                        width={260}
                                        height={260}
                                        className="object-contain hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <p className="mt-4 text-[#49494b] text-sm leading-snug">
                                    {t('home.cards.exam.description')}
                                </p>
                            </div>
                        </div> */}

                        {/* 第四张卡片：Daily Report */}
                        <div
                            className="hover:z-10 bg-white shadow-lg hover:shadow-xl rounded-2xl w-[300px] h-[400px] hover:rotate-0 hover:scale-110 transition-all hover:-translate-y-4 group-hover:translate-x-[120px] duration-500 ease-out transform"
                            style={{
                                transform: 'rotate(15deg)',
                                transformOrigin: 'center center'
                            }}
                        >
                            <div className="p-6 border border-[#1d283a] rounded-[12px] h-[100%]">
                                <h3 className="font-medium text-lg">{t('home.cards.dailyReport.title')}</h3>
                                <div
                                    className="flex justify-center mt-8 max-h-[236px] cursor-pointer"
                                    onClick={() => handleCardClick('daily')}
                                >
                                    <Image
                                        src="/assets/slogans/daily_report.png"
                                        alt="Daily Report"
                                        width={260}
                                        height={260}
                                        className="object-contain hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                                <p className="mt-4 text-[#49494b] text-sm leading-snug">
                                    {t('home.cards.dailyReport.description')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}