import React from "react";

export default function VehicleDashboard({ vehicleData }) {
  if (!vehicleData) return null;

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
      <h2 className="text-lg font-bold text-slate-900 mb-4 border-b pb-3">{title}</h2>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 mb-3 pb-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-medium text-slate-900 col-span-2">{value || "N/A"}</span>
    </div>
  );

  const { kjennemerke, understellsnummer, kuid, personligKjennemerke, registrering, tekniskKjoretoy, periodiskKjoretoykontroll } = vehicleData;

  return (
    <div className="space-y-6">
      {/* Identifiers Section */}
      <Section title="Identifiers">
        <InfoRow label="License plate" value={kjennemerke} />
        <InfoRow label="VIN (Chassis number)" value={understellsnummer} />
        <InfoRow label="KUID" value={kuid} />
        <InfoRow label="Personal licence plate" value={personligKjennemerke || "No"} />
      </Section>

      {/* Registration Section */}
      {registrering && (
        <Section title="Registration">
          <InfoRow label="Registration status" value={registrering.registreringsstatus} />
          <InfoRow label="Status date" value={registrering.registreringsstatusDato} />
          <InfoRow label="First registration (any country)" value={registrering.forstegangsregistrering} />
          <InfoRow label="First registration Norway" value={registrering.forstegangsregistreringNorge} />
          <InfoRow label="First registration owner" value={registrering.forstegangsregistreringEier} />
          <InfoRow label="Number plate colors" value={registrering.kjennemerkefarge} />
          <InfoRow label="Registered with dealer" value={registrering.isAvregistrertHosBilforhandler ? "Yes" : "No"} />
        </Section>
      )}

      {/* Periodic Vehicle Control Section */}
      {periodiskKjoretoykontroll && (
        <Section title="Periodic Vehicle Control (Inspection)">
          <InfoRow label="Last inspected" value={periodiskKjoretoykontroll.sistKontrollert || "Not inspected"} />
          <InfoRow label="Next inspection due" value={periodiskKjoretoykontroll.nesteKontroll} />
        </Section>
      )}

      {/* Technical Vehicle Section */}
      {tekniskKjoretoy && (
        <Section title="Technical Information">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Basic Info</h4>
              <div className="space-y-3">
                <InfoRow label="Make" value={tekniskKjoretoy.merke} />
                <InfoRow label="Model" value={tekniskKjoretoy.handelsbetegnelse} />
                <InfoRow label="Type designation" value={tekniskKjoretoy.typebetegnelse} />
                <InfoRow label="Euro class" value={tekniskKjoretoy.miljoEuroklasse} />
                <InfoRow label="Vehicle category" value={tekniskKjoretoy.tekniskKode} />
              </div>
            </div>

            {/* Dimensions */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-slate-900 mb-3">Dimensions</h4>
              <div className="space-y-3">
                <InfoRow label="Length (mm)" value={tekniskKjoretoy.lengde} />
                <InfoRow label="Width (mm)" value={tekniskKjoretoy.bredde} />
                <InfoRow label="Height (mm)" value={tekniskKjoretoy.hoyde} />
              </div>
            </div>

            {/* Weights */}
            {tekniskKjoretoy.lastegenskaper && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-900 mb-3">Weight & Load Capacity</h4>
                <div className="space-y-3">
                  <InfoRow label="Unladen weight (kg)" value={tekniskKjoretoy.lastegenskaper.egenvekt} />
                  <InfoRow label="Maximum total weight (kg)" value={tekniskKjoretoy.lastegenskaper.tillattTotalvekt} />
                  <InfoRow label="Payload (kg)" value={tekniskKjoretoy.lastegenskaper.nyttelast} />
                  <InfoRow label="Max trailer weight with brakes (kg)" value={tekniskKjoretoy.lastegenskaper.tillattTilhengervektMedBrems} />
                  <InfoRow label="Max trailer weight without brakes (kg)" value={tekniskKjoretoy.lastegenskaper.tillattTilhengervektUtenBrems} />
                </div>
              </div>
            )}

            {/* Seating & Performance */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-slate-900 mb-3">Seating & Performance</h4>
              <div className="space-y-3">
                <InfoRow label="Seating capacity" value={tekniskKjoretoy.sitteplasser} />
                <InfoRow label="Maximum speed (km/h)" value={tekniskKjoretoy.maksimumHastighet} />
                <InfoRow label="Gearbox" value={tekniskKjoretoy.girkasse} />
              </div>
            </div>

            {/* Color */}
            {tekniskKjoretoy.karosseri && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-900 mb-3">Color</h4>
                <div className="space-y-3">
                  <InfoRow label="Color" value={tekniskKjoretoy.karosseri.farge} />
                  <InfoRow label="Color code" value={tekniskKjoretoy.karosseri.fargekode} />
                </div>
              </div>
            )}

            {/* Engine & Fuel */}
            {tekniskKjoretoy.motorer && tekniskKjoretoy.motorer.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-900 mb-3">Engine</h4>
                {tekniskKjoretoy.motorer.map((motor, idx) => (
                  <div key={idx} className="space-y-3">
                    {motor.drivstoff && motor.drivstoff.length > 0 && (
                      <>
                        <InfoRow label="Fuel type" value={motor.drivstoff[0]?.drivstofftype} />
                        <InfoRow label="Power (kW)" value={motor.drivstoff[0]?.effekt} />
                        <InfoRow label="Max power per hour (kW)" value={motor.drivstoff[0]?.maksEffektPerTime} />
                        <InfoRow label="Range (km)" value={motor.drivstoff[0]?.rekkeviddeKm} />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tires & Wheels */}
            {tekniskKjoretoy.aksler?.dekkOgFelger && tekniskKjoretoy.aksler.dekkOgFelger.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-900 mb-3">Tires & Wheels</h4>
                {tekniskKjoretoy.aksler.dekkOgFelger.map((dekk, idx) => (
                  <div key={idx} className="mb-4 pb-4 border-b last:border-0">
                    <InfoRow label={`Axle ${dekk.akselId} - Tire size`} value={dekk.dekkdimensjon} />
                    <InfoRow label={`Axle ${dekk.akselId} - Rim size`} value={dekk.felgdimensjon} />
                    <InfoRow label={`Axle ${dekk.akselId} - Load index`} value={dekk.belastningskode} />
                    <InfoRow label={`Axle ${dekk.akselId} - Speed index`} value={dekk.hastighetskode} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}


    </div>
  );
}
