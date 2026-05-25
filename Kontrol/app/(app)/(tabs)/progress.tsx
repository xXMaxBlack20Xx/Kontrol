import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenContainer } from '@/components/ui/screen-container';
import { gradients, radius, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import type { ProgressDashboard, ProgressHabitStat, WeeklyProgressPoint } from '@/features/habits/progress-helpers';
import { useProgressScreenController } from '@/features/habits/use-progress-screen-controller';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export default function ProgressScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const {
    error,
    loading,
    progress,
    refreshing,
    reload,
    navigateToCreateHabit,
    navigateToHabits,
    user,
  } = useProgressScreenController();

  if (!user) {
    return <SessionLoadingScreen />;
  }

  const activeGradient = isDark ? gradients.blueScreenDark : gradients.blueScreenLight;
  const isInitialLoading = loading && !progress;

  return (
    <LinearGradient
      colors={[...activeGradient.colors]}
      locations={[...activeGradient.locations]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradientRoot}
    >
      <ScreenContainer
        style={{ backgroundColor: 'transparent' }}
        contentStyle={styles.content}
        edges={['top']}
        refreshControl={
          <RefreshControl
            onRefresh={() => reload({ showSpinner: false })}
            refreshing={refreshing}
            tintColor={colors.textPrimary}
          />
        }
      >
        <AppHeader
          description="Tus rachas y avances se calculan con hábitos y cumplimientos reales de Kontrol."
          title="Progreso"
        />

        {isInitialLoading ? <ProgressSkeleton /> : null}

        {!isInitialLoading && error ? (
          <ErrorState message={error} onRetry={() => reload({ showSpinner: true })} />
        ) : null}

        {!isInitialLoading && !error && progress ? (
          <>
            {!progress.hasHabits ? (
              <EmptyState
                action={<PrimaryButton icon="add-circle-outline" onPress={navigateToCreateHabit} title="Crear primer hábito" />}
                description="Todavía no tienes hábitos para medir. Crea uno para empezar a registrar tu constancia."
                icon="track-changes"
                title="Todavía no tienes hábitos"
              />
            ) : (
              <>
                <StreakHero progress={progress} />
                <MetricGrid progress={progress} />

                {!progress.hasCompletions ? (
                  <EmptyState
                    action={<SecondaryButton icon="check-circle-outline" onPress={navigateToHabits} title="Ir a hábitos" />}
                    description="Completa tu primer hábito para iniciar tu progreso y desbloquear tus rachas."
                    icon="flag"
                    title="Tu progreso inicia hoy"
                  />
                ) : null}

                <WeeklyProgress points={progress.weeklySeries} />
                <HabitProgressList habits={progress.habitStats} />
              </>
            )}
          </>
        ) : null}
      </ScreenContainer>
    </LinearGradient>
  );
}

function StreakHero({ progress }: { progress: ProgressDashboard }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const subtitle = progress.currentStreak > 0
    ? progress.todayCompleted >= progress.todayExpected && progress.todayExpected > 0
      ? 'Hoy ya cumpliste tus hábitos esperados.'
      : 'Sigue así, cada día programado cuenta.'
    : 'Completa un hábito hoy para iniciar tu racha.';

  return (
    <Card style={styles.streakCard}>
      <View style={styles.streakHeaderRow}>
        <View>
          <Text style={styles.cardEyebrow}>Racha actual</Text>
          <Text style={styles.streakValue}>{progress.currentStreak} días</Text>
        </View>
        <View style={styles.flameBadge}>
          <MaterialIcons color={isDark ? '#FFD60A' : '#FF7A1A'} name="local-fire-department" size={34} />
        </View>
      </View>

      <Text style={styles.streakSubtitle}>{subtitle}</Text>

      <View style={styles.bestStreakPill}>
        <MaterialIcons color={isDark ? '#FFD60A' : '#B26A00'} name="emoji-events" size={18} />
        <Text style={styles.bestStreakText}>Mejor racha: {progress.bestStreak} días</Text>
      </View>
    </Card>
  );
}

