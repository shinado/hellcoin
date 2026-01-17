import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Transaction } from '@solana/web3.js';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { useWallet } from '../../contexts/WalletContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import { transformToDeadAddress } from '../../utils/addressTransform';
import BurnSuccessModal from '../../components/BurnSuccessModal';

const APP_IDENTITY = {
  name: 'Hellcoin',
  uri: 'https://hellcoin.money',
  icon: 'favicon.ico',
};

export default function BurnScreen() {
  const wallet = useWallet();
  const { t } = useLanguage();

  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [transformedAddress, setTransformedAddress] = useState('');
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState('');

  // Transform name to address when it changes
  useEffect(() => {
    if (personName) {
      try {
        const address = transformToDeadAddress(personName);
        setTransformedAddress(address);
      } catch (e) {
        console.error('Error transforming address:', e);
        setTransformedAddress('');
      }
    } else {
      setTransformedAddress('');
    }
  }, [personName]);

  // Fetch token balance when wallet connects
  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchTokenBalance();
    } else {
      setTokenBalance(null);
    }
  }, [wallet.connected, wallet.publicKey]);

  // Fetch token price on mount and periodically
  useEffect(() => {
    fetchTokenPrice();
    const interval = setInterval(fetchTokenPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchTokenBalance = async () => {
    if (!wallet.publicKey) return;
    try {
      const data = await api.getTokenBalance(wallet.publicKey.toString());
      setTokenBalance(data.balance);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      setTokenBalance(null);
    }
  };

  const fetchTokenPrice = async () => {
    // #region agent log
    console.log('[DEBUG][H1-H5] fetchTokenPrice:start', { timestamp: Date.now() });
    // #endregion
    try {
      const price = await api.getTokenPrice();
      // #region agent log
      console.log('[DEBUG][H2] fetchTokenPrice:success', { price });
      // #endregion
      setTokenPrice(price);
    } catch (error: any) {
      // #region agent log
      console.log('[DEBUG][H1-H5] fetchTokenPrice:error', { errorName: error?.name, errorMessage: error?.message });
      // #endregion
      console.error('Error fetching token price:', error);
    }
  };

  const handleBurn = async () => {
    if (!wallet.publicKey || !personName || !amount) return;

    setLoading(true);
    setPlayVideo(true);

    try {
      // Prepare the transaction locally using direct RPC
      const { transaction } = await api.prepareTransfer(
        wallet.publicKey.toString(),
        transformedAddress,
        parseFloat(amount)
      );

      // Use Mobile Wallet Adapter to sign and send
      let signature = '';
      
      if (Platform.OS === 'web') {
        Alert.alert('Error', t('alerts.useMobileDevice'));
        setPlayVideo(false);
        setLoading(false);
        return;
      }

      await transact(async (mobileWallet: Web3MobileWallet) => {
        // Authorize the session
        const authResult = await wallet.authorizeSession(mobileWallet);
        
        // Sign and send
        const signatures = await mobileWallet.signAndSendTransactions({
          transactions: [transaction],
        });
        
        signature = signatures[0];
      });

      setPlayVideo(false);
      setTransactionSignature(signature);
      setShowSuccessModal(true);
      
    } catch (error: any) {
      console.error('Transaction failed:', error);
      Alert.alert(t('alerts.transactionFailed'), error.message || t('alerts.pleaseTryAgain'));
      setPlayVideo(false);
    } finally {
      setLoading(false);
    }
  };

  const usdValue = amount && tokenPrice 
    ? (parseFloat(amount) * tokenPrice).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null;

  const hasInsufficientBalance = 
    tokenBalance !== null && 
    amount && 
    parseFloat(amount) > tokenBalance;

  const canBurn = 
    wallet.connected && 
    personName && 
    amount && 
    !hasInsufficientBalance && 
    !loading;

  if (playVideo) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Video
          source={require('../../assets/burning-fire.mp4')}
          rate={1.0}
          volume={0}
          isMuted
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          style={{ width: '100%', height: '100%', position: 'absolute' }}
        />
        <View className="bg-black/50 px-6 py-4 rounded-lg">
          <Text className="text-white text-lg text-center">
            {t('burn.transferring')}
          </Text>
          <Text className="text-gray-300 text-sm text-center mt-2">
            {t('burn.waitingConfirmation')}
          </Text>
          <ActivityIndicator color="#fff" className="mt-4" />
        </View>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/hellcoin_bg.jpg')}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 bg-black/80">
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center items-center px-6 py-12">
            <Text className="text-7xl font-extrabold text-white text-center">
              {t('burn.title')}
            </Text>
            <Text className="text-lg text-white text-center mt-2">
              {t('burn.subtitle')}
            </Text>
            <Text className="text-sm text-gray-400 text-center mt-1">
              {t('burn.getStarted')}{' '}
              <Link href="/token" asChild>
                <Text className="text-blue-400">{t('burn.pumpFun')}</Text>
              </Link>
            </Text>

            <View className="w-full max-w-md mt-8">
              {/* Burn To Input */}
              <View className="mb-4">
                <Text className="text-white font-bold mb-2">{t('burn.burnTo')}</Text>
                <TextInput
                  className="bg-gray-600 text-white p-4 rounded-lg w-full"
                  placeholder={t('burn.burnToPlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  value={personName}
                  onChangeText={setPersonName}
                />
                {transformedAddress ? (
                  <Text className="text-gray-300 text-xs mt-2" numberOfLines={2}>
                    {t('burn.address')}: {transformedAddress}
                  </Text>
                ) : null}
              </View>

              {/* Amount Input */}
              <View className="mb-4">
                <Text className="text-white font-bold mb-2">{t('burn.amount')}</Text>
                <TextInput
                  className="bg-gray-600 text-white p-4 rounded-lg w-full"
                  placeholder={t('burn.amountPlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                {usdValue ? (
                  <Text className="text-gray-300 text-sm mt-2">
                    {t('burn.usdValue', { value: usdValue })}
                  </Text>
                ) : null}
                {hasInsufficientBalance ? (
                  <Text className="text-red-500 text-sm mt-1">
                    {t('burn.insufficientBalance')}
                  </Text>
                ) : null}
                {wallet.connected && tokenBalance !== null ? (
                  <Text className="text-white text-sm mt-1">
                    {t('burn.yourBalance', { balance: tokenBalance.toLocaleString() })}
                  </Text>
                ) : null}
              </View>

              {/* Connect/Burn Button */}
              {!wallet.connected ? (
                <TouchableOpacity
                  className="bg-purple-600 py-4 px-6 rounded-lg mt-4"
                  onPress={wallet.connect}
                  disabled={wallet.connecting}
                >
                  {wallet.connecting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-center text-lg">
                      {t('burn.connectWallet')}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View>
                  <View className="flex-row justify-between items-center mb-4 bg-gray-700 p-3 rounded-lg">
                    <Text className="text-gray-300 text-sm">
                      {wallet.publicKey?.toString().slice(0, 4)}...
                      {wallet.publicKey?.toString().slice(-4)}
                    </Text>
                    <TouchableOpacity onPress={wallet.disconnect}>
                      <Text className="text-red-400 text-sm">{t('burn.disconnect')}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    className={`py-4 px-6 rounded-lg ${
                      canBurn ? 'bg-blue-500' : 'bg-gray-500'
                    }`}
                    onPress={handleBurn}
                    disabled={!canBurn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white font-bold text-center text-lg">
                        {t('burn.transfer')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      <BurnSuccessModal
        visible={showSuccessModal}
        name={personName}
        address={transformedAddress}
        amount={amount}
        signature={transactionSignature}
        onClose={() => {
          setShowSuccessModal(false);
          setPersonName('');
          setAmount('');
          fetchTokenBalance();
        }}
      />
    </ImageBackground>
  );
}
