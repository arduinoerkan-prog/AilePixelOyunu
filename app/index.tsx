import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Screen = 'menu' | 'levels' | 'game' | 'result';
type Character = 0 | 1 | 2;
type GameAction = 'left' | 'right' | 'jump' | 'interact' | 'collect' | 'team';

type Task = {
  title: string;
  description: string;
  requiredCharacter: Character | 3;
  icon: keyof typeof Ionicons.glyphMap;
};

type Level = {
  id: number;
  name: string;
  location: string;
  description: string;
  accent: string;
  sky: string;
  ground: string;
  icon: keyof typeof Ionicons.glyphMap;
  obstacle: string;
  collectible: string;
  tasks: Task[];
};

const STORAGE_KEY = 'piknik-kahramanlari-progress';
const referenceHero = require('../assets/images/reference-hero.jpeg');

const levels: Level[] = [
  {
    id: 1,
    name: 'Orman Yolu',
    location: 'Çamlık patika',
    description: 'Aile, ağaçların arasından güvenli bir piknik yeri arıyor.',
    accent: '#4f9b63',
    sky: '#9bd4e8',
    ground: '#315f3d',
    icon: 'leaf',
    obstacle: 'Uyuyan kirpi',
    collectible: 'Termos',
    tasks: [
      { title: 'Patikayı kontrol et', description: 'Anne yüksekten bakıp kirpinin yanından geçsin.', requiredCharacter: 0, icon: 'eye' },
      { title: 'Kirpiyi uyandırma', description: 'Sessizce ilerleyerek engeli aşın.', requiredCharacter: 0, icon: 'footsteps' },
    ],
  },
  {
    id: 2,
    name: 'Nehir Kıyısı',
    location: 'Serin dere',
    description: 'Köprü sallanıyor; baba ağır kütüğü yerine oturtmalı.',
    accent: '#3c96a8',
    sky: '#86cde3',
    ground: '#39705e',
    icon: 'water',
    obstacle: 'Kurbağa korosu',
    collectible: 'Sandviç',
    tasks: [
      { title: 'Köprüyü onar', description: 'Baba kütüğü iterek geçişi sağlamlaştırır.', requiredCharacter: 1, icon: 'construct' },
      { title: 'Suyu geç', description: 'Aile köprüden birlikte ilerlesin.', requiredCharacter: 1, icon: 'walk' },
    ],
  },
  {
    id: 3,
    name: 'Tepe Yolu',
    location: 'Rüzgârlı tepe',
    description: 'Yol yükseliyor; hızlı kız çocuğu dar kayaların arasından geçebilir.',
    accent: '#d48d45',
    sky: '#f3c37d',
    ground: '#7c5938',
    icon: 'sunny',
    obstacle: 'Meraklı sincap',
    collectible: 'Çilek',
    tasks: [
      { title: 'Kayaları aş', description: 'Kız çocuğu dar geçitten hızla sıçrasın.', requiredCharacter: 2, icon: 'flash' },
      { title: 'Tepe bayrağına ulaş', description: 'Son sıçrayışla tepenin öteki tarafına geçin.', requiredCharacter: 2, icon: 'flag' },
    ],
  },
  {
    id: 4,
    name: 'Mağara Geçidi',
    location: 'Kaya tüneli',
    description: 'Karanlık geçitte anahtarı bulup yarasaları ürkütmeden ilerleyin.',
    accent: '#695b91',
    sky: '#8aa4b3',
    ground: '#3b394c',
    icon: 'moon',
    obstacle: 'Uçuşan yarasalar',
    collectible: 'Mağara anahtarı',
    tasks: [
      { title: 'Karanlığı aydınlat', description: 'Anne feneriyle güvenli yolu göstersin.', requiredCharacter: 0, icon: 'bulb' },
      { title: 'Anahtarı bul', description: 'Baba taş kapıyı açacak anahtarı toplasın.', requiredCharacter: 1, icon: 'key' },
    ],
  },
  {
    id: 5,
    name: 'Ada Finali',
    location: 'Denizin ortasındaki ada',
    description: 'Aile sonunda manzaralı yeri buldu. Fakat Ismail pikniği bölüyor.',
    accent: '#d95a43',
    sky: '#6fc4df',
    ground: '#34745f',
    icon: 'flag',
    obstacle: 'Ismail',
    collectible: 'Piknik sepeti',
    tasks: [
      { title: 'Piknik örtüsünü ser', description: 'Aile, Ismail’in sesine aldırmadan hazırlığa başlasın.', requiredCharacter: 3, icon: 'grid' },
      { title: 'Ismail’i uzaklaştır', description: 'Üçü birlikte konuşup piknik alanını korusun.', requiredCharacter: 3, icon: 'people' },
    ],
  },
];

