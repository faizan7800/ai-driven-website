const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME || "dkv1zwjfe";
import axios from "axios";

/* ----------  fake LongCat – returns instantly  ---------- */
// export async function askLongCat(prompt) {
//   // mock replies
//   if (prompt.includes("leiekontrakt")) return "Leieavtalen ser standard ut. Ingen spesielle avvik.";
//   if (prompt.includes("dekkmønster"))  return "Dekkene har ca. 4 mm mønster – bytt om 5 000 km.";
//   if (prompt.includes("service"))      return "Anbefal service om 8 000 km / 6 måneder.";
//   if (prompt.includes("feil"))         return "1. Tidlig EGR-ventil problemer\n2. Svake fjærer bak\n3. Katalysator ved 150 000 km";
//   return "Ingen spesielle anbefalinger.";
// }








export const askLongCat = async (prompt, context = null) => {
  // Accepts a prompt (the user's question or instruction) and an optional
  // context object containing vehicle data. We combine these into a single
  // message that will be sent to LongCat so the AI can provide context-aware answers.
  let finalPrompt = prompt
  if (context && typeof context === "object") {
    try {
      const ctxLines = []
      if (context.plate) ctxLines.push(`Plate: ${context.plate}`)
      if (context.lease && Object.keys(context.lease || {}).length) ctxLines.push(`Lease: ${JSON.stringify(context.lease)}`)
      if (context.insurance && Object.keys(context.insurance || {}).length) ctxLines.push(`Insurance: ${JSON.stringify(context.insurance)}`)
      if (context.maintenance && Array.isArray(context.maintenance) && context.maintenance.length) ctxLines.push(`Maintenance: ${JSON.stringify(context.maintenance)}`)
      if (context.liens && Object.keys(context.liens || {}).length) ctxLines.push(`Liens: ${JSON.stringify(context.liens)}`)

      const ctxStr = ctxLines.length ? `Context:\n${ctxLines.join('\n')}` : ""
      finalPrompt = ctxStr ? `${ctxStr}\n\nUser request:\n${prompt}` : prompt
    } catch (e) {
      console.warn("Failed to stringify context for LongCat prompt", e)
      finalPrompt = `${prompt}`
    }
  }
  console.log(finalPrompt, 'prompt')
  try {
    const apiKey = import.meta.env.VITE_LONGCAT_API_KEY;
    const url = "https://api.longcat.chat/openai/v1/chat/completions";

    const body = {
      model: "LongCat-Flash-Chat",
      messages: [
        {
          role: "user",
          content: finalPrompt
        }
      ],
      max_tokens: 300
    };

    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    };

    const resp = await axios.post(url, body, { headers });
    console.log(resp.data.choices?.[0]?.message?.content)

    return resp.data.choices?.[0]?.message?.content || "No response from AI.";
  } catch (err) {
    console.error("LongCat API error:", err.response?.data || err);
    return "Kunne ikke hente svar fra LongCat.";
  }
};


