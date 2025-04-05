'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Wallet, ChevronRight, Zap, Check, X, Loader2, Gift } from 'lucide-react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function RewardsPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [isFujiNetwork, setIsFujiNetwork] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [amount, setAmount] = useState<number>(0);

  // Check wallet connection and network on load
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            await checkNetwork();
          }
        } catch (error) {
          console.error('Error checking wallet:', error);
        }
      }
    };

    checkConnection();

    // Set up event listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });
      
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  const checkNetwork = async () => {
    if (!window.ethereum) return false;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      setIsFujiNetwork(network.chainId === 43113n);
      return network.chainId === 43113n;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await switchToFuji();
    } catch (error) {
      setError('Wallet connection failed');
      console.error('Wallet connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchToFuji = async () => {
    if (!window.ethereum) {
      setError('MetaMask not available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xA869',
          chainName: 'Avalanche Fuji C-Chain',
          nativeCurrency: {
            name: 'Avalanche',
            symbol: 'AVAX',
            decimals: 18,
          },
          rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
          blockExplorerUrls: ['https://testnet.snowtrace.io/'],
        }]
      });

      const switched = await checkNetwork();
      if (!switched) {
        setError('Failed to verify network switch');
      }
    } catch (error) {
      setError('Failed to switch network');
      console.error('Network switch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemAVAX = async () => {
    if (!account || !window.ethereum) {
      setError('Wallet not connected');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setTxHash(null);
      setShowSuccess(false);

      const onCorrectNetwork = await checkNetwork();
      if (!onCorrectNetwork) {
        setError('Please switch to Fuji Testnet first');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tx = {
        to: account,
        value: ethers.parseEther("0.1")
      };
      
      const transaction = await signer.sendTransaction(tx);
      setTxHash(transaction.hash);
      
      await transaction.wait();
      setShowSuccess(true);
      
    } catch (error: any) {
      setError(error.message || 'Redemption failed');
      console.error('Redemption error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600 flex items-center">
            <Gift className="mr-2" /> Rewards
          </h1>
          {account && (
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isFujiNetwork ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isFujiNetwork ? 'Fuji Connected' : 'Wrong Network'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-3xl font-bold mb-2">Earn & Redeem Rewards</h2>
                <p className="text-green-100">Turn your eco-friendly actions into AVAX tokens</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <p className="text-sm text-green-100 mb-1">Current Exchange Rate</p>
                <p className="text-2xl font-bold">100 Coins = 1 AVAX</p>
              </div>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="p-8 border-b">
            {!account ? (
              <button 
                onClick={connectWallet}
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Wallet className="h-5 w-5 mr-2" />
                )}
                Connect MetaMask Wallet
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Connected Wallet</p>
                  <p className="font-mono text-sm truncate">{account}</p>
                </div>
                
                <button 
                  onClick={switchToFuji}
                  disabled={loading || isFujiNetwork}
                  className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-all ${
                    loading ? 'bg-gray-300' : 
                    isFujiNetwork ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    isFujiNetwork ? (
                      <Check className="h-5 w-5 mr-2" />
                    ) : (
                      <ChevronRight className="h-5 w-5 mr-2" />
                    )
                  )}
                  {isFujiNetwork ? 'On Fuji Network' : 'Switch to Fuji Network'}
                </button>
              </div>
            )}
          </div>

          {/* Redemption Section */}
          <div className="p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" /> Redeem Your Coins
            </h3>
            
            <div className="bg-gradient-to-r from-green-50 to-yellow-50 border border-green-100 rounded-xl p-6 mb-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                  <p className="text-3xl font-bold text-gray-800">1,250 Coins</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-sm text-gray-600 mb-1">Equivalent to</p>
                  <p className="text-2xl font-bold text-green-600">12.5 AVAX</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Quick Redeem Options</p>
                <div className="grid grid-cols-3 gap-3">
                  {[100, 500, 1000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setAmount(amount)}
                      className="py-2 px-3 bg-white border border-gray-200 rounded-lg hover:border-green-400 transition-colors text-center"
                    >
                      <p className="font-medium">{amount} Coins</p>
                      <p className="text-xs text-green-600">= {amount/100} AVAX</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label htmlFor="redeem-amount" className="block text-sm text-gray-600 mb-2">Custom Amount</label>
                <div className="flex">
                  <input
                    id="redeem-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min="0"
                    max="1250"
                    placeholder="Enter coin amount"
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                  <span className="inline-flex items-center px-4 bg-gray-100 border-t border-b border-r border-gray-300 rounded-r-lg text-gray-700">
                    Coins
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  You'll receive: <span className="font-medium text-green-600">{(amount / 100).toFixed(2)} AVAX</span>
                </p>
              </div>

              <button 
                onClick={redeemAVAX}
                disabled={loading || !isFujiNetwork || amount <= 0}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center transition-all shadow-lg ${
                  loading ? 'bg-gray-400' : 
                  !isFujiNetwork ? 'bg-gray-400 cursor-not-allowed' : 
                  'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-6 w-6 mr-2" />
                )}
                Redeem {amount} Coins for {(amount / 100).toFixed(2)} AVAX
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Status */}
        {(error || txHash) && (
          <div className={`mt-8 p-6 rounded-xl ${error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-start">
              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${error ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {error ? <X className="h-6 w-6" /> : <Check className="h-6 w-6" />}
              </div>
              <div className="ml-4">
                <h3 className={`text-lg font-medium ${error ? 'text-red-800' : 'text-green-800'}`}>
                  {error ? 'Redemption Failed' : 'Redemption Successful!'}
                </h3>
                <div className={`mt-2 text-sm ${error ? 'text-red-700' : 'text-green-700'}`}>
                  {error ? (
                    <p>{error}</p>
                  ) : (
                    <>
                      <p>You've received {(amount / 100).toFixed(2)} AVAX in your wallet.</p>
                      <a 
                        href={`https://testnet.snowtrace.io/tx/${txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center mt-2 text-green-600 hover:text-green-800 underline"
                      >
                        View transaction on Snowtrace
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
              <Wallet className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Connect Wallet</h3>
            <p className="text-gray-600">Link your MetaMask wallet to start redeeming rewards</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Switch to Fuji</h3>
            <p className="text-gray-600">Ensure you're on Avalanche Fuji Testnet to receive AVAX</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4">
              <Gift className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Redeem & Enjoy</h3>
            <p className="text-gray-600">Convert your EcoCoins to AVAX tokens instantly</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Need test AVAX for gas? Get some from the <a href="https://faucet.avax.network/" target="_blank" className="text-green-600 hover:underline">Fuji Faucet</a></p>
          <p className="mt-2">EcoRewards - Turning green actions into digital rewards</p>
        </div>
      </footer>
    </div>
  );
}