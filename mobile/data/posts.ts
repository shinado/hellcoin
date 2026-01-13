export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  featured?: boolean;
  categories?: string[];
  author?: {
    name: string;
    avatar?: string;
  };
  coverImage?: string;
  content: string;
  readingTime?: number;
}

export const posts: BlogPost[] = [
  {
    slug: 'what-is-hellcoin',
    title: 'What is Hellcoin?',
    description: 'Learn about Hellcoin, the digital hell money designed to solve hyperinflation in the underworld.',
    date: '2024-03-15',
    featured: true,
    categories: ['Introduction', 'Crypto'],
    author: {
      name: 'Hellcoin Team',
    },
    readingTime: 5,
    content: `# What is Hellcoin?

Hellcoin ($HELL) is a revolutionary cryptocurrency designed to solve the hyperinflation problem in the underworld economy.

## The Problem

In Chinese tradition, people burn paper money (hell money) to send wealth to their deceased ancestors. However, this has led to massive inflation in the underworld economy, making the currency nearly worthless.

## The Solution

Hellcoin creates a deflationary mechanism where tokens are "burned" (sent to addresses that start with DEAD and end with DEADRiP) and can never be recovered. This removes tokens from circulation, creating natural deflation.

## How It Works

1. **Buy $HELL** - Purchase Hellcoin from pump.fun
2. **Enter a name** - The name of your deceased loved one
3. **Burn tokens** - Send them to a special DEAD address
4. **Deflation** - Less tokens in circulation = higher value

## Key Features

- **Deflationary by design** - Every burn reduces total supply
- **Cultural significance** - Connects crypto with ancestral traditions
- **Transparent** - All burns are recorded on Solana blockchain
- **Community driven** - Built for the community, by the community

Join us in revolutionizing the underworld economy, one burn at a time! 🔥`,
  },
  {
    slug: 'how-do-i-burn-hellcoin',
    title: 'How do I burn Hellcoin?',
    description: 'A step-by-step guide to burning Hellcoin for your loved ones in the underworld.',
    date: '2024-03-14',
    categories: ['Guide', 'Tutorial'],
    author: {
      name: 'Hellcoin Team',
    },
    readingTime: 3,
    content: `# How to Burn Hellcoin

Burning Hellcoin is a simple process that takes just a few steps.

## Prerequisites

- A Solana wallet (Phantom recommended)
- Some $HELL tokens
- SOL for transaction fees

## Step-by-Step Guide

### Step 1: Connect Your Wallet

Open the Hellcoin app and tap "Connect Wallet". This will open Phantom (or your preferred wallet) for authorization.

### Step 2: Enter the Recipient's Name

Type the name of your deceased loved one in the "Burn to" field. This name will be transformed into a special Solana address that starts with "DEAD" and ends with "DEADRiP".

### Step 3: Enter Amount

Specify how many $HELL tokens you want to burn. The app will show you the approximate USD value.

### Step 4: Confirm Transaction

Tap "Transfer" and confirm the transaction in your wallet. Wait for the blockchain confirmation.

### Step 5: Done!

Once confirmed, your tokens are permanently removed from circulation. The recipient in the underworld will receive your offering.

## Important Notes

- Burned tokens cannot be recovered
- The DEAD address is generated algorithmically
- All burns are recorded on the Solana blockchain
- Transaction fees are minimal (< $0.01)

Happy burning! 🔥`,
  },
  {
    slug: 'how-do-i-get-hellcoin',
    title: 'How do I get Hellcoin?',
    description: 'Guide to purchasing Hellcoin ($HELL) tokens from pump.fun.',
    date: '2024-03-13',
    categories: ['Guide'],
    author: {
      name: 'Hellcoin Team',
    },
    readingTime: 3,
    content: `# How to Get Hellcoin

Getting Hellcoin ($HELL) is easy through pump.fun.

## What You Need

- A Solana wallet (Phantom, Solflare, etc.)
- Some SOL for purchase and fees
- Access to pump.fun

## Steps to Buy

### 1. Get SOL

If you don't have SOL, you can buy it from:
- Coinbase
- Binance
- Any major crypto exchange

Then transfer it to your Solana wallet.

### 2. Visit pump.fun

Go to [pump.fun/coin/oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump](https://pump.fun/coin/oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump)

### 3. Connect Wallet

Click "Connect Wallet" and authorize your Phantom wallet.

### 4. Buy $HELL

Enter the amount of SOL you want to spend and click "Buy".

### 5. Confirm Transaction

Confirm in your wallet and wait for the transaction to complete.

## Token Details

- **Token Address**: oLMyKTuqw8foxar2b11aZf7k7f4a9M8TRme5bh8pump
- **Network**: Solana
- **Decimals**: 6

Now you're ready to burn! 🔥`,
  },
  {
    slug: 'what-is-hell-money',
    title: 'What is Hell Money?',
    description: 'The cultural history behind hell money and its significance in Chinese tradition.',
    date: '2024-03-12',
    categories: ['Culture', 'History'],
    author: {
      name: 'Hellcoin Team',
    },
    readingTime: 6,
    content: `# What is Hell Money?

Hell money, also known as ghost money or spirit money, is a form of joss paper used in traditional Chinese ancestral worship.

## History

The practice dates back thousands of years in Chinese culture. It's believed that burning paper money sends wealth to deceased ancestors in the afterlife.

## Types of Hell Money

1. **Traditional Paper Money** - Simple rectangular papers
2. **Bank Notes** - Elaborate notes from the "Bank of Hell"
3. **Modern Goods** - Paper houses, cars, phones, etc.

## The Hyperinflation Problem

With billions of people burning money over centuries, the underworld economy has experienced massive inflation. Traditional hell money denominations have become practically worthless.

## Enter Hellcoin

Hellcoin solves this by creating a deflationary digital currency. Each burn permanently removes tokens from circulation, maintaining value in the underworld economy.

## Cultural Significance

Hellcoin bridges ancient tradition with modern technology, allowing people to honor their ancestors while participating in the crypto economy.`,
  },
  {
    slug: 'does-underworld-suffer-from-inflation',
    title: 'Does Underworld Suffer from Inflation?',
    description: 'Exploring the economic challenges of the afterlife and how Hellcoin addresses them.',
    date: '2024-03-11',
    categories: ['Economics', 'Culture'],
    author: {
      name: 'Hellcoin Team',
    },
    readingTime: 5,
    content: `# Does Underworld Suffer from Inflation?

Short answer: Yes, massively.

## The Scale of the Problem

Every year, during festivals like Qingming (Tomb Sweeping Day) and Ghost Month, billions of hell money notes are burned worldwide. Over centuries, this has led to hyperinflation of epic proportions.

## The Numbers

- **Qingming Festival**: Over 4 billion people participate
- **Ghost Month**: Millions of tons of paper burned
- **Cumulative Effect**: Trillions of hell dollars added yearly

## Economic Consequences

In traditional hell money terms:
- A bowl of rice might cost millions
- A house could cost trillions
- New arrivals are essentially worthless

## The Hellcoin Solution

By implementing a deflationary mechanism:
1. Limited initial supply
2. Permanent burns reduce circulation
3. Value increases over time
4. Fair distribution in afterlife

## Conclusion

Hellcoin represents economic reform for the underworld, bringing sound monetary policy to the afterlife.`,
  },
  {
    slug: 'what-is-central-bank-of-underworld',
    title: 'What is Central Bank of Underworld?',
    description: 'Understanding the role of the Central Bank of Underworld in the Hellcoin ecosystem.',
    date: '2024-03-10',
    categories: ['Economics', 'Hellcoin'],
    author: {
      name: 'Hellcoin Team',
    },
    readingTime: 4,
    content: `# What is Central Bank of Underworld?

The Central Bank of Underworld is a special address in the Hellcoin ecosystem: DEADCentra1BankofUnderwor1dooooooopoDEADRiP

## Purpose

This address serves as the primary treasury for underworld operations:
- Collects a portion of burned tokens
- Maintains underworld liquidity
- Funds afterlife infrastructure

## How It Works

When tokens are burned, they're sent to DEAD addresses. The Central Bank address is one such destination, reserved for official protocol use.

## Transparency

All transactions to and from the Central Bank are visible on the Solana blockchain:
- View on Solscan
- Track token movements
- Verify burns

## Governance

The Central Bank is controlled by... well, that's between the underworld and its residents. 🔥`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
