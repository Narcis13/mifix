import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./components/auth/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LoginPage } from "./pages/Login";
import { HomePage } from "./pages/Home";
import { GestiuniPage } from "./pages/Gestiuni";
import { SurseFinantarePage } from "./pages/SurseFinantare";
import { LocuriPage } from "./pages/Locuri";
import { ConturiPage } from "./pages/Conturi";
import { ClasificariPage } from "./pages/Clasificari";
import { MijloaceFixePage } from "./pages/MijloaceFixe";
import { MijlocFixEdit } from "./pages/MijlocFixEdit";
import { MijlocFixDetail } from "./pages/MijlocFixDetail";
import Amortizare from "./pages/Amortizare";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "gestiuni",
        element: <GestiuniPage />,
      },
      {
        path: "surse-finantare",
        element: <SurseFinantarePage />,
      },
      {
        path: "locuri",
        element: <LocuriPage />,
      },
      {
        path: "conturi",
        element: <ConturiPage />,
      },
      {
        path: "clasificari",
        element: <ClasificariPage />,
      },
      {
        path: "amortizare",
        element: <Amortizare />,
      },
      {
        path: "mijloace-fixe",
        children: [
          {
            index: true,
            element: <MijloaceFixePage />,
          },
          {
            path: "nou",
            element: <MijlocFixEdit />,
          },
          {
            path: ":id",
            element: <MijlocFixDetail />,
          },
          {
            path: ":id/edit",
            element: <MijlocFixEdit />,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
