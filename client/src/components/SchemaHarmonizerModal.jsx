import { useState } from "react";
import { ArrowRight, Code, Database, FileCode, Layers, ShieldCheck, X } from "lucide-react";

const stateFieldMappings = {
  karnataka: {
    stateName: "Karnataka",
    system: "Bhoomi (Revenue) & Kaveri 2.0 (Deeds)",
    rorTerm: "RTC / Pahani (Record of Rights, Tenancy & Crops)",
    areaUnit: "Acres & Guntas",
    mappings: [
      { localField: "Hobli / Hobli Code", canonical: "subDistrictDivision", ogc: "AdministrativeUnit.level4", type: "String" },
      { localField: "Survey No. & Hissa", canonical: "cadastralParcelIdentifier", ogc: "CadastralParcel.nationalId", type: "String" },
      { localField: "Khata Extract No.", canonical: "revenueAccountHolderId", ogc: "LandInfra.Party.identifier", type: "String" },
      { localField: "Column 9/10 (Kabzedar)", canonical: "primaryRightsHolder", ogc: "RRR.RightHolder.name", type: "Person" },
      { localField: "Column 11 (Other Rights)", canonical: "liabilitiesAndEncumbrances", ogc: "RRR.MortgageCharge", type: "LienMatrix" },
      { localField: "Form 11E Sketch", canonical: "subdivisionBoundarySketch", ogc: "SurveyElement.Observation", type: "Geometry" }
    ]
  },
  tamilnadu: {
    stateName: "Tamil Nadu",
    system: "Tamil Nilam (Land Admin) & TNREGINET 2.0 (SRO)",
    rorTerm: "Patta / Chitta (Extract of Land Record)",
    areaUnit: "Grounds & Cents",
    mappings: [
      { localField: "Vattam / Firka", canonical: "subDistrictDivision", ogc: "AdministrativeUnit.level4", type: "String" },
      { localField: "Paimash / Survey No.", canonical: "cadastralParcelIdentifier", ogc: "CadastralParcel.nationalId", type: "String" },
      { localField: "Patta Enn (பreach எண்)", canonical: "revenueAccountHolderId", ogc: "LandInfra.Party.identifier", type: "String" },
      { localField: "Pattadharar Name", canonical: "primaryRightsHolder", ogc: "RRR.RightHolder.name", type: "Person" },
      { localField: "Villangam (வில்லங்கம்)", canonical: "liabilitiesAndEncumbrances", ogc: "RRR.MortgageCharge", type: "LienMatrix" },
      { localField: "FMB Sketch (புலப்படம்)", canonical: "subdivisionBoundarySketch", ogc: "SurveyElement.Observation", type: "Geometry" }
    ]
  },
  chandigarh: {
    stateName: "Chandigarh (UT)",
    system: "Chandigarh Estate Office & e-Registrar",
    rorTerm: "Urban Property Register (UPR) / Jamabandi",
    areaUnit: "Square Yards / Marla",
    mappings: [
      { localField: "Sector & Block Code", canonical: "subDistrictDivision", ogc: "AdministrativeUnit.level4", type: "String" },
      { localField: "Plot / SCO Plot No.", canonical: "cadastralParcelIdentifier", ogc: "CadastralParcel.nationalId", type: "String" },
      { localField: "Estate Register File No.", canonical: "revenueAccountHolderId", ogc: "LandInfra.Party.identifier", type: "String" },
      { localField: "Allottee / Transferee", canonical: "primaryRightsHolder", ogc: "RRR.RightHolder.name", type: "Person" },
      { localField: "Heritage Visual Charter", canonical: "planningRestrictions", ogc: "Zoning.RestrictionClause", type: "HeritageNOC" },
      { localField: "Digital Building Footprint", canonical: "subdivisionBoundarySketch", ogc: "SurveyElement.Observation", type: "Geometry" }
    ]
  }
};

const canonicalJsonLdSample = {
  "@context": [
    "https://www.w3.org/ns/json-ld",
    "https://schemas.landstack.gov.in/v1/landinfra.jsonld"
  ],
  "@type": "CadastralParcel",
  "nationalUlpin": "33030400100482",
  "crs": "http://www.opengis.net/def/crs/EPSG/0/4326",
  "administrativeHierarchy": {
    "stateCode": "TN",
    "district": "Kanchipuram",
    "taluk": "Sriperumbudur",
    "village": "Mambakkam"
  },
  "rightsRestrictionsLiabilities": {
    "tenureType": "Freehold",
    "registeredDeedRef": "DOC-2024-SPB-3109",
    "encumbrances": [
      {
        "type": "EquitableMortgage",
        "chargeHolder": "Indian Overseas Bank",
        "amountINR": 15000000,
        "status": "Active"
      }
    ]
  },
  "spatialLayers": {
    "layer1Cadastre": { "geometryType": "Polygon", "vertexCount": 4 },
    "layer2Zoning": { "zoneCategory": "LightIndustrial", "farPermissible": 2.5 },
    "layer3Utilities": { "waterMainProximityMeters": 4.2, "power11kVGrid": true }
  }
};

