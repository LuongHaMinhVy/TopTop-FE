"use client";

import { useTranslations } from "next-intl";
import { useNotifications, useMarkReadMutation } from "@/hooks/notification-hooks";
import { Avatar } from "@repo/ui";
import { Bookmark, Heart, MessageCircle, Repeat2, UserPlus, Circle, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import * as locales from "date-fns/locale";
import { usePathname } from "next/navigation";
import Image from "next/image";
import type { Notification } from "@/types/notification";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { useRouter } from "@/i18n/routing";
import { DocumentTitle } from "@/components/shared/DocumentTitle";

export default function ActivityPage() {
  const t = useTranslations('Main');
  const { data: notificationsData, isLoading } = useNotifications();
  const markRead = useMarkReadMutation();
  const pathname = usePathname();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const localeStr = pathname.split('/')[1] || 'vi';
  const dateLocale = localeStr === 'vi' ? locales.vi : locales.enUS;

  const notifications = notificationsData?.data || [];

  const getLocalizedNotificationContent = (notification: Notification) => {
    const { type, content, actorUsername } = notification;
    
    let cleanContent = content;
    if (actorUsername && content.startsWith(actorUsername)) {
      cleanContent = content.substring(actorUsername.length).trim();
    }

    switch (type) {
      case "LIKE": {
        const colonIndex = cleanContent.indexOf(":");
        if (colonIndex !== -1) {
          const videoTitle = cleanContent.substring(colonIndex + 1).trim();
          return `${t("notifications.liked")}: ${videoTitle}`;
        }
        return t("notifications.liked");
      }
      case "SAVE": {
        return t("notifications.saved");
      }
      case "REPOST": {
        return t("notifications.reposted");
      }
      case "REPOST_LIKE": {
        return t("notifications.repostLiked");
      }
      case "COMMENT": {
        const colonIndex = cleanContent.indexOf(":");
        if (colonIndex !== -1) {
          const commentContent = cleanContent.substring(colonIndex + 1).trim();
          return `${t("notifications.commented")}: ${commentContent}`;
        }
        return t("notifications.commented");
      }
      case "FOLLOW": {
        return t("notifications.followed");
      }
      default:
        return cleanContent;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <Heart className="w-4 h-4 fill-brand text-brand" />;
      case 'SAVE': return <Bookmark className="w-4 h-4 fill-yellow-400 text-yellow-400" />;
      case 'REPOST': return <Repeat2 className="w-4 h-4 text-green-500" />;
      case 'REPOST_LIKE': return <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />;
      case 'COMMENT': return <MessageCircle className="w-4 h-4 fill-blue-500 text-blue-500" />;
      case 'FOLLOW': return <UserPlus className="w-4 h-4 text-purple-500" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getGroupedNotifications = (items: Notification[]) => {
    const today: Notification[] = [];
    const thisWeek: Notification[] = [];
    const thisMonth: Notification[] = [];
    const earlier: Notification[] = [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    items.forEach((item) => {
      const time = new Date(item.createdAt).getTime();
      if (time >= startOfToday) {
        today.push(item);
      } else if (time >= oneWeekAgo) {
        thisWeek.push(item);
      } else if (time >= oneMonthAgo) {
        thisMonth.push(item);
      } else {
        earlier.push(item);
      }
    });

    return { today, thisWeek, thisMonth, earlier };
  };

  const groupLabels = {
    today: t("notifications.today"),
    thisWeek: t("notifications.thisWeek"),
    thisMonth: t("notifications.thisMonth"),
    earlier: t("notifications.earlier")
  };

  const grouped = getGroupedNotifications(notifications);

  const renderGroup = (title: string, groupItems: Notification[]) => {
    if (groupItems.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-[13px] font-bold text-text-secondary px-3 py-1 mb-2 mt-4 uppercase tracking-wider opacity-60">
          {title}
        </h3>
        <div className="flex flex-col gap-1">
          {groupItems.map((notification: Notification) => (
            <div 
              key={notification.id}
              className="flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer group hover:bg-black/5 dark:hover:bg-white/8"
              onClick={() => {
                if (!notification.isRead) markRead.mutate(notification.id);
                if (notification.videoId) {
                  router.push(`/@${notification.videoOwnerUsername || user?.username}/video/${notification.videoId}`);
                } else {
                  router.push(`/@${notification.actorUsername}`);
                }
              }}
            >
              <div 
                className="relative flex-shrink-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!notification.isRead) markRead.mutate(notification.id);
                  router.push(`/@${notification.actorUsername}`);
                }}
              >
                <Avatar src={notification.actorAvatarUrl} alt={notification.actorUsername} size="lg" />
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm">
                  {getIcon(notification.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[15px] leading-tight mb-1 break-words">
                  <span 
                    className="font-bold hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!notification.isRead) markRead.mutate(notification.id);
                      router.push(`/@${notification.actorUsername}`);
                    }}
                  >
                    @{notification.actorUsername}
                  </span>
                  {" "}{getLocalizedNotificationContent(notification)}
                </p>
                <p className="text-[13px] text-text-muted">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: dateLocale })}
                </p>
              </div>

              {notification.videoId && (
                <div className="relative w-12 h-16 rounded-md overflow-hidden bg-black flex-shrink-0 border border-elevated">
                  <Image 
                    src={notification.videoThumbnailUrl || ""} 
                    alt="Video thumbnail"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[600px] mx-auto p-4 sm:p-6 pb-24 lg:pb-6">
      <DocumentTitle title="Activity | TopTop" />
      <h1 className="text-[24px] font-bold mb-6">{t('sidebar.activity')}</h1>

      <div className="flex flex-col gap-1">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-elevated" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-elevated rounded w-3/4" />
                <div className="h-3 bg-elevated rounded w-1/4" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-elevated/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-10 h-10 text-text-muted" />
            </div>
            <p className="text-text-secondary font-medium">{t('notifications.empty')}</p>
          </div>
        ) : (
          <>
            {renderGroup(groupLabels.today, grouped.today)}
            {renderGroup(groupLabels.thisWeek, grouped.thisWeek)}
            {renderGroup(groupLabels.thisMonth, grouped.thisMonth)}
            {renderGroup(groupLabels.earlier, grouped.earlier)}
          </>
        )}
      </div>
    </div>
  );
}
