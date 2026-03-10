import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import VehicleInfo from "./components/VehicleInfo";
import ManualDataForm from "./components/ManualDataForm";
import VehicleDashboard from "./components/VehicleDashboard";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { fetchVehicleDataFromLicensePlate, analyzeVehicleHealth } from "./services/aiBrowser";

// Import other components (assuming they exist)
import ListPage from "./pages/ListPage";
import PlateDetailPage from "./pages/PlateDetailPage";
import HistoryPage from "./pages/HistoryPage";

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
  
  // Health analysis state
  const [healthAnalysis, setHealthAnalysis] = useState(null);
  const [healthMileage, setHealthMileage] = useState("");
  const [isAnalyzingHealth, setIsAnalyzingHealth] = useState(false);

  // Fetch vehicle data from API endpoint
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
      console.log("[v0] Fetching vehicle data for plate:", currentPlate);
      
      // Fetch from API endpoint
      const apiResult = await fetchVehicleDataFromLicensePlate(currentPlate, vehicleMake, vehicleModel);
      
      if (apiResult.success && apiResult.data) {
        console.log("[v0] API data retrieved successfully");
        // Extract vehicleData key from the API response
        const vehicleDataFromAPI = apiResult.data.vehicleData || apiResult.data;
        setVehicleData({
          ...vehicleDataFromAPI,
          source: "API",
          licensePlate: currentPlate,
          make: vehicleMake || vehicleDataFromAPI.merke,
          model: vehicleModel || vehicleDataFromAPI.handelsbetegnelse
        });
      } else {
        console.error("[v0] API error:", apiResult.error);
        alert("No vehicle data found: " + apiResult.error);
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

  // Function to analyze vehicle health
  const analyzeVehicleHealthOnFirstScreen = async () => {
    if (!vehicleData || vehicleImages.length === 0 || !healthMileage) {
      alert("Please enter mileage and ensure images are uploaded");
      return;
    }

    setIsAnalyzingHealth(true);
    try {
      const vehicleType = `${vehicleData.merke || vehicleData.make || vehicleMake} ${vehicleData.handelsbetegnelse || vehicleData.model || vehicleModel}`;
      console.log("[v0] Starting health analysis with:", { vehicleType, mileage: healthMileage });
      
      const result = await analyzeVehicleHealth(vehicleType, healthMileage, vehicleImages);
      
      if (result.success && result.data) {
        console.log("[v0] Health analysis successful");
        const responseData = result.data;
        const analysisData = responseData.analysis || responseData;
        
        setHealthAnalysis({
          imageAnalysis: analysisData.imageAnalysis || "Analysis complete",
          condition: analysisData.condition || "Vehicle condition assessed",
          riskLevel: analysisData.riskLevel || "medium",
          criticalIssues: Array.isArray(analysisData.criticalIssues) ? analysisData.criticalIssues : [],
          maintenance: Array.isArray(analysisData.maintenance) ? analysisData.maintenance : [],
          recommendations: Array.isArray(analysisData.recommendations) ? analysisData.recommendations : [],
          maintenanceTimeline: analysisData.maintenanceTimeline || "Based on condition",
          mileage: healthMileage,
          vehicleType: vehicleType
        });
      } else {
        alert("Health analysis failed: " + result.error);
      }
    } catch (err) {
      console.error("[v0] Health analysis error:", err);
      alert("Health analysis failed");
    } finally {
      setIsAnalyzingHealth(false);
    }
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

    // Clean vehicleData to remove undefined values
    const cleanedApiData = cleanObject(vehicleData || {});

    const payload = {
      plate,
      apiData: cleanedApiData,
      manualData: dataToSave,
      healthAnalysis: healthAnalysis,
      vehicleMake: vehicleMake,
      vehicleModel: vehicleModel,
      savedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "vehicle", plate), payload);

    alert("Vehicle + manual data + health analysis saved");
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
                    setHealthAnalysis(null);
                    setHealthMileage("");
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

            {/* Results Display - Vehicle Dashboard, Health Analysis, and Manual Data Form */}
            {!loading && vehicleData && (
              <div className="lg:col-span-2 space-y-8">
                {/* API Vehicle Data Dashboard */}
                <VehicleDashboard 
                  vehicleData={vehicleData}
                />
                
                {/* Health Analysis Section */}
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Vehicle Health Analysis</h2>
                  
                  {!healthAnalysis ? (
                    <div className="space-y-4">
                      <p className="text-slate-600 mb-4">Analyze your vehicle's health based on uploaded images</p>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Current Mileage (km) <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="Enter current mileage"
                          value={healthMileage}
                          onChange={(e) => setHealthMileage(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <button
                        onClick={analyzeVehicleHealthOnFirstScreen}
                        disabled={isAnalyzingHealth || !healthMileage || vehicleImages.length === 0}
                        className={`w-full px-4 py-3 rounded-lg text-white font-medium transition-colors ${
                          isAnalyzingHealth || !healthMileage || vehicleImages.length === 0
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {isAnalyzingHealth ? "Analyzing Vehicle Health..." : "Analyze Vehicle Health"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Vehicle Type</p>
                          <p className="text-lg font-semibold text-slate-900">{healthAnalysis.vehicleType}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-slate-600">Mileage</p>
                          <p className="text-lg font-semibold text-slate-900">{healthAnalysis.mileage} km</p>
                        </div>
                      </div>

                      {healthAnalysis.imageAnalysis && (
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-slate-900 mb-2">Image Analysis</h3>
                          <p className="text-slate-700">{healthAnalysis.imageAnalysis}</p>
                        </div>
                      )}

                      {healthAnalysis.condition && (
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-slate-900 mb-2">Overall Condition</h3>
                          <p className="text-slate-700">{healthAnalysis.condition}</p>
                        </div>
                      )}

                      {healthAnalysis.riskLevel && (
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-slate-900 mb-2">Risk Level</h3>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            healthAnalysis.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                            healthAnalysis.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {healthAnalysis.riskLevel.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {healthAnalysis.criticalIssues && healthAnalysis.criticalIssues.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                          <h3 className="font-semibold text-red-900 mb-2">Critical Issues</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {healthAnalysis.criticalIssues.map((issue, idx) => (
                              <li key={idx} className="text-red-700 text-sm">{typeof issue === 'string' ? issue : JSON.stringify(issue)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {healthAnalysis.maintenance && healthAnalysis.maintenance.length > 0 && (
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                          <h3 className="font-semibold text-amber-900 mb-3">Maintenance Needed</h3>
                          <div className="space-y-2">
                            {healthAnalysis.maintenance.map((task, idx) => (
                              <div key={idx} className="bg-white p-2 rounded border-l-4 border-amber-500">
                                {typeof task === 'string' ? (
                                  <p className="text-amber-900 text-sm">{task}</p>
                                ) : (
                                  <div>
                                    <p className="text-amber-900 font-medium text-sm">{task.task || JSON.stringify(task)}</p>
                                    {task.reason && <p className="text-amber-800 text-xs mt-1">{task.reason}</p>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {healthAnalysis.recommendations && healthAnalysis.recommendations.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h3 className="font-semibold text-green-900 mb-2">Recommendations</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {healthAnalysis.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-green-700 text-sm">{typeof rec === 'string' ? rec : JSON.stringify(rec)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {healthAnalysis.maintenanceTimeline && (
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-slate-900 mb-2">Maintenance Timeline</h3>
                          <p className="text-slate-700">{healthAnalysis.maintenanceTimeline}</p>
                        </div>
                      )}

                      <button
                        onClick={() => setHealthAnalysis(null)}
                        className="w-full px-4 py-2 rounded-lg bg-slate-200 text-slate-900 hover:bg-slate-300 transition font-medium text-sm"
                      >
                        Analyze Again
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Manual Data Entry Form */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-4">Add Manual Vehicle Information</h2>
                  <ManualDataForm 
                    manualData={manualData} 
                    setManualData={setManualData} 
                    plate={plate}
                    onAnalysisComplete={handleAnalysisComplete}
                    vehicleData={vehicleData}
                    vehicleImages={vehicleImages}
                    vehicleMake={vehicleMake}
                    vehicleModel={vehicleModel}
                  />
                  
                  {/* Save Button */}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <button 
                      onClick={saveEverything}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                      Save All Vehicle Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      } />
      <Route path="/list" element={<ListPage />} />
      <Route path="/plate/:plate" element={<PlateDetailPage />} />
      <Route path="/history" element={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <HistoryPage />
          </main>
        </div>
      } />
    </Routes>
  );
}

export default App;
