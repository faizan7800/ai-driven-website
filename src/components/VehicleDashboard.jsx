import React from "react";

export default function VehicleDashboard({ vehicleData, onAnalyzeAgain }) {
  if (!vehicleData) return null;

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
      <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-3">{title}</h2>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value || "N/A"}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Identifiers Section */}
      <Section title="Identifiers">
        <InfoRow label="License plate" value={vehicleData.licensePlate} />
        <InfoRow label="VIN" value={vehicleData.vin} />
        <InfoRow label="KUID" value={vehicleData.kuid} />
        <InfoRow label="Personal plate" value={vehicleData.personalPlate} />
        <InfoRow label="Import used" value={vehicleData.importUsed} />
      </Section>

      {/* Registration Section */}
      <Section title="Registration">
        <InfoRow label="First registration (any country)" value={vehicleData.firstRegistration} />
        <InfoRow label="First registration Norway" value={vehicleData.firstRegistrationNorway} />
        <InfoRow label="Latest registration change" value={vehicleData.latestRegistrationChange} />
      </Section>

      {/* Car Lease Info Section */}
      {vehicleData.lease && (
        <Section title="Car Lease Info">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-2">Lease start</p>
              <p className="text-sm font-medium text-slate-900">{vehicleData.lease.leaseStart || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Lease end</p>
              <p className="text-sm font-medium text-slate-900">{vehicleData.lease.leaseEnd || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Lease payment</p>
              <p className="text-sm font-medium text-slate-900">{vehicleData.lease.leasePayment || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Payment date</p>
              <p className="text-sm font-medium text-slate-900">{vehicleData.lease.paymentDate || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Payment responsible</p>
              <p className="text-sm font-medium text-slate-900">{vehicleData.lease.paymentResponsible || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Leaser provider</p>
              <p className="text-sm font-medium text-slate-900">{vehicleData.lease.leaserProvider || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Lease receiver</p>
              <p className="text-sm font-medium text-slate-900">{vehicleData.lease.leaseReceiver || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2">Returned lessor</p>
              <p className="text-sm font-medium text-slate-900">{vehicleData.lease.returnedLessor || "N/A"}</p>
            </div>
          </div>
        </Section>
      )}

      {/* Insurance Section */}
      {vehicleData.insurance && (
        <Section title="Insurance">
          <InfoRow label="Provider" value={vehicleData.insurance.provider} />
          <InfoRow label="Claim procedure URL" value={vehicleData.insurance.claimProcedureUrl} />
          <InfoRow label="Claim contact" value={vehicleData.insurance.claimContact} />
          <InfoRow label="Insurance Expiry Date" value={vehicleData.insurance.insuranceExpiryDate} />
        </Section>
      )}

      {/* Technical Section */}
      {vehicleData.technical && (
        <Section title="Technical">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">Make</p>
                <p className="text-sm font-medium text-slate-900">{vehicleData.technical.make || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Model</p>
                <p className="text-sm font-medium text-slate-900">{vehicleData.technical.model || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Version</p>
                <p className="text-sm font-medium text-slate-900">{vehicleData.technical.version || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Type</p>
                <p className="text-sm font-medium text-slate-900">{vehicleData.technical.type || "N/A"}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-slate-900 mb-3">Dimensions</h4>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Length (mm)" value={vehicleData.technical.lengthMm} />
                <InfoRow label="Width (mm)" value={vehicleData.technical.widthMm} />
                <InfoRow label="Height (mm)" value={vehicleData.technical.heightMm} />
                <InfoRow label="Weight unladen (kg)" value={vehicleData.technical.weightUnladenKg} />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-slate-900 mb-3">Engine</h4>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Displacement (cc)" value={vehicleData.technical.displacementCc} />
                <InfoRow label="Max power (kW)" value={vehicleData.technical.maxPowerKw} />
                <InfoRow label="Fuel type" value={vehicleData.technical.fuelType} />
                <InfoRow label="Euro class" value={vehicleData.technical.euroClass} />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-slate-900 mb-3">Other Info</h4>
              <InfoRow label="Driving ban" value={vehicleData.technical.drivingBan ? "Yes" : "No"} />
            </div>
          </div>
        </Section>
      )}

      {/* Additional Info */}
      {vehicleData.additional && (
        <Section title="Additional Information">
          <InfoRow label="Colour" value={vehicleData.additional.colour} />
          <InfoRow label="Description" value={vehicleData.additional.description} />
          <InfoRow label="Code" value={vehicleData.additional.code} />
          {vehicleData.additional.drivingBan && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800 font-medium">⚠️ Driving ban in effect</p>
            </div>
          )}
        </Section>
      )}

      {/* Action Buttons */}
      {onAnalyzeAgain && (
        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={onAnalyzeAgain}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
          >
            Analyze Again with Different Photos
          </button>
          <button
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-semibold text-sm"
          >
            Save Vehicle Data
          </button>
        </div>
      )}
    </div>
  );
}