/* ----------  OpenAI Function (Text)  ---------- */
export const askOpenAI = async (prompt, context = null) => {
  // Accepts a prompt and optional context object containing vehicle data
  // Combines context into a single message sent to OpenAI
  let finalPrompt = prompt;
  
  if (context && typeof context === "object") {
    try {
      const ctxLines = [];
      if (context.plate) ctxLines.push(`Plate: ${context.plate}`);
      if (context.lease && Object.keys(context.lease || {}).length) ctxLines.push(`Lease: ${JSON.stringify(context.lease)}`);
      if (context.insurance && Object.keys(context.insurance || {}).length) ctxLines.push(`Insurance: ${JSON.stringify(context.insurance)}`);
      if (context.maintenance && Array.isArray(context.maintenance) && context.maintenance.length) ctxLines.push(`Maintenance: ${JSON.stringify(context.maintenance)}`);
      if (context.liens && Object.keys(context.liens || {}).length) ctxLines.push(`Liens: ${JSON.stringify(context.liens)}`);

      const ctxStr = ctxLines.length ? `Context:\n${ctxLines.join('\n')}` : "";
      finalPrompt = ctxStr ? `${ctxStr}\n\nUser request:\n${prompt}` : prompt;
    } catch (e) {
      console.warn("Failed to stringify context for OpenAI prompt", e);
      finalPrompt = prompt;
    }
  }
  
  console.log(finalPrompt, 'finalPrompt');
  
  try {
    const apiKey = import.meta.env.VITE_OPEN_API_KEY;
    
    if (!apiKey) {
      console.error("OpenAI API key not found in environment variables");
      return "API key not configured. Please check your .env file.";
    }
    
    const url = "https://api.openai.com/v1/chat/completions";

    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: finalPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    };

    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    };

    const resp = await axios.post(url, body, { headers });
    console.log("OpenAI response:", resp.data.choices?.[0]?.message?.content);

    return resp.data.choices?.[0]?.message?.content || "No response from OpenAI.";
  } catch (err) {
    console.error("OpenAI API error:", err.response?.status, err.response?.data || err.message);
    const errorMessage = err.response?.data?.error?.message || "Could not fetch response from OpenAI.";
    return errorMessage;
  }
};

/* ----------  OpenAI Vision API (Image Analysis)  ---------- */
export const analyzeVehicleImages = async (images, vehicleType, mileage, make = "", model = "") => {
  try {
    const apiKey = import.meta.env.VITE_OPEN_API_KEY;
    
    if (!apiKey) {
      console.error("OpenAI API key not found in environment variables");
      return { error: "API key not configured. Please check your .env file." };
    }
    
    // Convert images to base64
    const imagePromises = images.map(img => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve({
            type: "image_url",
            image_url: {
              url: `data:${img.type};base64,${base64}`
            }
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(img);
      });
    });
    
    const imageContents = await Promise.all(imagePromises);
    
    // Build the analysis prompt with enhanced requirements
    const vehicleInfo = [
      `Type: ${vehicleType || "Unknown"}`,
      `Mileage: ${mileage || "Unknown"} km`,
      make && `Make: ${make}`,
      model && `Model: ${model}`
    ].filter(Boolean).join('\n');

    const analysisPrompt = `You are an expert vehicle inspector and automotive technician. Analyze the provided vehicle image(s) and provide a comprehensive vehicle health report in JSON format.

Vehicle Information:
${vehicleInfo}

Analyze the image(s) thoroughly and identify what is visible (tires, exterior condition, interior, engine bay, paint condition, rust, dents, scratches, etc.). 

Provide a detailed assessment covering:
- Overall condition and visual health
- Tire condition and wear patterns
- Exterior damage, dents, rust, or paint issues
- Interior condition and wear
- Engine bay cleanliness and component condition
- Evidence of maintenance or neglect
- Tuning or modifications visible
- Estimated maintenance needs and priorities
- Safety concerns

Provide detailed assessment with the following JSON structure (ensure all fields are present):
{
  "imageAnalysis": "Detailed description of what's visible in the image(s), specific components, condition observations",
  "condition": "Comprehensive overall condition summary based on visual inspection, specific observations about wear and tear",
  "riskLevel": "low|medium|high",
  "criticalIssues": ["Critical issue 1", "Critical issue 2"],
  "maintenance": [
    {
      "task": "Task name",
      "reason": "Why this needs attention, specific observations from images",
      "priority": "low|medium|high",
      "estimatedCost": "Average estimated cost range (e.g. $200-400)"
    }
  ],
  "recommendations": [
    "Recommendation 1 based on visual inspection",
    "Recommendation 2 based on visual inspection"
  ],
  "maintenanceTimeline": "Detailed timeline for when maintenance should be done based on observations"
}

Provide ONLY valid JSON without markdown formatting or code blocks. Be thorough and specific based on what you can see in the images.`;

    const url = "https://api.openai.com/v1/chat/completions";
    
    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompt
            },
            ...imageContents
          ]
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    };

    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    };

    const resp = await axios.post(url, body, { headers });
    const responseText = resp.data.choices?.[0]?.message?.content || "{}";
    
    console.log("OpenAI Vision response:", responseText);
    
    // Parse JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      const analysisResult = JSON.parse(jsonStr);
      return analysisResult;
    } catch (parseErr) {
      console.error("Failed to parse OpenAI response:", parseErr);
      return {
        error: "Failed to parse analysis response",
        rawResponse: responseText
      };
    }
  } catch (err) {
    console.error("OpenAI Vision API error:", err.response?.status, err.response?.data || err.message);
    const errorMessage = err.response?.data?.error?.message || "Could not analyze images with OpenAI.";
    return { error: errorMessage };
  }
};

