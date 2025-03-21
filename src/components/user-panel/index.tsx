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
                <Avatar className="hidden sm:block w-10 h-10 cursor-pointer">
                    <AvatarImage src={data?.user?.image?.toString()} alt="profile" />
                    <AvatarFallback>user</AvatarFallback>
                </Avatar>
            </PopoverTrigger>
            <PopoverContent className="space-y-1 p-2 w-72">
                <div className="flex items-center px-2 h-10">
                    <p className="font-medium text-sm truncate">{data?.user?.email}</p>
                </div>
                <div className="flex items-center h-10">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="justify-between !shadow-none focus-visible:shadow-none p-[8px] !border-0 focus-visible:border-0 focus:border-0 border-none rounded-none outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full h-full text-sm"
                        onClick={() => window.open(`/${locale}/pricing`, '_blank')}
                    >
                        <p className="font-medium text-sm">{t('membershipPlan')}</p>
                        <span className="text-sm">
                            {expiryTime ? 'Premium' : 'Free'}
                        </span>
                    </Button>
                </div>
                {expiryTime && (
                    <div className="flex justify-between items-center px-2 h-10">
                        <p className="font-medium text-sm">{t('expiryDate')}</p>
                        <span className="text-sm">{expiryTime.toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
                    </div>
                )}
                {expiryTime && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="justify-between !shadow-none focus-visible:shadow-none p-[8px] !border-0 focus-visible:border-0 focus:border-0 border-none rounded-none outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full h-10 text-sm"
                        onClick={handleManageSubscription}
                    >
                        {t('subscriptionManagement')}
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                )}
                <Separator className="!mt-[8px] !mb-[8px]" />
                <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start !shadow-none focus-visible:shadow-none p-[8px] !border-0 focus-visible:border-0 focus:border-0 rounded-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 w-full h-10 text-sm"
                    onClick={handleLogout}
                >
                    {t('logout')}
                </Button>
            </PopoverContent>
        </Popover>
    )
}