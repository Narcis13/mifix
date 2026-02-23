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
import { ProvenientaPage } from "./pages/Provenienta";
import { TipuriStocPage } from "./pages/TipuriStoc";
import { UnitatiMasuraPage } from "./pages/UnitatiMasura";
import { MijloaceFixePage } from "./pages/MijloaceFixe";
import { MijlocFixEdit } from "./pages/MijlocFixEdit";
import { MijlocFixDetail } from "./pages/MijlocFixDetail";
import Amortizare from "./pages/Amortizare";
import {
  RapoartePage,
  FisaMijlocFixPage,
  BalantaVerificarePage,
  BalantaAnaliticaPage,
  JurnalActePage,
  SituatieAmortizarePage,
  CentralizatorActePage,
  ListaInventarierePage,
  RaportActPage,
  SituatieObiectePage,
  DurataDepasitaPage,
  ListaInventariereGoalaPage,
  LocuriObiectePage,
  CorespMaterialContPage,
  ListaMaterialePage,
} from "./pages/Rapoarte";
import { OperatiuniMasaPage } from "./pages/OperatiuniMasa";
import { VerificarePage } from "./pages/Verificare";
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
        path: "provenienta",
        element: <ProvenientaPage />,
      },
      {
        path: "tipuri-stoc",
        element: <TipuriStocPage />,
      },
      {
        path: "unitati-masura",
        element: <UnitatiMasuraPage />,
      },
      {
        path: "amortizare",
        element: <Amortizare />,
      },
      {
        path: "rapoarte",
        children: [
          { index: true, element: <RapoartePage /> },
          { path: "fisa", element: <FisaMijlocFixPage /> },
          { path: "balanta", element: <BalantaVerificarePage /> },
          { path: "jurnal", element: <JurnalActePage /> },
          { path: "amortizare", element: <SituatieAmortizarePage /> },
          { path: "balanta-analitica", element: <BalantaAnaliticaPage /> },
          { path: "centralizator", element: <CentralizatorActePage /> },
          { path: "lista-inventariere", element: <ListaInventarierePage /> },
          { path: "act", element: <RaportActPage /> },
          { path: "situatie-obiecte", element: <SituatieObiectePage /> },
          { path: "durata-depasita", element: <DurataDepasitaPage /> },
          { path: "lista-inventariere-goala", element: <ListaInventariereGoalaPage /> },
          { path: "locuri-obiecte", element: <LocuriObiectePage /> },
          { path: "corespondenta-material-cont", element: <CorespMaterialContPage /> },
          { path: "lista-materiale", element: <ListaMaterialePage /> },
        ],
      },
      {
        path: "operatiuni-masa",
        element: <OperatiuniMasaPage />,
      },
      {
        path: "verificare",
        element: <VerificarePage />,
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
