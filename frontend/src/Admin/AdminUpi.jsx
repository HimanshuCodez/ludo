import React, { useState, useRef } from 'react'
import { 
  Upload, 
  Edit3, 
  Save, 
  X, 
  Image, 
  RotateCw,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
  AlertCircle,
  Check,
  FileImage
} from 'lucide-react'

const AdminUpi = () => {
  const [currentBarcode, setCurrentBarcode] = useState('https://via.placeholder.com/400x200/2563eb/ffffff?text=QR+Code+Sample')
  const [isEditing, setIsEditing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef(null)

  // Mock barcode history data

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        handleFileUpload(file)
      }
    }
  }

  const handleFileUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedFile({
        file: file,
        preview: e.target.result,
        name: file.name
      })
      setIsEditing(true)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleSave = () => {
    // TODO: Implement your save barcode API call here
    console.log('Saving barcode:', uploadedFile)
    // Example API call:
    // await saveBarcodeImage(uploadedFile.file)
    
    setCurrentBarcode(uploadedFile.preview)
    setIsEditing(false)
    setUploadedFile(null)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setUploadedFile(null)
    setZoom(100)
    setRotation(0)
  }

  const adjustZoom = (delta) => {
    setZoom(prev => Math.max(50, Math.min(200, prev + delta)))
  }

  const rotateImage = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Downloading current barcode')
    // Example: Create download link and trigger download
  }

  const handleDelete = (barcodeId) => {
    // TODO: Implement delete barcode API call here
    console.log('Deleting barcode:', barcodeId)
    // Example API call:
    // await deleteBarcodeImage(barcodeId)
  }

  const setAsActive = (barcode) => {
    // TODO: Implement set as active barcode API call here
    console.log('Setting as active barcode:', barcode.id)
    // Example API call:
    // await setActiveBarcodeImage(barcode.id)
    setCurrentBarcode(barcode.image)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Barcode Management</h1>
          <p className="text-gray-600">Upload and manage payment QR codes and barcodes</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-green-800 font-medium">Barcode updated successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Barcode Display */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <h2 className="text-xl font-bold flex items-center">
                <Image className="w-6 h-6 mr-2" />
                Current Active Barcode
              </h2>
            </div>

            <div className="p-6">
              {/* Image Controls */}
              {isEditing && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Preview Controls</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => adjustZoom(-25)}
                      className="p-2 rounded-lg bg-white hover:bg-gray-100 shadow-sm transition-colors"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600 px-2">{zoom}%</span>
                    <button
                      onClick={() => adjustZoom(25)}
                      className="p-2 rounded-lg bg-white hover:bg-gray-100 shadow-sm transition-colors"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={rotateImage}
                      className="p-2 rounded-lg bg-white hover:bg-gray-100 shadow-sm transition-colors"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Barcode Display */}
              <div className="bg-gray-100 rounded-lg p-6 flex justify-center mb-6">
                <div className="max-w-sm overflow-hidden">
                  <img
                    src={isEditing && uploadedFile ? uploadedFile.preview : currentBarcode}
                    alt="Current Barcode"
                    className="w-full h-auto rounded-lg shadow-md transition-transform duration-300"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Upload New
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Upload Area & History */}
          <div className="space-y-6">
            {/* File Upload Area */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-blue-500" />
                  Upload New Barcode
                </h3>
              </div>

              <div className="p-6">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">
                    Drop your barcode here
                  </h4>
                  <p className="text-gray-500 mb-4">
                    or click to browse files
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports: PNG, JPG, GIF (Max 5MB)
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>

                {uploadedFile && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <FileImage className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">
                        {uploadedFile.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

           
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Important:</p>
            <p>Make sure the barcode is clear and readable. Users will scan this code for payments. Test the barcode after uploading to ensure it works correctly.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUpi