"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Video, ShieldAlert, TrendingUp,
  Settings, LogOut, LayoutDashboard, BarChart3,
  Search, Bell, MoreVertical
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authLogout } from "@/services/auth-api-service";
import { useTranslations } from "next-intl";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const t = useTranslations("Admin.dashboard");

  const logoutMutation = useMutation({
    mutationFn: authLogout,
    onSuccess: () => router.push("/login"),
  });

  const stats = [
    { label: t("stats.totalCreators"),   value: "1.2M",  icon: Users,       color: "bg-blue-500",    trend: "+12%" },
    { label: t("stats.totalVideos"),     value: "85.4M", icon: Video,       color: "bg-[#FE2C55]",   trend: "+8%"  },
    { label: t("stats.activityReports"), value: "2.4K",  icon: ShieldAlert, color: "bg-orange-500",  trend: "-5%"  },
    { label: t("stats.dailyUsers"),      value: "450K",  icon: TrendingUp,  color: "bg-green-500",   trend: "+15%" },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <div className="w-64 bg-black text-white flex flex-col shadow-2xl">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center relative overflow-hidden">
            <span className="text-white  font-extrabold text-2xl italic tracking-tighter absolute z-10">t</span>
            <span className="text-[#25F4EE] font-extrabold text-2xl italic tracking-tighter absolute z-0 -translate-x-[1px] -translate-y-[1px]">t</span>
            <span className="text-[#FE2C55] font-extrabold text-2xl italic tracking-tighter absolute z-0  translate-x-[1px]  translate-y-[1px]">t</span>
          </div>
          <span className="text-xl font-bold tracking-tight">TopTop Admin</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <SidebarItem icon={LayoutDashboard} label={t("nav.overview")}  active={activeTab === "overview"}  onClick={() => setActiveTab("overview")}  />
          <SidebarItem icon={Users}           label={t("nav.creators")}  active={activeTab === "creators"}  onClick={() => setActiveTab("creators")}  />
          <SidebarItem icon={Video}           label={t("nav.content")}   active={activeTab === "content"}   onClick={() => setActiveTab("content")}   />
          <SidebarItem icon={BarChart3}       label={t("nav.analytics")} active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
          <SidebarItem icon={ShieldAlert}     label={t("nav.safety")}    active={activeTab === "safety"}    onClick={() => setActiveTab("safety")}    />

          <div className="pt-8 pb-2">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {t("nav.system")}
            </p>
          </div>
          <SidebarItem icon={Settings} label={t("nav.settings")} active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => logoutMutation.mutate()}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t("logout")}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("header.searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-black transition-all"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FE2C55] rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{t("header.adminTeam")}</p>
                <p className="text-xs text-gray-500">{t("header.adminRole")}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FE2C55] to-black flex items-center justify-center text-white font-bold shadow-lg">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl font-black text-gray-900">{t("title")}</h1>
                <p className="text-gray-500">{t("welcome")}</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all">
                  {t("downloadReport")}
                </button>
                <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition-all">
                  {t("liveMonitor")}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`${stat.color} p-3 rounded-xl text-white`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend.startsWith("+") ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                      {stat.trend}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-black text-gray-900">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Reports Table */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">{t("recentReports.title")}</h3>
                  <button className="text-sm text-[#FE2C55] font-bold hover:underline">{t("recentReports.viewAll")}</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">{t("recentReports.colUser")}</th>
                        <th className="px-6 py-4 font-semibold">{t("recentReports.colType")}</th>
                        <th className="px-6 py-4 font-semibold">{t("recentReports.colStatus")}</th>
                        <th className="px-6 py-4 font-semibold">{t("recentReports.colAction")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <TableRow user="@creative_mind"  type={t("reportTypes.inappropriate")} status="Pending"      />
                      <TableRow user="@dance_king_99"  type={t("reportTypes.copyright")}     status="In Review"    />
                      <TableRow user="@tech_guru"      type={t("reportTypes.spam")}           status="Resolved"     />
                      <TableRow user="@morning_vibes"  type={t("reportTypes.harassment")}     status="High Priority"/>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Platform Health */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-6">{t("platformHealth.title")}</h3>
                <div className="space-y-6">
                  <HealthBar label={t("platformHealth.cdn")}        value={98} color="bg-green-500"   />
                  <HealthBar label={t("platformHealth.api")}        value={92} color="bg-[#FE2C55]"   />
                  <HealthBar label={t("platformHealth.moderation")} value={45} color="bg-orange-500"  />
                  <HealthBar label={t("platformHealth.storage")}    value={78} color="bg-blue-500"    />
                </div>
                <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 leading-relaxed">{t("platformHealth.systemNote")}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SidebarItem({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all ${
        active ? "bg-[#FE2C55] text-white shadow-lg shadow-[#FE2C55]/20" : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function TableRow({ user, type, status }: { user: string; type: string; status: string }) {
  const t = useTranslations("Admin.dashboard.status");

  const statusColors: Record<string, string> = {
    "Pending":       "bg-gray-100 text-gray-600",
    "In Review":     "bg-blue-100 text-blue-600",
    "Resolved":      "bg-green-100 text-green-600",
    "High Priority": "bg-red-100 text-red-600",
  };

  const statusKeys: Record<string, string> = {
    "Pending":       "pending",
    "In Review":     "inReview",
    "Resolved":      "resolved",
    "High Priority": "highPriority",
  };

  return (
    <tr className="hover:bg-gray-50 transition-all group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <span className="text-sm font-semibold text-gray-900">{user}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{type}</td>
      <td className="px-6 py-4">
        <span className={`text-[10px] uppercase font-black px-2 py-1 rounded ${statusColors[status] ?? "bg-gray-100"}`}>
          {t(statusKeys[status] ?? status)}
        </span>
      </td>
      <td className="px-6 py-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-all">
          <MoreVertical className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function HealthBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900">{value}%</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}