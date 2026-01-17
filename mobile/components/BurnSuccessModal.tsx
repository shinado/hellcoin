import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

interface BurnSuccessModalProps {
  visible: boolean;
  name: string;
  address: string;
  amount: string;
  signature: string;
  onClose: () => void;
}

export default function BurnSuccessModal({
  visible,
  name,
  address,
  amount,
  signature,
  onClose,
}: BurnSuccessModalProps) {
  const { t } = useLanguage();

  const openSolscan = () => {
    Linking.openURL(`https://solscan.io/address/${address}`);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-center items-center px-6">
        <View className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
          <View className="items-center">
            <Image
              source={require('../assets/rip.png')}
              className="w-32 h-32 mb-4"
              resizeMode="contain"
            />

            <Text className="text-3xl font-bold text-white text-center mb-4">
              {t('burnSuccess.rip', { name })}
            </Text>

            <Text className="text-gray-300 text-center mb-2">
              {t('burnSuccess.message', {
                amount: parseFloat(amount).toLocaleString(),
                name,
              })}
            </Text>

            <TouchableOpacity onPress={openSolscan}>
              <Text className="text-gray-400 text-xs text-center underline" numberOfLines={2}>
                ({t('burnSuccess.addressLabel', { address })})
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-red-500 py-3 px-6 rounded-lg mt-6"
            onPress={onClose}
          >
            <Text className="text-white font-bold text-center">{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
