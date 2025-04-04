import { ethers } from 'ethers';
import { NextResponse } from 'next/server';

// Fake wallet address for demo
const FAKE_WALLET_ADDRESS = '0xFakeBackendWallet1234567890abcdef1234567890';

// In-memory points and ETH storage (replace with database in production)
const userPoints = {};
const userEthEarned = {}; // Tracks total ETH earned per user

console.log(`Demo backend wallet address: ${FAKE_WALLET_ADDRESS}`);

export async function GET(request) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get('walletAddress');

  if (!ethers.isAddress(walletAddress)) {
    return NextResponse.json(
      { success: false, error: 'Invalid wallet address' },
      { status: 400 }
    );
  }

  // Initialize new users with 1000 points if not already set
  if (!userPoints[walletAddress]) {
    userPoints[walletAddress] = 1000;
    userEthEarned[walletAddress] = 0;
    console.log(`Initialized new user ${walletAddress} with 1000 points and 0 FakeETH`);
  }

  return NextResponse.json({
    success: true,
    points: userPoints[walletAddress],
    ethEarned: userEthEarned[walletAddress]
  });
}

export async function POST(request) {
  try {
    const { rewardId, pointsCost, walletAddress, cryptoAmount, cryptoType } = await request.json();

    // Validate inputs
    if (!ethers.isAddress(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Initialize new users with starting points
    if (!userPoints[walletAddress]) {
      userPoints[walletAddress] = 1000;
      userEthEarned[walletAddress] = 0;
      console.log(`Initialized new user ${walletAddress} with 1000 points and 0 FakeETH`);
    }

    if (userPoints[walletAddress] < pointsCost) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Insufficient points (${userPoints[walletAddress]}/${pointsCost})`
        },
        { status: 400 }
      );
    }

    // Simulate transaction
    const fakeTxHash = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`;
    console.log(`Simulated transaction: ${fakeTxHash}`);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update user points and ETH earned
    userPoints[walletAddress] -= pointsCost;
    userEthEarned[walletAddress] = (userEthEarned[walletAddress] || 0) + cryptoAmount;

    return NextResponse.json({
      success: true,
      txHash: fakeTxHash,
      updatedPoints: userPoints[walletAddress],
      ethEarned: userEthEarned[walletAddress],
      message: `Sent ${cryptoAmount} FakeETH to ${walletAddress} (demo mode)`
    });

  } catch (error) {
    console.error('Redemption error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error.reason || error.code || 'Unknown error'
      },
      { status: 500 }
    );
  }
}