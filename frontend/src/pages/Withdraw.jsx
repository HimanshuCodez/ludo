import React, { useState, useEffect } from 'react';
import { Wallet, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const Withdraw = () => {
  const [formData, setFormData] = useState({
    upiId: '',
    screenshot: null
  });
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validateUpiId = (upiId) => {
    const upiRegex = /^[\w\.-]+@[\w\.-]+$/;
    return upiRegex.test(upiId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({
          ...prev,
          screenshot: 'File size should be less than 5MB'
        }));
        return;
      }

      setFormData(prev => ({
        ...prev,
        screenshot: file
      }));
      setPreview(URL.createObjectURL(file));
      setErrors(prev => ({
        ...prev,
        screenshot: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.upiId.trim()) {
      newErrors.upiId = 'UPI ID is required';
    } else if (!validateUpiId(formData.upiId)) {
      newErrors.upiId = 'Please enter a valid UPI ID (e.g., user@paytm)';
    }


    if (!formData.screenshot) {
      newErrors.screenshot = 'Payment screenshot is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // Simulate API call and file upload
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 3000);
  };

  // Reset form after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setFormData({ upiId: '', screenshot: null });
        setPreview('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [success]);

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border-t-4 border-green-500">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Withdrawal Request Submitted!</h2>
            <p className="text-gray-600">Your withdrawal request has been received and is being processed.</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-left space-y-2">

              <p className="text-sm text-gray-700">
                <strong>UPI ID:</strong> {formData.upiId}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Status:</strong> <span className="text-orange-600">Processing</span>
              </p>
              <p className="text-sm text-gray-700">
                <strong>Expected Time:</strong> 24-48 hours
              </p>
            </div>
          </div>

          <div className="flex justify-center space-x-1 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>

          <button
            onClick={() => setSuccess(false)}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Make Another Withdrawal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Withdraw Funds</h1>
          <p className="text-gray-600">Enter your UPI details and upload payment screenshot</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* UPI ID Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              UPI ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="upiId"
              value={formData.upiId}
              onChange={handleInputChange}
              placeholder="yourname@paytm"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
                errors.upiId ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.upiId && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.upiId}
              </p>
            )}
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Screenshot <span className="text-red-500">*</span>
            </label>
            
            {preview && (
              <div className="mb-4">
                <img 
                  src={preview} 
                  alt="Payment Screenshot" 
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                />
              </div>
            )}

            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              errors.screenshot ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-purple-400'
            }`}>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mb-4">
                PNG, JPG or JPEG (max. 5MB)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 file:cursor-pointer cursor-pointer"
              />
            </div>
            
            {errors.screenshot && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.screenshot}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              loading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Request...
              </div>
            ) : (
              'Submit Withdrawal Request'
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Important Notes:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Withdrawals are processed within 24-48 hours</li>
            <li>• Ensure your UPI ID is correct and active</li>
            <li>• Upload a clear screenshot of the payment request</li>
            <li>• Contact support if you don't receive funds within 48 hours</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;