function MetricGrid({ progress }: { progress: ProgressDashboard }) {
  return (
    <View style={metricGridStyles.grid}>
      <MetricCard icon="today" label="Hoy" value={`${progress.todayCompleted}/${progress.todayExpected}`} />
      <MetricCard icon="track-changes" label="Cumplimiento" value={`${progress.todayCompletionRate}%`} />
      <MetricCard icon="calendar-month" label="Semana" value={`${progress.weekCompleted}`} detail={`${progress.weekCompletionRate}%`} />
      <MetricCard icon="checklist" label="Hábitos activos" value={`${progress.activeHabits}`} />
      <MetricCard icon="date-range" label="Mes" value={`${progress.monthCompleted}`} detail={`${progress.monthCompletionRate}%`} />
      <MetricCard icon="done-all" label="Total" value={`${progress.totalCompletions}`} detail="cumplimientos" />
    </View>
  );
}

function MetricCard({ detail, icon, label, value }: { detail?: string; icon: IconName; label: string; value: string }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  return (
    <Card style={styles.metricCard}>
      <View style={styles.metricIconBadge}>
        <MaterialIcons color={colors.primary} name={icon} size={20} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}
    </Card>
  );
}

function WeeklyProgress({ points }: { points: WeeklyProgressPoint[] }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeadingRow}>
        <View>
          <Text style={styles.sectionTitle}>Semana</Text>
          <Text style={styles.sectionCaption}>Cumplimientos por día programado</Text>
        </View>
        <MaterialIcons color={colors.textSecondary} name="trending-up" size={22} />
      </View>

      <View style={styles.weekRow}>
        {points.map((point) => (
          <DayBar key={point.date} point={point} />
        ))}
      </View>
    </Card>
  );
}

function DayBar({ point }: { point: WeeklyProgressPoint }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const barHeight = Math.max(8, Math.round(point.rate * 0.72));

  return (
    <View style={styles.dayColumn}>
      <View style={[styles.dayTrack, point.isToday && styles.dayTrackToday]}>
        <View
          style={[
            styles.dayFill,
            { height: barHeight, opacity: point.isFuture ? 0.28 : 1 },
            point.rate === 0 && styles.dayFillEmpty,
          ]}
        />
      </View>
      <Text style={[styles.dayLabel, point.isToday && styles.dayLabelToday]}>{point.dayLabel}</Text>
      <Text style={styles.dayCount}>{point.completed}/{point.expected}</Text>
    </View>
  );
}

function HabitProgressList({ habits }: { habits: ProgressHabitStat[] }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeadingRow}>
        <View>
          <Text style={styles.sectionTitle}>Por hábito</Text>
          <Text style={styles.sectionCaption}>Racha individual y avance del mes</Text>
        </View>
        <MaterialIcons color={colors.textSecondary} name="format-list-bulleted" size={22} />
      </View>

      <View style={styles.habitList}>
        {habits.map((habit) => (
          <HabitProgressRow key={habit.habitId} habit={habit} />
        ))}
      </View>
    </Card>
  );
}

function HabitProgressRow({ habit }: { habit: ProgressHabitStat }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const accentColor = isHexColor(habit.color) ? habit.color : colors.primary;

  return (
    <View style={styles.habitRow}>
      {habit.coverPhotoUrl ? (
        <Image source={{ uri: habit.coverPhotoUrl }} style={styles.habitImage} />
      ) : (
        <View style={[styles.habitIcon, { backgroundColor: `${accentColor}24` }]}>
          <MaterialIcons color={accentColor} name={habit.completedToday ? 'check-circle' : 'radio-button-unchecked'} size={24} />
        </View>
      )}

      <View style={styles.habitContent}>
        <View style={styles.habitTitleRow}>
          <Text numberOfLines={1} style={styles.habitName}>{habit.name}</Text>
          <Text style={[styles.habitStatus, habit.completedToday && styles.habitStatusDone]}>
            {habit.completedToday ? 'Hoy listo' : 'Pendiente'}
          </Text>
        </View>
        <View style={styles.habitMetaRow}>
          <Text style={styles.habitMeta}>{habit.currentStreak} días de racha</Text>
          <Text style={styles.habitMeta}>{habit.completionRate}% del mes</Text>
        </View>
        <View style={styles.habitTrack}>
          <View style={[styles.habitFill, { width: `${habit.completionRate}%`, backgroundColor: accentColor }]} />
        </View>
      </View>
    </View>
  );
}

