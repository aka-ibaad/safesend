import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Create Account' }} />
      <Stack.Screen name="biometric" options={{ headerShown: false }} />
      <Stack.Screen name="freelancer/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="freelancer/upload" options={{ title: 'Upload File', headerBackTitle: 'Back' }} />
      <Stack.Screen name="client/dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="preview/[id]" options={{ title: 'Secure Preview', headerBackTitle: 'Back' }} />
      <Stack.Screen name="preview/annotate" options={{ title: 'Annotate', headerBackTitle: 'Back' }} />
    </Stack>
  );
}
