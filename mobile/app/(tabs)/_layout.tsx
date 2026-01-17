import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { t } = useLanguage();

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
            <View className="flex-row items-center mr-4">
              <LanguageSwitcher />
              <Link href="/modal" asChild>
                <Pressable className="ml-2">
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={25}
                      color="#fff"
                      style={{ opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            </View>
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.burn'),
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="fire" color={color} />,
        }}
      />
      <Tabs.Screen
        name="distribution"
        options={{
          title: t('tabs.distribution'),
          tabBarIcon: ({ color }) => <TabBarIcon name="pie-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="token"
        options={{
          title: t('tabs.buy'),
          tabBarIcon: ({ color }) => <TabBarIcon name="dollar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="blog"
        options={{
          title: t('tabs.blog'),
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="newspaper-o" color={color} />,
        }}
      />
    </Tabs>
  );
}
