// App.js
import React from "react";
import Header from "./components/Header";
import { Routes, Route } from "react-router-dom";
import Footer from "./components/Footer";
import MainPage from "./components/MainPage";
import "./App.css";
import TableData from "./components/table_page/table";

const App = () => {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <div className="app">
              <Header />
              <MainPage />
              <Footer />
            </div>
          }
        />
        <Route path="/table" element={<TableData />} />
      </Routes>
    </>
  );
};
export default App;
