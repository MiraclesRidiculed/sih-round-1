import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";

const HomePage = lazy(() => import("./pages/HomePage"));
const ParcelDetailPage = lazy(() => import("./pages/ParcelDetailPage"));
const PublicVerifyPage = lazy(() => import("./pages/PublicVerifyPage"));
const QrScanPage = lazy(() => import("./pages/QrScanPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const App = () => (
  <Suspense fallback={<div className="rounded-[2rem] border border-white/60 bg-white/80 p-10 text-earth-800">Loading application...</div>}>
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/parcels/:parcelId" element={<ParcelDetailPage />} />
        <Route path="/verify/:parcelId" element={<PublicVerifyPage />} />
        <Route path="/scan" element={<QrScanPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </Suspense>
);

export default App;
