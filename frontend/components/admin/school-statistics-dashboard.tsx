"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  GraduationCap,
  UserCog,
  School,
  BookOpen,
  TrendingUp,
} from "lucide-react";

interface SchoolStatisticsDashboardProps {
  statistics: {
    school: any;
    currentStats: {
      admins: number;
      students: number;
      teachers: number;
      parents: number;
      classes: number;
      subjects: number;
    };
    charts: {
      studentGrowth: Array<{ month: string; count: number }>;
      userGrowth: Array<{ month: string; teachers: number; parents: number; hr: number }>;
      attendanceTrends: Array<{ date: string; present: number; absent: number; late: number }>;
      gradeDistribution: Array<{ name: string; value: number }>;
    };
  };
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

export function SchoolStatisticsDashboard({ statistics }: SchoolStatisticsDashboardProps) {
  const t = useTranslations();

  const statCards = [
    {
      title: t("admin.superAdmin.students"),
      value: statistics.currentStats.students,
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: t("admin.superAdmin.teachers"),
      value: statistics.currentStats.teachers,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: t("admin.superAdmin.parents"),
      value: statistics.currentStats.parents,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: t("admin.superAdmin.admins"),
      value: statistics.currentStats.admins,
      icon: UserCog,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: t("admin.superAdmin.classes"),
      value: statistics.currentStats.classes,
      icon: School,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
    },
    {
      title: t("admin.superAdmin.totalSubjects"),
      value: statistics.currentStats.subjects,
      icon: BookOpen,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Student Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.superAdmin.studentGrowth")}</CardTitle>
          <CardDescription>
            {t("admin.superAdmin.studentGrowthDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={statistics.charts.studentGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.superAdmin.userGrowth")}</CardTitle>
          <CardDescription>
            {t("admin.superAdmin.userGrowthDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statistics.charts.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="teachers" fill="#a855f7" name={t("roles.teacher")} />
              <Bar dataKey="parents" fill="#3b82f6" name={t("roles.parent")} />
              <Bar dataKey="hr" fill="#06b6d4" name={t("roles.hr")} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.superAdmin.attendanceTrends")}</CardTitle>
            <CardDescription>
              {t("admin.superAdmin.attendanceTrendsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistics.charts.attendanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="present"
                  stroke="#22c55e"
                  name={t("admin.superAdmin.present")}
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  stroke="#ef4444"
                  name={t("admin.superAdmin.absent")}
                />
                <Line
                  type="monotone"
                  dataKey="late"
                  stroke="#f59e0b"
                  name={t("admin.superAdmin.late")}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.superAdmin.gradeDistribution")}</CardTitle>
            <CardDescription>
              {t("admin.superAdmin.gradeDistributionDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statistics.charts.gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => {
                    const percent = entry.percent || 0;
                    return `${entry.name}: ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statistics.charts.gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

