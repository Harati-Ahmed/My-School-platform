import { getTranslations } from 'next-intl/server';
import { AdvancedAnalytics } from '@/components/admin/advanced-analytics';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, GraduationCap } from 'lucide-react';
import { getAnalyticsData } from '@/lib/actions/admin';

export default async function AnalyticsPage() {
  const t = await getTranslations();
  
  let analyticsData;
  try {
    analyticsData = await getAnalyticsData();
  } catch (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t('phase5.analytics.title')}</h1>
        <p className="text-destructive">{t('common.error')}: Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('phase5.analytics.title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('phase5.analytics.dashboard')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('teacher.dashboard.totalStudents')}
              </p>
              <h3 className="mt-2 text-3xl font-bold">{analyticsData.stats.totalStudents}</h3>
            </div>
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('admin.dashboard.totalTeachers')}
              </p>
              <h3 className="mt-2 text-3xl font-bold">{analyticsData.stats.totalTeachers}</h3>
            </div>
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('phase5.analytics.classAverage')}
              </p>
              <h3 className="mt-2 text-3xl font-bold">
                {isNaN(analyticsData.stats.classAverage) ? 0 : analyticsData.stats.classAverage}%
              </h3>
            </div>
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('teacher.dashboard.attendanceRate')}
              </p>
              <h3 className="mt-2 text-3xl font-bold">
                {isNaN(analyticsData.stats.attendanceRate) ? 0 : analyticsData.stats.attendanceRate}%
              </h3>
            </div>
            <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('phase5.analytics.topPerformers')}
              </p>
              <h3 className="mt-2 text-3xl font-bold">{analyticsData.topPerformers.length}</h3>
            </div>
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('phase5.analytics.needsAttention')}
              </p>
              <h3 className="mt-2 text-3xl font-bold">{analyticsData.needsAttention.length}</h3>
            </div>
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900">
              <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Advanced Analytics Component */}
      <AdvancedAnalytics data={analyticsData} locale="en" />
    </div>
  );
}

