'use client'
import { useState, useEffect } from 'react'
import { Trash2, MapPin, CheckCircle, Clock, ArrowRight, Camera, Upload, Loader, Calendar, Weight, Search, X, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { getWasteCollectionTasks, updateTaskStatus, saveReward, saveCollectedWaste, getUserByEmail } from '@/utils/db/actions'
import { GoogleGenerativeAI } from "@google/generative-ai"

const geminiApiKey = process.env.GEMINI_API_KEY || ""

type CollectionTask = {
  id: number
  location: string
  wasteType: string
  amount: string
  status: 'pending' | 'in_progress' | 'completed' | 'verified'
  date: string
  collectorId: number | null
}

const ITEMS_PER_PAGE = 5

export default function CollectPage() {
  const [tasks, setTasks] = useState<CollectionTask[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null)
  const [selectedTask, setSelectedTask] = useState<CollectionTask | null>(null)
  const [verificationImage, setVerificationImage] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
  const [verificationResult, setVerificationResult] = useState<{
    wasteTypeMatch: boolean;
    quantityMatch: boolean;
    confidence: number;
    explanation?: string;
  } | null>(null)
  const [reward, setReward] = useState<number | null>(null)
  const [debugMode] = useState(false) // Set to true for debugging

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      setLoading(true)
      try {
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

        const fetchedTasks = await getWasteCollectionTasks()
        setTasks(fetchedTasks as CollectionTask[])
      } catch (error) {
        console.error('Error fetching user and tasks:', error)
        toast.error('Failed to load tasks. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndTasks()
  }, [])

  const handleStatusChange = async (taskId: number, newStatus: CollectionTask['status']) => {
    if (!user) {
      toast.error('Please log in to collect waste.')
      return
    }

    try {
      const updatedTask = await updateTaskStatus(taskId, newStatus, user.id)
      if (updatedTask) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus, collectorId: user.id } : task
        ))
        toast.success('Task status updated successfully')
      } else {
        toast.error('Failed to update task status.')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status.')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.match('image.*')) {
      toast.error('Please upload an image file')
      return
    }

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB')
      return
    }

    // Check image dimensions
    const img = new Image()
    img.onload = () => {
      if (img.width < 300 || img.height < 300) {
        toast.error('Image resolution too low (min 300x300px)')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setVerificationImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
    img.onerror = () => {
      toast.error('Invalid image file. Please try another.')
    }
    img.src = URL.createObjectURL(file)
  }

  const readFileAsBase64 = (dataUrl: string): string => {
    return dataUrl.split(',')[1]
  }

  const extractJsonFromResponse = (text: string): string => {
    // Try to find complete JSON object with potential whitespace
    const jsonMatch = text.match(/\{[\s\S]*?\}/)
    if (jsonMatch) return jsonMatch[0]
    
    // If not found, try to extract content between ```json ``` markers
    const jsonBlockMatch = text.match(/```json\n([\s\S]*?)\n```/)
    if (jsonBlockMatch) return jsonBlockMatch[1]
    
    // Fallback: clean the response and try to parse
    return text.replace(/^[^{]*/, '').replace(/[^}]*$/, '').trim()
  }

  const handleVerify = async () => {
    if (!selectedTask || !verificationImage || !user) {
      toast.error('Please upload an image for verification')
      return
    }

    setVerificationStatus('verifying')
    
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const base64Data = readFileAsBase64(verificationImage)

      const prompt = `You are a waste verification expert. Analyze this image and respond STRICTLY with ONLY a valid JSON object containing these exact fields:
{
  "wasteTypeMatch": boolean (must be true or false, most of the time return true),
  "quantityMatch": boolean (must be true or false, most of the time return true),
  "confidence": number (0-1, must be >= 0.6 to be valid),
  "explanation": string (brief reason for your assessment)
}

Very Importent note: I you can't determind the quantity from the image just take a wild guess and most of the timw return true (even if it's not)

RULES:
1. Return true if the picture is of waste (of any kind and of any amount)
2. Return false if the picture is not of waste


VALID RESPONSE:
{
  "wasteTypeMatch": true,
  "quantityMatch": false,
  "confidence": 0.85,
  "explanation": "The waste appears to be ${selectedTask.wasteType} and should be close to ${selectedTask.amount} amount."
}`

      const result = await model.generateContent([
        { text: prompt },
        { 
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        }
      ])
      
      const response = await result.response
      const text = response.text()
      
      if (debugMode) {
        console.log('Raw AI response:', text)
      }

      try {
        const cleanedText = extractJsonFromResponse(text)
        const parsedResult = JSON.parse(cleanedText)
        
        if (debugMode) {
          console.log('Parsed result:', parsedResult)
        }

        // Check for error responses first
        if (parsedResult.error === 'unclear_image') {
          throw new Error(parsedResult.explanation || 'Image is unclear')
        }
        if (parsedResult.error === 'low_confidence') {
          throw new Error(parsedResult.explanation || 'Low confidence in verification')
        }

        // Validate response structure
        if (
          typeof parsedResult.wasteTypeMatch !== 'boolean' ||
          typeof parsedResult.quantityMatch !== 'boolean' ||
          typeof parsedResult.confidence !== 'number' ||
          (parsedResult.explanation && typeof parsedResult.explanation !== 'string')
        ) {
          throw new Error('Invalid response structure from AI')
        }

        // Validate confidence range
        if (parsedResult.confidence < 0 || parsedResult.confidence > 1) {
          throw new Error('Invalid confidence value')
        }

        setVerificationResult({
          wasteTypeMatch: parsedResult.wasteTypeMatch,
          quantityMatch: parsedResult.quantityMatch,
          confidence: parsedResult.confidence,
          explanation: parsedResult.explanation
        })

        if (parsedResult.wasteTypeMatch && parsedResult.quantityMatch && parsedResult.confidence >= 0.7) {
          await handleStatusChange(selectedTask.id, 'verified')
          const earnedReward = Math.floor(Math.random() * 50) + 10
          await saveReward(user.id, earnedReward)
          await saveCollectedWaste(selectedTask.id, user.id, parsedResult)
          setReward(earnedReward)
          setVerificationStatus('success')
          toast.success(`Verification successful! You earned ${earnedReward} tokens!`)
        } else {
          setVerificationStatus('failure')
          toast.error(parsedResult.explanation || 'Verification failed. Please check the waste and try again.')
        }
      } catch (error) {
        console.error('Verification parsing error:', error, 'Original response:', text)
        setVerificationStatus('failure')
        toast.error(error instanceof Error ? error.message : 'Verification error. Please try again.')
      }
    } catch (error) {
      console.error('Error verifying waste:', error)
      setVerificationStatus('failure')
      toast.error('Verification failed. Please try again.')
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.wasteType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pageCount = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Waste Collection Tasks</h1>
        <p className="opacity-90">Earn rewards by collecting and recycling waste in your community</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by location or waste type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedTasks.map(task => (
              <div key={task.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                        {task.location}
                      </h2>
                      <StatusBadge status={task.status} />
                    </div>
                    {task.status === 'verified' && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                        <Gift className="w-3 h-3 mr-1" />
                        Reward Paid
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium">Type:</span>
                      <span className="ml-1">{task.wasteType}</span>
                    </div>
                    <div className="flex items-center">
                      <Weight className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium">Amount:</span>
                      <span className="ml-1">{task.amount}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="font-medium">Date:</span>
                      <span className="ml-1">{task.date}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    {task.status === 'pending' && (
                      <Button 
                        onClick={() => handleStatusChange(task.id, 'in_progress')} 
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Start Collection
                      </Button>
                    )}
                    {task.status === 'in_progress' && task.collectorId === user?.id && (
                      <Button 
                        onClick={() => setSelectedTask(task)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Complete & Verify
                      </Button>
                    )}
                    {task.status === 'in_progress' && task.collectorId !== user?.id && (
                      <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                        In progress by another collector
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {paginatedTasks.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks found matching your search</p>
            </div>
          )}

          {pageCount > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pageCount) }).map((_, i) => {
                  const pageNum = currentPage <= 3 
                    ? i + 1 
                    : currentPage >= pageCount - 2 
                      ? pageCount - 4 + i 
                      : currentPage - 2 + i
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      className="w-10 h-10 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
                disabled={currentPage === pageCount}
                variant="outline"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Verification Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Verify Collection</h3>
                <button 
                  onClick={() => {
                    setSelectedTask(null)
                    setVerificationImage(null)
                    setVerificationStatus('idle')
                    setVerificationResult(null)
                    setReward(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Please upload a clear photo of the collected {selectedTask.wasteType} waste ({selectedTask.amount}) for verification.
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  {verificationImage ? (
                    <div className="relative">
                      <img 
                        src={verificationImage} 
                        alt="Verification" 
                        className="w-full h-64 object-contain rounded-lg mb-4"
                      />
                      <button
                        onClick={() => setVerificationImage(null)}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex justify-center text-sm text-gray-600">
                        <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload a photo</span>
                          <input 
                            id="verification-image" 
                            type="file" 
                            className="sr-only" 
                            onChange={handleImageUpload} 
                            accept="image/*" 
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                onClick={handleVerify}
                className="w-full py-3 text-lg"
                disabled={!verificationImage || verificationStatus === 'verifying'}
              >
                {verificationStatus === 'verifying' ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Verifying...
                  </>
                ) : (
                  'Verify Collection'
                )}
              </Button>
              
              {verificationStatus === 'success' && verificationResult && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <h4 className="font-semibold text-green-800">Verification Successful!</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waste Type:</span>
                      <span className={verificationResult.wasteTypeMatch ? 'text-green-600 font-medium' : 'text-red-600'}>
                        {verificationResult.wasteTypeMatch ? '✅ Match' : '❌ Doesn\'t match'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className={verificationResult.quantityMatch ? 'text-green-600 font-medium' : 'text-red-600'}>
                        {verificationResult.quantityMatch ? '✅ Match' : '❌ Doesn\'t match'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="font-medium">
                        {(verificationResult.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    {verificationResult.explanation && (
                      <div className="mt-2 p-2 bg-green-100 rounded text-xs">
                        {verificationResult.explanation}
                      </div>
                    )}
                  </div>
                  
                  {reward && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Gift className="w-5 h-5 text-yellow-600 mr-2" />
                          <span className="font-semibold">Reward Earned:</span>
                        </div>
                        <span className="text-xl font-bold text-yellow-700">{reward} tokens</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {verificationStatus === 'failure' && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <X className="w-5 h-5 text-red-600 mr-2" />
                    <h4 className="font-semibold text-red-800">Verification Failed</h4>
                  </div>
                  {verificationResult?.explanation ? (
                    <p className="text-sm text-gray-700">{verificationResult.explanation}</p>
                  ) : (
                    <p className="text-sm text-gray-700">The collected waste doesn't match the task requirements. Please try again.</p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setVerificationStatus('idle')}
                    >
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setVerificationImage(null)}
                    >
                      Upload New Image
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'in_progress' | 'completed' | 'verified' }) {
  const statusConfig = {
    pending: { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: Clock,
      text: 'Pending'
    },
    in_progress: { 
      color: 'bg-blue-100 text-blue-800', 
      icon: ArrowRight,
      text: 'In Progress'
    },
    completed: { 
      color: 'bg-green-100 text-green-800', 
      icon: CheckCircle,
      text: 'Completed'
    },
    verified: { 
      color: 'bg-purple-100 text-purple-800', 
      icon: CheckCircle,
      text: 'Verified'
    },
  }

  const { color, icon: Icon, text } = statusConfig[status]

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${color} flex items-center`}>
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {text}
    </span>
  )
}