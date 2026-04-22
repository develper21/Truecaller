import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/src/theme/colors';
import { GlassButton } from '@/src/components/GlassButton';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    icon: 'shield',
    iconLib: 'feather',
    title: 'Know Who Calls',
    desc: 'Instantly identify unknown callers with our massive database of 100M+ numbers worldwide.',
    color: Colors.accent,
  },
  {
    id: 2,
    icon: 'block',
    iconLib: 'material',
    title: 'Block Spam Calls',
    desc: 'Automatically detect and block telemarketing, fraud, and spam calls before they reach you.',
    color: Colors.accentDark,
  },
  {
    id: 3,
    icon: 'lock',
    iconLib: 'feather',
    title: 'Your Privacy First',
    desc: 'Stay incognito while searching. Control who sees your info with advanced privacy settings.',
    color: Colors.accent,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  function goNext() {
    if (current < slides.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setCurrent(current + 1);
    } else {
      router.replace('/permissions');
    }
  }

  function skip() {
    router.replace('/login');
  }

  const slide = slides[current];

  return (
    <View style={styles.container}>
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={skip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={[styles.iconContainer, { borderColor: slide.color + '40' }]}>
          <View style={[styles.iconInner, { backgroundColor: slide.color + '20' }]}>
            {slide.iconLib === 'feather' ? (
              <Feather name={slide.icon as any} size={52} color={slide.color} />
            ) : (
              <MaterialIcons name={slide.icon as any} size={52} color={slide.color} />
            )}
          </View>
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.desc}>{slide.desc}</Text>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: bottomPad + 20 }]}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === current ? 24 : 8,
                  backgroundColor: i === current ? Colors.accent : 'rgba(255,255,255,0.3)',
                },
              ]}
            />
          ))}
        </View>
        <GlassButton
          title={current === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={goNext}
          fullWidth
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gradientStart,
  },
  bgBlob1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: Colors.gradientEnd,
    top: -width * 0.2,
    right: -width * 0.2,
    opacity: 0.7,
  },
  bgBlob2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: Colors.accent,
    bottom: height * 0.1,
    left: -width * 0.15,
    opacity: 0.15,
  },
  header: {
    paddingHorizontal: 24,
    alignItems: 'flex-end',
    paddingBottom: 8,
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  desc: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    borderRadius: 16,
    paddingVertical: 16,
  },
});
