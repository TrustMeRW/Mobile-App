import { Stack } from 'expo-router';

export default function EmploymentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { padding: 0 } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="employment-detail" />
      <Stack.Screen name="create-employment" />
    </Stack>
  );
}
