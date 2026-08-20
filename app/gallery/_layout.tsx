import { Redirect, Stack } from 'expo-router';

export default function GalleryLayout() {
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <Stack screenOptions={{ headerShown: true, headerTitle: 'Artwork', headerBackTitle: 'Back' }} />
  );
}
