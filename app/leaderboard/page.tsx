'use client'
import { useState, useEffect } from 'react'
import { getAllRewards, getUserByEmail } from '@/utils/db/actions'
import { Loader, Award, User, Trophy, Crown, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

type Reward = {
  id: number
  userId: number
  points: number
  level: number
  createdAt: Date
  userName: string | null
}

const rankColors = [
  'bg-gradient-to-r from-yellow-400 to-yellow-500', // 1st place
  'bg-gradient-to-r from-gray-300 to-gray-400',     // 2nd place
  'bg-gradient-to-r from-yellow-600 to-yellow-700', // 3rd place
]

export default function LeaderboardPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null)

  useEffect(() => {
    const fetchRewardsAndUser = async () => {
      setLoading(true)
      try {
        const fetchedRewards = await getAllRewards()
        // Sort rewards by points in descending order
        const sortedRewards = fetchedRewards.sort((a, b) => b.points - a.points)
        setRewards(sortedRewards)

        const userEmail = localStorage.getItem('userEmail')
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail)
          if (fetchedUser) {
            setUser(fetchedUser)
          } else {
            toast.error('User not found. Please log in again.')
          }
        } else {
          toast.error('User not logged in. Please log in.')
        }
      } catch (error) {
        console.error('Error fetching rewards and user:', error)
        toast.error('Failed to load leaderboard. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchRewardsAndUser()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-blue-600">
              Leaderboard
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See where you stand among the top performers and track your progress
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-12 w-12 text-green-500" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Top 3 Podium */}
            {rewards.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-8 h-48">
                {[1, 0, 2].map((position) => {
                  const reward = rewards[position]
                  if (!reward) return null
                  
                  return (
                    <motion.div
                      key={position}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: position * 0.1, duration: 0.5 }}
                      className={`flex flex-col items-center justify-end rounded-t-xl p-4 shadow-lg ${
                        rankColors[position]
                      } ${position === 0 ? 'h-40' : position === 1 ? 'h-32' : 'h-28'}`}
                    >
                      <div className="bg-white rounded-full p-2 -mt-10 shadow-md">
                        <User className="h-10 w-10 rounded-full bg-gray-200 text-gray-600 p-1" />
                      </div>
                      <div className="text-center mt-4 text-white">
                        <h3 className="font-bold text-lg">{reward.userName}</h3>
                        <div className="flex items-center justify-center mt-1">
                          <Trophy className="h-5 w-5 mr-1" />
                          <span className="font-semibold">{reward.points.toLocaleString()} pts</span>
                        </div>
                        <div className="mt-1 text-sm">Level {reward.level}</div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Leaderboard Table */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-20">
                  <Sparkles className="h-32 w-32 text-yellow-300" />
                </div>
                <div className="relative z-10 flex justify-between items-center text-white">
                  <Trophy className="h-12 w-12 text-yellow-300" />
                  <div className="text-center">
                    <h2 className="text-3xl font-bold">Top Performers</h2>
                    <p className="text-green-100 mt-1">Compete and climb the ranks</p>
                  </div>
                  <Award className="h-12 w-12 text-yellow-300" />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Points</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rewards.map((reward, index) => (
                      <motion.tr
                        key={reward.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`${
                          user && user.id === reward.userId
                            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500'
                            : 'hover:bg-gray-50'
                        } transition-colors duration-150 ease-in-out`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {index < 3 ? (
                              <div className={`rounded-full w-8 h-8 flex items-center justify-center ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-300' : 'bg-yellow-600'}`}>
                                <Crown className="h-5 w-5 text-white" />
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="relative">
                                <User className="h-full w-full rounded-full bg-gray-200 text-gray-600 p-2" />
                                {index < 3 && (
                                  <div className={`absolute -bottom-1 -right-1 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-yellow-700'}`}>
                                    {index + 1}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{reward.userName}</div>
                              <div className="text-xs text-gray-500">@{reward.userName?.toLowerCase().replace(/\s+/g, '')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Award className="h-5 w-5 text-indigo-500 mr-2" />
                            <div className="text-sm font-semibold text-gray-900">
                              {reward.points.toLocaleString()}
                              <span className="ml-1 text-xs text-gray-500">pts</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gradient-to-r from-green-100 to-blue-100 text-green-800">
                            Level {reward.level}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Current User Highlight */}
              {user && (
                <div className="bg-indigo-50 p-4 border-t border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 p-2 mr-3" />
                      <div>
                        <h4 className="font-medium text-indigo-900">Your Position</h4>
                        <p className="text-sm text-indigo-600">
                          {rewards.findIndex(r => r.userId === user.id) + 1} of {rewards.length}
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all">
                      View Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}