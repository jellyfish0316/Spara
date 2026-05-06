import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTodayStore } from '../../store/today';
import * as api from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

type Phase = 'dotting' | 'revealing' | 'locked';

const DOT_PATTERNS = ['· · ·', '· · · ·', '· · · · ·', '· · · · · ·'];

export default function FinalizeScreen() {
    const router = useRouter();
    const receipt = useTodayStore((s) => s.receipt);
    const finalize = useTodayStore((s) => s.finalize);

    const [phase, setPhase] = useState<Phase>('dotting');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [verdictText, setVerdictText] = useState('');
    const [dotIndex, setDotIndex] = useState(0);
    const [rerolled, setRerolled] = useState(false);

    const currentVerdict = suggestions[suggestionIndex] ?? '';

    // Keep latest suggestions in a ref so the dotting interval can read them without re-running
    const suggestionsRef = useRef<string[]>([]);
    useEffect(() => { suggestionsRef.current = suggestions; }, [suggestions]);

    // Fetch suggestions on mount — fills the data, does NOT change phase
    useEffect(() => {
        if (!receipt) return;
        api.getVerdictSuggestions(receipt.id)
        .then((res) => setSuggestions(res.suggestions.length > 0 ? res.suggestions : ['A GOOD ONE']))
        .catch(() => setSuggestions(['A GOOD ONE']));
    }, []);

    // Dotting animation — cycles dots, exits when min cycles done AND suggestions are ready
    useEffect(() => {
        if (phase !== 'dotting') return;
        let count = 0;
        const interval = setInterval(() => {
        setDotIndex(count % DOT_PATTERNS.length);
        count++;
        if (count > 8 && suggestionsRef.current.length > 0) {
            clearInterval(interval);
            setPhase('revealing');
        }
        }, 220);
        return () => clearInterval(interval);
    }, [phase]);

    // Typewriter reveal
    useEffect(() => {
        if (phase !== 'revealing') return;
        if (!currentVerdict) {
        setPhase('locked');
        return;
        }
        setVerdictText('');
        let i = 0;
        const interval = setInterval(() => {
        i++;
        setVerdictText(currentVerdict.slice(0, i));
        if (i >= currentVerdict.length) {
            clearInterval(interval);
            setPhase('locked');
        }
        }, 80);
        return () => clearInterval(interval);
    }, [phase, currentVerdict]);

    const canReroll = !rerolled && suggestionIndex < suggestions.length - 1;

    const handleReroll = () => {
        if (!canReroll) return;
        setRerolled(true);
        setSuggestionIndex(suggestionIndex + 1);
        setVerdictText('');
        setPhase('dotting');
    };

    const handleDone = async () => {
        await finalize(currentVerdict);
        router.back();
    };

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    }}>
      {/* Label */}
      <Text style={{
        fontFamily: fonts.regular,
        fontSize: 9,
        letterSpacing: 1.35,
        color: colors.darkTextDim,
        marginBottom: 16,
      }}>
        TODAY'S VERDICT
      </Text>

      {/* Verdict slot */}
      <View style={{ minHeight: 60, justifyContent: 'center', marginBottom: 48 }}>
        {phase === 'dotting' && (
          <Text style={{
            fontFamily: fonts.regular,
            fontSize: 24,
            color: colors.darkBorder,
            letterSpacing: 4,
          }}>
            {DOT_PATTERNS[dotIndex]}
          </Text>
        )}
        {(phase === 'revealing' || phase === 'locked') && (
          <Text style={{
            fontFamily: fonts.semibold,
            fontSize: 24,
            color: colors.cream,
            letterSpacing: 2,
            textAlign: 'center',
          }}>
            {verdictText.toUpperCase()}
          </Text>
        )}
      </View>

      {/* Action buttons */}
      <View style={{ width: '100%', gap: 10 }}>
        {phase === 'locked' && canReroll && (
          <Pressable
            onPress={handleReroll}
            style={{
              height: 40,
              borderWidth: 1,
              borderColor: colors.darkBorder,
              borderRadius: 3,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.regular, fontSize: 10, letterSpacing: 1, color: colors.darkTextDim }}>
              re-roll
            </Text>
          </Pressable>
        )}

        {phase === 'locked' && (
          <Pressable
            onPress={handleDone}
            style={{
              height: 40,
              backgroundColor: colors.cream,
              borderRadius: 3,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1, color: colors.ink }}>
              done
            </Text>
          </Pressable>
        )}

        {phase !== 'locked' && (
          <Pressable
            onPress={() => router.back()}
            style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: fonts.regular, fontSize: 10, letterSpacing: 1, color: colors.darkBorder }}>
              cancel
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
