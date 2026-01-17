import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <View className="flex-row bg-gray-800 rounded-lg p-1">
      <TouchableOpacity
        className={`px-3 py-1 rounded ${language === 'en' ? 'bg-blue-500' : ''}`}
        onPress={() => setLanguage('en')}
      >
        <Text className={`text-sm font-medium ${language === 'en' ? 'text-white' : 'text-gray-400'}`}>
          EN
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`px-3 py-1 rounded ${language === 'zh' ? 'bg-blue-500' : ''}`}
        onPress={() => setLanguage('zh')}
      >
        <Text className={`text-sm font-medium ${language === 'zh' ? 'text-white' : 'text-gray-400'}`}>
          中文
        </Text>
      </TouchableOpacity>
    </View>
  );
}
