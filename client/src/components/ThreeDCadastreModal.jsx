import { useState } from "react";
import { Box, Building2, CheckCircle2, Layers, MapPin, X } from "lucide-react";

const sampleUrbanUnits = [
  { floor: 3, floorLabel: "Level 3: Executive Penthouse & Boardroom", unitUlpin: "04010100200814-F301", unitName: "Penthouse Suite 301", areaSqFt: 1250, owner: "Gurpreet Singh Dhillon", use: "Executive Office", status: "Owner Occupied" },
  { floor: 2, floorLabel: "Level 2: Tech Incubator & Design Studio", unitUlpin: "04010100200814-F201", unitName: "Studio 201", areaSqFt: 820, owner: "TechSpire Infotech Ltd", use: "Software Studio", status: "Active Tenancy" },
  { floor: 2, floorLabel: "Level 2: Tech Incubator & Design Studio", unitUlpin: "04010100200814-F202", unitName: "Studio 202", areaSqFt: 780, owner: "TechSpire Infotech Ltd", use: "R&D Lab", status: "Active Tenancy" },
  { floor: 1, floorLabel: "Level 1: Corporate Commercial Suites", unitUlpin: "04010100200814-F101", unitName: "Suite 101", areaSqFt: 850, owner: "Dhillon Commercial Assets LLP", use: "Corporate Chambers", status: "Commercial Lease" },
  { floor: 1, floorLabel: "Level 1: Corporate Commercial Suites", unitUlpin: "04010100200814-F102", unitName: "Suite 102", carpetAreaSqFt: 750, owner: "Dhillon Commercial Assets LLP", use: "Consultancy Hub", status: "Commercial Lease" },
  { floor: 0, floorLabel: "Ground Level: Retail Arcade & Frontage", unitUlpin: "04010100200814-G01", unitName: "Shop G-101", areaSqFt: 620, owner: "Gurpreet Singh Dhillon (60%)", use: "Retail Frontage", status: "Active Retail" },
  { floor: 0, floorLabel: "Ground Level: Retail Arcade & Frontage", unitUlpin: "04010100200814-G02", unitName: "Shop G-102", areaSqFt: 580, owner: "Simran Kaur Dhillon (40%)", use: "Cafe & Confectionery", status: "Active Retail" }
];

