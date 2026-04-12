import { createBrowserRouter } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import LandingPage from "@/pages/LandingPage";
import TranscriptPage from "@/pages/TranscriptPage";
import BseMeetingPage from "@/pages/BseMeetingPage";
import NotFoundPage from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/transcript",
        element: <TranscriptPage />,
      },
      {
        path: "/bse-meeting",
        element: <BseMeetingPage />,
      },
      {
        path: "/bse-design",
        element: <BseMeetingPage slug="design" />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
