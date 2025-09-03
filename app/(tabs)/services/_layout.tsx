import { Stack } from 'expo-router';

export default function ServicesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { padding: 0 } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="debts" />
      <Stack.Screen name="employments" />
    </Stack>
  );
}
