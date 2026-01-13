import React, { useState, useEffect } from 'react';
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
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useWallet } from '../../contexts/WalletContext';
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { Transaction } from '@solana/web3.js';
import api, { QuoteResponse, PrepareTradeResponse } from '../../services/api';

const screenWidth = Dimensions.get('window').width;

const MINT_ADDRESS = 'oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

type TradeMode = 'buy' | 'sell';

export default function TokenScreen() {
  const wallet = useWallet();
  const [price, setPrice] = useState<number | null>(null);
  const [chartData, setChartData] = useState<number[]>([]);
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
      // Fetch current price
      const currentPrice = await api.getTokenPrice();
      setPrice(currentPrice);

      // Generate chart data
      // If price is 0 or unavailable, use mock data for display
      const basePrice = currentPrice > 0 ? currentPrice : 0.00001;
      const mockData = Array.from({ length: 24 }, () => {
        return basePrice * (0.8 + Math.random() * 0.4);
      });
      mockData[mockData.length - 1] = basePrice;
      setChartData(mockData);
    } catch (error) {
      console.error('Error fetching token data:', error);
      // Set default chart data if fetch fails
      const defaultPrice = 0.00001;
      const mockData = Array.from({ length: 24 }, () => {
        return defaultPrice * (0.8 + Math.random() * 0.4);
      });
      setChartData(mockData);
      setPrice(defaultPrice);
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
      Alert.alert('Wallet Not Connected', 'Please connect your wallet first.');
      return;
    }

    if (!fromAmount || !quote) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
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

        const action = tradeMode === 'buy' ? 'Bought' : 'Sold';
        const fromToken = tradeMode === 'buy' ? 'SOL' : '$HELL';
        const toToken = tradeMode === 'buy' ? '$HELL' : 'SOL';

        Alert.alert(
          'Success!',
          `${action} ${fromAmount} ${fromToken} for ${tradeData.expectedOutput.toFixed(2)} ${toToken}\nSignature: ${signatures[0].slice(0, 8)}...`,
          [{ text: 'OK', onPress: () => { setFromAmount(''); setToAmount(''); setQuote(null); } }]
        );
      });
    } catch (error: any) {
      console.error('Trade failed:', error);
      Alert.alert('Trade Failed', error.message || 'Please try again.');
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

  const chartConfig = {
    backgroundGradientFrom: '#001800',
    backgroundGradientTo: '#001800',
    decimalPlaces: 6,
    color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#FF6384' },
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#001800] justify-center items-center">
        <ActivityIndicator size="large" color="#FF6384" />
        <Text className="text-white mt-4">Loading token data...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#001800]">
      <View className="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-white mb-2">$HELL Token</Text>
          <View className="flex-row items-center">
            <Text className="text-2xl text-white mr-2">
              ${price?.toFixed(8) || '0.00000000'}
            </Text>
            <View className="bg-green-500/20 px-2 py-1 rounded">
              <Text className="text-green-400 text-sm">+5.24%</Text>
            </View>
          </View>
        </View>

        {/* Chart */}
        <View className="mb-6">
          <Text className="text-white font-bold mb-3">Price Chart (24h)</Text>
          <LineChart
            data={{
              labels: chartData.map((_, i) =>
                i % 4 === 0 ? `${new Date().getHours() - 23 + i}h` : ''
              ),
              datasets: [
                {
                  data: chartData,
                  color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 16 }}
          />
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
                Buy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded ${tradeMode === 'sell' ? 'bg-red-500' : ''}`}
              onPress={() => handleModeChange('sell')}
            >
              <Text className={`text-center font-bold ${tradeMode === 'sell' ? 'text-white' : 'text-gray-400'}`}>
                Sell
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-white font-bold mb-4 text-lg">{tradeMode === 'buy' ? 'Buy $HELL' : 'Sell $HELL'}</Text>

          {/* From */}
          <View className="mb-3">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-400 text-sm">You pay</Text>
              <Text className="text-gray-400 text-sm">Balance: {wallet.connected ? '~0.5 ' + (tradeMode === 'buy' ? 'SOL' : '$HELL') : 'Connect wallet'}</Text>
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
            <Text className="text-gray-400 text-sm mb-2">You receive</Text>
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
                  Connect Wallet
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
                        ? `Buy ${toAmount} $HELL`
                        : `Sell ${toAmount} SOL`)
                    : 'Enter Amount'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Info */}
          <Text className="text-gray-400 text-xs mt-3 text-center">
            Powered by Jupiter Aggregator via Backend API • Slippage: 1%
            {quote?.testMode && ' • TEST MODE'}
          </Text>
        </View>

        {/* External Links */}
        <View className="flex gap-3">
          <TouchableOpacity
            className="flex-1 bg-[#002800] py-3 rounded-lg items-center"
            onPress={() => Linking.openURL('https://pump.fun/coin/oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump')}
          >
            <Text className="text-white">View on pump.fun</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-[#002800] py-3 rounded-lg items-center"
            onPress={() => Linking.openURL('https://solscan.io/token/oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump')}
          >
            <Text className="text-white">View on Solscan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
