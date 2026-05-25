import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { type Href, useRouter } from 'expo-router';
import { ComponentProps, ReactNode, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionLoadingScreen } from '@/components/session-loading-screen';
import { AppHeader } from '@/components/ui/app-header';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import { Card } from '@/components/ui/card';
import { FeedbackMessage, SelectPill, TextInputField } from '@/components/ui/form';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/ui/screen-container';
import { gradients, radius, spacing, typography } from '@/components/ui/theme';
import { useTheme } from '@/components/ui/theme-context';
import { useAuth } from '@/features/account/auth-context';
import {
  createPhotoMetadata,
  createPhotoUploadUrl,
  uploadPhotoBlob,
  type PhotoMetadata,
} from '@/features/api/photo-service';
import {
  createHabit,
  CreateHabitError,
  createHabitErrorMessages,
  editHabit,
  formatHabitDays,
  type HabitRecord,
} from '@/features/habits/habit';
import { remoteHabitRepository } from '@/features/habits/remote-habit-repository';
import { expoNotificationScheduler } from '@/features/reminders/expo-notification-scheduler';
import { fileReminderRepository } from '@/features/reminders/local-reminder-repository';
import {
  ReminderError,
  reminderErrorMessages,
  saveHabitReminder,
  validateReminderTime,
} from '@/features/reminders/reminder';
import { syncRemoteReminder } from '@/features/reminders/remote-reminder-service';

type IconName = ComponentProps<typeof MaterialIcons>['name'];
type SubmitState = 'idle' | 'creating' | 'savingReminder' | 'uploadingImage' | 'attachingImage';
type ImageContentType = PhotoMetadata['contentType'];
type ImageExtension = 'jpg' | 'jpeg' | 'png' | 'webp';

type SelectedHabitImage = {
  contentType: ImageContentType;
  fileExtension: ImageExtension;
  sizeBytes?: number;
  uri: string;
};

type CreateHabitFormValues = {
  category: string;
  color: string;
  daysOfWeek: number[];
  frequency: string;
  icon: IconName;
  name: string;
  reminderTime: string;
  subcategories: string[];
  target: string;
};

type CreateHabitFormErrors = Partial<Record<keyof CreateHabitFormValues, string>>;

const allDays = [1, 2, 3, 4, 5, 6, 0];
const weekdayDays = [1, 2, 3, 4, 5];
const weekendDays = [6, 0];
const maxImageSizeBytes = 10_000_000;

const dayOptions = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'M', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 0 },
];
const categoryOptions = ['Salud', 'Ejercicio', 'Estudio', 'Productividad', 'Alimentación', 'Sueño', 'Personal'];
const subcategoryOptions = [
  'Cardio',
  'Fuerza',
  'Movilidad',
  'Mentalidad',
  'Lectura',
  'Hidratación',
  'Descanso',
  'Nutrición',
  'Enfoque',
  'Productividad',
  'Recuperación',
  'Técnica',
];
const colorOptions = [
  '#007AFF',
  '#34C759',
  '#FF9500',
  '#AF52DE',
  '#FF2D55',
  '#5AC8FA',
  '#30D5C8',
  '#2F4F9F',
  '#D96C8A',
  '#C47A1B',
];
const iconOptions: { label: string; value: IconName }[] = [
  { label: 'Meta', value: 'flag' },
  { label: 'Salud', value: 'favorite' },
  { label: 'Ejercicio', value: 'fitness-center' },
  { label: 'Estudio', value: 'menu-book' },
  { label: 'Sueño', value: 'bedtime' },
  { label: 'Agua', value: 'water-drop' },
  { label: 'Mejorar', value: 'trending-up' },
  { label: 'Dieta', value: 'restaurant' },
];

function getFrequencyFromDays(daysOfWeek: number[]): 'daily' | 'custom' {
  return daysOfWeek.length === 7 ? 'daily' : 'custom';
}

