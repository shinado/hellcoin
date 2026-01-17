import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useWallet } from '../../contexts/WalletContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import api, { QuoteResponse, PrepareTradeResponse, ChartDataPoint } from '../../services/api';

// Lazy load chart wrapper to avoid circular dependency on web
const CandlestickChartWrapper = lazy(() => import('../../components/CandlestickChartWrapper'));

type TradeMode = 'buy' | 'sell';

export default function TokenScreen() {
  const wallet = useWallet();
  const { t } = useLanguage();

  const [price, setPrice] = useState<number | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [swapping, setSwapping] = useState(false);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [tradeMode, setTradeMode] = useState<TradeMode>('buy');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch current price and chart data in parallel
      const [currentPrice, chartResponse] = await Promise.all([
        api.getTokenPrice(),
        api.getChartData('6h', 7) // 7 days, 6-hour intervals
      ]);

      setPrice(currentPrice);
      setChartData(chartResponse.items);

      // Calculate 24h price change from chart data
      if (chartResponse.items.length >= 4) { // 4 x 6h = 24h
        const price24hAgo = chartResponse.items[chartResponse.items.length - 4].c;
        const change = ((currentPrice - price24hAgo) / price24hAgo) * 100;
        setPriceChange24h(change);
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
      setPrice(0);
      setChartData([]);
      setPriceChange24h(0);
    } finally {
      setLoading(false);
    }
  };

  const calculateToAmount = async (from: string) => {
    if (!from || isNaN(parseFloat(from))) {
      setToAmount('');
      setQuote(null);
      return;
    }

    try {
      const amount = parseFloat(from);
      if (amount <= 0) return;

      // Use backend API for quotes
      const quoteData = await api.getQuote(tradeMode, amount);

      setToAmount(quoteData.outputAmount.toFixed(2));
      setQuote(quoteData);
    } catch (error: any) {
      console.error('Error getting quote:', error);
      setToAmount('');
      setQuote(null);
    }
  };

  const handleFromAmountChange = (text: string) => {
    setFromAmount(text);
    calculateToAmount(text);
  };

  const handleSwap = async () => {
    if (!wallet.connected) {
      Alert.alert(t('alerts.walletNotConnected'), t('alerts.pleaseConnect'));
      return;
    }

    if (!fromAmount || !quote) {
      Alert.alert(t('alerts.invalidAmount'), t('alerts.pleaseEnterAmount'));
      return;
    }

    setSwapping(true);

    try {
      const amount = parseFloat(fromAmount);

      // Prepare transaction using backend API
      let tradeData: PrepareTradeResponse;
      if (tradeMode === 'buy') {
        tradeData = await api.prepareBuy(wallet.publicKey!.toString(), amount);
      } else {
        tradeData = await api.prepareSell(wallet.publicKey!.toString(), amount);
      }

      // Sign and send using mobile wallet adapter
      await transact(async (mobileWallet: Web3MobileWallet) => {
        await wallet.authorizeSession(mobileWallet);

        const signatures = await mobileWallet.signAndSendTransactions({
          transactions: [tradeData.transaction],
        });

        const action = tradeMode === 'buy' ? t('token.bought') : t('token.sold');
        const fromToken = tradeMode === 'buy' ? 'SOL' : '$HELL';
        const toToken = tradeMode === 'buy' ? '$HELL' : 'SOL';

        Alert.alert(
          t('token.success'),
          t('token.tradeSuccess', {
            action,
            amount: fromAmount,
            fromToken,
            output: tradeData.expectedOutput.toFixed(2),
            toToken,
            signature: signatures[0].slice(0, 8),
          }),
          [{ text: t('token.ok'), onPress: () => { setFromAmount(''); setToAmount(''); setQuote(null); } }]
        );
      });
    } catch (error: any) {
      console.error('Trade failed:', error);
      Alert.alert(t('alerts.transactionFailed'), error.message || t('alerts.pleaseTryAgain'));
    } finally {
      setSwapping(false);
    }
  };

  const handleModeChange = (mode: TradeMode) => {
    setTradeMode(mode);
    setFromAmount('');
    setToAmount('');
    setQuote(null);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#001800] justify-center items-center">
        <ActivityIndicator size="large" color="#FF6384" />
        <Text className="text-white mt-4">{t('token.loadingData')}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#001800]">
      <View className="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-white mb-2">{t('token.title')}</Text>
          <View className="flex-row items-center">
            <Text className="text-2xl text-white mr-2">
              ${price?.toFixed(8) || '0.00000000'}
            </Text>
            <View className={`${priceChange24h >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'} px-2 py-1 rounded`}>
              <Text className={`${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'} text-sm`}>
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Chart */}
        <View className="mb-6">
          <Text className="text-white font-bold mb-3">{t('token.priceChart')}</Text>
          {chartData.length > 0 ? (
            <View style={{ height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: '#002800' }}>
              <Suspense fallback={<ActivityIndicator color="#FF6384" style={{ marginTop: 80 }} />}>
                <CandlestickChartWrapper data={chartData} />
              </Suspense>
            </View>
          ) : (
            <View style={{ height: 220, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002800', borderRadius: 16 }}>
              <Text className="text-gray-400">No chart data available</Text>
            </View>
          )}
        </View>

        {/* Swap UI */}
        <View className="bg-[#002800] rounded-xl p-4 mb-6">
          {/* Buy/Sell Toggle */}
          <View className="flex-row bg-[#001800] rounded-lg p-1 mb-4">
            <TouchableOpacity
              className={`flex-1 py-2 rounded ${tradeMode === 'buy' ? 'bg-green-500' : ''}`}
              onPress={() => handleModeChange('buy')}
            >
              <Text className={`text-center font-bold ${tradeMode === 'buy' ? 'text-white' : 'text-gray-400'}`}>
                {t('token.buy')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded ${tradeMode === 'sell' ? 'bg-red-500' : ''}`}
              onPress={() => handleModeChange('sell')}
            >
              <Text className={`text-center font-bold ${tradeMode === 'sell' ? 'text-white' : 'text-gray-400'}`}>
                {t('token.sell')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-white font-bold mb-4 text-lg">{tradeMode === 'buy' ? t('token.buyHell') : t('token.sellHell')}</Text>

          {/* From */}
          <View className="mb-3">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-400 text-sm">{t('token.youPay')}</Text>
              <Text className="text-gray-400 text-sm">
                {t('token.balance', {
                  balance: wallet.connected ? '~0.5' : '-',
                  token: tradeMode === 'buy' ? 'SOL' : '$HELL',
                })}
              </Text>
            </View>
            <View className="bg-[#001800] rounded-lg p-4 flex-row items-center">
              <TextInput
                className="flex-1 text-white text-xl"
                placeholder="0.0"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                value={fromAmount}
                onChangeText={handleFromAmountChange}
                editable={wallet.connected}
              />
              <View className={`${tradeMode === 'buy' ? 'bg-yellow-500' : 'bg-red-600'} px-3 py-1 rounded flex-row items-center ml-3`}>
                <Text className={`font-bold ${tradeMode === 'buy' ? 'text-black' : 'text-white'}`}>{tradeMode === 'buy' ? 'SOL' : '$HELL'}</Text>
              </View>
            </View>
          </View>

          {/* Swap Icon */}
          <View className="flex justify-center mb-3">
            <View className="bg-[#001800] w-10 h-10 rounded-full items-center justify-center">
              <Text className="text-white text-lg">↓</Text>
            </View>
          </View>

          {/* To */}
          <View className="mb-4">
            <Text className="text-gray-400 text-sm mb-2">{t('token.youReceive')}</Text>
            <View className="bg-[#001800] rounded-lg p-4 flex-row items-center">
              <Text className="flex-1 text-white text-xl">{toAmount || '0.0'}</Text>
              <View className={`${tradeMode === 'sell' ? 'bg-yellow-500' : 'bg-red-600'} px-3 py-1 rounded flex-row items-center ml-3`}>
                <Text className={`font-bold ${tradeMode === 'sell' ? 'text-black' : 'text-white'}`}>{tradeMode === 'sell' ? 'SOL' : '$HELL'}</Text>
              </View>
            </View>
          </View>

          {/* Swap Button */}
          {!wallet.connected ? (
            <TouchableOpacity
              className="bg-blue-500 py-4 rounded-lg"
              onPress={wallet.connect}
              disabled={wallet.connecting}
            >
              {wallet.connecting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-center text-lg">
                  {t('token.connectWallet')}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className={`py-4 rounded-lg ${fromAmount && quote ? (tradeMode === 'buy' ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-600'}`}
              onPress={handleSwap}
              disabled={!fromAmount || !quote || swapping}
            >
              {swapping ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-center text-lg">
                  {fromAmount && quote
                    ? (tradeMode === 'buy'
                        ? t('token.buyToken', { amount: toAmount })
                        : t('token.sellToken', { amount: toAmount }))
                    : t('token.enterAmount')}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Info */}
          <Text className="text-gray-400 text-xs mt-3 text-center">
            {t('token.poweredBy')}
            {quote?.testMode && ` • ${t('token.testMode')}`}
          </Text>
        </View>

        {/* External Links */}
        <View className="flex gap-3">
          <TouchableOpacity
            className="flex-1 bg-[#002800] py-3 rounded-lg items-center"
            onPress={() => Linking.openURL('https://pump.fun/coin/oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump')}
          >
            <Text className="text-white">{t('token.viewOnPump')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-[#002800] py-3 rounded-lg items-center"
            onPress={() => Linking.openURL('https://solscan.io/token/oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump')}
          >
            <Text className="text-white">{t('token.viewOnSolscan')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
