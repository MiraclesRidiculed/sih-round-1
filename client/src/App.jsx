import { Suspense, lazy } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import { useAuth } from "./context/AuthContext";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ParcelDetailPage = lazy(() => import("./pages/ParcelDetailPage"));
const PublicVerifyPage = lazy(() => import("./pages/PublicVerifyPage"));
const QrScanPage = lazy(() => import("./pages/QrScanPage"));
const StandardTechnicalDocPage = lazy(() => import("./pages/StandardTechnicalDocPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const OperationsPage = lazy(() => import("./pages/OperationsPage"));
const NationalRegistryPage = lazy(() => import("./pages/NationalRegistryPage"));
const FieldSurveyPage = lazy(() => import("./pages/FieldSurveyPage"));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, sessionLoading } = useAuth();
  const location = useLocation();

  if (sessionLoading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">Checking your session...</div>;
  }

  return isAuthenticated
    ? children
    : <Navigate to="/login" replace state={{ from: location }} />;
};

const DepartmentRoute = ({ children }) => {
  const { activeRole } = useAuth();
  return activeRole === "citizen" ? <Navigate to="/" replace /> : children;
};

const AuthorizationNotice = () => {
  const { accessDenied, clearAccessDenied } = useAuth();

  if (!accessDenied) return null;

  return (
    <div role="alert" className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={18} />
        <div>
          <p className="font-bold">Access denied</p>
          <p className="mt-0.5">{accessDenied.message}</p>
        </div>
      </div>
      <button type="button" onClick={clearAccessDenied} className="rounded p-1 text-amber-800 hover:bg-amber-100" aria-label="Dismiss access denied message">
        <X size={16} />
      </button>
    </div>
  );
};

const App = () => (
  <Suspense fallback={<div className="rounded-[2rem] border border-white/60 bg-white/80 p-10 text-earth-800">Loading application...</div>}>
    <Routes>
      <Route element={<><AuthorizationNotice /><AppLayout /></>}>
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/parcels/:parcelId" element={<ProtectedRoute><ParcelDetailPage /></ProtectedRoute>} />
        <Route path="/verify/:parcelId" element={<PublicVerifyPage />} />
        <Route path="/scan" element={<QrScanPage />} />
        <Route path="/std" element={<ProtectedRoute><DepartmentRoute><StandardTechnicalDocPage /></DepartmentRoute></ProtectedRoute>} />
        <Route path="/operations" element={<ProtectedRoute><DepartmentRoute><OperationsPage /></DepartmentRoute></ProtectedRoute>} />
        <Route path="/registry" element={<ProtectedRoute><DepartmentRoute><NationalRegistryPage /></DepartmentRoute></ProtectedRoute>} />
        <Route path="/field-survey" element={<ProtectedRoute><DepartmentRoute><FieldSurveyPage /></DepartmentRoute></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </Suspense>
);

export default App;
