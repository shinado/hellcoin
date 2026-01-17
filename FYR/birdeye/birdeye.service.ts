import { Injectable, Logger } from '@nestjs/common';
import { EnvKeys } from '../../common/env-keys.enum';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosHeaders } from 'axios';
import { batchMapFetcher } from '../../common/batch-fetcher';
import { isEmptyArray, isEmptyMap } from '../../common/fn';

const BASE_URL = 'https://public-api.birdeye.so';

export interface OHLDV_Item {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  unixTime: number;
  address: string;
  type: string;
  currency: string;
}

export interface PriceData {
  value: string;
  updateUnixTime: number;
  updateHumanTime: string;
  priceInNative: number;
  priceChange24h: number;
  liquidity: number;
}

export interface PriceVolumeData {
  price: string;
  updateUnixTime: number;
  updateHumanTime: string;
  volumeUSD: number;
  priceChangePercent: number;
  volumeChangePercent: number;
}

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  extensions?: {
    coingecko_id?: string;
    website?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    medium?: string;
    description?: string;
    tiktok?: string;
  };
  logo_uri: string;
}

export interface MarketData {
  network: string;
  address: string;
  liquidity: number;
  price: number;
  total_supply: number;
  circulating_supply: number;
  fdv: number;
  market_cap: number;
}

export interface TradeDataRaw {
  address: string;
  holder: number;
  market: number;
  last_trade_unix_time: number;
  price: number;
  history_30m_price: number;
  price_change_30m_percent: number;
  history_1h_price: number;
  price_change_1h_percent: number;
  history_2h_price: number;
  price_change_2h_percent: number;
  history_4h_price: number;
  price_change_4h_percent: number;
  history_6h_price: number;
  price_change_6h_percent: number;
  history_8h_price: number;
  price_change_8h_percent: number;
  history_12h_price: number;
  price_change_12h_percent: number;
  history_24h_price: number;
  price_change_24h_percent: number;
  trade_30m: number;
  trade_history_30m: number;
  trade_30m_change_percent: number;
  volume_30m: number;
  volume_30m_usd: number;
  volume_history_30m: number;
  volume_history_30m_usd: number;
  volume_30m_change_percent: number;
  trade_1h: number;
  trade_history_1h: number;
  trade_1h_change_percent: number;
  volume_1h: number;
  volume_1h_usd: number;
  volume_history_1h: number;
  volume_history_1h_usd: number;
  volume_1h_change_percent: number;
  trade_2h: number;
  trade_history_2h: number;
  trade_2h_change_percent: number;
  volume_2h: number;
  volume_2h_usd: number;
  volume_history_2h: number;
  volume_history_2h_usd: number;
  volume_2h_change_percent: number;
  trade_4h: number;
  trade_history_4h: number;
  trade_4h_change_percent: number;
  volume_4h: number;
  volume_4h_usd: number;
  volume_history_4h: number;
  volume_history_4h_usd: number;
  volume_4h_change_percent: number;
  trade_8h: number;
  trade_history_8h: number;
  trade_8h_change_percent: number;
  volume_8h: number;
  volume_8h_usd: number;
  volume_history_8h: number;
  volume_history_8h_usd: number;
  volume_8h_change_percent: number;
  trade_24h: number;
  trade_history_24h: number;
  trade_24h_change_percent: number;
  volume_24h: number;
  volume_24h_usd: number;
  volume_history_24h: number;
  volume_history_24h_usd: number;
  volume_24h_change_percent: number;
}

export interface TradeData {
  network: string;
  address: string;
  holder: number;
  price: number;
  price_change_24h_percent: number;
  volume_24h: number;
  volume_24h_usd: number;
  volume_24h_change_percent: number;
}

export interface SearchedToken {
  name: string;
  symbol: string;
  network: string;
  address: string;
  decimals: number;
  fdv: number;
  market_cap: number;
  liquidity: number;
  volume_24h_change_percent: number;
  price: number;
  price_change_24h_percent: number;
  trade_24h: number;
  trade_24h_change_percent: number;
  volume_24h_usd: number;
  logo_uri: string;
}

// Single timestamp price query
export interface PriceAtTimestamp {
  value: number;
  updateUnixTime: number;
  priceChange24h: number;
}