function sortDays(daysOfWeek: number[]): number[] {
  return dayOptions.map((dayOption) => dayOption.value).filter((day) => daysOfWeek.includes(day));
}

function dateFromTime(time: string): Date {
  const date = new Date();
  const [hour = 8, minute = 0] = time.split(':').map(Number);

  date.setHours(hour, minute, 0, 0);

  return date;
}

function formatTime(date: Date): string {
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');

  return `${hour}:${minute}`;
}

function getImageType(asset: ImagePicker.ImagePickerAsset): { contentType: ImageContentType; fileExtension: ImageExtension } | null {
  const mimeType = asset.mimeType?.toLowerCase();
  const uri = asset.uri.toLowerCase();

  if (mimeType === 'image/jpeg' || uri.endsWith('.jpg') || uri.endsWith('.jpeg')) {
    return { contentType: 'image/jpeg', fileExtension: uri.endsWith('.jpeg') ? 'jpeg' : 'jpg' };
  }

  if (mimeType === 'image/png' || uri.endsWith('.png')) {
    return { contentType: 'image/png', fileExtension: 'png' };
  }

  if (mimeType === 'image/webp' || uri.endsWith('.webp')) {
    return { contentType: 'image/webp', fileExtension: 'webp' };
  }

  return null;
}

function validateCreateHabitForm(values: CreateHabitFormValues): CreateHabitFormErrors {
  const errors: CreateHabitFormErrors = {};
  const normalizedName = values.name.trim();
  const normalizedCategory = values.category.trim();
  const normalizedTarget = values.target.trim();

  if (!normalizedName) {
    errors.name = createHabitErrorMessages.NAME_REQUIRED;
  } else if (normalizedName.length < 2) {
    errors.name = createHabitErrorMessages.NAME_TOO_SHORT;
  } else if (normalizedName.length > 60) {
    errors.name = createHabitErrorMessages.NAME_TOO_LONG;
  }

  if (!values.daysOfWeek.length) {
    errors.daysOfWeek = 'Selecciona al menos un día de la semana.';
  }

  if (values.frequency !== 'daily' && values.frequency !== 'custom') {
    errors.frequency = createHabitErrorMessages.FREQUENCY_REQUIRED;
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

function hasErrors(errors: CreateHabitFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

async function uploadHabitImage(habitId: string, selectedImage: SelectedHabitImage): Promise<string> {
  const upload = await createPhotoUploadUrl({
    contentType: selectedImage.contentType,
    fileExtension: selectedImage.fileExtension,
    habitId,
  });
  const uploadedSizeBytes = await uploadPhotoBlob({
    contentType: selectedImage.contentType,
    uploadUrl: upload.uploadUrl,
    uri: selectedImage.uri,
  });
  const sizeBytes = selectedImage.sizeBytes && selectedImage.sizeBytes > 0 ? selectedImage.sizeBytes : uploadedSizeBytes;

  await createPhotoMetadata({
    blobPath: upload.blobPath,
    contentType: selectedImage.contentType,
    habitId,
    photoId: upload.photoId,
    sizeBytes,
  });

  return upload.photoId;
}

export default function CreateHabitScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const insets = useSafeAreaInsets();
  
  const [showInfo, setShowInfo] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('');
  const [habitSubcategories, setHabitSubcategories] = useState<string[]>([]);
  const [habitTarget, setHabitTarget] = useState('');
  const [habitReminderTime, setHabitReminderTime] = useState('');
  const [habitDaysOfWeek, setHabitDaysOfWeek] = useState<number[]>(allDays);
  const [habitColor, setHabitColor] = useState(colorOptions[0]);
  const [habitIcon, setHabitIcon] = useState<IconName>('flag');
  const [selectedImage, setSelectedImage] = useState<SelectedHabitImage | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof CreateHabitFormValues, boolean>>>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const habitFrequency = getFrequencyFromDays(habitDaysOfWeek);
  const formValues: CreateHabitFormValues = {
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
  const validationErrors = validateCreateHabitForm(formValues);
  const isSubmitting = submitState !== 'idle';
  const canSubmit = !isSubmitting && !hasErrors(validationErrors);
  const submitTitle = submitState === 'savingReminder'
    ? 'Guardando recordatorio...'
    : submitState === 'uploadingImage'
      ? 'Subiendo imagen...'
      : submitState === 'attachingImage'
        ? 'Asociando imagen...'
        : submitState === 'creating'
          ? 'Creando hábito...'
          : 'Crear hábito';

  function getVisibleError(field: keyof CreateHabitFormValues): string | undefined {
    return wasSubmitted || touchedFields[field] ? validationErrors[field] : undefined;
  }

  function markFieldTouched(field: keyof CreateHabitFormValues) {
    setTouchedFields((currentTouchedFields) => ({ ...currentTouchedFields, [field]: true }));
  }

  function navigateToHabits() {
    router.replace('/(app)/(tabs)/habits' as Href);
  }

  function setQuickDays(daysOfWeek: number[]) {
    setHabitDaysOfWeek(sortDays(daysOfWeek));
    markFieldTouched('daysOfWeek');
  }

  function toggleDay(day: number) {
    setHabitDaysOfWeek((currentDays) => {
      const nextDays = currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day];

      return sortDays(nextDays);
    });
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.82,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const imageType = getImageType(asset);

    if (!imageType) {
      setMessage('Selecciona una imagen JPG, PNG o WebP.');
      return;
    }

    if (asset.fileSize && asset.fileSize > maxImageSizeBytes) {
      setMessage('La imagen no puede superar 10 MB.');
      return;
    }

    setSelectedImage({
      contentType: imageType.contentType,
      fileExtension: imageType.fileExtension,
      sizeBytes: asset.fileSize,
      uri: asset.uri,
    });
  }

  function getReminderMessage(error: unknown): string {
    if (error instanceof ReminderError) {
      return reminderErrorMessages[error.code];
    }

    return reminderErrorMessages.REMINDER_SAVE_UNAVAILABLE;
  }

  async function saveReminderIfNeeded(habit: HabitRecord): Promise<string | null> {
    if (!habitReminderTime.trim() || !user) {
      return null;
    }

    setSubmitState('savingReminder');

    try {
      const reminder = await saveHabitReminder(
        {
          accountId: user.accountId,
          habitId: habit.id,
          habitName: habit.name,
          time: habitReminderTime,
        },
        fileReminderRepository,
        expoNotificationScheduler,
      );

      await syncRemoteReminder({
        daysOfWeek: habitDaysOfWeek,
        habitId: habit.id,
        habitName: habit.name,
        time: reminder.time,
      });
      await editHabit(habit, { reminderTime: reminder.time }, remoteHabitRepository);

      return null;
    } catch (error) {
      return `El hábito se creó, pero no se pudo crear el recordatorio. ${getReminderMessage(error)}`;
    }
  }

  async function uploadImageIfNeeded(habit: HabitRecord): Promise<string | null> {
    if (!selectedImage) {
      return null;
    }

    try {
      setSubmitState('uploadingImage');
      const photoId = await uploadHabitImage(habit.id, selectedImage);

      setSubmitState('attachingImage');
      await editHabit(habit, { coverPhotoId: photoId }, remoteHabitRepository);

      return null;
    } catch {
      return 'El hábito se creó, pero no se pudo subir la imagen.';
    }
  }

  async function handleCreateHabit() {
    if (!user || isSubmitting) {
      return;
    }

    setWasSubmitted(true);
    setMessage(null);
    setIsSuccess(false);

    if (hasErrors(validationErrors)) {
      setMessage('Revisa los campos marcados antes de crear el hábito.');
      return;
    }

    setSubmitState('creating');

    try {
      const habit = await createHabit(
        {
          accountId: user.accountId,
          category: habitCategory,
          color: habitColor,
          daysOfWeek: habitDaysOfWeek,
          frequency: habitFrequency,
          icon: habitIcon,
          name: habitName,
          reminderTime: '',
          subcategories: habitSubcategories,
          target: habitTarget,
        },
        remoteHabitRepository,
      );
      const warnings = [await saveReminderIfNeeded(habit), await uploadImageIfNeeded(habit)].filter(Boolean);

      setIsSuccess(true);

      if (warnings.length) {
        Alert.alert('Hábito creado', warnings.join('\n'), [{ onPress: navigateToHabits, text: 'Ver hábitos' }]);
      } else {
        navigateToHabits();
      }
    } catch (error) {
      setIsSuccess(false);

      if (error instanceof CreateHabitError) {
        setMessage(createHabitErrorMessages[error.code]);
      } else {
        setMessage(createHabitErrorMessages.HABIT_CREATION_UNAVAILABLE);
      }
    } finally {
      setSubmitState('idle');
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
            onBack={navigateToHabits}
            title="Crear hábito"
            rightElement={
              <Pressable
                accessibilityLabel={showInfo ? 'Ocultar guía de ayuda' : 'Mostrar guía de ayuda'}
                accessibilityRole="button"
                onPress={() => setShowInfo(!showInfo)}
                style={({ pressed }) => [
                  styles.infoButton,
                  pressed && styles.pressed,
                ]}
                hitSlop={12}
              >
                <MaterialIcons
                  color={showInfo ? colors.primary : colors.textSecondary}
                  name="info-outline"
                  size={24}
                />
              </Pressable>
            }
          />

          {showInfo && (
            <Card style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                Define cuándo quieres cumplirlo, cómo se verá y si tendrá recordatorio o imagen.
              </Text>
            </Card>
          )}

          <Card style={styles.previewCard}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            ) : (
              <View style={[styles.previewIcon, { backgroundColor: `${habitColor}24` }]}>
                <MaterialIcons color={habitColor} name={habitIcon} size={26} />
              </View>
            )}
            <View style={styles.previewCopy}>
              <Text style={styles.previewEyebrow}>Vista previa</Text>
              <Text numberOfLines={2} style={styles.previewTitle}>
                {habitName.trim() || 'Tu nuevo hábito'}
              </Text>
              <Text style={styles.previewDescription}>
                {formatHabitDays(habitDaysOfWeek)}{habitCategory ? ` · ${habitCategory}` : ''}
              </Text>
            </View>
          </Card>

          <FormSection
            description="El nombre y los días son necesarios para crear el hábito."
            title="Datos principales"
          >
            <TextInputField
              autoCapitalize="sentences"
              error={getVisibleError('name')}
              helperText="Usa entre 2 y 60 caracteres."
              icon="edit-note"
              label="Nombre"
              maxLength={60}
              onBlur={() => markFieldTouched('name')}
              onChangeText={setHabitName}
              placeholder="Leer 10 páginas"
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  <SelectPill
                    icon="today"
                    label="Todos"
                    onPress={() => setQuickDays(allDays)}
                    selected={habitDaysOfWeek.length === 7}
                    style={getPillStyle(habitDaysOfWeek.length === 7)}
                  />
                  <SelectPill
                    label="Entre semana"
                    onPress={() => setQuickDays(weekdayDays)}
                    selected={formatHabitDays(habitDaysOfWeek) === 'Entre semana'}
                    style={getPillStyle(formatHabitDays(habitDaysOfWeek) === 'Entre semana')}
                  />
                  <SelectPill
                    label="Fines"
                    onPress={() => setQuickDays(weekendDays)}
                    selected={formatHabitDays(habitDaysOfWeek) === 'Fines de semana'}
                    style={getPillStyle(formatHabitDays(habitDaysOfWeek) === 'Fines de semana')}
                  />
                </ScrollView>
              </View>
              <View style={styles.dayGrid}>
                {dayOptions.map((dayOption) => (
                  <Pressable
                    accessibilityLabel={dayOption.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: habitDaysOfWeek.includes(dayOption.value) }}
                    key={dayOption.value}
                    onPress={() => toggleDay(dayOption.value)}
                    style={({ pressed }) => [
                      styles.dayButton,
                      { backgroundColor: colors.surfaceMuted },
                      habitDaysOfWeek.includes(dayOption.value) && {
                        backgroundColor: colors.primary,
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isDark ? 0.22 : 0.1,
                        shadowRadius: 8,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      { color: colors.textPrimary },
                      habitDaysOfWeek.includes(dayOption.value) && { color: colors.primaryText }
                    ]}>
                      {dayOption.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {getVisibleError('daysOfWeek') ? <Text style={styles.errorText}>{getVisibleError('daysOfWeek')}</Text> : null}
              <Text style={styles.helperText}>{formatHabitDays(habitDaysOfWeek)}</Text>
            </View>
          </FormSection>

          <FormSection
            description="Elige una categoría principal y subcategorías opcionales."
            title="Organización"
          >
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Categoría principal</Text>
              <View style={styles.scrollWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {categoryOptions.map((category) => (
                    <SelectPill
                      key={category}
                      label={category}
                      onPress={() => setHabitCategory((currentCategory) => currentCategory === category ? '' : category)}
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
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

          <FormSection description="Color e ícono aparecen en la tarjeta del hábito." title="Identidad visual">
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Color</Text>
              <View style={styles.scrollWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
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

          <FormSection
            description="Agrega una meta, un recordatorio y una imagen si quieres reforzar la constancia."
            title="Apoyo diario"
          >
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
                style={({ pressed }) => [
                  styles.timeButton,
                  { backgroundColor: colors.surfaceMuted },
                  pressed && styles.pressed,
                ]}
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
              {selectedImage ? <Image source={{ uri: selectedImage.uri }} style={styles.selectedImagePreview} /> : null}
              <View style={styles.inlineActions}>
                <SecondaryButton
                  compact
                  fullWidth={false}
                  icon="image"
                  onPress={handlePickImage}
                  title={selectedImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
                />
                {selectedImage ? (
                  <SecondaryButton compact fullWidth={false} icon="delete-outline" onPress={() => setSelectedImage(null)} title="Quitar" tone="danger" />
                ) : null}
              </View>
              <Text style={styles.helperText}>JPG, PNG o WebP. Máximo 10 MB.</Text>
            </View>
          </FormSection>
        </ScrollView>

        <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {message ? <FeedbackMessage message={message} type={isSuccess ? 'success' : 'error'} /> : null}
          <View style={styles.footerActions}>
            <PrimaryButton
              accessibilityLabel="Crear hábito"
              disabled={!canSubmit}
              icon="save"
              loading={isSubmitting}
              onPress={handleCreateHabit}
              title={submitTitle}
            />
            <SecondaryButton
              accessibilityLabel="Cancelar creación de hábito"
              disabled={isSubmitting}
              icon="close"
              onPress={navigateToHabits}
              title="Cancelar"
            />
          </View>
        </View>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl + spacing.xl,
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
  infoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  infoBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    borderWidth: 0,
    padding: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.12 : 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  infoBoxText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
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
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pillUnselectedOverride: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 0,
    borderRadius: radius.pill,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.12 : 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  pillSelectedOverride: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    borderRadius: radius.pill,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.22 : 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  scrollWrapper: {
    marginHorizontal: -spacing.xl,
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  horizontalScrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
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
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.12 : 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  dayButtonText: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.semibold,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorOption: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 44,
    justifyContent: 'center',
    width: 44,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
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
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.15 : 0.05,
    shadowRadius: 10,
    elevation: 2,
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
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footerActions: {
    gap: spacing.sm,
  },
  stickyFooter: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: isDark ? 'rgba(8, 9, 12, 0.92)' : 'rgba(244, 248, 255, 0.92)',
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
  },
});
