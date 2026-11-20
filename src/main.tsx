import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Locator from "@/pages/Locator";
import Dashboard from "@/pages/Dashboard";
import Results from "@/pages/Results";
import Pro from "@/pages/Pro";
import Reto from "@/pages/Reto";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={150}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="locator" element={<Locator />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="results" element={<Results />} />
            <Route path="pro" element={<Pro />} />
            <Route path="reto" element={<Reto />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </React.StrictMode>,
);
