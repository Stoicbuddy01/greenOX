'use client';
import { Gift, Trophy, Star, Coins, Gem, Zap, Sparkles, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

function getEthereum() {
  if (typeof window === 'undefined') return undefined;
  return window.ethereum;
}

export default function RewardsPage() {
  const [animatedPoints, setAnimatedPoints] = useState(200); // Start with 200 points
  const [animatedLevel, setAnimatedLevel] = useState(Math.floor(200 / 250)); // Initial level based on points
  const [walletAddress, setWalletAddress] = useState("");
  const [fakeEthBalance, setFakeEthBalance] = useState(0.0);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Array<{
    id: string;
    reward: string;
    points: number;
    cryptoAmount: number;
    cryptoType: string;
    status: 'pending' | 'completed' | 'failed';
    txHash?: string;
    date: string;
    error?: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  const rewards = [
    {
      icon: <Gem className="h-10 w-10" />,
      title: "Eco Warrior Badge",
      points: 100,
      cryptoAmount: 0.001,
      cryptoType: "ETH",
      description: "Exclusive NFT badge for top contributors",
      status: "unlocked"
    },
    {
      icon: <Coins className="h-10 w-10" />,
      title: "$100 Gift Card",
      points: 1000,
      cryptoAmount: 0.002,
      cryptoType: "ETH",
      description: "Redeemable at eco-friendly stores",
      status: "unlocked"
    },
    {
      icon: <Zap className="h-10 w-10" />,
      title: "Solar Charger",
      points: 2000,
      cryptoAmount: 0.005,
      cryptoType: "ETH",
      description: "Portable solar-powered device",
      status: "locked"
    },
    {
      icon: <Trophy className="h-10 w-10" />,
      title: "Community Leader",
      points: 5000,
      cryptoAmount: 0.01,
      cryptoType: "ETH",
      description: "Featured on our leaderboard",
      status: "locked"
    },
    {
      icon: <Star className="h-10 w-10" />,
      title: "VIP Event Access",
      points: 7500,
      cryptoAmount: 0.015,
      cryptoType: "ETH",
      description: "Invitation to annual sustainability summit",
      status: "locked"
    },
    {
      icon: <Gift className="h-10 w-10" />,
      title: "Custom Reward",
      points: 10000,
      cryptoAmount: 0.02,
      cryptoType: "ETH",
      description: "Design your own eco-friendly reward",
      status: "locked"
    }
  ];

  const milestones = [
    { points: 100, reward: "Starter Pack" },
    { points: 500, reward: "Eco Warrior Status" },
    { points: 1000, reward: "First Gift Card" },
    { points: 5000, reward: "Leaderboard Feature" }
  ];

  useEffect(() => {
    const ethereum = getEthereum();
    setIsMetaMaskInstalled(!!ethereum?.isMetaMask);
  }, []);

  const connectMetaMask = async () => {
    try {
      const ethereum = getEthereum();
      if (!ethereum) {
        window.open('https://metamask.io/download.html', '_blank');
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      setFakeEthBalance(0.1);
      alert('Connected to MetaMask - Using simulated Ethereum network');
    } catch (error) {
      console.error("Error connecting MetaMask:", error);
      alert("Failed to connect MetaMask. Please try again.");
    }
  };

  const handleRedeem = async (rewardId: number, pointsCost: number) => {
    if (!walletAddress) {
      alert('Please connect your MetaMask wallet first');
      return;
    }

    if (animatedPoints < pointsCost) {
      alert('Insufficient points to redeem this reward');
      return;
    }

    setIsLoading(true);
    
    const newTxId = Date.now().toString();
    const currentDate = new Date().toLocaleString();
    const fakeTxHash = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`;
    
    setTransactions(prev => [{
      id: newTxId,
      reward: rewards[rewardId].title,
      points: pointsCost,
      cryptoAmount: rewards[rewardId].cryptoAmount,
      cryptoType: rewards[rewardId].cryptoType,
      status: 'pending',
      date: currentDate,
      txHash: fakeTxHash
    }, ...prev]);

    try {
      const reward = rewards[rewardId];
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update points and level dynamically
      const updatedPoints = animatedPoints - pointsCost;
      setAnimatedPoints(updatedPoints);
      setAnimatedLevel(Math.floor(updatedPoints / 250));
      setFakeEthBalance(prev => Number((prev + reward.cryptoAmount).toFixed(6)));

      setTransactions(prev => prev.map(tx =>
        tx.id === newTxId
          ? { ...tx, status: 'completed' }
          : tx
      ));

      alert(`Successfully redeemed! ${reward.cryptoAmount} ETH added to your wallet\nTransaction: ${fakeTxHash}`);

    } catch (error: any) {
      console.error('Redemption error:', error);
      setTransactions(prev => prev.map(tx =>
        tx.id === newTxId
          ? { ...tx, status: 'failed', error: error.message || 'Transaction failed' }
          : tx
      ));
      alert(`Error: ${error.message || 'Transaction failed'}`);
    } finally {
      setIsLoading(false);
      setShowWalletModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50">
      {/* Wallet Connection Banner */}
      {!walletAddress && (
        <div className="bg-amber-100 text-amber-800 p-4 text-center shadow-sm">
          <p className="text-sm">
            {isMetaMaskInstalled ? (
              <Button onClick={connectMetaMask} variant="link" className="text-amber-800 underline font-medium">
                Connect MetaMask to access your ETH wallet
              </Button>
            ) : (
              <span>
                Install <a href="https://metamask.io/download.html" target="_blank" className="underline font-medium">MetaMask</a> to manage your ETH
              </span>
            )}
          </p>
        </div>
      )}

      {/* Wallet Modal */}
      {showWalletModal && selectedReward !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-2xl max-w-md w-full shadow-xl border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Transaction</h3>
            <p className="text-sm text-gray-600 mb-4">
              Redeem {rewards[selectedReward].points} points for {rewards[selectedReward].cryptoAmount} ETH
            </p>
            
            {walletAddress && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-mono text-gray-700 break-all">To: {walletAddress}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={() => handleRedeem(selectedReward, rewards[selectedReward].points)}
                disabled={isLoading || !walletAddress}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? 'Processing...' : 'Sign & Redeem'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowWalletModal(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-24 px-6 text-center overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <span className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-6 shadow-sm">
            <TrendingUp className="mr-2 h-4 w-4" />
            Sustainable Actions • Ethereum Rewards
          </span>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-emerald-600 to-lime-500 bg-clip-text text-transparent">
              Green Rewards
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Earn Ethereum by making a positive environmental impact
          </p>
        </motion.div>
      </section>

      {/* Wallet Section */}
      {walletAddress && (
        <section className="py-16 px-6 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Ethereum Wallet</h2>
                <p className="text-gray-600">ETH earned from eco-friendly actions</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-6 w-6 fill-white">
                    <path d="M16 0c8.837 0 16 7.163 16 16s-7.163 16-16 16S0 24.837 0 16 7.163 0 16 0zm0 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm-.3 5h.9c3.6 0 5.4 1.8 5.4 5.4v.3c0 3.3-1.5 5.1-4.5 5.2v1.5h-3.3v-1.5h-2.4v-3.6h2.4v-3.3h-2.4v-3.6h3.9zm.3 3.6h-1.2v3.3h1.2c1.5 0 2.1-.6 2.1-1.8v-.3c0-1.2-.6-1.8-2.1-1.8z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Wallet Address</p>
                  <p className="text-sm font-mono text-gray-900">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Balance</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{fakeEthBalance.toFixed(4)} ETH</p>
                    <p className="text-sm text-gray-500 mt-1">≈ ${(fakeEthBalance * 3000).toFixed(2)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="h-5 w-5 fill-gray-700">
                      <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Available</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{(fakeEthBalance * 0.9).toFixed(4)} ETH</p>
                    <p className="text-sm text-gray-500 mt-1">Ready to use</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-5 w-5 fill-emerald-600">
                      <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{(fakeEthBalance * 0.1).toFixed(4)} ETH</p>
                    <p className="text-sm text-gray-500 mt-1">Processing</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-5 w-5 fill-amber-500">
                      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* User Progress */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="bg-white rounded-3xl p-8 shadow-lg border border-emerald-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Impact</h2>
                <p className="text-gray-600">Every action counts!</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <motion.div 
                  key={animatedPoints}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-emerald-50 p-6 rounded-xl text-center border border-emerald-100"
                >
                  <div className="text-4xl font-bold text-emerald-600">{animatedPoints}</div>
                  <p className="text-gray-600 text-sm mt-2">Points</p>
                </motion.div>
                <motion.div 
                  key={animatedLevel}
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-lime-50 p-6 rounded-xl text-center border border-lime-100"
                >
                  <div className="text-4xl font-bold text-lime-600">{animatedLevel}</div>
                  <p className="text-gray-600 text-sm mt-2">Level</p>
                </motion.div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Journey</h3>
              <div className="relative pt-4">
                <div className="absolute top-1/2 h-2 w-full bg-gray-200 rounded-full -translate-y-1/2"></div>
                <motion.div 
                  className="absolute top-1/2 h-2 bg-gradient-to-r from-emerald-400 to-lime-400 rounded-full -translate-y-1/2"
                  initial={{ width: `${(200 / 5000) * 100}%` }} // Initial width based on 200 points
                  animate={{ width: `${(animatedPoints / 5000) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
                
                <div className="relative flex justify-between">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <motion.div 
                        className={`h-6 w-6 rounded-full mb-2`}
                        initial={{ backgroundColor: animatedPoints >= milestone.points ? '#10b981' : '#d1d5db' }}
                        animate={{ 
                          backgroundColor: animatedPoints >= milestone.points ? '#10b981' : '#d1d5db',
                          scale: animatedPoints >= milestone.points ? 1.1 : 1
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {animatedPoints >= milestone.points && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-full w-full rounded-full ring-4 ring-emerald-200"
                          />
                        )}
                      </motion.div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">{milestone.points}</p>
                        <p className="text-xs text-gray-500">{milestone.reward}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Rewards Gallery */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Claim Your <span className="text-emerald-600">Rewards</span></h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Redeem your points for Ethereum and eco-friendly rewards
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rewards.map((reward, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8 }}
                className={`bg-white rounded-2xl p-6 shadow-md ${reward.status === 'unlocked' ? 'border-2 border-emerald-200' : 'border border-gray-200'} hover:shadow-xl transition-all`}
              >
                <div className={`flex items-center justify-center h-14 w-14 rounded-xl mb-6 ${reward.status === 'unlocked' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  {reward.icon}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{reward.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    {reward.points} pts
                  </span>
                  <Button 
                    size="sm" 
                    className={reward.status === 'unlocked' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300 text-gray-600'}
                    disabled={reward.status !== 'unlocked' || isLoading || animatedPoints < reward.points}
                    onClick={() => {
                      setSelectedReward(index);
                      setShowWalletModal(true);
                    }}
                  >
                    {reward.status === 'unlocked' ? `Redeem (${reward.cryptoAmount} ETH)` : 'Locked'}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transactions Section */}
      {walletAddress && (
        <section className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Transaction History</h2>
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No transactions yet. Redeem a reward to see your history!
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {transactions.slice(0, 5).map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          tx.status === 'completed' ? 'bg-emerald-100' : 
                          tx.status === 'pending' ? 'bg-amber-100' : 'bg-red-100'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className={`h-5 w-5 ${
                            tx.status === 'completed' ? 'fill-emerald-500' : 
                            tx.status === 'pending' ? 'fill-amber-500' : 'fill-red-500'
                          }`}>
                            <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tx.reward}</p>
                          <p className="text-sm text-gray-500">{tx.date}</p>
                          {tx.txHash && (
                            <p className="text-xs text-gray-400 mt-1">Tx: {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          tx.status === 'completed' ? 'text-emerald-600' : 
                          tx.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          +{tx.cryptoAmount} ETH
                        </p>
                        <p className="text-sm text-gray-500">{tx.points} pts</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            {transactions.length > 5 && (
              <div className="mt-6 text-center">
                <Button variant="outline" className="text-emerald-600 border-emerald-600 hover:bg-emerald-50">
                  View All Transactions
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 px-6 text-center bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Start Earning <span className="text-emerald-600">Ethereum</span>
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Make a difference and get rewarded in ETH
          </p>
          <Button asChild className="px-10 py-6 text-lg bg-emerald-600 hover:bg-emerald-700 shadow-lg">
            <Link href="/report">
              Begin Your Journey
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}