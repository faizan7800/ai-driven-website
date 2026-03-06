import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import VehicleInfo from "./components/VehicleInfo";
import ManualDataForm from "./components/ManualDataForm";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { fetchVehicleDataFromLicensePlate, extractVehicleDataFromImages, analyzeVehicleImages } from "./services/aiBrowser";

// Import other components (assuming they exist)
import ListPage from "./pages/ListPage";
import PlateDetailPage from "./pages/PlateDetailPage";

function App() {
  const [plate, setPlate] = useState("");
  const [vehicleData, setVehicleData] = useState(null);
  const [manualData, setManualData] = useState({});
  const [loading, setLoading] = useState(false);
  const [allPlates, setAllPlates] = useState([]); // New state for all saved plates

  // New state to hold tire analysis data from ManualDataForm
  const [tireAnalysisData, setTireAnalysisData] = useState(null);

  // Image and vehicle info state for the first page
  const [vehicleImages, setVehicleImages] = useState([]);
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");

  // Complete data fetch flow with API first, then AI fallback
  const fetchData = async (currentPlate = plate) => {
    if (!currentPlate || vehicleImages.length === 0) {
      alert("Please enter a license plate and upload at least 1 image");
      return;
    }

    setLoading(true);
    setVehicleData(null);
    setManualData({});
    setTireAnalysisData(null);

    try {
      console.log("[v0] Starting fetch with spinner...");
      
      // Step 1: Try to fetch from API first
      console.log("[v0] Attempting API call for plate:", currentPlate);
      const apiResult = await fetchVehicleDataFromLicensePlate(currentPlate, vehicleMake, vehicleModel);
      
      if (apiResult.success && apiResult.data) {
        console.log("[v0] API succeeded - displaying vehicle data only");
        setVehicleData({
          ...apiResult.data,
          source: "API"
        });
        setTireAnalysisData(null); // No analysis if API succeeds
        return; // Exit early, don't do AI analysis
      }

      // Step 2: API failed - do AI extraction + health analysis in parallel
      console.log("[v0] API failed, starting AI extraction + analysis in parallel...");
      
      const [extractionResult, healthResult] = await Promise.all([
        extractVehicleDataFromImages(vehicleImages, currentPlate, vehicleMake, vehicleModel),
        analyzeVehicleImages(vehicleImages, "", "", vehicleMake, vehicleModel) // Using empty vehicleType/mileage since not required
      ]);

      // Set extracted vehicle data
      if (extractionResult.success && extractionResult.data) {
        console.log("[v0] AI extraction successful");
        setVehicleData({
          ...extractionResult.data,
          source: "AI (Extracted from Images)"
        });
      } else {
        console.error("[v0] AI extraction failed:", extractionResult.error);
        alert("Failed to extract vehicle data from images: " + extractionResult.error);
      }

      // Set health analysis
      if (!healthResult.error) {
        console.log("[v0] Health analysis successful");
        setTireAnalysisData({
          analysis: {
            imageAnalysis: healthResult.imageAnalysis || "Analysis complete",
            condition: healthResult.condition || "Vehicle condition assessed from images",
            riskLevel: healthResult.riskLevel || "medium",
            criticalIssues: healthResult.criticalIssues || [],
            maintenance: healthResult.maintenance || [],
            recommendations: healthResult.recommendations || [],
            maintenanceTimeline: healthResult.maintenanceTimeline || "Based on condition"
          },
          vehicleType: "",
          mileage: "",
          make: vehicleMake,
          model: vehicleModel,
          licensePlate: currentPlate,
          timestamp: new Date().toISOString(),
          imageCount: vehicleImages.length
        });
      }

    } catch (err) {
      console.error("[v0] Error:", err);
      alert("Error fetching data – check console");
    } finally {
      setLoading(false);
    }
  };


  // 4. Handler to receive analysis data from ManualDataForm
  const handleAnalysisComplete = (analysisResult) => {
    setTireAnalysisData(analysisResult);
  };

  /* ---------- save BOTH api + manual ---------- */
const cleanObject = (obj) => {
  const cleaned = {};
  for (let key in obj) {
    cleaned[key] = obj[key] === undefined ? null : obj[key]; // 👈 Converts undefined → null
  }
  return cleaned;
};

const saveEverything = async () => {
  if (!plate) return alert("Enter a license plate first");

  try {
    const dataToSave = cleanObject({
      ...manualData,
      tireAnalysis: tireAnalysisData
    });

    const payload = {
      plate,
      apiData: vehicleData,
      manualData: dataToSave,
      savedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "vehicle", plate), payload);

    alert("Vehicle + manual data saved");
  } catch(err) {
    console.error(err);
    alert("Error saving everything");
  }
};


  // Prepare manualData for ManualDataForm, including tire analysis
  const manualDataWithAnalysis = {
    ...manualData,
    tireAnalysis: tireAnalysisData,
  };

  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen bg-gray-50">
          <Header />

          <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Unified Form - License Plate, Images, Make, Model */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Vehicle Information & Images</h2>
              
              {/* License Plate Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  License Plate <span className="text-red-600">*</span>
                </label>
                <input
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-lg font-semibold focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter license plate (e.g. EF24448)"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                />
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Vehicle Images <span className="text-red-600">*</span> (Min 1 - Max 5)
                </label>
                <p className="text-xs text-slate-500 mb-3">Upload clear photos of your vehicle (exterior, interior, tires, engine bay)</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 5) {
                      alert("Maximum 5 images allowed. Only the first 5 will be used.");
                      setVehicleImages(files.slice(0, 5));
                    } else {
                      setVehicleImages(files);
                    }
                  }}
                  disabled={vehicleImages.length >= 5}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                {vehicleImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {vehicleImages.map((img, idx) => (
                      <div key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {img.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Make and Model */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Vehicle Make (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Toyota, BMW, Ford"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Vehicle Model (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Camry, 3 Series, Mustang"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button 
                  className={`flex-1 px-4 py-3 rounded-lg text-white font-medium transition-colors ${
                    vehicleImages.length === 0 || !plate
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  onClick={() => fetchData()}
                  disabled={vehicleImages.length === 0 || !plate || loading}
                >
                  {loading ? "Loading…" : "Fetch Vehicle Data & Analyze"}
                </button>
            
                <button
                  className="px-4 py-3 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition font-medium"
                  onClick={() => {
                    setPlate("");
                    setVehicleImages([]);
                    setVehicleMake("");
                    setVehicleModel("");
                    setVehicleData(null);
                    setManualData({});
                    setTireAnalysisData(null);
                  }}
                >
                  Reset
                </button>
              </div>
              
              {vehicleImages.length === 0 && plate && (
                <p className="text-xs text-amber-600 mt-2">Upload at least 1 image to proceed</p>
              )}
            </div>


            {/* Loading Spinner */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-lg text-slate-700 font-medium">Fetching vehicle data...</p>
              </div>
            )}

            {/* Results Display */}
            {!loading && vehicleData && (
              <div className="lg:col-span-2 space-y-6">
                
                {/* Vehicle Data Section */}
                <div className="bg-blue-50 rounded-lg shadow-lg p-6 border border-blue-200">
                  <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                    Vehicle Information
                    <span className="text-sm font-normal text-blue-700">
                      ({vehicleData.source || "Unknown Source"})
                    </span>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Info */}
                    <div className="bg-white rounded-lg p-4">
                      <h3 className="font-semibold text-slate-900 mb-3">Basic Information</h3>
                      <div className="space-y-2 text-sm">
                        {vehicleData.make && <div><span className="font-medium text-slate-700">Make:</span> {vehicleData.make}</div>}
                        {vehicleData.model && <div><span className="font-medium text-slate-700">Model:</span> {vehicleData.model}</div>}
                        {vehicleData.year && <div><span className="font-medium text-slate-700">Year:</span> {vehicleData.year}</div>}
                        {vehicleData.bodyType && <div><span className="font-medium text-slate-700">Body Type:</span> {vehicleData.bodyType}</div>}
                        {vehicleData.color && <div><span className="font-medium text-slate-700">Color:</span> {vehicleData.color}</div>}
                        {vehicleData.condition && <div><span className="font-medium text-slate-700">Condition:</span> {vehicleData.condition}</div>}
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="bg-white rounded-lg p-4">
                      <h3 className="font-semibold text-slate-900 mb-3">Additional Details</h3>
                      <div className="space-y-2 text-sm">
                        {vehicleData.mileageEstimate && <div><span className="font-medium text-slate-700">Estimated Mileage:</span> {vehicleData.mileageEstimate}</div>}
                        {vehicleData.transmission && <div><span className="font-medium text-slate-700">Transmission:</span> {vehicleData.transmission}</div>}
                        {vehicleData.fuelType && <div><span className="font-medium text-slate-700">Fuel Type:</span> {vehicleData.fuelType}</div>}
                        {vehicleData.estimatedValue && <div><span className="font-medium text-slate-700">Estimated Value:</span> {vehicleData.estimatedValue}</div>}
                      </div>
                    </div>
                  </div>

                  {/* View Full JSON */}
                  <details className="mt-4">
                    <summary className="cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                      View Full Data (JSON)
                    </summary>
                    <div className="bg-white rounded-lg p-4 mt-2 max-h-96 overflow-y-auto">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words">
                        {JSON.stringify(vehicleData, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>

                {/* Health Analysis Section (only if AI data was used) */}
                {tireAnalysisData && (
                  <div className="bg-amber-50 rounded-lg shadow-lg p-6 border border-amber-200">
                    <h2 className="text-2xl font-bold text-amber-900 mb-4">Vehicle Health & Maintenance Analysis</h2>
                    
                    <div className="space-y-4">
                      {tireAnalysisData.analysis?.imageAnalysis && (
                        <div className="bg-white rounded-lg p-4">
                          <h3 className="font-semibold text-slate-900 mb-2">Image Analysis</h3>
                          <p className="text-slate-700 text-sm">{tireAnalysisData.analysis.imageAnalysis}</p>
                        </div>
                      )}

                      {tireAnalysisData.analysis?.condition && (
                        <div className="bg-white rounded-lg p-4">
                          <h3 className="font-semibold text-slate-900 mb-2">Overall Condition</h3>
                          <p className="text-slate-700 text-sm">{tireAnalysisData.analysis.condition}</p>
                        </div>
                      )}

                      {tireAnalysisData.analysis?.riskLevel && (
                        <div className="bg-white rounded-lg p-4">
                          <h3 className="font-semibold text-slate-900 mb-2">Risk Level</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            tireAnalysisData.analysis.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                            tireAnalysisData.analysis.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {tireAnalysisData.analysis.riskLevel.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {tireAnalysisData.analysis?.criticalIssues && tireAnalysisData.analysis.criticalIssues.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                          <h3 className="font-semibold text-red-900 mb-2">Critical Issues</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {tireAnalysisData.analysis.criticalIssues.map((issue, idx) => (
                              <li key={idx} className="text-red-700 text-sm">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {tireAnalysisData.analysis?.maintenance && tireAnalysisData.analysis.maintenance.length > 0 && (
                        <div className="bg-white rounded-lg p-4">
                          <h3 className="font-semibold text-slate-900 mb-3">Maintenance Needs</h3>
                          <div className="space-y-3">
                            {tireAnalysisData.analysis.maintenance.map((task, idx) => (
                              <div key={idx} className="border-l-4 border-blue-500 pl-4">
                                <div className="font-medium text-slate-900">{task.task}</div>
                                <div className="text-sm text-slate-600">{task.reason}</div>
                                <div className="text-xs mt-1">
                                  <span className={`inline-block px-2 py-1 rounded mr-2 ${
                                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                    task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {task.priority?.toUpperCase()}
                                  </span>
                                  <span className="text-slate-600">Cost: {task.estimatedCost}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {tireAnalysisData.analysis?.recommendations && tireAnalysisData.analysis.recommendations.length > 0 && (
                        <div className="bg-white rounded-lg p-4">
                          <h3 className="font-semibold text-slate-900 mb-2">Recommendations</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {tireAnalysisData.analysis.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-slate-700 text-sm">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {tireAnalysisData.analysis?.maintenanceTimeline && (
                        <div className="bg-white rounded-lg p-4">
                          <h3 className="font-semibold text-slate-900 mb-2">Maintenance Timeline</h3>
                          <p className="text-slate-700 text-sm">{tireAnalysisData.analysis.maintenanceTimeline}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Save Buttons */}
                <div className="mt-4 flex gap-2">
                  <button className="button" onClick={saveEverything}>
                    Save Everything
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      } />
      <Route path="/list" element={<ListPage />} />
      <Route path="/plate/:plate" element={<PlateDetailPage />} /> 
    </Routes>
  );
}

export default App;