const characters: Array<{
  id: Character;
  name: string;
  role: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
}> = [
  { id: 0, name: 'Anne', role: 'Yüksek zıplar', icon: 'woman', tint: '#d85f55' },
  { id: 1, name: 'Baba', role: 'Ağır nesneleri iter', icon: 'man', tint: '#e0a43a' },
  { id: 2, name: 'Kız', role: 'Hızlı hareket eder', icon: 'happy', tint: '#62a2d7' },
];

function pressFeedback(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  void Haptics.impactAsync(style);
}

function ActionButton({
  icon,
  label,
  onPress,
  tone = 'secondary',
  disabled = false,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'secondary' | 'danger' | 'quiet';
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        pressFeedback();
        onPress();
      }}
      testID={testID}
      style={({ pressed }) => [
        styles.actionButton,
        tone === 'primary' && styles.actionPrimary,
        tone === 'danger' && styles.actionDanger,
        tone === 'quiet' && styles.actionQuiet,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={tone === 'primary' ? COLORS.light.primaryForeground : COLORS.light.foreground} />
      <Text style={[styles.actionLabel, tone === 'primary' && styles.actionPrimaryLabel]}>{label}</Text>
    </Pressable>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandIcon}>
        <Ionicons name="basket" size={compact ? 18 : 24} color={COLORS.light.primaryForeground} />
      </View>
      <View>
        <Text style={[styles.brandTitle, compact && styles.brandTitleSmall]}>PİKNİK</Text>
        <Text style={[styles.brandSubtitle, compact && styles.brandSubtitleSmall]}>KAHRAMANLARI</Text>
      </View>
    </View>
  );
}