// Price sequence data point
export interface PriceDataPoint {
  unixTime: number;
  value: number;
}

export interface TokenOverview {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  logoURI: string;
  
  // Price data
  price: number;
  priceChange24hPercent: number;
  
  // Market data
  marketCap: number;
  fdv: number;
  liquidity: number;
  
  // Volume data
  v24hUSD: number;
  v24hChangePercent: number;
  
  // Trade data
  trade24h: number;
  trade24hChangePercent: number;
  
  // Supply data
  totalSupply: number;
  circulatingSupply: number;
  
  // Holder data
  holder: number;
}

export interface TokenTransactionAsset {
  symbol: string;
  decimals: number;
  address: string;
  amount: number;
  uiAmount: number;
  price: number;
  nearestPrice: number;
  changeAmount: number;
  uiChangeAmount: number;
  isScaledUiToken: boolean;
  multiplier: number | null;
}

export interface TokenTransaction {
  quote: TokenTransactionAsset;
  base: TokenTransactionAsset;
  basePrice: number;
  quotePrice: number;
  txHash: string;
  source: string;
  blockUnixTime: number;
  txType: string;
  owner: string;
  side: 'buy' | 'sell';
  alias: string | null;
  pricePair: number;
  from: TokenTransactionAsset;
  to: TokenTransactionAsset;
  tokenPrice: number;
  poolId: string;
}

export interface TokenTransactionsResponse {
  items: TokenTransaction[];
  hasNext: boolean;
}

@Injectable()
export default class BirdeyeService {
  private logger = new Logger(BirdeyeService.name);
  private readonly apiKey: string;

  constructor(
    configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = configService.get<string>(EnvKeys.BIRDEYE_API_KEY);
    if (!this.apiKey) {
      throw new Error(`${EnvKeys.BIRDEYE_API_KEY} is not set`);
    }
  }

  private buildHeaders(chain: string) {
    return new AxiosHeaders({
      'x-api-key': this.apiKey,
      'x-chain': chain,
    });
  }

  async findKLines(
    chain: string,
    address: string,
    type: string,
    time_from: number,
    time_to: number,
  ): Promise<OHLDV_Item[]> {
    const params = {
      address,
      type,
      time_from,
      time_to,
      currency: 'usd',
    };
    this.logger.debug({ tag: 'findKLines', ...params });
    const response = await this.httpService.axiosRef.get(
      `${BASE_URL}/defi/ohlcv`,
      {
        headers: this.buildHeaders(chain),
        params,
      },
    );
    return (response?.data?.data?.items as OHLDV_Item[]) || [];
  }

  async findPrice(chain: string, address: string): Promise<PriceData> {
    this.logger.debug({ tag: 'findPrice', chain, address });
    const response = await this.httpService.axiosRef.get(
      `${BASE_URL}/defi/price`,
      {
        headers: this.buildHeaders(chain),
        params: {
          address,
        },
      },
    );
    return (response?.data?.data as PriceData) || null;
  }

  async findPriceMulti(
    chain: string,
    mints: string[],
  ): Promise<Map<string, PriceData>> {
    return batchMapFetcher<string, string, PriceData>(
      mints,
      100,
      async (subMints: string[]) => {
        this.logger.debug({ tag: 'findPriceMulti', subMints, chain });
        const response = await this.httpService.axiosRef.post(
          `${BASE_URL}/defi/multi_price`,
          {
            list_address: subMints.join(','),
          },
          {
            headers: this.buildHeaders(chain),
          },
        );
        return this.obj2map<PriceData>(response?.data?.data);
      },
    );
  }

  async findPriceVolume(
    chain: string,
    address: string,
  ): Promise<PriceVolumeData> {
    this.logger.debug({ tag: 'findPriceVolume', chain, address });
    const response = await this.httpService.axiosRef.get(
      `${BASE_URL}/defi/price_volume/single`,
      {
        headers: this.buildHeaders(chain),
        params: {
          address,
          type: '24h',
        },
      },
    );
    return (response?.data?.data as PriceVolumeData) || null;
  }

