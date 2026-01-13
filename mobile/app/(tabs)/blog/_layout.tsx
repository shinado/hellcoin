import { Stack } from 'expo-router';

export default function BlogLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#001800',
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Blog',
        }}
      />
      <Stack.Screen
        name="[slug]"
        options={{
          title: 'Article',
        }}
      />
    </Stack>
  );
}
