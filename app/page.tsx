'use client';
import { Leaf, Coins, Zap, Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

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

export default function HomePage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

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
      alert('Connected to MetaMask (demo mode)');
    } catch (error) {
      console.error("Error connecting MetaMask:", error);
      alert("Failed to connect MetaMask. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f0fdf9]">
      {/* Hero Section */}
      <section className="relative py-32 px-6 text-center overflow-hidden isolate">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <motion.div 
            initial={{ x: -100, y: -100 }}
            animate={{ x: 0, y: 0 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="absolute top-10 left-5%"
          >
            <Leaf className="h-24 w-24 text-green-400" />
          </motion.div>
          <motion.div 
            initial={{ x: 100, y: 100 }}
            animate={{ x: 0, y: 0 }}
            transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
            className="absolute bottom-20 right-10%"
          >
            <Coins className="h-20 w-20 text-yellow-300" />
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto relative"
        >
          <motion.span 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="inline-flex items-center px-4 py-2 bg-green-100/80 backdrop-blur-sm text-green-700 rounded-full text-sm font-medium mb-6 border border-green-200 shadow-sm"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Clean Up • Earn Crypto
          </motion.span>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-r from-green-600 to-yellow-500 bg-clip-text text-transparent"
            >
              Green Rewards
            </motion.span>
          </h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
          >
            Join the movement to clean the planet and earn FakeETH rewards in this demo!
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {!walletAddress ? (
              <Button 
                onClick={connectMetaMask} 
                className="px-8 py-6 text-lg bg-gradient-to-r from-green-600 to-yellow-500 hover:from-green-700 hover:to-yellow-600 shadow-xl hover:shadow-2xl transition-all"
              >
                {isMetaMaskInstalled ? "Connect Wallet" : "Get MetaMask"}
              </Button>
            ) : (
              <Button asChild className="px-8 py-6 text-lg bg-gradient-to-r from-green-600 to-yellow-500 hover:from-green-700 hover:to-yellow-600 shadow-xl hover:shadow-2xl transition-all">
                <Link href="/rewards">
                  Explore Rewards
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild className="px-8 py-6 text-lg border-2 border-gray-300 hover:border-green-500 group">
              <Link href="/about">
                <span className="text-gray-700 group-hover:text-green-700 transition-colors flex items-center gap-2">
                  Learn More <ChevronRight className="h-5 w-5" />
                </span>
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-gray-900 text-center mb-16"
          >
            Why <span className="text-green-600">Green Rewards</span>?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="flex items-center justify-center h-16 w-16 bg-green-100 rounded-full mx-auto mb-6">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Eco Impact</h3>
              <p className="text-gray-600">Report and collect waste to make a real difference in your community.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="flex items-center justify-center h-16 w-16 bg-yellow-100 rounded-full mx-auto mb-6">
                <Coins className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Earn Rewards</h3>
              <p className="text-gray-600">Turn your efforts into FakeETH and exclusive perks (demo mode).</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="flex items-center justify-center h-16 w-16 bg-green-100 rounded-full mx-auto mb-6">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Simple & Fun</h3>
              <p className="text-gray-600">Easy-to-use platform with a gamified experience for all ages.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6 bg-gradient-to-r from-green-600 to-emerald-500 text-white text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-6">
            Start Making a Difference Today
          </h2>
          <p className="text-xl text-green-100 mb-10">
            Connect your wallet and join thousands cleaning up while earning rewards.
          </p>
          <Button asChild className="px-10 py-7 text-lg bg-white text-green-700 hover:bg-green-100 shadow-xl hover:shadow-2xl transition-all">
            <Link href="/report">
              Report Waste Now
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-100 text-center">
        <p className="text-gray-600">
          © 2025 Green Rewards Demo. Built with 🌍 & 💚 by 3XREMERS.
        </p>
      </footer>
    </div>
  );
}