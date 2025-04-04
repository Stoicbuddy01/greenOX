'use client'
import { useState, useEffect, useRef } from 'react'
import { MapPin, Upload, CheckCircle, Loader, XCircle, Trash2, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { createReport, createUser, getRecentReports, getUserByEmail } from '@/utils/db/actions'
import dynamic from 'next/dynamic'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

// Dynamic imports with SSR disabled
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

interface VerificationResult {
  wasteType: string;
  quantity: string;
  confidence: number;
}

interface Report {
  id: number;
  location: string;
  wasteType: string;
  amount: string;
  createdAt: string;
}

export default function ReportPage() {
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null)
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [newReport, setNewReport] = useState({
    location: '',
    type: '',
    amount: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.5726, 88.3639]) // Default to Kolkata
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewReport({ ...newReport, [name]: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleVerify = async () => {
    if (!file) return;
  
    setVerificationStatus('verifying');
    
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
      const base64Data = await readFileAsBase64(file);
  
      const prompt = `Analyze this waste image and respond with ONLY a JSON object containing:
      - wasteType (string): type of waste (e.g., plastic, organic, mixed)
      - quantity (string): estimated amount with unit (e.g., "500 kg", "2 cubic meters")
      - confidence (number): between 0 and 1
      
      Example response:
      {"wasteType": "plastic bottles", "quantity": "500 kg", "confidence": 0.85}`;
  
      const result = await model.generateContent([prompt, {
        inlineData: {
          data: base64Data.split(',')[1],
          mimeType: file.type,
        },
      }]);
      
      const response = await result.response;
      const text = response.text();
      
      try {
        // Clean the response (remove markdown formatting if present)
        let cleanedResponse = text.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.slice(7, -3).trim(); // Remove ```json and ```
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.slice(3, -3).trim(); // Remove ```
        }
  
        const parsedResult = JSON.parse(cleanedResponse);
        
        if (parsedResult.wasteType && parsedResult.quantity && parsedResult.confidence) {
          setVerificationResult(parsedResult);
          setVerificationStatus('success');
          setNewReport({
            ...newReport,
            type: parsedResult.wasteType,
            amount: parsedResult.quantity
          });
          toast.success('Waste verified successfully!');
        } else {
          throw new Error('Invalid response format');
        }
      } catch (parseError) {
        console.error('Failed to parse response:', text);
        toast.error('Failed to parse verification response. Please try again.');
        setVerificationStatus('failure');
      }
    } catch (error) {
      console.error('Error verifying waste:', error);
      toast.error('Failed to verify waste. Please try again.');
      setVerificationStatus('failure');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const newCenter: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setMapCenter(newCenter);
        
        if (mapRef.current) {
          mapRef.current.flyTo(newCenter, 15);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng(newCenter);
        }
        
        setNewReport({
          ...newReport,
          location: `${newCenter[0].toFixed(4)}, ${newCenter[1].toFixed(4)}`
        });
        toast.success('Location found!');
      } else {
        toast.error('Location not found');
      }
    } catch (error) {
      toast.error('Error searching location');
      console.error('Search error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationStatus !== 'success' || !user) {
      toast.error('Please verify the waste before submitting or log in.');
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await createReport(
        user.id,
        newReport.location,
        newReport.type,
        newReport.amount,
        preview || undefined,
        verificationResult ? JSON.stringify(verificationResult) : undefined
      ) as any;
      
      const formattedReport = {
        id: report.id,
        location: report.location,
        wasteType: report.type,
        amount: report.amount,
        createdAt: report.createdAt.toISOString().split('T')[0]
      };
      
      setReports([formattedReport, ...reports]);
      setNewReport({ location: '', type: '', amount: '' });
      setFile(null);
      setPreview(null);
      setVerificationStatus('idle');
      setVerificationResult(null);
      
      toast.success('Report submitted successfully! Thank you for your contribution.');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const email = localStorage.getItem('userEmail')
      if (email) {
        let user = await getUserByEmail(email)
        if (!user) {
          user = await createUser(email, 'Anonymous User')
        }
        setUser(user)
        
        const recentReports = await getRecentReports()
        const formattedReports = recentReports.map(report => ({
          ...report,
          createdAt: report.createdAt.toISOString().split('T')[0]
        }))
        setReports(formattedReports)
      } else {
        router.push('/login') 
      }
    }
    checkUser()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Waste Reporting Portal
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help keep our environment clean by reporting waste in your area
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Form Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-green-600 p-4 text-white">
                <h2 className="text-xl font-semibold">Report New Waste</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                {/* Image Upload Section */}
                <div className="mb-8">
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Upload Waste Image
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-10 pb-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 transition-all duration-300 bg-gray-50/50 relative group">
                    {!preview ? (
                      <div className="space-y-3 text-center">
                        <div className="mx-auto h-16 w-16 text-gray-400 group-hover:text-green-500 transition-colors">
                          <Upload size={64} className="mx-auto" />
                        </div>
                        <div className="flex justify-center text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500">
                            <span>Click to upload</span>
                            <input 
                              id="waste-image" 
                              type="file" 
                              className="sr-only" 
                              onChange={handleFileChange} 
                              accept="image/*" 
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                      </div>
                    ) : (
                      <div className="relative w-full h-64 flex items-center justify-center">
                        <img 
                          src={preview} 
                          alt="Waste preview" 
                          className="max-w-full max-h-full object-contain rounded-lg" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null)
                            setPreview(null)
                            setVerificationStatus('idle')
                            setVerificationResult(null)
                          }}
                          className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md hover:shadow-lg transition-all"
                          aria-label="Remove image"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Button */}
                <Button 
                  type="button" 
                  onClick={handleVerify} 
                  className="w-full mb-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-4 text-lg rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2" 
                  disabled={!file || verificationStatus === 'verifying'}
                >
                  {verificationStatus === 'verifying' ? (
                    <>
                      <Loader className="animate-spin h-5 w-5" />
                      <span>Analyzing Waste...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Verify Waste</span>
                    </>
                  )}
                </Button>

                {/* Verification Result */}
                {verificationStatus === 'success' && verificationResult && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg animate-fade-in">
                    <div className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-lg font-semibold text-green-800">Analysis Complete</h3>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-white p-2 rounded-lg">
                            <p className="text-gray-500 font-medium">Type</p>
                            <p className="text-gray-800 font-semibold capitalize">{verificationResult.wasteType}</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg">
                            <p className="text-gray-500 font-medium">Amount</p>
                            <p className="text-gray-800 font-semibold">{verificationResult.quantity}</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg col-span-2">
                            <p className="text-gray-500 font-medium">Confidence</p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                              <div 
                                className={`h-2.5 rounded-full ${verificationResult.confidence > 0.7 ? 'bg-green-500' : verificationResult.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                style={{ width: `${verificationResult.confidence * 100}%` }}
                              ></div>
                            </div>
                            <p className="text-gray-800 font-semibold text-right text-xs mt-1">
                              {(verificationResult.confidence * 100).toFixed(0)}% accurate
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Location Search and Map */}
                <div className="space-y-1 mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Location
                  </label>
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for a location..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    <Button 
                      onClick={handleSearch}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Search
                    </Button>
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Drag marker to exact spot)
                  </label>
                  <div className="h-96 rounded-lg overflow-hidden border border-gray-300 relative z-0">
                    {typeof window !== 'undefined' && (
                      <MapContainer 
                        center={mapCenter}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        whenCreated={(map) => {
                          mapRef.current = map
                          map.on('dragstart', () => {
                            if (markerRef.current) {
                              markerRef.current.setOpacity(0.6)
                            }
                          })
                        }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker 
                          position={mapCenter}
                          draggable={true}
                          ref={(ref) => {
                            if (ref) {
                              markerRef.current = ref
                            }
                          }}
                          eventHandlers={{
                            dragstart: () => {
                              if (markerRef.current) {
                                markerRef.current.setOpacity(0.6)
                              }
                            },
                            dragend: (e) => {
                              const marker = e.target
                              const position = marker.getLatLng()
                              marker.setOpacity(1)
                              setMapCenter([position.lat, position.lng])
                              setNewReport({
                                ...newReport,
                                location: `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
                              })
                            }
                          }}
                        >
                          <Popup>Drag me to the exact waste location</Popup>
                        </Marker>
                      </MapContainer>
                    )}
                  </div>
                  <input
                    type="hidden"
                    name="location"
                    value={newReport.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Waste Type and Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div className="space-y-1">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Waste Type
                    </label>
                    <input
                      type="text"
                      id="type"
                      name="type"
                      value={newReport.type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50"
                      placeholder="Auto-detected from image"
                      readOnly
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                      Estimated Amount
                    </label>
                    <input
                      type="text"
                      id="amount"
                      name="amount"
                      value={newReport.amount}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50"
                      placeholder="Auto-detected from image"
                      readOnly
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-4 text-lg rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  disabled={isSubmitting || verificationStatus !== 'success'}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin h-5 w-5" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Report</span>
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Recent Reports Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 h-full">
              <div className="bg-blue-600 p-4 text-white">
                <h2 className="text-xl font-semibold">Recent Reports</h2>
              </div>
              
              <div className="p-4 h-[calc(100%-56px)] overflow-y-auto">
                {reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200">
                        <div className="flex items-start">
                          <div className="bg-green-100 p-2 rounded-lg mr-3">
                            <MapPin className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800 line-clamp-1">{report.location}</h3>
                            <div className="flex justify-between mt-1 text-sm">
                              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full capitalize">
                                {report.wasteType}
                              </span>
                              <span className="text-gray-500">{report.amount}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{report.createdAt}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                    <div className="bg-blue-100 p-4 rounded-full mb-4">
                      <MapPin className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No reports yet</h3>
                    <p className="text-gray-500 text-sm">
                      Submit your first waste report to see it appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add these styles for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .leaflet-container {
          background-color: #f8fafc;
        }
        .leaflet-marker-icon {
          filter: hue-rotate(120deg);
          transition: opacity 0.2s ease;
        }
      `}</style>
    </div>
  )
}