function ProgressPips({ count, total }: { count: number; total: number }) {
  return (
    <View style={styles.pips}>
      {Array.from({ length: total }).map((_, index) => (
        <View key={index} style={[styles.pip, index < count && styles.pipActive]} />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [screen, setScreen] = useState<Screen>('menu');
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [activeCharacter, setActiveCharacter] = useState<Character>(0);
  const [worldProgress, setWorldProgress] = useState(12);
  const [currentTask, setCurrentTask] = useState(0);
  const [collected, setCollected] = useState(0);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [message, setMessage] = useState('Aile birlikte daha güçlü.');
  const [lastResult, setLastResult] = useState({ level: 1, score: 0 });

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!value) return;
      try {
        const parsed = JSON.parse(value) as { completedLevels?: number[] };
        if (Array.isArray(parsed.completedLevels)) {
          setCompletedLevels(parsed.completedLevels);
        }
      } catch {
        setCompletedLevels([]);
      }
    });
  }, []);

  const unlockedLevel = useMemo(() => Math.min(5, Math.max(1, completedLevels.length + 1)), [completedLevels]);
  const activeTask = activeLevel?.tasks[currentTask];
  const taskReady = Boolean(activeLevel && currentTask >= activeLevel.tasks.length && worldProgress >= 88);
  const boardWidth = Math.min(width - 32, 520);

  const saveLevel = (levelId: number, finalScore: number) => {
    const nextCompleted = Array.from(new Set([...completedLevels, levelId])).sort((a, b) => a - b);
    setCompletedLevels(nextCompleted);
    setLastResult({ level: levelId, score: finalScore });
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ completedLevels: nextCompleted }));
  };

  const startLevel = (levelId: number) => {
    const nextLevel = levels.find((level) => level.id === levelId);
    if (!nextLevel || levelId > unlockedLevel) return;
    setActiveLevel(nextLevel);
    setSelectedLevel(levelId);
    setActiveCharacter(0);
    setWorldProgress(12);
    setCurrentTask(0);
    setCollected(0);
    setScore(0);
    setHearts(3);
    setMessage(nextLevel.description);
    setScreen('game');
    pressFeedback(Haptics.ImpactFeedbackStyle.Medium);
  };

  const completeCurrentLevel = () => {
    if (!activeLevel || !taskReady) return;
    const finalScore = score + collected * 100 + 500;
    saveLevel(activeLevel.id, finalScore);
    setLastResult({ level: activeLevel.id, score: finalScore });
    setScreen('result');
    pressFeedback(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleGameAction = (action: GameAction) => {
    if (!activeLevel) return;
    if (action === 'left') {
      setWorldProgress((value) => Math.max(0, value - 6));
      setMessage('Aile biraz geri döndü.');
      return;
    }
    if (action === 'right') {
      setWorldProgress((value) => Math.min(100, value + 12));
      setMessage(worldProgress >= 88 ? 'Piknik alanı göründü!' : 'Patikada ilerliyorsunuz.');
      setScore((value) => value + 10);
      return;
    }
    if (action === 'jump') {
      setWorldProgress((value) => Math.min(100, value + 8));
      setScore((value) => value + 25);
      setMessage(activeCharacter === 0 ? 'Anne yüksekten atladı.' : activeCharacter === 1 ? 'Baba sağlam bir adım attı.' : 'Kız çocuğu hızla sıçradı.');
      return;
    }
    if (action === 'collect') {
      if (collected >= 3) {
        setMessage('Bu bölümdeki bütün eşyalar toplandı.');
        return;
      }
      setCollected((value) => value + 1);
      setScore((value) => value + 100);
      setMessage(`${activeLevel.collectible} toplandı. Piknik hazırlığı tamamlanıyor.`);
      pressFeedback(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    if (action === 'team') {
      if (activeLevel.id !== 5) return;
      if (worldProgress < 60) {
        setMessage('Önce adanın ortasına kadar ilerleyin.');
        return;
      }
      if (currentTask < activeLevel.tasks.length) {
        setCurrentTask((value) => value + 1);
        setScore((value) => value + 300);
        setMessage('Aile omuz omuza durdu. Ismail piknik alanından uzaklaşıyor.');
      }
      return;
    }
    if (currentTask >= activeLevel.tasks.length) {
      setMessage('Görev tamamlandı. Piknik alanına doğru ilerleyin.');
      return;
    }
    if (activeTask?.requiredCharacter === 3) {
      setMessage('Bu görev için takım çalışması düğmesine basın.');
      return;
    }
    if (activeTask && activeTask.requiredCharacter !== activeCharacter) {
      setHearts((value) => Math.max(1, value - 1));
      setMessage(`${characters[activeTask.requiredCharacter].name} bu görev için daha uygun.`);
      pressFeedback(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    setCurrentTask((value) => value + 1);
    setScore((value) => value + 250);
    setMessage(`${activeTask?.title} tamamlandı. Yol açıldı.`);
    pressFeedback(Haptics.ImpactFeedbackStyle.Medium);
  };

  const renderMenu = () => (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.menuHeader}>
        <BrandMark />
        <View style={styles.recordBadge}>
          <Ionicons name="star" size={15} color={COLORS.light.primary} />
          <Text style={styles.recordText}>{completedLevels.length}/5</Text>
        </View>
      </View>
      <View style={[styles.heroCard, { width: boardWidth }]}>
        <Image source={referenceHero} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(16,43,47,0.94)']} style={styles.heroOverlay} />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>AİLE GÜCÜ</Text>
          <Text style={styles.heroTitle}>Her engel aşılır.</Text>
          <Text style={styles.heroDescription}>Ailece yola çıkın, beş farklı yerde huzurlu piknik için mücadele edin.</Text>
        </View>
      </View>
      <View style={styles.menuIntro}>
        <Text style={styles.sectionKicker}>MACERA GÜNLÜĞÜ</Text>
        <Text style={styles.pageTitle}>Piknik zamanı</Text>
        <Text style={styles.pageDescription}>Karakter değiştir, eşyaları topla ve ailenin birlikte hareket etmesini sağla.</Text>
      </View>
      <ActionButton icon="play" label="Maceraya başla" tone="primary" onPress={() => setScreen('levels')} testID="start-game" />
      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <Ionicons name="map" size={20} color={COLORS.light.primary} />
          <Text style={styles.quickStatNumber}>5</Text>
          <Text style={styles.quickStatLabel}>bölüm</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStat}>
          <Ionicons name="people" size={20} color={COLORS.light.primary} />
          <Text style={styles.quickStatNumber}>3</Text>
          <Text style={styles.quickStatLabel}>kahraman</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStat}>
          <Ionicons name="basket" size={20} color={COLORS.light.primary} />
          <Text style={styles.quickStatNumber}>15</Text>
          <Text style={styles.quickStatLabel}>eşya</Text>
        </View>
      </View>
      <View style={styles.tipCard}>
        <Ionicons name="bulb" size={21} color={COLORS.light.primary} />
        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>İpucu</Text>
          <Text style={styles.tipText}>Her aile bireyinin farklı bir yeteneği var. Engelin yanına gelince doğru karakteri seç.</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderLevels = () => (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.screenHeader}>
        <Pressable accessibilityLabel="Ana menüye dön" onPress={() => setScreen('menu')} style={styles.iconCircle}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <BrandMark compact />
        <View style={styles.headerSpacer} />
      </View>
      <Text style={styles.sectionKicker}>BÖLÜM DÜNYASI</Text>
      <Text style={styles.pageTitle}>Nereye gidelim?</Text>
      <Text style={styles.pageDescription}>Birlikte hareket ederek yeni piknik alanlarının kilidini açın.</Text>
      <View style={styles.levelList}>
        {levels.map((level) => {
          const isLocked = level.id > unlockedLevel;
          const isCompleted = completedLevels.includes(level.id);
          return (
            <Pressable
              accessibilityLabel={`${level.id}. bölüm ${level.name}`}
              accessibilityRole="button"
              disabled={isLocked}
              key={level.id}
              onPress={() => startLevel(level.id)}
              style={({ pressed }) => [styles.levelCard, isLocked && styles.levelLocked, pressed && styles.pressed]}
            >
              <View style={[styles.levelArtwork, { backgroundColor: level.sky }]}>
                <Ionicons name={level.icon} size={34} color={level.ground} />
                <View style={[styles.artworkGround, { backgroundColor: level.ground }]} />
                <View style={styles.artworkSun} />
              </View>
              <View style={styles.levelCardCopy}>
                <View style={styles.levelTitleRow}>
                  <Text style={styles.levelNumber}>0{level.id}</Text>
                  <Text style={styles.levelName}>{level.name}</Text>
                  {isCompleted && <Ionicons name="checkmark-circle" size={19} color={COLORS.light.primary} />}
                  {isLocked && <Ionicons name="lock-closed" size={17} color={COLORS.light.mutedForeground} />}
                </View>
                <Text style={styles.levelLocation}>{level.location}</Text>
                <Text numberOfLines={2} style={styles.levelDescription}>{level.description}</Text>
                <View style={styles.levelMeta}>
                  <View style={styles.metaItem}><Ionicons name="alert-circle" size={14} color={level.accent as never} /><Text style={styles.metaText}>{level.obstacle}</Text></View>
                  <View style={styles.metaItem}><Ionicons name="basket" size={14} color={COLORS.light.primary} /><Text style={styles.metaText}>{level.collectible}</Text></View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.familyCallout}>
        <Ionicons name="people" size={23} color={COLORS.light.primary} />
        <Text style={styles.familyCalloutText}>İlk dört bölümde hayvanlar, finalde ise Ismail pikniği bölmeye çalışıyor.</Text>
      </View>
    </ScrollView>
  );

  const renderWorld = () => {
    if (!activeLevel) return null;
    return (
      <View style={[styles.world, { backgroundColor: activeLevel.sky, width: boardWidth }]}>
        <View style={styles.worldCloudOne}><Ionicons name="cloud" size={44} color="rgba(255,255,255,0.72)" /></View>
        <View style={styles.worldCloudTwo}><Ionicons name="cloud" size={30} color="rgba(255,255,255,0.56)" /></View>
        <View style={styles.worldSun}><Ionicons name="sunny" size={30} color={COLORS.light.primary} /></View>
        <View style={styles.worldTreeOne}><Ionicons name="leaf" size={82} color={activeLevel.ground} /></View>
        <View style={styles.worldTreeTwo}><Ionicons name="leaf" size={58} color={activeLevel.accent} /></View>
        <View style={styles.worldObstacle}>
          <View style={[styles.obstacleBadge, { backgroundColor: activeLevel.accent }]}>
            <Ionicons name={activeLevel.id === 5 ? 'person' : activeLevel.icon} size={24} color={COLORS.light.foreground} />
          </View>
          <Text style={styles.obstacleName}>{activeLevel.obstacle}</Text>
        </View>
        <View style={styles.worldCharacter}>
          <View style={[styles.characterBubble, { backgroundColor: characters[activeCharacter].tint }]}>
            <Ionicons name={characters[activeCharacter].icon} size={29} color={COLORS.light.foreground} />
          </View>
          <Text style={styles.worldCharacterName}>{characters[activeCharacter].name}</Text>
        </View>
        <View style={[styles.worldPath, { backgroundColor: activeLevel.ground }]} />
        <View style={styles.worldFlowers}><Ionicons name="flower" size={25} color={COLORS.light.primary} /></View>
        <View style={styles.worldFinish}><Ionicons name="flag" size={26} color={COLORS.light.accent} /></View>
      </View>
    );
  };

  const renderGame = () => {
    if (!activeLevel) return null;
    return (
      <View style={[styles.gameScreen, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.gameTopbar}>
          <Pressable accessibilityLabel="Bölümler ekranına dön" onPress={() => setScreen('levels')} style={styles.iconCircle}>
            <Ionicons name="close" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.gameTitle}>
            <Text style={styles.gameLevelLabel}>BÖLÜM {activeLevel.id}/5</Text>
            <Text style={styles.gameLevelName}>{activeLevel.name}</Text>
          </View>
          <View style={styles.gameScore}>
            <Ionicons name="star" size={15} color={COLORS.light.primary} />
            <Text style={styles.gameScoreText}>{String(score).padStart(5, '0')}</Text>
          </View>
        </View>
        <View style={styles.gameStatus}>
          <View style={styles.healthRow}>
            {[0, 1, 2].map((heart) => <Ionicons key={heart} name="heart" size={18} color={heart < hearts ? COLORS.light.accent : COLORS.light.muted} />)}
          </View>
          <View style={styles.progressWrap}>
            <Text style={styles.progressLabel}>PİKNİK ALANI</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${worldProgress}%` }]} /></View>
          </View>
          <View style={styles.itemCount}><Ionicons name="basket" size={17} color={COLORS.light.primary} /><Text style={styles.itemCountText}>{collected}/3</Text></View>
        </View>
        {renderWorld()}
        <View style={styles.messageBox}>
          <Ionicons name={activeLevel.id === 5 ? 'people' : 'chatbubble-ellipses'} size={18} color={COLORS.light.primary} />
          <Text style={styles.messageText}>{message}</Text>
        </View>
        <View style={styles.taskBox}>
          <View style={styles.taskHeader}>
            <View style={styles.taskHeaderTitle}><Ionicons name="flag" size={17} color={COLORS.light.primary} /><Text style={styles.taskLabel}>AKTİF GÖREV</Text></View>
            <ProgressPips count={currentTask} total={activeLevel.tasks.length} />
          </View>
          {activeTask ? (
            <View style={styles.taskContent}>
              <View style={styles.taskIcon}><Ionicons name={activeTask.icon} size={21} color={COLORS.light.primaryForeground} /></View>
              <View style={styles.taskCopy}><Text style={styles.taskTitle}>{activeTask.title}</Text><Text style={styles.taskDescription}>{activeTask.description}</Text></View>
            </View>
          ) : (
            <View style={styles.taskContent}><View style={[styles.taskIcon, styles.taskDoneIcon]}><Ionicons name="checkmark" size={21} color={COLORS.light.primaryForeground} /></View><View style={styles.taskCopy}><Text style={styles.taskTitle}>Bütün görevler tamamlandı</Text><Text style={styles.taskDescription}>Artık sonuna kadar ilerleyip piknik alanına ulaş.</Text></View></View>
          )}
        </View>
        <View style={styles.characterSwitcher}>
          <Text style={styles.controlLabel}>KARAKTER DEĞİŞTİR</Text>
          <View style={styles.characterRow}>
            {characters.map((character) => (
              <Pressable
                accessibilityLabel={`${character.name} karakterini seç`}
                accessibilityRole="button"
                key={character.id}
                onPress={() => { pressFeedback(); setActiveCharacter(character.id); setMessage(`${character.name} öne geçti: ${character.role}.`); }}
                style={[styles.characterOption, activeCharacter === character.id && styles.characterSelected]}
              >
                <View style={[styles.miniCharacter, { backgroundColor: character.tint }]}><Ionicons name={character.icon} size={20} color={COLORS.light.foreground} /></View>
                <Text style={[styles.characterOptionName, activeCharacter === character.id && styles.characterSelectedText]}>{character.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.controls}>
          <View style={styles.directionControls}>
            <Pressable accessibilityLabel="Sola git" onPress={() => handleGameAction('left')} style={styles.controlCircle}><Ionicons name="arrow-back" size={22} color={colors.foreground} /></Pressable>
            <Pressable accessibilityLabel="Zıpla" onPress={() => handleGameAction('jump')} style={[styles.controlCircle, styles.jumpControl]}><Ionicons name="arrow-up" size={24} color={COLORS.light.primaryForeground} /></Pressable>
            <Pressable accessibilityLabel="Sağa git" onPress={() => handleGameAction('right')} style={styles.controlCircle}><Ionicons name="arrow-forward" size={22} color={colors.foreground} /></Pressable>
          </View>
          <View style={styles.actionControls}>
            <Pressable accessibilityLabel="Eşya topla" onPress={() => handleGameAction('collect')} style={styles.smallControl}><Ionicons name="basket" size={19} color={COLORS.light.primary} /><Text style={styles.smallControlText}>Topla</Text></Pressable>
            {activeLevel.id === 5 ? (
              <Pressable accessibilityLabel="Takım çalışması yap" onPress={() => handleGameAction('team')} style={[styles.smallControl, styles.teamControl]}><Ionicons name="people" size={19} color={COLORS.light.primaryForeground} /><Text style={styles.teamControlText}>Takım</Text></Pressable>
            ) : (
              <Pressable accessibilityLabel="Görevi çöz" onPress={() => handleGameAction('interact')} style={styles.smallControl}><Ionicons name="hand-left" size={19} color={COLORS.light.primary} /><Text style={styles.smallControlText}>Etkileş</Text></Pressable>
            )}
          </View>
        </View>
        {taskReady && <ActionButton icon="flag" label="Final pikniğine ulaş" tone="primary" onPress={completeCurrentLevel} testID="complete-level" />}
      </View>
    );
  };

  const renderResult = () => (
    <View style={[styles.resultScreen, { paddingTop: insets.top + 34, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.resultConfetti}><Ionicons name="sparkles" size={88} color={COLORS.light.primary} /></View>
      <Text style={styles.resultKicker}>BÖLÜM TAMAMLANDI</Text>
      <Text style={styles.resultTitle}>{lastResult.level === 5 ? 'Final pikniği!' : 'Yol açıldı!'}</Text>
      <Text style={styles.resultDescription}>{lastResult.level === 5 ? 'Aile birlikte hareket etti ve Ismail’i piknik alanından uzaklaştırdı.' : `${levels[lastResult.level - 1].name} güvenle geçildi. Bir sonraki piknik yeri sizi bekliyor.`}</Text>
      <View style={styles.resultScoreCard}>
        <Text style={styles.resultScoreLabel}>TOPLAM PUAN</Text>
        <Text style={styles.resultScore}>{String(lastResult.score).padStart(5, '0')}</Text>
        <View style={styles.resultDivider} />
        <View style={styles.resultStats}><View><Text style={styles.resultStatValue}>+500</Text><Text style={styles.resultStatLabel}>Aile bonusu</Text></View><View><Text style={styles.resultStatValue}>{lastResult.level}/5</Text><Text style={styles.resultStatLabel}>Bölüm</Text></View><View><Text style={styles.resultStatValue}>3/3</Text><Text style={styles.resultStatLabel}>Kalp</Text></View></View>
      </View>
      <View style={styles.resultActions}>
        {lastResult.level < 5 && <ActionButton icon="arrow-forward" label="Sonraki bölüme geç" tone="primary" onPress={() => startLevel(lastResult.level + 1)} />}
        <ActionButton icon="map" label="Bölüm haritası" onPress={() => setScreen('levels')} />
        <ActionButton icon="home" label="Ana menü" tone="quiet" onPress={() => setScreen('menu')} />
      </View>
    </View>
  );

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      {screen === 'menu' && renderMenu()}
      {screen === 'levels' && renderLevels()}
      {screen === 'game' && renderGame()}
      {screen === 'result' && renderResult()}
    </View>
  );
}

const COLORS = {
  light: {
    background: '#102b2f',
    foreground: '#fff9e9',
    primary: '#f5b72f',
    primaryForeground: '#271b16',
    secondary: '#2d5c53',
    card: '#1d4140',
    muted: '#204745',
    mutedForeground: '#b9d0bd',
    accent: '#e85f3f',
    border: '#467568',
  },
};

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: COLORS.light.background },
  scrollContent: { alignItems: 'center', paddingHorizontal: 16, gap: 16 },
  menuHeader: { width: '100%', maxWidth: 520, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.light.primary },
  brandTitle: { color: COLORS.light.primary, fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  brandTitleSmall: { fontSize: 13, letterSpacing: 1 },
  brandSubtitle: { color: COLORS.light.foreground, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  brandSubtitleSmall: { fontSize: 8, letterSpacing: 0.7 },
  recordBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.light.card, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.light.border },
  recordText: { color: COLORS.light.foreground, fontWeight: '800', fontSize: 12 },
  heroCard: { height: 225, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.light.border, backgroundColor: COLORS.light.card },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  heroCopy: { position: 'absolute', left: 18, right: 18, bottom: 18 },
  eyebrow: { color: COLORS.light.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  heroTitle: { color: COLORS.light.foreground, fontSize: 28, fontWeight: '900', marginTop: 3 },
  heroDescription: { color: COLORS.light.foreground, opacity: 0.86, fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: 310 },
  menuIntro: { width: '100%', maxWidth: 520, marginTop: 3 },
  sectionKicker: { color: COLORS.light.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  pageTitle: { color: COLORS.light.foreground, fontSize: 30, fontWeight: '900', marginTop: 5 },
  pageDescription: { color: COLORS.light.mutedForeground, fontSize: 14, lineHeight: 20, marginTop: 4 },
  actionButton: { minHeight: 52, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: COLORS.light.secondary, borderRadius: 15, borderWidth: 1, borderColor: COLORS.light.border, paddingHorizontal: 16 },
  actionPrimary: { backgroundColor: COLORS.light.primary, borderColor: COLORS.light.primary },
  actionDanger: { backgroundColor: COLORS.light.accent, borderColor: COLORS.light.accent },
  actionQuiet: { backgroundColor: 'transparent', borderColor: 'transparent' },
  actionLabel: { color: COLORS.light.foreground, fontSize: 15, fontWeight: '800' },
  actionPrimaryLabel: { color: COLORS.light.primaryForeground },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  quickStats: { width: '100%', maxWidth: 520, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 16, backgroundColor: COLORS.light.card, borderRadius: 17, borderWidth: 1, borderColor: COLORS.light.border },
  quickStat: { alignItems: 'center', gap: 2, minWidth: 70 },
  quickStatNumber: { color: COLORS.light.foreground, fontSize: 20, fontWeight: '900' },
  quickStatLabel: { color: COLORS.light.mutedForeground, fontSize: 11, fontWeight: '700' },
  quickStatDivider: { width: 1, height: 34, backgroundColor: COLORS.light.border },
  tipCard: { width: '100%', maxWidth: 520, flexDirection: 'row', gap: 11, padding: 15, borderRadius: 16, backgroundColor: COLORS.light.muted, borderWidth: 1, borderColor: COLORS.light.border },
  tipCopy: { flex: 1, gap: 3 },
  tipTitle: { color: COLORS.light.primary, fontWeight: '900', fontSize: 13 },
  tipText: { color: COLORS.light.mutedForeground, fontSize: 12, lineHeight: 18 },
  screenHeader: { width: '100%', maxWidth: 520, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.light.card, borderWidth: 1, borderColor: COLORS.light.border },
  headerSpacer: { flex: 1 },
  levelList: { width: '100%', maxWidth: 520, gap: 12, marginTop: 5 },
  levelCard: { minHeight: 139, flexDirection: 'row', overflow: 'hidden', borderRadius: 18, backgroundColor: COLORS.light.card, borderWidth: 1, borderColor: COLORS.light.border },
  levelLocked: { opacity: 0.43 },
  levelArtwork: { width: 103, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  artworkGround: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 42 },
  artworkSun: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.light.primary, right: 12, top: 16 },
  levelCardCopy: { flex: 1, padding: 13, gap: 4 },
  levelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  levelNumber: { color: COLORS.light.primary, fontSize: 11, fontWeight: '900' },
  levelName: { flex: 1, color: COLORS.light.foreground, fontSize: 16, fontWeight: '900' },
  levelLocation: { color: COLORS.light.mutedForeground, fontSize: 11, fontWeight: '700' },
  levelDescription: { color: COLORS.light.mutedForeground, fontSize: 11, lineHeight: 15, paddingRight: 3 },
  levelMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 3 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '48%' },
  metaText: { color: COLORS.light.foreground, fontSize: 10, fontWeight: '700' },
  familyCallout: { width: '100%', maxWidth: 520, flexDirection: 'row', gap: 10, padding: 15, backgroundColor: COLORS.light.muted, borderRadius: 16, borderWidth: 1, borderColor: COLORS.light.border },
  familyCalloutText: { flex: 1, color: COLORS.light.mutedForeground, fontSize: 12, lineHeight: 18 },
  gameScreen: { flex: 1, alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  gameTopbar: { width: '100%', maxWidth: 520, flexDirection: 'row', alignItems: 'center', gap: 10 },
  gameTitle: { flex: 1, gap: 2 },
  gameLevelLabel: { color: COLORS.light.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  gameLevelName: { color: COLORS.light.foreground, fontSize: 16, fontWeight: '900' },
  gameScore: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.light.card, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 9, borderWidth: 1, borderColor: COLORS.light.border },
  gameScoreText: { color: COLORS.light.foreground, fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] },
  gameStatus: { width: '100%', maxWidth: 520, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  healthRow: { flexDirection: 'row', gap: 2 },
  progressWrap: { flex: 1, gap: 4 },
  progressLabel: { color: COLORS.light.mutedForeground, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  progressTrack: { height: 7, borderRadius: 7, backgroundColor: COLORS.light.muted, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 7, backgroundColor: COLORS.light.primary },
  itemCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemCountText: { color: COLORS.light.foreground, fontWeight: '900', fontSize: 12 },
  world: { height: 218, borderRadius: 20, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: COLORS.light.border },
  worldCloudOne: { position: 'absolute', top: 25, left: 22 },
  worldCloudTwo: { position: 'absolute', top: 57, right: 24 },
  worldSun: { position: 'absolute', top: 18, right: 25 },
  worldTreeOne: { position: 'absolute', left: 13, top: 43 },
  worldTreeTwo: { position: 'absolute', right: 38, top: 72 },
  worldObstacle: { position: 'absolute', bottom: 67, left: '58%', alignItems: 'center', gap: 3 },
  obstacleBadge: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)' },
  obstacleName: { color: COLORS.light.primaryForeground, fontSize: 10, fontWeight: '900', backgroundColor: COLORS.light.primary, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5 },
  worldCharacter: { position: 'absolute', bottom: 61, left: '27%', alignItems: 'center', gap: 3 },
  characterBubble: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.light.foreground },
  worldCharacterName: { color: COLORS.light.foreground, fontSize: 10, fontWeight: '900', backgroundColor: COLORS.light.background, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5 },
  worldPath: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 58 },
  worldFlowers: { position: 'absolute', bottom: 28, left: '46%' },
  worldFinish: { position: 'absolute', right: 14, bottom: 47 },
  messageBox: { width: '100%', maxWidth: 520, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 13, backgroundColor: COLORS.light.muted, borderWidth: 1, borderColor: COLORS.light.border },
  messageText: { flex: 1, color: COLORS.light.foreground, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  taskBox: { width: '100%', maxWidth: 520, padding: 12, borderRadius: 15, backgroundColor: COLORS.light.card, borderWidth: 1, borderColor: COLORS.light.border },
  taskHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  taskHeaderTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskLabel: { color: COLORS.light.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { width: 18, height: 4, borderRadius: 4, backgroundColor: COLORS.light.muted },
  pipActive: { backgroundColor: COLORS.light.primary },
  taskContent: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  taskIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.light.primary, alignItems: 'center', justifyContent: 'center' },
  taskDoneIcon: { backgroundColor: COLORS.light.secondary },
  taskCopy: { flex: 1, gap: 2 },
  taskTitle: { color: COLORS.light.foreground, fontSize: 13, fontWeight: '900' },
  taskDescription: { color: COLORS.light.mutedForeground, fontSize: 11, lineHeight: 15 },
  characterSwitcher: { width: '100%', maxWidth: 520, gap: 7 },
  controlLabel: { color: COLORS.light.mutedForeground, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  characterRow: { flexDirection: 'row', gap: 8 },
  characterOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.light.border, backgroundColor: COLORS.light.card },
  characterSelected: { borderColor: COLORS.light.primary, backgroundColor: COLORS.light.secondary },
  miniCharacter: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  characterOptionName: { color: COLORS.light.mutedForeground, fontSize: 11, fontWeight: '800' },
  characterSelectedText: { color: COLORS.light.foreground },
  controls: { width: '100%', maxWidth: 520, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  directionControls: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  controlCircle: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.light.card, borderWidth: 1, borderColor: COLORS.light.border },
  jumpControl: { backgroundColor: COLORS.light.primary, borderColor: COLORS.light.primary },
  actionControls: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  smallControl: { minWidth: 66, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: COLORS.light.card, borderWidth: 1, borderColor: COLORS.light.border },
  smallControlText: { color: COLORS.light.foreground, fontSize: 10, fontWeight: '800' },
  teamControl: { backgroundColor: COLORS.light.accent, borderColor: COLORS.light.accent },
  teamControlText: { color: COLORS.light.primaryForeground, fontSize: 10, fontWeight: '900' },
  resultScreen: { flex: 1, alignItems: 'center', paddingHorizontal: 22, justifyContent: 'center', gap: 14 },
  resultConfetti: { width: 126, height: 126, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.light.card, borderWidth: 1, borderColor: COLORS.light.border, transform: [{ rotate: '-7deg' }] },
  resultKicker: { color: COLORS.light.primary, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginTop: 6 },
  resultTitle: { color: COLORS.light.foreground, fontSize: 34, fontWeight: '900', textAlign: 'center' },
  resultDescription: { color: COLORS.light.mutedForeground, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 350 },
  resultScoreCard: { width: '100%', maxWidth: 400, alignItems: 'center', padding: 20, marginTop: 5, borderRadius: 20, backgroundColor: COLORS.light.card, borderWidth: 1, borderColor: COLORS.light.border },
  resultScoreLabel: { color: COLORS.light.mutedForeground, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  resultScore: { color: COLORS.light.primary, fontSize: 40, fontWeight: '900', letterSpacing: 2, marginVertical: 4 },
  resultDivider: { width: '100%', height: 1, backgroundColor: COLORS.light.border, marginVertical: 11 },
  resultStats: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center' },
  resultStatValue: { color: COLORS.light.foreground, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  resultStatLabel: { color: COLORS.light.mutedForeground, fontSize: 10, marginTop: 3, textAlign: 'center' },
  resultActions: { width: '100%', maxWidth: 400, gap: 8, marginTop: 4 },
});