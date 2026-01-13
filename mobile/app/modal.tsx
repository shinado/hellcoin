import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text, ScrollView, Linking, TouchableOpacity } from 'react-native';

export default function ModalScreen() {
  const links = [
    {
      title: 'Website',
      url: 'https://hellcoin.money',
      icon: '🌐',
    },
    {
      title: 'Follow on X',
      url: 'https://twitter.com/hellcoin_money',
      icon: '🐦',
    },
    {
      title: 'Join Community',
      url: 'https://t.me/hellcoinmoney',
      icon: '💬',
    },
    {
      title: 'Whitepaper',
      url: 'https://docs.google.com/document/d/1AEMrs5Y7FZ3tqk9HlqlIVY89QIh6PVhfcLHTMuF6L5E/edit',
      icon: '📄',
    },
    {
      title: 'pump.fun',
      url: 'https://pump.fun/coin/oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump',
      icon: '🔥',
    },
  ];

  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1 px-6 py-8">
        <Text className="text-3xl font-bold text-white text-center mb-2">
          Hellcoin
        </Text>
        <Text className="text-gray-400 text-center mb-8">
          The meme coin burning hyperinflation in hell 🔥
        </Text>

        <View className="bg-gray-800 rounded-lg overflow-hidden">
          {links.map((link, index) => (
            <TouchableOpacity
              key={link.url}
              className={`flex-row items-center px-4 py-4 ${
                index < links.length - 1 ? 'border-b border-gray-700' : ''
              }`}
              onPress={() => Linking.openURL(link.url)}
            >
              <Text className="text-2xl mr-4">{link.icon}</Text>
              <Text className="text-white flex-1">{link.title}</Text>
              <Text className="text-gray-400">→</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-8 bg-gray-800 rounded-lg p-4">
          <Text className="text-gray-400 text-sm text-center">
            Token Address
          </Text>
          <Text className="text-white text-xs text-center mt-2 font-mono">
            oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump
          </Text>
        </View>

        <Text className="text-gray-500 text-xs text-center mt-8">
          Version 1.0.0
        </Text>
      </ScrollView>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
