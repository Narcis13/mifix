import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import { HomePage } from "./pages/Home";
import { GestiuniPage } from "./pages/Gestiuni";
import { SurseFinantarePage } from "./pages/SurseFinantare";
import { LocuriPage } from "./pages/Locuri";
import { ConturiPage } from "./pages/Conturi";
import { ClasificariPage } from "./pages/Clasificari";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