/* ----------  Fetch Vehicle Data from License Plate API  ---------- */
export const fetchVehicleDataFromLicensePlate = async (licensePlate, make = "", model = "") => {
  try {
    if (!licensePlate) {
      return { error: "License plate is required" };
    }

    // Encode the license plate for URL
    const encodedPlate = encodeURIComponent(licensePlate);
    // Use proxy endpoint to avoid CORS issues
    const proxyUrl = `/api/vehicle/getVehicleDataFromLicensePlate/${encodedPlate}`;

    console.log("[v0] Fetching vehicle data from proxy:", proxyUrl);

    const response = await axios.get(proxyUrl);
    
    if (response.data) {
      console.log("[v0] Vehicle data fetched successfully:", response.data);
      return {
        success: true,
        data: response.data,
        make,
        model
      };
    } else {
      return { error: "No data found for this license plate" };
    }
  } catch (err) {
    console.error("[v0] License plate API error:", err.response?.status, err.response?.data || err.message);
    return {
      error: "Failed to fetch vehicle data from API",
      details: err.response?.data?.error?.message || err.message
    };
  }
};

/* ----------  Extract Vehicle Data from Images (AI Fallback for API)  ---------- */
export const extractVehicleDataFromImages = async (images, licensePlate = "", make = "", model = "") => {
  try {
    const apiKey = import.meta.env.VITE_OPEN_API_KEY;
    
    if (!apiKey) {
      console.error("[v0] OpenAI API key not found");
      return { error: "API key not configured. Please check your .env file." };
    }
    
    // Convert images to base64
    const imagePromises = images.map(img => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve({
            type: "image_url",
            image_url: {
              url: `data:${img.type};base64,${base64}`
            }
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(img);
      });
    });
    
    const imageContents = await Promise.all(imagePromises);
    
    // Build extraction prompt for vehicle data similar to API response format
    const extractionPrompt = `You are an expert vehicle data analyst. Based on the provided vehicle image(s), extract and provide comprehensive vehicle information in JSON format.

User provided information:
- License Plate: ${licensePlate || "Not provided"}
- Make: ${make || "Extract from images if possible"}
- Model: ${model || "Extract from images if possible"}

Analyze the image(s) carefully to identify and extract as much information as possible:
- Make (manufacturer/brand): e.g., Toyota, BMW, Ford, Honda
- Model: e.g., Camry, 3 Series, Mustang
- Body Type: e.g., Sedan, SUV, Truck, Coupe
- Color: Primary and secondary exterior colors
- Year/Generation: Approximate year if visible from design
- Condition: Overall condition assessment
- Mileage Estimate: Rough estimate from visible wear patterns
- Exterior Features: Visible modifications, trim level, special equipment
- Interior Details: Visible interior condition and features
- Engine Bay: Visible engine condition and components
- Notable Observations: Any unique characteristics, damage, modifications, wear patterns

Provide the following comprehensive JSON structure (extract as much as you can confidently identify):
{
  "licensePlate": "${licensePlate || ""}",
  "make": "Vehicle make extracted or provided",
  "model": "Vehicle model extracted or provided",
  "bodyType": "Body type from images",
  "color": "Primary color visible in images",
  "secondaryColor": "Secondary color if visible",
  "year": "Approximate year from design cues",
  "condition": "Overall condition assessment (Excellent/Good/Fair/Poor)",
  "mileageEstimate": "Estimated mileage from visible wear",
  "transmission": "Manual/Automatic if visible",
  "fuelType": "Petrol/Diesel/Hybrid/Electric if identifiable",
  "features": [
    "Feature 1 visible",
    "Feature 2 visible"
  ],
  "exteriorCondition": "Detailed assessment of paint, dents, rust, scratches",
  "interiorCondition": "Visible interior condition and cleanliness",
  "tiresCondition": "Tire condition assessment if visible",
  "engineCondition": "Engine bay condition if visible",
  "modifications": [
    "Visible modification 1",
    "Visible modification 2"
  ],
  "estimatedValue": "Rough value estimate based on condition and features",
  "commonIssues": [
    "Potential issue 1 based on observations",
    "Potential issue 2 based on observations"
  ],
  "maintenanceNeeds": [
    "Maintenance recommendation 1",
    "Maintenance recommendation 2"
  ],
  "detailedObservations": "Comprehensive observations about the vehicle based on visual inspection",
  "source": "AI Extracted from Images"
}

Provide ONLY valid JSON without markdown formatting or code blocks. Extract maximum information from what you can see in the images.`;

    const url = "https://api.openai.com/v1/chat/completions";
    
    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: extractionPrompt
            },
            ...imageContents
          ]
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    };

    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    };

    console.log("[v0] Extracting vehicle data from images...");
    const resp = await axios.post(url, body, { headers });
    const responseText = resp.data.choices?.[0]?.message?.content || "{}";
    
    console.log("[v0] Vehicle extraction response:", responseText);
    
    // Parse JSON response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      const extractedData = JSON.parse(jsonStr);
      return {
        success: true,
        data: extractedData,
        isFromAI: true,
        source: "AI Extracted from Images"
      };
    } catch (parseErr) {
      console.error("[v0] Failed to parse extraction response:", parseErr);
      return {
        success: false,
        error: "Failed to parse vehicle data extraction",
        rawResponse: responseText
      };
    }
  } catch (err) {
    console.error("[v0] Vehicle extraction error:", err.response?.status, err.response?.data || err.message);
    return {
      error: "Failed to extract vehicle data from images",
      details: err.response?.data?.error?.message || err.message
    };
  }
};