function isHexColor(value?: string): value is string {
  return Boolean(value && /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(value));
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <EmptyState
      action={<PrimaryButton icon="refresh" onPress={onRetry} title="Reintentar" />}
      description={message}
      icon="cloud-off"
      title="No se pudo cargar progreso"
    />
  );
}

function ProgressSkeleton() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  return (
    <View style={styles.skeletonStack}>
      <Card style={styles.skeletonHero}>
        <ActivityIndicator color={colors.textPrimary} />
        <Text style={styles.loadingText}>Cargando progreso...</Text>
      </Card>
      <View style={metricGridStyles.grid}>
        {[0, 1, 2, 3].map((item) => (
          <Card key={item} style={styles.skeletonMetric} />
        ))}
      </View>
    </View>
  );
}

const metricGridStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 120,
  },
  streakCard: {
    backgroundColor: isDark ? 'rgba(46, 28, 20, 0.92)' : '#FFF1E7',
    borderColor: isDark ? 'rgba(255, 214, 10, 0.18)' : '#FFD4B8',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  streakHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  cardEyebrow: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
  },
  streakValue: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyRound,
    fontSize: 52,
    fontWeight: typography.weights.heavy,
    letterSpacing: -1.6,
    lineHeight: 58,
    marginTop: spacing.xs,
  },
  flameBadge: {
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 214, 10, 0.13)' : '#FFFFFF',
    borderRadius: radius.xl,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  streakSubtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 17,
    lineHeight: 24,
  },
  bestStreakPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: isDark ? 'rgba(255, 214, 10, 0.12)' : 'rgba(255, 184, 77, 0.22)',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bestStreakText: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.semibold,
  },
  metricCard: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xs,
    minHeight: 132,
  },
  metricIconBadge: {
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(10, 132, 255, 0.14)' : 'rgba(0, 122, 255, 0.1)',
    borderRadius: radius.md,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
  },
  metricValue: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyRound,
    fontSize: 30,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.8,
  },
  metricDetail: {
    color: colors.textTertiary,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  sectionCard: {
    gap: spacing.lg,
  },
  sectionHeadingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 21,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.4,
  },
  sectionCaption: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  weekRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  dayTrack: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 78,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '100%',
  },
  dayTrackToday: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  dayFill: {
    backgroundColor: isDark ? '#30D158' : '#34C759',
    borderRadius: radius.pill,
    minHeight: 8,
    width: '100%',
  },
  dayFillEmpty: {
    backgroundColor: colors.borderStrong,
  },
  dayLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  dayLabelToday: {
    color: colors.primary,
  },
  dayCount: {
    color: colors.textTertiary,
    fontFamily: typography.fontFamilyRound,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
  },
  habitList: {
    gap: spacing.md,
  },
  habitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  habitImage: {
    borderRadius: radius.lg,
    height: 54,
    width: 54,
  },
  habitIcon: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  habitContent: {
    flex: 1,
    gap: spacing.xs,
  },
  habitTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  habitName: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: typography.fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.heavy,
  },
  habitStatus: {
    color: colors.textTertiary,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  habitStatusDone: {
    color: colors.successText,
  },
  habitMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  habitMeta: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  habitTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 7,
    overflow: 'hidden',
  },
  habitFill: {
    borderRadius: radius.pill,
    height: '100%',
  },
  skeletonStack: {
    gap: spacing.lg,
  },
  skeletonHero: {
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 190,
    justifyContent: 'center',
  },
  skeletonMetric: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 132,
    opacity: 0.72,
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
  },
});
