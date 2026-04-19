import { createBrowserRouter } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import LandingPage from "@/pages/LandingPage";
import TranscriptPage from "@/pages/TranscriptPage";
import BseMeetingPage from "@/pages/BseMeetingPage";
import AdminPage from "@/pages/AdminPage";
import MeetingNotesListPage from "@/pages/MeetingNotesListPage";
import MeetingNotesNewPage from "@/pages/MeetingNotesNewPage";
import MeetingNotesDetailPage from "@/pages/MeetingNotesDetailPage";
import NotFoundPage from "@/pages/NotFoundPage";
import LoginPage from "@/pages/LoginPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Compliance pages
import ComplianceLayout from "@/pages/compliance/ComplianceLayout";
import ComplianceIndex from "@/pages/compliance/ComplianceIndex";
import DpdpActPage from "@/pages/compliance/DpdpActPage";
import VaptPage from "@/pages/compliance/VaptPage";
import CertInPage from "@/pages/compliance/CertInPage";
import ItActPage from "@/pages/compliance/ItActPage";
import DigitalRecordsPage from "@/pages/compliance/DigitalRecordsPage";
import SafeHostingPage from "@/pages/compliance/SafeHostingPage";
import StandardsPage from "@/pages/compliance/StandardsPage";
import FirmsPage from "@/pages/compliance/FirmsPage";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/transcript",
        element: (
          <ProtectedRoute>
            <TranscriptPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/bse-meeting",
        element: (
          <ProtectedRoute>
            <BseMeetingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/bse-design",
        element: (
          <ProtectedRoute>
            <BseMeetingPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin",
        element: (
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/meeting-notes",
        element: (
          <ProtectedRoute>
            <MeetingNotesListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/meeting-notes/new",
        element: (
          <ProtectedRoute>
            <MeetingNotesNewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/meeting-notes/:id",
        element: (
          <ProtectedRoute>
            <MeetingNotesDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/compliance",
        element: (
          <ProtectedRoute>
            <ComplianceLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ComplianceIndex /> },
          { path: "dpdp-act", element: <DpdpActPage /> },
          { path: "vapt", element: <VaptPage /> },
          { path: "cert-in", element: <CertInPage /> },
          { path: "it-act", element: <ItActPage /> },
          { path: "digital-records", element: <DigitalRecordsPage /> },
          { path: "safe-hosting", element: <SafeHostingPage /> },
          { path: "standards", element: <StandardsPage /> },
          { path: "firms", element: <FirmsPage /> },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