  async findPriceVolumeMulti(
    chain: string,
    mints: string[],
  ): Promise<Map<string, PriceVolumeData>> {
    return batchMapFetcher<string, string, PriceVolumeData>(
      mints,
      50,
      async (subMints: string[]) => {
        this.logger.debug({ tag: 'findPriceVolumeMulti', subMints, chain });
        const response = await this.httpService.axiosRef.post(
          `${BASE_URL}/defi/price_volume/multi`,
          {
            list_address: subMints.join(','),
            type: '24h',
          },
          {
            headers: this.buildHeaders(chain),
          },
        );
        return this.obj2map<PriceVolumeData>(response?.data?.data);
      },
    );
  }

  async findTokenMetadata(
    chain: string,
    address: string,
  ): Promise<TokenMetadata> {
    this.logger.debug({ tag: 'findTokenMetadata', chain, address });
    const response = await this.httpService.axiosRef.get(
      `${BASE_URL}/defi/v3/token/meta-data/single`,
      {
        headers: this.buildHeaders(chain),
        params: {
          address,
        },
      },
    );
    return (response?.data?.data as TokenMetadata) || null;
  }

  async findTokenMetadataMulti(
    chain: string,
    mints: string[],
  ): Promise<Map<string, TokenMetadata>> {
    // 去重 - 防御性编程，避免重复的 API 调用
    const uniqueMints = [...new Set(mints)];
    
    return batchMapFetcher<string, string, TokenMetadata>(
      uniqueMints,
      50,
      async (subMints: string[]) => {
        this.logger.debug({ 
          tag: 'findTokenMetadataMulti', 
          count: subMints.length,
          chain 
        });
        const response = await this.httpService.axiosRef.get(
          `${BASE_URL}/defi/v3/token/meta-data/multiple`,
          {
            headers: this.buildHeaders(chain),
            params: {
              list_address: subMints.join(','),
            },
          },
        );
        return this.obj2map<TokenMetadata>(response?.data?.data);
      },
    );
  }

  async findMarketData(chain: string, address: string): Promise<MarketData> {
    this.logger.debug({ tag: 'findMarketData', chain, address });
    const response = await this.httpService.axiosRef.get(
      `${BASE_URL}/defi/v3/token/market-data`,
      {
        headers: this.buildHeaders(chain),
        params: {
          address,
        },
      },
    );
    const result = (response?.data?.data as MarketData) || null;
    if (!result) return null;
    result.network = chain;
    return result;
  }

  async findMarketDataMulti(
    chain: string,
    mints: string[],
  ): Promise<Map<string, MarketData>> {
    // 去重 - 防御性编程，避免重复的 API 调用
    const uniqueMints = [...new Set(mints)];
    
    return batchMapFetcher<string, string, MarketData>(
      uniqueMints,
      20,
      async (subMints: string[]) => {
        this.logger.debug({ 
          tag: 'findMarketDataMulti', 
          count: subMints.length,
          chain 
        });
        const response = await this.httpService.axiosRef.get(
          `${BASE_URL}/defi/v3/token/market-data/multiple`,
          {
            headers: this.buildHeaders(chain),
            params: {
              list_address: subMints.join(','),
            },
          },
        );
        const result = this.obj2map<MarketData>(response?.data?.data);
        if (isEmptyMap(result)) return result;
        const map = new Map<string, MarketData>();
        for (const [key, value] of result.entries()) {
          value.network = chain;
        }
        return map;
      },
    );
  }

  async findTradeData(chain: string, address: string): Promise<TradeData> {
    this.logger.debug({ tag: 'findTradeData', chain, address });
    const response = await this.httpService.axiosRef.get(
      `${BASE_URL}/defi/v3/token/trade-data/single`,
      {
        headers: this.buildHeaders(chain),
        params: {
          address,
        },
      },
    );
    return this.tradeDataSlim(chain, response?.data?.data as TradeDataRaw);
  }

  async findTradeDataMulti(
    chain: string,
    mints: string[],
  ): Promise<Map<string, TradeData>> {
    // 去重 - 防御性编程，避免重复的 API 调用
    const uniqueMints = [...new Set(mints)];
    
    return batchMapFetcher<string, string, TradeData>(
      uniqueMints,
      20,
      async (subMints: string[]) => {
        this.logger.debug({ 
          tag: 'findTradeDataMulti', 
          count: subMints.length,
          chain 
        });
        const response = await this.httpService.axiosRef.get(
          `${BASE_URL}/defi/v3/token/trade-data/multiple`,
          {
            headers: this.buildHeaders(chain),
            params: {
              list_address: subMints.join(','),
            },
          },
        );
        const result = this.obj2map<TradeDataRaw>(response?.data?.data);
        const map = new Map<string, TradeData>();
        if (!isEmptyMap(result)) {
          for (const [key, value] of result.entries()) {
            map.set(key, this.tradeDataSlim(chain, value));
          }
        }
        return map;
      },
    );
  }

