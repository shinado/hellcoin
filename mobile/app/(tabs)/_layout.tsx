import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, Link } from 'expo-router';
import { Pressable } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6384',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#001800',
          borderTopColor: '#002800',
        },
        headerStyle: {
          backgroundColor: '#001800',
        },
        headerTintColor: '#fff',
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                  color="#fff"
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Burn',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="fire" color={color} />,
        }}
      />
      <Tabs.Screen
        name="distribution"
        options={{
          title: 'Distribution',
          tabBarIcon: ({ color }) => <TabBarIcon name="pie-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="token"
        options={{
          title: 'Buy $HELL',
          tabBarIcon: ({ color }) => <TabBarIcon name="dollar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="blog"
        options={{
          title: 'Blog',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="newspaper-o" color={color} />,
        }}
      />
    </Tabs>
  );
}
