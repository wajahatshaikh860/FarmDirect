import {requireAuth} from "@/lib/permissions";
import {getNotifications} from "@/services/notificationService";
import CommerceShell from "@/components/commerce/CommerceShell";
import NotificationList from "@/components/phase4/NotificationList";
export const metadata={title:"Notifications"};
export default async function Page(){const user=await requireAuth();return <CommerceShell role={user.role} activeLabel="Notifications"><h1>Notifications</h1><section className="phase4-card"><NotificationList data={await getNotifications(user)}/><p className="muted">Showing up to 50 recent notifications.</p></section></CommerceShell>;}
