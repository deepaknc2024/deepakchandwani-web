import { createBrowserRouter } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import LandingPage from "@/pages/LandingPage";
import TranscriptPage from "@/pages/TranscriptPage";
import BseMeetingPage from "@/pages/BseMeetingPage";
import NotFoundPage from "@/pages/NotFoundPage";
import LoginPage from "@/pages/LoginPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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
            <BseMeetingPage slug="bse-design" />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