const ThreeDCadastreModal = ({ parcel, onClose }) => {
  const [selectedUnit, setSelectedUnit] = useState(sampleUrbanUnits[0]);
  const [activeFloorFilter, setActiveFloorFilter] = useState("all");

  const units = parcel?.verticalStrata?.floors?.length
    ? parcel.verticalStrata.floors.flatMap((fl) =>
        fl.units.map((u) => ({
          floor: fl.floorNumber,
          floorLabel: fl.floorLabel,
          unitUlpin: u.unitUlpin,
          unitName: u.unitNumber,
          areaSqFt: u.carpetAreaSqFt,
          owner: u.owner,
          use: u.use,
          status: u.status || "Sanctioned"
        }))
      )
    : sampleUrbanUnits;

  const filteredUnits = activeFloorFilter === "all" ? units : units.filter((u) => u.floor === Number(activeFloorFilter));

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2.5rem] border border-white/60 bg-white p-6 shadow-2xl md:p-8">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-900 shadow-sm">
              <Building2 size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-900">
                  DoLR SIH26011 Research Focus
                </span>
                <span className="text-xs text-earth-500">Vertical Strata & 3D ULPIN Multi-Storey Mapping</span>
              </div>
              <h3 className="text-lg font-black text-earth-950 sm:text-xl">
                {parcel?.parcelId} • 3D Cadastre & Vertical Property Strata Preview
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-earth-500 hover:bg-earth-100 hover:text-earth-900"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3D Vertical Architecture Explainer */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 text-xs">
          <p className="font-bold text-purple-950 uppercase tracking-wider">
            🏢 Vertical Property Identity Architecture:
          </p>
          <p className="mt-1 text-earth-700 leading-relaxed">
            In dense urban centres, high-rise buildings and commercial complexes share a single 2D land footprint. Land Stack models <strong>Vertical Strata</strong> by extending the parent 2D ULPIN into standardized 3D Sub-ULPINs with vertical Z-axis boundaries, carpet area shares, and undivided rights in land.
          </p>
        </div>

        {/* Floor Filter Tabs */}
        <div className="mt-5 flex items-center gap-1.5 rounded-2xl bg-earth-100/70 p-1 text-xs font-semibold">
          <span className="px-2 text-earth-500 font-bold uppercase text-[10px]">Filter Floor:</span>
          {["all", "3", "2", "1", "0"].map((fl) => (
            <button
              key={fl}
              type="button"
              onClick={() => setActiveFloorFilter(fl)}
              className={`rounded-xl px-3 py-1 text-xs transition ${
                activeFloorFilter === fl ? "bg-earth-900 text-white shadow-xs" : "text-earth-700 hover:bg-earth-200"
              }`}
            >
              {fl === "all" ? "All Floors" : `Floor ${fl}`}
            </button>
          ))}
        </div>

        {/* 3D Stack Visualization + Unit Details Grid */}
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {/* Isometric Tiered Floor Stack */}
          <div className="relative flex flex-col items-center justify-center rounded-3xl border border-earth-300 bg-gradient-to-b from-gray-900 via-gray-800 to-earth-950 p-6 shadow-inner text-white min-h-[300px]">
            <p className="absolute top-3 left-4 text-[10px] font-mono text-gray-400">
              Parent Cadastral Base: {parcel?.ulpin || "04010100200814"}
            </p>

            {/* Visual Isometric Stacked Floors */}
            <div className="w-full max-w-xs space-y-2 py-4">
              {[3, 2, 1, 0].map((floorNum) => {
                const floorUnits = units.filter((u) => u.floor === floorNum);
                const isSelected = selectedUnit?.floor === floorNum;

                return (
                  <div
                    key={floorNum}
                    onClick={() => setSelectedUnit(floorUnits[0])}
                    className={`cursor-pointer rounded-2xl p-3 border transition transform hover:-translate-y-0.5 ${
                      isSelected
                        ? "border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/10 scale-102"
                        : "border-white/20 bg-white/10 hover:bg-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        Level {floorNum} ({floorNum === 0 ? "Ground" : `Floor ${floorNum}`})
                      </span>
                      <span className="font-mono text-[10px] text-gray-300">
                        {floorUnits.length} Unit(s)
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                      {floorUnits.map((u) => (
                        <span
                          key={u.unitUlpin}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUnit(u);
                          }}
                          className={`rounded px-1.5 py-0.5 font-mono ${
                            selectedUnit?.unitUlpin === u.unitUlpin
                              ? "bg-amber-400 text-earth-950 font-bold"
                              : "bg-black/40 text-gray-300 hover:text-white"
                          }`}
                        >
                          {u.unitName}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* 2D Base Foundation */}
              <div className="rounded-xl border border-dashed border-emerald-500/60 bg-emerald-950/40 p-2 text-center text-[10px] text-emerald-300 font-mono">
                ▼ 2D Surface Cadastral Parcel Footprint (Z: 0.0m) ▼
              </div>
            </div>
          </div>

          {/* Selected Unit Deep-Dive Card */}
          {selectedUnit && (
            <div className="flex flex-col justify-between rounded-3xl border border-earth-200 bg-earth-50/80 p-5 shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                      Selected 3D Strata Unit
                    </span>
                    <h4 className="text-base font-extrabold text-earth-950">
                      {selectedUnit.unitName}
                    </h4>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                    {selectedUnit.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 text-xs text-earth-800">
                  <div className="rounded-xl bg-white p-3 border border-earth-200">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-earth-500">3D Sub-ULPIN Identifier</p>
                    <p className="mt-0.5 font-mono text-sm font-black text-purple-950">
                      {selectedUnit.unitUlpin}
                    </p>
                    <p className="mt-1 text-[10px] text-earth-500">
                      Derived from Parent 2D Cadastre ULPIN: <span className="font-mono">{parcel?.ulpin || "04010100200814"}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white p-2.5 border border-earth-200">
                      <span className="text-[10px] font-bold text-earth-500">Carpet Area:</span>
                      <p className="font-bold text-earth-900">{selectedUnit.areaSqFt} Sq. Ft</p>
                    </div>

                    <div className="rounded-xl bg-white p-2.5 border border-earth-200">
                      <span className="text-[10px] font-bold text-earth-500">Permitted Use:</span>
                      <p className="font-bold text-earth-900">{selectedUnit.use}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-2.5 border border-earth-200">
                    <span className="text-[10px] font-bold text-earth-500">Registered Rights Holder:</span>
                    <p className="font-bold text-earth-900">{selectedUnit.owner}</p>
                    <p className="text-[10px] text-earth-500">Undivided Share of Land (UDS): Proportionate</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-purple-100/70 p-2.5 text-[11px] text-purple-900 border border-purple-200">
                <strong>DPI Interoperability:</strong> Unit {selectedUnit.unitUlpin} is individually searchable in the National Land Stack by Banks (for home loans) and Municipal Corporations (for unit-level property tax PID).
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-earth-900 px-6 py-2 text-xs font-bold text-white shadow hover:bg-earth-800"
          >
            Close 3D Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreeDCadastreModal;
