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
        <View style={{ flex: 1 }}>
          <Text style={styles.cardEyebrow}>Racha actual</Text>
          <Text style={styles.streakValue}>
            {progress.currentStreak} <Text style={styles.streakUnit}>días</Text>
          </Text>
        </View>
        <View style={styles.flameBadge}>
          <MaterialIcons color={isDark ? '#FFD60A' : '#FF9500'} name="local-fire-department" size={32} />
        </View>
      </View>

      <Text style={styles.streakSubtitle}>{subtitle}</Text>

      <View style={styles.bestStreakPill}>
        <MaterialIcons color={isDark ? '#FFD60A' : '#FF9500'} name="emoji-events" size={16} />
        <Text style={styles.bestStreakText}>
          Mejor racha:{' '}
          <Text style={styles.bestStreakNumber}>{progress.bestStreak}</Text>{' '}
          días
        </Text>
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
      <View style={styles.metricHeaderRow}>
        <View style={styles.metricIconBadge}>
          <MaterialIcons color={colors.primary} name={icon} size={16} />
        </View>
        <Text numberOfLines={1} style={styles.metricLabel}>{label}</Text>
      </View>
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
        <View style={styles.sectionIconBadge}>
          <MaterialIcons color={colors.primary} name="trending-up" size={20} />
        </View>
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
  const maxBarHeight = 90;
  const barHeight = Math.max(6, Math.round((point.rate / 100) * maxBarHeight));

  return (
    <View style={styles.dayColumn}>
      <View style={[styles.dayTrack, point.isToday && styles.dayTrackToday]}>
        <View
          style={[
            styles.dayFill,
            { height: barHeight, opacity: point.isFuture ? 0.3 : 1 },
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
        <View style={styles.sectionIconBadge}>
          <MaterialIcons color={colors.primary} name="format-list-bulleted" size={20} />
        </View>
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
        <View style={[styles.habitIcon, { backgroundColor: `${accentColor}18` }]}>
          <MaterialIcons color={accentColor} name={habit.completedToday ? 'check-circle' : 'radio-button-unchecked'} size={24} />
        </View>
      )}

      <View style={styles.habitContent}>
        <View style={styles.habitTitleRow}>
          <Text numberOfLines={1} style={styles.habitName}>{habit.name}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: habit.completedToday ? (isDark ? 'rgba(48, 209, 88, 0.12)' : 'rgba(52, 199, 89, 0.1)') : colors.surfaceMuted }
          ]}>
            <Text style={[styles.habitStatus, habit.completedToday && styles.habitStatusDone]}>
              {habit.completedToday ? 'Hoy listo' : 'Pendiente'}
            </Text>
          </View>
        </View>
        <View style={styles.habitMetaRow}>
          <Text style={styles.habitMeta}>
            Racha: <Text style={styles.habitMetaNumber}>{habit.currentStreak}</Text> días
          </Text>
          <Text style={styles.habitMeta}>
            Mes: <Text style={styles.habitMetaNumber}>{habit.completionRate}%</Text>
          </Text>
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
    gap: spacing.xl,
    paddingBottom: 140,
  },
  streakCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 24,
    borderWidth: 0,
    gap: spacing.md,
    padding: spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.22 : 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  streakHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  cardEyebrow: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  streakValue: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyRound,
    fontSize: 48,
    fontWeight: typography.weights.heavy,
    letterSpacing: -1.2,
    marginTop: 2,
  },
  streakUnit: {
    fontSize: 24,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  flameBadge: {
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 149, 0, 0.12)' : 'rgba(255, 149, 0, 0.08)',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  streakSubtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    lineHeight: 22,
  },
  bestStreakPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: isDark ? 'rgba(255, 214, 10, 0.12)' : 'rgba(255, 184, 77, 0.12)',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  bestStreakText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  bestStreakNumber: {
    fontFamily: typography.fontFamilyRound,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
  },
  metricCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 22,
    borderWidth: 0,
    gap: spacing.xs,
    padding: spacing.lg,
    minHeight: 110,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.15 : 0.02,
    shadowRadius: 12,
    elevation: 1,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metricIconBadge: {
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(10, 132, 255, 0.12)' : 'rgba(0, 122, 255, 0.08)',
    borderRadius: radius.md,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.2,
    textTransform: 'uppercase',
    flex: 1,
  },
  metricValue: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamilyRound,
    fontSize: 26,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.8,
    marginTop: spacing.xs,
  },
  metricDetail: {
    color: colors.textTertiary,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
  },
  sectionCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 24,
    borderWidth: 0,
    gap: spacing.xl,
    padding: spacing.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.22 : 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  sectionHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 20,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.6,
  },
  sectionCaption: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  sectionIconBadge: {
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(10, 132, 255, 0.12)' : 'rgba(0, 122, 255, 0.08)',
    borderRadius: radius.md,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  weekRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  dayTrack: {
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    borderRadius: radius.pill,
    height: 90,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 14,
  },
  dayTrackToday: {
    backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.08)',
  },
  dayFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    width: '100%',
  },
  dayFillEmpty: {
    backgroundColor: 'transparent',
  },
  dayLabel: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
  },
  dayLabelToday: {
    color: colors.primary,
    fontWeight: typography.weights.heavy,
  },
  dayCount: {
    color: colors.textTertiary,
    fontFamily: typography.fontFamilyRound,
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
  habitList: {
    gap: spacing.lg,
  },
  habitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: 2,
  },
  habitImage: {
    borderRadius: radius.lg,
    height: 52,
    width: 52,
  },
  habitIcon: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 52,
    justifyContent: 'center',
    width: 52,
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
    letterSpacing: -0.3,
  },
  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  habitStatus: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  habitStatusDone: {
    color: isDark ? '#30D158' : '#248A3D',
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
  habitMetaNumber: {
    fontFamily: typography.fontFamilyRound,
    fontSize: 14,
    fontWeight: typography.weights.heavy,
    color: colors.textPrimary,
  },
  habitTrack: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    borderRadius: radius.pill,
    height: 8,
    marginTop: 4,
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
    backgroundColor: colors.surfaceMuted,
    borderRadius: 24,
    borderWidth: 0,
    gap: spacing.md,
    minHeight: 190,
    justifyContent: 'center',
  },
  skeletonMetric: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 22,
    borderWidth: 0,
    minHeight: 110,
    opacity: 0.6,
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.semibold,
  },
});
