import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import api, { TokenHolder } from '../../services/api';
import { isUnderworldAddress } from '../../utils/addressTransform';

const screenWidth = Dimensions.get('window').width;

interface DistributionData {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

const NAME_MAPPINGS: Record<string, { name: string; color: string }> = {
  '7GqFL3YoxcbAsxPYAJW9qfMjbB16E2uV2R2DS4FYus6U': {
    name: 'pump.fun Pool',
    color: '#FF6384',
  },
  'DEADCentra1BankofUnderwor1dooooooopoDEADRiP': {
    name: 'Central Bank of Underworld',
    color: '#36A2EB',
  },
};

export default function DistributionScreen() {
  const [loading, setLoading] = useState(true);
  const [distributionData, setDistributionData] = useState<DistributionData[]>([]);
  const [topHolders, setTopHolders] = useState<TokenHolder[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const holders = await api.getTokenHolders();
      setTopHolders(holders.slice(0, 10));
      
      const distribution = processHolderDistribution(holders);
      setDistributionData(distribution);
    } catch (error) {
      console.error('Error fetching distribution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processHolderDistribution = (holders: TokenHolder[]): DistributionData[] => {
    const pumpFunAddress = '7GqFL3YoxcbAsxPYAJW9qfMjbB16E2uV2R2DS4FYus6U';

    let pumpFunAmount = 0;
    let underworldAmount = 0;
    let realWorldAmount = 0;

    holders.forEach((holder) => {
      if (holder.owner === pumpFunAddress) {
        pumpFunAmount += holder.amount;
      } else if (isUnderworldAddress(holder.owner)) {
        underworldAmount += holder.amount;
      } else {
        realWorldAmount += holder.amount;
      }
    });

    const total = pumpFunAmount + underworldAmount + realWorldAmount;

    return [
      {
        name: 'pump.fun Pool',
        amount: Math.round((pumpFunAmount / total) * 100),
        color: '#FF6384',
        legendFontColor: '#fff',
        legendFontSize: 12,
      },
      {
        name: 'Underworld',
        amount: Math.round((underworldAmount / total) * 100),
        color: '#36A2EB',
        legendFontColor: '#fff',
        legendFontSize: 12,
      },
      {
        name: 'Real World',
        amount: Math.round((realWorldAmount / total) * 100),
        color: '#FFCE56',
        legendFontColor: '#fff',
        legendFontSize: 12,
      },
    ];
  };

  const getCategoryInfo = (address: string) => {
    const mapping = NAME_MAPPINGS[address];
    if (mapping) {
      return { category: mapping.name, color: mapping.color };
    }

    if (isUnderworldAddress(address)) {
      return { category: 'Underworld Holdings', color: '#36A2EB' };
    }

    if (address === '89i8GFzzmda7m8ks9eTdWk12vLQqL2dXeEyZHKsW7Yso') {
      return { category: 'Developer Holdings', color: '#FFCE56' };
    }

    return { category: 'Real World Holdings', color: '#FFCE56' };
  };

  if (loading) {
    return (
      <View className="flex-1 bg-hell-green justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
        <Text className="text-white mt-4">Loading distribution data...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#002200]">
      <View className="py-8 px-4">
        <Text className="text-3xl font-bold text-white text-center mb-8">
          Token Distribution
        </Text>

        {/* Pie Chart */}
        <View className="items-center mb-8">
          <PieChart
            data={distributionData}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
          />
        </View>

        {/* Deadboard / Leaderboard */}
        <Text className="text-2xl font-bold text-white text-center mb-6">
          Deadboard
        </Text>

        <View className="bg-gray-800 rounded-lg overflow-hidden">
          {/* Header */}
          <View className="flex-row bg-gray-700 py-3 px-4">
            <Text className="text-gray-300 text-xs font-medium w-12">Rank</Text>
            <Text className="text-gray-300 text-xs font-medium flex-1">Address</Text>
            <Text className="text-gray-300 text-xs font-medium text-right w-24">Amount</Text>
          </View>

          {/* Rows */}
          {topHolders.map((holder, index) => {
            const { category, color } = getCategoryInfo(holder.owner);
            
            return (
              <TouchableOpacity
                key={holder.address || index}
                className="flex-row py-4 px-4 border-b border-gray-700"
                onPress={() => Linking.openURL(`https://solscan.io/address/${holder.owner}`)}
              >
                <Text className="text-gray-300 w-12">#{index + 1}</Text>
                <View className="flex-1 pr-2">
                  <Text className="text-gray-300 text-xs" numberOfLines={1}>
                    {holder.owner.slice(0, 8)}...{holder.owner.slice(-8)}
                  </Text>
                  <View 
                    className="mt-1 px-2 py-0.5 rounded-full self-start"
                    style={{ backgroundColor: `${color}20`, borderColor: color, borderWidth: 1 }}
                  >
                    <Text style={{ color }} className="text-xs">
                      {category}
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-300 text-right w-24">
                  {holder.amount.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
