import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ReactNode, useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { DestructiveButton, PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { FeedbackMessage, SelectPill, TextInputField } from '@/components/ui/form';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/ui/screen-container';
import { gradients, radius, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { deletePhoto } from '@/features/api/photo-service';
import { useAuth } from '@/features/account/auth-context';
import {
  allDays,
  categoryOptions,
  colorOptions,
  dateFromTime,
  dayOptions,
  formatTime,
  getFrequencyFromDays,
  iconOptions,
  normalizeFormDays,
  sortDays,
  subcategoryOptions,
  weekdayDays,
  weekendDays,
  type HabitIconName,
} from '@/features/habits/habit-form-options';
import {
  getHabitImageType,
  maxHabitImageSizeBytes,
  uploadHabitImage,
  type SelectedHabitImage,
} from '@/features/habits/habit-image';
import {
  deleteHabit,
  DeleteHabitError,
  deleteHabitErrorMessages,
  editHabit,
  EditHabitError,
  editHabitErrorMessages,
  formatHabitDays,
  type HabitRecord,
} from '@/features/habits/habit';
import { remoteHabitRepository } from '@/features/habits/remote-habit-repository';
import { habitDetailHref } from '@/features/navigation/routes';
import { expoNotificationScheduler } from '@/features/reminders/expo-notification-scheduler';
import { fileReminderRepository } from '@/features/reminders/local-reminder-repository';
import {
  deleteHabitReminder,
  ReminderError,
  reminderErrorMessages,
  saveHabitReminder,
  validateReminderTime,
  type ReminderRecord,
} from '@/features/reminders/reminder';
import {
  deleteRemoteReminderByHabitId,
  listRemoteReminders,
  syncRemoteReminder,
} from '@/features/reminders/remote-reminder-service';

type SubmitState = 'idle' | 'savingHabit' | 'savingReminder' | 'uploadingImage' | 'attachingImage';

type EditHabitFormValues = {
  category: string;
  color: string;
  daysOfWeek: number[];
  frequency: string;
  icon: HabitIconName;
  name: string;
  reminderTime: string;
  subcategories: string[];
  target: string;
};

type EditHabitFormErrors = Partial<Record<keyof EditHabitFormValues, string>>;

function isHabitIconName(value?: string): value is HabitIconName {
  return Boolean(value && value in MaterialIcons.glyphMap);
}

function validateEditHabitForm(values: EditHabitFormValues): EditHabitFormErrors {
  const errors: EditHabitFormErrors = {};
  const normalizedName = values.name.trim();
  const normalizedCategory = values.category.trim();
  const normalizedTarget = values.target.trim();

  if (!normalizedName) {
    errors.name = editHabitErrorMessages.NAME_REQUIRED;
  } else if (normalizedName.length < 2) {
    errors.name = editHabitErrorMessages.NAME_TOO_SHORT;
  } else if (normalizedName.length > 60) {
    errors.name = editHabitErrorMessages.NAME_TOO_LONG;
  }

  if (!values.daysOfWeek.length) {
    errors.daysOfWeek = editHabitErrorMessages.DAYS_OF_WEEK_REQUIRED;
  }

  if (values.frequency !== 'daily' && values.frequency !== 'custom') {
    errors.frequency = editHabitErrorMessages.FREQUENCY_REQUIRED;
  }

  if (normalizedCategory.length > 120) {
    errors.category = 'La categoría no puede superar 120 caracteres.';
  }

  if (values.subcategories.length > 12) {
    errors.subcategories = 'Selecciona máximo 12 subcategorías.';
  }

  if (normalizedTarget.length > 120) {
    errors.target = 'La meta no puede superar 120 caracteres.';
  }

  if (values.reminderTime.trim()) {
    const reminderValidationError = validateReminderTime(values.reminderTime);

    if (reminderValidationError) {
      errors.reminderTime = reminderErrorMessages[reminderValidationError];
    }
  }

  return errors;
}

function hasErrors(errors: EditHabitFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

function getReminderMessage(error: unknown): string {
  if (error instanceof ReminderError) {
    return reminderErrorMessages[error.code];
  }

  return reminderErrorMessages.REMINDER_SAVE_UNAVAILABLE;
}

export default function EditHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const insets = useSafeAreaInsets();
  const habitId = Array.isArray(id) ? id[0] : id;
  const [habit, setHabit] = useState<HabitRecord | null>(null);
  const [reminder, setReminder] = useState<ReminderRecord | null>(null);
  const [hasRemoteReminder, setHasRemoteReminder] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('');
  const [habitSubcategories, setHabitSubcategories] = useState<string[]>([]);
  const [habitTarget, setHabitTarget] = useState('');
  const [habitReminderTime, setHabitReminderTime] = useState('');
  const [habitDaysOfWeek, setHabitDaysOfWeek] = useState<number[]>(allDays);
  const [habitColor, setHabitColor] = useState(colorOptions[0]);
  const [habitIcon, setHabitIcon] = useState<HabitIconName>('flag');
  const [selectedImage, setSelectedImage] = useState<SelectedHabitImage | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof EditHabitFormValues, boolean>>>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [scheduleFallbackMessage, setScheduleFallbackMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [isDeleting, setIsDeleting] = useState(false);

  const habitFrequency = getFrequencyFromDays(habitDaysOfWeek);
  const formValues: EditHabitFormValues = {
    category: habitCategory,
    color: habitColor,
    daysOfWeek: habitDaysOfWeek,
    frequency: habitFrequency,
    icon: habitIcon,
    name: habitName,
    reminderTime: habitReminderTime,
    subcategories: habitSubcategories,
    target: habitTarget,
  };
  const validationErrors = validateEditHabitForm(formValues);
  const isSubmitting = submitState !== 'idle';
  const canSubmit = !isSubmitting && !hasErrors(validationErrors);
  const submitTitle = submitState === 'savingReminder'
    ? 'Guardando recordatorio...'
    : submitState === 'uploadingImage'
      ? 'Subiendo imagen...'
      : submitState === 'attachingImage'
        ? 'Asociando imagen...'
        : submitState === 'savingHabit'
          ? 'Guardando...'
          : 'Guardar cambios';
  const previewImageUri = selectedImage?.uri ?? (!shouldRemoveImage ? habit?.coverPhotoUrl : undefined);

  const loadHabit = useCallback(async () => {
    if (!user || !habitId) {
      setHabit(null);
      setReminder(null);
      setHasRemoteReminder(false);
      setIsLoading(false);
      setMessage(habitId ? null : 'No se recibió el identificador del hábito.');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setScheduleFallbackMessage(null);

    try {
      const [storedHabits, storedReminder, remoteReminders] = await Promise.all([
        remoteHabitRepository.listByAccount(user.accountId),
        fileReminderRepository.findByHabitId(habitId),
        listRemoteReminders().catch(() => []),
      ]);
      const selectedHabit = storedHabits.find((currentHabit) => currentHabit.id === habitId) ?? null;
      const remoteReminder = remoteReminders.find((currentReminder) => currentReminder.habitId === habitId);

      setHabit(selectedHabit);
      setReminder(storedReminder);
      setHasRemoteReminder(Boolean(remoteReminder));
      setSelectedImage(null);
      setShouldRemoveImage(false);
      setWasSubmitted(false);
      setTouchedFields({});

      if (selectedHabit) {
        const initialDays = normalizeFormDays(selectedHabit.daysOfWeek);

        setHabitName(selectedHabit.name);
        setHabitCategory(selectedHabit.category ?? '');
        setHabitSubcategories(selectedHabit.subcategories ?? []);
        setHabitTarget(selectedHabit.target ?? '');
        setHabitReminderTime(storedReminder?.time ?? remoteReminder?.time ?? selectedHabit.reminderTime ?? '');
        setHabitDaysOfWeek(initialDays);
        setHabitColor(selectedHabit.color ?? colorOptions[0]);
        setHabitIcon(isHabitIconName(selectedHabit.icon) ? selectedHabit.icon : 'flag');

        if (!selectedHabit.daysOfWeek?.length) {
          setScheduleFallbackMessage('Este hábito no tenía días guardados; se mostrará como diario hasta que selecciones una frecuencia.');
        }
      } else {
        setMessage('El hábito fue eliminado o ya no está disponible.');
      }
    } catch {
      setHabit(null);
      setReminder(null);
      setHasRemoteReminder(false);
      setMessage('No se pudo cargar el hábito. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [habitId, user]);

  useFocusEffect(
    useCallback(() => {
      loadHabit();
    }, [loadHabit]),
  );

  function getVisibleError(field: keyof EditHabitFormValues): string | undefined {
    return wasSubmitted || touchedFields[field] ? validationErrors[field] : undefined;
  }

  function markFieldTouched(field: keyof EditHabitFormValues) {
    setTouchedFields((currentTouchedFields) => ({ ...currentTouchedFields, [field]: true }));
  }

  function navigateToHabits() {
    router.replace('/(app)/(tabs)/habits' as Href);
  }

  function setQuickDays(daysOfWeek: number[]) {
    setHabitDaysOfWeek(sortDays(daysOfWeek));
    setScheduleFallbackMessage(null);
    markFieldTouched('daysOfWeek');
  }

  function toggleDay(day: number) {
    setHabitDaysOfWeek((currentDays) => {
      const nextDays = currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day];

      return sortDays(nextDays);
    });
    setScheduleFallbackMessage(null);
    markFieldTouched('daysOfWeek');
  }

  function toggleSubcategory(subcategory: string) {
    setHabitSubcategories((currentSubcategories) =>
      currentSubcategories.includes(subcategory)
        ? currentSubcategories.filter((currentSubcategory) => currentSubcategory !== subcategory)
        : [...currentSubcategories, subcategory],
    );
    markFieldTouched('subcategories');
  }

  function handleTimeChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    setHabitReminderTime(formatTime(selectedDate));
    markFieldTouched('reminderTime');
  }

  async function handlePickImage() {
    setMessage(null);
    setIsSuccess(false);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessage('Permite acceso a tus fotos para seleccionar una imagen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: 'images',
      quality: 0.82,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const imageType = getHabitImageType(asset);

    if (!imageType) {
      setMessage('Selecciona una imagen JPG, PNG o WebP.');
      return;
    }

    if (asset.fileSize && asset.fileSize > maxHabitImageSizeBytes) {
      setMessage('La imagen no puede superar 10 MB.');
      return;
    }

    setSelectedImage({
      contentType: imageType.contentType,
      fileExtension: imageType.fileExtension,
      sizeBytes: asset.fileSize,
      uri: asset.uri,
    });
    setShouldRemoveImage(false);
  }

  async function syncReminderAfterHabitSave(updatedHabit: HabitRecord): Promise<string | null> {
    setSubmitState('savingReminder');

    try {
      if (habitReminderTime.trim()) {
        const updatedReminder = await saveHabitReminder(
          {
            accountId: updatedHabit.accountId,
            habitId: updatedHabit.id,
            habitName: updatedHabit.name,
            time: habitReminderTime,
          },
          fileReminderRepository,
          expoNotificationScheduler,
        );

        setReminder(updatedReminder);
        await syncRemoteReminder({
          daysOfWeek: updatedHabit.daysOfWeek,
          habitId: updatedHabit.id,
          habitName: updatedHabit.name,
          time: updatedReminder.time,
        });
        setHasRemoteReminder(true);

        return null;
      }

      if (reminder) {
        await deleteHabitReminder(
          { habitId: updatedHabit.id, confirmed: true },
          fileReminderRepository,
          expoNotificationScheduler,
        );
        setReminder(null);
      }

      if (reminder || hasRemoteReminder) {
        await deleteRemoteReminderByHabitId(updatedHabit.id);
        setHasRemoteReminder(false);
      }

      return null;
    } catch (error) {
      return `Los cambios se guardaron, pero no se pudo actualizar el recordatorio. ${getReminderMessage(error)}`;
    }
  }

  async function syncImageAfterHabitSave(updatedHabit: HabitRecord): Promise<{ habit: HabitRecord; warning: string | null }> {
    if (selectedImage) {
      try {
        setSubmitState('uploadingImage');
        const photoId = await uploadHabitImage(updatedHabit.id, selectedImage);

        setSubmitState('attachingImage');
        const habitWithPhoto = await editHabit(updatedHabit, { coverPhotoId: photoId }, remoteHabitRepository);
        return { habit: habitWithPhoto, warning: null };
      } catch {
        return {
          habit: updatedHabit,
          warning: 'Los cambios se guardaron, pero no se pudo actualizar la imagen.',
        };
      }
    }

    if (shouldRemoveImage && habit?.coverPhotoId) {
      try {
        await deletePhoto(habit.coverPhotoId);
      } catch {
        return {
          habit: updatedHabit,
          warning: 'La imagen se quitó del hábito, pero no se pudo eliminar el archivo anterior.',
        };
      }
    }

    return { habit: updatedHabit, warning: null };
  }

  async function handleSaveHabitEdit() {
    if (!habit || isSubmitting) {
      return;
    }

    setWasSubmitted(true);
    setMessage(null);
    setIsSuccess(false);

    if (hasErrors(validationErrors)) {
      setMessage('Revisa los campos marcados antes de guardar los cambios.');
      return;
    }

    setSubmitState('savingHabit');

    try {
      const editedHabit = await editHabit(
        habit,
        {
          category: habitCategory,
          color: habitColor,
          coverPhotoId: shouldRemoveImage && !selectedImage ? '' : habit.coverPhotoId,
          daysOfWeek: habitDaysOfWeek,
          frequency: habitFrequency,
          icon: habitIcon,
          name: habitName,
          subcategories: habitSubcategories,
          target: habitTarget,
        },
        remoteHabitRepository,
      );
      const warnings = [await syncReminderAfterHabitSave(editedHabit)];
      const imageResult = await syncImageAfterHabitSave(editedHabit);
      const finalHabit = imageResult.habit;

      if (imageResult.warning) {
        warnings.push(imageResult.warning);
      }

      setHabit(finalHabit);
      setIsSuccess(true);

      const visibleWarnings = warnings.filter(Boolean);

      if (visibleWarnings.length) {
        Alert.alert('Cambios guardados', visibleWarnings.join('\n'), [
          { onPress: () => router.replace(habitDetailHref(finalHabit.id)), text: 'Ver hábito' },
        ]);
      } else {
        router.replace(habitDetailHref(finalHabit.id));
      }
    } catch (error) {
      setIsSuccess(false);

      if (error instanceof EditHabitError) {
        setMessage(editHabitErrorMessages[error.code]);
      } else {
        setMessage(editHabitErrorMessages.HABIT_EDIT_UNAVAILABLE);
      }
    } finally {
      setSubmitState('idle');
    }
  }

  function confirmDeleteHabit() {
    if (!habit) {
      return;
    }

    Alert.alert('Eliminar hábito', 'Esta acción retirará el hábito de la aplicación.', [
      { style: 'cancel', text: 'Cancelar' },
      {
        onPress: handleDeleteHabit,
        style: 'destructive',
        text: 'Eliminar',
      },
    ]);
  }

  async function handleDeleteHabit() {
    if (!habit) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    setIsSuccess(false);

    try {
      const deletedHabit = await deleteHabit(habit, true, remoteHabitRepository);

      if (reminder) {
        try {
          await deleteHabitReminder(
            { habitId: deletedHabit.id, confirmed: true },
            fileReminderRepository,
            expoNotificationScheduler,
          );
          deleteRemoteReminderByHabitId(deletedHabit.id).catch(() => undefined);
        } catch {
          setMessage('El hábito fue eliminado, pero no se pudo cancelar su recordatorio local.');
        }
      }

      router.replace('/(app)/(tabs)/habits' as Href);
    } catch (error) {
      setIsSuccess(false);

      if (error instanceof DeleteHabitError) {
        setMessage(deleteHabitErrorMessages[error.code]);
      } else {
        setMessage(deleteHabitErrorMessages.HABIT_DELETE_UNAVAILABLE);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  if (!user) {
    return <SessionLoadingScreen />;
  }

  const activeGradient = isDark ? gradients.blueScreenDark : gradients.blueScreenLight;
  const getPillStyle = (selected: boolean) => selected ? styles.pillSelectedOverride : styles.pillUnselectedOverride;

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
        contentStyle={styles.containerContent}
        edges={['top']}
        keyboardAvoiding
        scroll={false}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppHeader
            backLabel="Cancelar"
            eyebrow="Editar hábito"
            onBack={() => router.back()}
            title={habit?.name ?? 'Hábito'}
          />

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.textPrimary} />
              <Text style={styles.loadingText}>Cargando hábito...</Text>
            </View>
          ) : null}

          {message ? <FeedbackMessage message={message} type={isSuccess ? 'success' : 'error'} /> : null}
          {scheduleFallbackMessage ? <FeedbackMessage message={scheduleFallbackMessage} type="info" /> : null}

          {!isLoading && !habit ? (
            <EmptyState
              action={<SecondaryButton compact fullWidth={false} icon="arrow-back" onPress={navigateToHabits} title="Volver a hábitos" />}
              description="No se encontraron datos válidos para editar. Puede que el hábito haya sido eliminado."
              icon="error-outline"
              title="Hábito no disponible"
            />
          ) : null}

          {habit ? (
            <>
              <Card style={styles.previewCard}>
                {previewImageUri ? (
                  <Image source={{ uri: previewImageUri }} style={styles.previewImage} />
                ) : (
                  <View style={[styles.previewIcon, { backgroundColor: `${habitColor}24` }]}>
                    <MaterialIcons color={habitColor} name={habitIcon} size={26} />
                  </View>
                )}
                <View style={styles.previewCopy}>
                  <Text style={styles.previewEyebrow}>Vista previa</Text>
                  <Text numberOfLines={2} style={styles.previewTitle}>
                    {habitName.trim() || 'Tu hábito'}
                  </Text>
                  <Text style={styles.previewDescription}>
                    {formatHabitDays(habitDaysOfWeek)}{habitCategory ? ` · ${habitCategory}` : ''}
                  </Text>
                </View>
              </Card>

              <FormSection description="Actualiza nombre y frecuencia sin perder tu historial." title="Datos principales">
                <TextInputField
                  autoCapitalize="sentences"
                  error={getVisibleError('name')}
                  helperText="Usa entre 2 y 60 caracteres."
                  icon="edit-note"
                  label="Nombre"
                  maxLength={60}
                  onBlur={() => markFieldTouched('name')}
                  onChangeText={setHabitName}
                  placeholder="Leer 30 minutos"
                  returnKeyType="next"
                  value={habitName}
                  containerStyle={[
                    styles.inputFieldContainer,
                    getVisibleError('name') ? { borderWidth: 1, borderColor: colors.dangerText } : null,
                  ]}
                />

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Frecuencia</Text>
                  <View style={styles.scrollWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalScrollContent}>
                      <SelectPill icon="today" label="Todos" onPress={() => setQuickDays(allDays)} selected={habitDaysOfWeek.length === 7} style={getPillStyle(habitDaysOfWeek.length === 7)} />
                      <SelectPill label="Entre semana" onPress={() => setQuickDays(weekdayDays)} selected={formatHabitDays(habitDaysOfWeek) === 'Entre semana'} style={getPillStyle(formatHabitDays(habitDaysOfWeek) === 'Entre semana')} />
                      <SelectPill label="Fines" onPress={() => setQuickDays(weekendDays)} selected={formatHabitDays(habitDaysOfWeek) === 'Fines de semana'} style={getPillStyle(formatHabitDays(habitDaysOfWeek) === 'Fines de semana')} />
                    </ScrollView>
                  </View>
                  <View style={styles.dayGrid}>
                    {dayOptions.map((dayOption) => (
                      <Pressable
                        accessibilityLabel={dayOption.accessibilityLabel}
                        accessibilityRole="button"
                        accessibilityState={{ selected: habitDaysOfWeek.includes(dayOption.value) }}
                        key={dayOption.value}
                        onPress={() => toggleDay(dayOption.value)}
                        style={({ pressed }) => [
                          styles.dayButton,
                          { backgroundColor: colors.surfaceMuted },
                          habitDaysOfWeek.includes(dayOption.value) && { backgroundColor: colors.primary },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.dayButtonText, { color: colors.textPrimary }, habitDaysOfWeek.includes(dayOption.value) && { color: colors.primaryText }]}>
                          {dayOption.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {getVisibleError('daysOfWeek') ? <Text style={styles.errorText}>{getVisibleError('daysOfWeek')}</Text> : null}
                  <Text style={styles.helperText}>{formatHabitDays(habitDaysOfWeek)}</Text>
                </View>
              </FormSection>

              <FormSection description="Mantén organizada la tarjeta con una categoría y varias subcategorías." title="Organización">
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Categoría principal</Text>
                  <View style={styles.scrollWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalScrollContent}>
                      {categoryOptions.map((category) => (
                        <SelectPill
                          key={category}
                          label={category}
                          onPress={() => {
                            setHabitCategory((currentCategory) => currentCategory === category ? '' : category);
                            markFieldTouched('category');
                          }}
                          selected={habitCategory === category}
                          style={getPillStyle(habitCategory === category)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Subcategorías</Text>
                  <View style={styles.scrollWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalScrollContent}>
                      {subcategoryOptions.map((subcategory) => (
                        <SelectPill
                          key={subcategory}
                          label={subcategory}
                          onPress={() => toggleSubcategory(subcategory)}
                          selected={habitSubcategories.includes(subcategory)}
                          style={getPillStyle(habitSubcategories.includes(subcategory))}
                        />
                      ))}
                    </ScrollView>
                  </View>
                  {getVisibleError('subcategories') ? <Text style={styles.errorText}>{getVisibleError('subcategories')}</Text> : null}
                </View>
              </FormSection>

              <FormSection description="Color e ícono se reflejan en la tarjeta después de guardar." title="Identidad visual">
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Color</Text>
                  <View style={styles.scrollWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalScrollContent}>
                      {colorOptions.map((color) => (
                        <Pressable
                          accessibilityLabel={`Color ${color}`}
                          accessibilityRole="button"
                          accessibilityState={{ selected: habitColor === color }}
                          key={color}
                          onPress={() => setHabitColor(color)}
                          style={({ pressed }) => [
                            styles.colorOption,
                            {
                              backgroundColor: color,
                              borderColor: habitColor === color ? (isDark ? '#FFFFFF' : '#000000') : 'transparent',
                            },
                            pressed && styles.pressed,
                          ]}
                        >
                          {habitColor === color ? <MaterialIcons color="#FFFFFF" name="check" size={18} /> : null}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Icono</Text>
                  <View style={styles.scrollWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalScrollContent}>
                      {iconOptions.map((iconOption) => (
                        <SelectPill
                          icon={iconOption.value}
                          key={iconOption.value}
                          label={iconOption.label}
                          onPress={() => setHabitIcon(iconOption.value)}
                          selected={habitIcon === iconOption.value}
                          style={getPillStyle(habitIcon === iconOption.value)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </FormSection>

              <FormSection description="Ajusta meta, recordatorio e imagen representativa." title="Apoyo diario">
                <TextInputField
                  autoCapitalize="sentences"
                  error={getVisibleError('target')}
                  helperText="Ejemplo: 10 páginas, 20 minutos, 2 litros."
                  icon="flag"
                  label="Meta opcional"
                  maxLength={120}
                  onBlur={() => markFieldTouched('target')}
                  onChangeText={setHabitTarget}
                  placeholder="20 minutos"
                  value={habitTarget}
                  containerStyle={[
                    styles.inputFieldContainer,
                    getVisibleError('target') ? { borderWidth: 1, borderColor: colors.dangerText } : null,
                  ]}
                />

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Recordatorio opcional</Text>
                  <Pressable
                    accessibilityLabel="Seleccionar hora de recordatorio"
                    accessibilityRole="button"
                    onPress={() => setShowTimePicker(true)}
                    style={({ pressed }) => [styles.timeButton, { backgroundColor: colors.surfaceMuted }, pressed && styles.pressed]}
                  >
                    <MaterialIcons color={colors.textSecondary} name="schedule" size={21} />
                    <Text style={styles.timeButtonText}>{habitReminderTime || 'Seleccionar hora'}</Text>
                  </Pressable>
                  {showTimePicker ? (
                    <View style={styles.timePickerBlock}>
                      <DateTimePicker
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        mode="time"
                        onChange={handleTimeChange}
                        value={dateFromTime(habitReminderTime || '08:00')}
                      />
                      {Platform.OS === 'ios' ? (
                        <SecondaryButton compact fullWidth={false} onPress={() => setShowTimePicker(false)} title="Listo" />
                      ) : null}
                    </View>
                  ) : null}
                  {habitReminderTime ? (
                    <View style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}>
                      <SecondaryButton compact fullWidth={false} icon="close" onPress={() => setHabitReminderTime('')} title="Quitar hora" />
                    </View>
                  ) : null}
                  {getVisibleError('reminderTime') ? <Text style={styles.errorText}>{getVisibleError('reminderTime')}</Text> : null}
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Imagen representativa</Text>
                  {previewImageUri ? <Image source={{ uri: previewImageUri }} style={styles.selectedImagePreview} /> : null}
                  {!previewImageUri ? (
                    <View style={[styles.imageFallback, { backgroundColor: `${habitColor}1A` }]}>
                      <MaterialIcons color={habitColor} name={habitIcon} size={28} />
                      <Text style={styles.helperText}>Sin imagen representativa.</Text>
                    </View>
                  ) : null}
                  <View style={styles.inlineActions}>
                    <SecondaryButton compact fullWidth={false} icon="image" onPress={handlePickImage} title={previewImageUri ? 'Cambiar imagen' : 'Seleccionar imagen'} />
                    {previewImageUri ? (
                      <SecondaryButton compact fullWidth={false} icon="delete-outline" onPress={() => { setSelectedImage(null); setShouldRemoveImage(true); }} title="Quitar" tone="danger" />
                    ) : null}
                  </View>
                  <Text style={styles.helperText}>JPG, PNG o WebP. Máximo 10 MB. La app no guarda URIs locales como imagen definitiva.</Text>
                </View>
              </FormSection>

              <Card style={styles.dangerSection}>
                <Text style={styles.sectionTitle}>Zona de riesgo</Text>
                <Text style={styles.sectionDescription}>Eliminar un hábito no borra tu cuenta, pero retira el hábito de las vistas principales.</Text>
                <DestructiveButton fullWidth={false} icon="delete-outline" loading={isDeleting} onPress={confirmDeleteHabit} title="Eliminar hábito" />
              </Card>
            </>
          ) : null}
        </ScrollView>

        {habit ? (
          <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.footerActions}>
              <PrimaryButton disabled={!canSubmit} icon="save" loading={isSubmitting} onPress={handleSaveHabitEdit} title={submitTitle} />
              <SecondaryButton disabled={isSubmitting} icon="close" onPress={() => router.back()} title="Cancelar" />
            </View>
          </View>
        ) : null}
      </ScreenContainer>
    </LinearGradient>
  );
}

function FormSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  return (
    <Card style={styles.formSection}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionDescription}>{description}</Text>
      </View>
      {children}
    </Card>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  containerContent: {
    flex: 1,
    gap: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  scrollContent: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '600',
  },
  previewCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  previewIcon: {
    alignItems: 'center',
    borderRadius: radius.xl,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  previewImage: {
    borderRadius: radius.xl,
    height: 70,
    width: 70,
  },
  previewCopy: {
    flex: 1,
    gap: 2,
  },
  previewEyebrow: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  previewTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.5,
    lineHeight: 27,
  },
  previewDescription: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  formSection: {
    gap: spacing.lg,
  },
  sectionCopy: {
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 19,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.6,
  },
  sectionDescription: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  fieldBlock: {
    gap: spacing.sm,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.heavy,
    letterSpacing: -0.3,
  },
  inputFieldContainer: {
    borderWidth: 0,
  },
  pillUnselectedOverride: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    borderWidth: 0,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.12 : 0.04,
    shadowRadius: 6,
  },
  pillSelectedOverride: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 0,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.22 : 0.1,
    shadowRadius: 8,
  },
  scrollWrapper: {
    marginHorizontal: -spacing.xl,
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  horizontalScrollContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  dayGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  dayButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 0,
    elevation: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.12 : 0.04,
    shadowRadius: 6,
  },
  dayButtonText: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  colorOption: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    elevation: 1,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 44,
  },
  helperText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: colors.dangerText,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.74,
    transform: [{ scale: 0.96 }],
  },
  timeButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 0,
    elevation: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.15 : 0.05,
    shadowRadius: 10,
  },
  timeButtonText: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 17,
    fontWeight: typography.weights.semibold,
  },
  timePickerBlock: {
    gap: spacing.sm,
  },
  selectedImagePreview: {
    alignSelf: 'stretch',
    borderRadius: radius.xl,
    height: 180,
  },
  imageFallback: {
    alignItems: 'center',
    borderRadius: radius.xl,
    gap: spacing.sm,
    minHeight: 120,
    justifyContent: 'center',
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dangerSection: {
    gap: spacing.md,
  },
  footerActions: {
    gap: spacing.sm,
  },
  stickyFooter: {
    backgroundColor: isDark ? 'rgba(8, 9, 12, 0.92)' : 'rgba(244, 248, 255, 0.92)',
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
});
