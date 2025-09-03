import { Stack } from 'expo-router';

export default function DebtsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { padding: 0 } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add-debt" />
      <Stack.Screen name="debt-detail" />
    </Stack>
  );
}