/* ----------  Analyze Vehicle Health  ---------- */
export const analyzeVehicleHealth = async (vehicleType, mileage, images) => {
  try {
    if (!vehicleType || !mileage || !images || images.length === 0) {
      return { error: "Vehicle type, mileage, and at least 1 image are required" };
    }

    // Use proxy endpoint to avoid CORS issues
    const proxyUrl = `/api/vehicle/analyzeVehicleHealth`;

    console.log("[v0] Analyzing vehicle health...");

    // Create FormData to send files and form fields
    const formData = new FormData();
    formData.append("vehicleType", vehicleType);
    formData.append("mileage", mileage);
    
    // Add images - take only the first image for now
    if (images && images.length > 0) {
      formData.append("image", images[0]);
    }

    const response = await axios.post(proxyUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    if (response.data?.success || response.data?.data) {
      const analysisData = response.data.data || response.data;
      console.log("[v0] Vehicle health analysis successful:", analysisData);
      return {
        success: true,
        data: analysisData
      };
    } else {
      return {
        error: response.data?.message || "Failed to analyze vehicle health"
      };
    }
  } catch (err) {
    console.error("[v0] Vehicle health analysis error:", err.response?.status, err.response?.data || err.message);
    return {
      error: "Failed to analyze vehicle health",
      details: err.response?.data?.error?.message || err.message
    };
  }
};

/* ----------  Cloudinary UNSIGNED (works locally)  ---------- */
export async function uploadCloudinaryUnsigned(file, folder = "vehicle-app") {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", "vehicle-unsigned"); // create once in console
  form.append("folder", folder);

  const res = await fetch(url, { method: "POST", body: form });
  const data = await res.json();
  return data.secure_url;
}
