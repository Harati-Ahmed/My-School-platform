'use client';

/**
 * Advanced Analytics Dashboard Component
 * Provides comprehensive analytics and insights
 */

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Calendar,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Area,
  AreaChart,
} from 'recharts';

interface AnalyticsData {
  studentPerformance: Array<{ month: string; average: number }>;
  attendanceTrends: Array<{
    month: string;
    present: number;
    absent: number;
    late: number;
  }>;
  gradeDistribution: Array<{ range: string; count: number }>;
  subjectPerformance: Array<{ subject: string; average: number }>;
  topPerformers: Array<{ name: string; grade: number }>;
  needsAttention: Array<{ name: string; grade: number; attendance: number }>;
}

interface AdvancedAnalyticsProps {
  data: AnalyticsData;
  locale?: 'en' | 'ar';
}

const COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#a855f7',
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
  COLORS.purple,
];

export function AdvancedAnalytics({
  data,
  locale = 'en',
}: AdvancedAnalyticsProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate statistics
  const stats = useMemo(() => {
    const avgPerformance =
      data.studentPerformance.length > 0
        ? data.studentPerformance.reduce((acc, curr) => acc + curr.average, 0) /
          data.studentPerformance.length
        : 0;

    const totalAttendance = data.attendanceTrends.reduce(
      (acc, curr) => ({
        present: acc.present + curr.present,
        absent: acc.absent + curr.absent,
        late: acc.late + curr.late,
      }),
      { present: 0, absent: 0, late: 0 }
    );

    const totalStudents =
      totalAttendance.present +
      totalAttendance.absent +
      totalAttendance.late;
    const attendanceRate =
      totalStudents > 0
        ? (totalAttendance.present / totalStudents) * 100
        : 0;

    return {
      avgPerformance: isNaN(avgPerformance) ? 0 : Number(avgPerformance.toFixed(1)),
      attendanceRate: isNaN(attendanceRate) ? 0 : Number(attendanceRate.toFixed(1)),
      topPerformersCount: data.topPerformers.length,
      needsAttentionCount: data.needsAttention.length,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('phase5.analytics.studentPerformance')}
              </p>
              <h3 className="mt-2 text-3xl font-bold">
                {stats.avgPerformance}%
              </h3>
            </div>
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('phase5.analytics.attendanceTrends')}
              </p>
              <h3 className="mt-2 text-3xl font-bold">
                {stats.attendanceRate}%
              </h3>
            </div>
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('phase5.analytics.topPerformers')}
              </p>
              <h3 className="mt-2 text-3xl font-bold">
                {stats.topPerformersCount}
              </h3>
            </div>
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
              <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('phase5.analytics.needsAttention')}
              </p>
              <h3 className="mt-2 text-3xl font-bold">
                {stats.needsAttentionCount}
              </h3>
            </div>
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            {t('phase5.analytics.overview')}
          </TabsTrigger>
          <TabsTrigger value="trends">
            {t('phase5.analytics.trends')}
          </TabsTrigger>
          <TabsTrigger value="distribution">
            {t('phase5.analytics.gradeDistribution')}
          </TabsTrigger>
          <TabsTrigger value="subjects">
            {t('phase5.analytics.subjectPerformance')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {t('phase5.analytics.studentPerformance')}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.studentPerformance}>
                <defs>
                  <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.primary}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.primary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="average"
                  stroke={COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorAverage)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">
                {t('phase5.analytics.topPerformers')}
              </h3>
              <div className="space-y-3">
                {data.topPerformers.slice(0, 5).map((student, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-muted p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <span className="font-bold text-primary">
                      {student.grade.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">
                {t('phase5.analytics.needsAttention')}
              </h3>
              <div className="space-y-3">
                {data.needsAttention.slice(0, 5).map((student, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-muted p-3"
                  >
                    <span className="font-medium">{student.name}</span>
                    <div className="flex gap-2 text-sm">
                      <span className="text-muted-foreground">
                        Grade: {student.grade.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-muted-foreground">
                        Att: {student.attendance.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {t('phase5.analytics.attendanceTrends')}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.attendanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="present"
                  fill={COLORS.success}
                  name={t('parent.attendance.present')}
                />
                <Bar
                  dataKey="late"
                  fill={COLORS.warning}
                  name={t('parent.attendance.late')}
                />
                <Bar
                  dataKey="absent"
                  fill={COLORS.danger}
                  name={t('parent.attendance.absent')}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {t('phase5.analytics.gradeDistribution')}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data.gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => {
                    const dataEntry = entry as { range?: string; percent?: number };
                    return `${dataEntry.range || ''}: ${((dataEntry.percent || 0) * 100).toFixed(0)}%`;
                  }}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="range"
                >
                  {data.gradeDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {t('phase5.analytics.subjectPerformance')}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data.subjectPerformance}
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="subject" type="category" />
                <Tooltip />
                <Bar dataKey="average" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