const SchemaHarmonizerModal = ({ onClose }) => {
  const [selectedState, setSelectedState] = useState("tamilnadu");
  const [showJsonLd, setShowJsonLd] = useState(false);

  const activeMapping = stateFieldMappings[selectedState];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2.5rem] border border-white/60 bg-white p-6 shadow-2xl md:p-8">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 shadow-sm">
              <Database size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                  Federated DPI Gateway
                </span>
                <span className="text-xs text-earth-500">OGC LandInfra / JSON-LD National Canonical Schema</span>
              </div>
              <h3 className="text-lg font-black text-earth-950 sm:text-xl">
                Multi-State Data Harmonization Engine
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

        {/* Federal Architecture Banner */}
        <div className="rounded-2xl border border-earth-200 bg-earth-50/80 p-4 text-xs">
          <p className="font-bold text-earth-900 uppercase tracking-wider">
            🏛️ Constitutional Federalism (Seventh Schedule, List II, Entry 18):
          </p>
          <p className="mt-1 text-earth-700 leading-relaxed">
            State revenue records remain the statutory source of truth. The National Land Stack DPI acts as a federated interoperability layer by automatically translating regional database fields into a canonical OGC/JSON-LD data model.
          </p>
        </div>

        {/* State Selection Tabs & View Toggle */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 rounded-2xl bg-earth-100/70 p-1 text-xs">
            {Object.keys(stateFieldMappings).map((stKey) => (
              <button
                key={stKey}
                type="button"
                onClick={() => setSelectedState(stKey)}
                className={`rounded-xl px-3.5 py-1.5 font-bold transition ${
                  selectedState === stKey ? "bg-earth-900 text-white shadow-xs" : "text-earth-700 hover:bg-earth-200"
                }`}
              >
                {stateFieldMappings[stKey].stateName}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowJsonLd(!showJsonLd)}
            className="inline-flex items-center gap-1.5 rounded-full border border-earth-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-earth-800 shadow-xs hover:bg-earth-50"
          >
            <Code size={14} />
            {showJsonLd ? "Show Visual Mapping" : "Show Canonical JSON-LD"}
          </button>
        </div>

        {showJsonLd ? (
          /* JSON-LD Raw View */
          <div className="mt-4 rounded-3xl bg-gray-950 p-5 font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner">
            <div className="mb-2 text-gray-500 font-sans text-[11px] border-b border-gray-800 pb-1">
              National Land Stack OGC LandInfra Linked Data Spec (JSON-LD)
            </div>
            <pre className="leading-relaxed">{JSON.stringify(canonicalJsonLdSample, null, 2)}</pre>
          </div>
        ) : (
          /* Visual Field Mapping Table */
          <div className="mt-4 overflow-hidden rounded-3xl border border-earth-200 bg-white shadow-sm">
            <div className="bg-earth-100/60 px-5 py-3 text-xs border-b">
              <span className="font-bold text-earth-900">Source State System:</span> {activeMapping.system} •{" "}
              <span className="font-bold text-earth-900">RoR Term:</span> {activeMapping.rorTerm} •{" "}
              <span className="font-bold text-earth-900">Native Unit:</span> {activeMapping.areaUnit}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-earth-50/70 text-[11px] font-bold uppercase tracking-wider text-earth-600">
                    <th className="p-3.5">Regional Field (State Database)</th>
                    <th className="p-3.5 text-center">Transform</th>
                    <th className="p-3.5">National Canonical Attribute</th>
                    <th className="p-3.5">OGC LandInfra Primitive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-earth-100 text-earth-800 font-medium">
                  {activeMapping.mappings.map((m, idx) => (
                    <tr key={idx} className="hover:bg-earth-50/50 transition">
                      <td className="p-3.5 font-bold text-blue-900 font-mono text-[11px]">{m.localField}</td>
                      <td className="p-3.5 text-center text-earth-400">
                        <ArrowRight size={14} className="mx-auto" />
                      </td>
                      <td className="p-3.5 font-bold text-earth-950 font-mono text-[11px]">{m.canonical}</td>
                      <td className="p-3.5 text-emerald-800 font-mono text-[10px]">
                        <span className="rounded bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                          {m.ogc}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center border-t pt-4 text-xs text-earth-600">
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
            <ShieldCheck size={15} />
            <span>Compliant with DoLR DILRMP 3.0 Interoperability Guidelines</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-earth-900 px-5 py-2 text-xs font-bold text-white shadow hover:bg-earth-800"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchemaHarmonizerModal;
