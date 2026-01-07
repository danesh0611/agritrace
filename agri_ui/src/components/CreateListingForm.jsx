import React, { useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';

export default function CreateListingForm({ user, onSubmit, loading = false }) {
  const [formData, setFormData] = useState({
    batchId: '',
    cropName: '',
    quantityKg: '',
    askingPricePerKg: '',
    qualityGrade: 'Grade-A',
    deliveryLocation: '',
    harvestDate: new Date().toISOString().split('T')[0]
  });

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    // Validation
    if (!formData.batchId.trim()) {
      setError('❌ Batch ID is required. It must start with "0x" and be 66 characters (blockchain hash)');
      return;
    }
    
    // Check if it's a blockchain batch ID (should be 0x + 64 hex chars = 66 total)
    if (!formData.batchId.startsWith('0x') || formData.batchId.length !== 66) {
      setError('❌ Invalid Batch ID format. Must be 66 characters starting with 0x (from blockchain)');
      return;
    }
    
    if (!formData.cropName.trim()) {
      setError('Crop name is required');
      return;
    }
    if (!formData.quantityKg || parseFloat(formData.quantityKg) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (!formData.askingPricePerKg || parseFloat(formData.askingPricePerKg) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setInfo('📋 Creating marketplace listing with blockchain batch ID...');
    
    await onSubmit({
      ...formData,
      sellerId: user.id,
      sellerEmail: user.email,
      sellerName: user.username,
      quantityKg: parseFloat(formData.quantityKg),
      askingPricePerKg: parseFloat(formData.askingPricePerKg)
    });

    // Reset form
    setFormData({
      batchId: '',
      cropName: '',
      quantityKg: '',
      askingPricePerKg: '',
      qualityGrade: 'Grade-A',
      deliveryLocation: '',
      harvestDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-green-200 p-6 space-y-4">
      <h3 className="text-xl font-bold text-green-800">📦 List Your Produce</h3>

      {/* Info Alert */}
      <div className="flex gap-2 bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span className="text-sm">
          <strong>⚠️ Important:</strong> Create your batch on blockchain FIRST (using "Blockchain" tab). Copy the Batch ID (0x...) and paste it here.
        </span>
      </div>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {info && (
        <div className="flex gap-2 bg-green-50 border border-green-200 text-green-700 p-3 rounded">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{info}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Batch ID */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Blockchain Batch ID * <span className="text-red-500">(Required)</span></label>
          <input
            type="text"
            name="batchId"
            value={formData.batchId}
            onChange={handleChange}
            placeholder="0x... (copy from blockchain batch creation, should be 66 characters)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Format: 0x followed by 64 hexadecimal characters</p>
        </div>

        {/* Crop Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Crop Name *</label>
          <input
            type="text"
            name="cropName"
            value={formData.cropName}
            onChange={handleChange}
            placeholder="e.g., Tomatoes, Wheat"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity (kg) *</label>
          <input
            type="number"
            name="quantityKg"
            value={formData.quantityKg}
            onChange={handleChange}
            placeholder="0.00"
            step="0.1"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Price per kg */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Price per kg (₹) *</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-600">₹</span>
            <input
              type="number"
              name="askingPricePerKg"
              value={formData.askingPricePerKg}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
        </div>

        {/* Quality Grade */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Quality Grade</label>
          <select
            name="qualityGrade"
            value={formData.qualityGrade}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Grade-A">Grade-A (Premium)</option>
            <option value="Grade-B">Grade-B (Good)</option>
            <option value="Grade-C">Grade-C (Standard)</option>
          </select>
        </div>

        {/* Harvest Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Harvest Date</label>
          <input
            type="date"
            name="harvestDate"
            value={formData.harvestDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Delivery Location */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Location</label>
          <input
            type="text"
            name="deliveryLocation"
            value={formData.deliveryLocation}
            onChange={handleChange}
            placeholder="e.g., Farm location or warehouse address"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Summary */}
      {formData.quantityKg && formData.askingPricePerKg && (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Expected Total Value</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{(parseFloat(formData.quantityKg) * parseFloat(formData.askingPricePerKg)).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {parseFloat(formData.quantityKg)} kg @ ₹{parseFloat(formData.askingPricePerKg)}/kg
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
      >
        {loading ? 'Creating Listing...' : 'Create Listing'}
      </button>
    </form>
  );
}