  private tradeDataSlim(network: string, data: TradeDataRaw): TradeData {
    if (!data) return null;
    return {
      network,
      address: data.address,
      holder: data.holder,
      price: data.price,
      price_change_24h_percent: data.price_change_24h_percent,
      volume_24h: data.volume_24h,
      volume_24h_usd: data.volume_24h_usd,
      volume_24h_change_percent: data.volume_24h_change_percent,
    };
  }

  async findPriceAtTimestamp(
    chain: string,
    address: string,
    unixtime: number,
  ): Promise<PriceAtTimestamp> {
    this.logger.debug({ tag: 'findPriceAtTimestamp', chain, address, unixtime });
    const response = await this.httpService.axiosRef.get(
      `${BASE_URL}/defi/historical_price_unix`,
      {
        headers: this.buildHeaders(chain),
        params: {
          address,
          unixtime,
        },
      },
    );
    return (response?.data?.data as PriceAtTimestamp) || null;
  }


  async findPriceSequence(
    chain: string,
    address: string,
    type: string,
    time_from: number,
    time_to: number,
  ): Promise<PriceDataPoint[]> {
    this.logger.debug({ tag: 'findPriceSequence', chain, address, type, time_from, time_to });
    const response = await this.httpService.axiosRef.get(
      `${BASE_URL}/defi/history_price`,
      {
        headers: this.buildHeaders(chain),
        params: {
          address,
          type,
          time_from,
          time_to,
        },
      },
    );
    return (response?.data?.data?.items as PriceDataPoint[]) || [];
  }

  async search(chain: string, keyword: string): Promise<SearchedToken[]> {
    this.logger.debug({ tag: 'search', chain, keyword });
    const response = await this.httpService.axiosRef.get(
      `${BASE_URL}/defi/v3/search`,
      {
        headers: this.buildHeaders(chain),
        params: {
          chain,
          keyword,
          target: 'token',
          search_mode: 'fuzzy',
          search_by: 'combination', // address, name, symbol
          sort_type: 'desc',
          sort_by: 'volume_24h_usd',
          offset: 0,
          limit: 20,
        },
      },
    );
    const items = response?.data?.data?.items || [];
    if (isEmptyArray(items)) return [];
    return items.find((it: any) => it.type === 'token')?.result || [];
  }

  async findTokenOverview(chain: string, address: string): Promise<TokenOverview> {
    this.logger.debug({ tag: 'findTokenOverview', chain, address });
    const response = await this.httpService.axiosRef.get(
      `${BASE_URL}/defi/token_overview`,
      {
        headers: this.buildHeaders(chain),
        params: {
          address,
          frames: '24h', // Only request 24h data to reduce bandwidth
        },
      },
    );
    return (response?.data?.data as TokenOverview) || null;
  }

  async findRecentTrades(
    chain: string,
    address: string,
    options?: {
      offset?: number;
      limit?: number;
      txType?: string;
      sortType?: 'asc' | 'desc';
    },
  ): Promise<TokenTransactionsResponse> {
    const { offset = 0, limit = 20, txType = 'swap', sortType = 'desc' } = options || {};
    this.logger.debug({ tag: 'findRecentTrades', chain, address, offset, limit, txType, sortType });
    const response = await this.httpService.axiosRef.get(
      `${BASE_URL}/defi/txs/token`,
      {
        headers: this.buildHeaders(chain),
        params: {
          address,
          offset,
          limit,
          tx_type: txType,
          sort_type: sortType,
          ui_amount_mode: 'scaled',
        },
      },
    );
    return (response?.data?.data as TokenTransactionsResponse) || { items: [], hasNext: false };
  }

  private obj2map<T>(obj: { [key: string]: T }): Map<string, T> {
    if (!obj) return null;
    const result = new Map<string, T>();
    for (const k of Object.keys(obj)) {
      result.set(k, obj[k]);
    }
    return result;
  }
}
