import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import { Fredoka_500Medium, Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { useFonts } from 'expo-font';

export function useAppFonts(): boolean {
  const [areFontsLoaded, fontLoadError] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });

  return areFontsLoaded || fontLoadError !== null;
}
