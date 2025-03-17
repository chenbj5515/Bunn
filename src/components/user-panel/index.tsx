"use client"
// import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { signOut } from "@/lib/auth-client"
import { ChevronRight } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { createPortalSession } from "./server-functions/create-portal-session"
import { useSession } from "@/lib/auth-client"
import { useSubscription } from "@/hooks/use-subscription"

export default function UserPanel() {
    const { data } = useSession()
    const router = useRouter()
    const locale = useLocale()
    const t = useTranslations('LoginedHeader')

    const { expiryTime } = useSubscription()

    // const subscription_end_time = data?.user?.subscription_end_time;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })
    }

    async function handleLogout() {
        await signOut()
        router.push(`/${locale}/home`)
    }

    async function handleManageSubscription() {
        try {
            const url = await createPortalSession()
            window.open(url, '_blank')
        } catch (error) {
            console.error('Failed to create portal session:', error)
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Avatar className="hidden sm:block h-10 w-10 cursor-pointer">
                    <AvatarImage src={data?.user?.image?.toString()} alt="profile" />
                    <AvatarFallback>user</AvatarFallback>
                </Avatar>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2 space-y-1">
                <div className="h-10 px-2 flex items-center">
                    <p className="text-sm font-medium truncate">{data?.user?.email}</p>
                </div>
                <div className="h-10 flex items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-[8px] h-full w-full justify-between text-sm border-none outline-none"
                        onClick={() => window.open(`/${locale}/pricing`, '_blank')}
                    >
                        <p className="text-sm font-medium">{t('membershipPlan')}</p>
                        <span className="text-sm">
                            {expiryTime ? 'Premium' : 'Free'}
                        </span>
                    </Button>
                </div>
                {expiryTime && (
                    <div className="h-10 px-2 flex items-center justify-between">
                        <p className="text-sm font-medium">{t('expiryDate')}</p>
                        <span className="text-sm">{expiryTime.toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
                    </div>
                )}
                {expiryTime && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 p-[8px] w-full justify-between text-sm border-none outline-none"
                        onClick={handleManageSubscription}
                    >
                        {t('subscriptionManagement')}
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                )}
                <Separator className="!mt-[8px] !mb-[8px]" />
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 p-[8px] w-full justify-start text-sm"
                    onClick={handleLogout}
                >
                    {t('logout')}
                </Button>
            </PopoverContent>
        </Popover>
    )
}