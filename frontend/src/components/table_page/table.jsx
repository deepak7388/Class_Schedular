import React, { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import "./TableData.css";

function TableData({ section }) {
  const [data, setData] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [reportLink, setReportLink] = useState("");
  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("section"));
    const yourVariableData = {
      section: items,
    };

    const queryParams = new URLSearchParams(yourVariableData).toString();

    fetch(`http://localhost:3000/tableData?${queryParams}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => setData(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);
  const handleReportGeneration = () => {
    if (!selectedSection) {
      alert("Please select a Section.");
      return;
    }

    const url = `http://localhost:3000/generateReport?section=${selectedSection}`;
    window.open(url, "_blank");
  };
  return (
    <div>
      <h2>Table Data</h2>
      <div>
        <label htmlFor="sectionSelect">Select Section:</label>
        <select
          id="sectionSelect"
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
        >
          <option value="">--Select Section--</option>
          <option value="CSA">CS-A</option>
          <option value="CSB">CS-B</option>
          <option value="CSC">CS-C</option>
          <option value="ITA">IT-A</option>
          <option value="ITB">IT-B</option>
          <option value="CEA">CE-A</option>
          <option value="CEB">CE-B</option>
          <option value="MEA">ME-A</option>
          <option value="MEB">ME-B</option>
          <option value="EEA">EE-A</option>
          <option value="EEB">EE-B</option>
          <option value="ECEA">ECE-A</option>
          <option value="ECEB">ECE-B</option>
        </select>
        <button onClick={handleReportGeneration}>Generate Report</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Year</th>
            <th>Class</th>
            <th>Day</th>
            <th>Section</th>
            <th>Semester</th>
            <th>Lecture Type</th>
            <th>Subject Code</th>
            <th>Subject Name</th>
            <th>Teacher</th>
            <th>Room</th>
            <th>Duration</th>
            <th>Building_name</th>
            <th>Room_number</th>
            <th>Floor</th>
            <th>Period_no</th>
            <th>Problematic</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td>{row.year}</td>
              <td>{row.class}</td>
              <td>{row.day}</td>
              <td>{row.section}</td>
              <td>{row.semester}</td>
              <td>{row.lecture_type}</td>
              <td>{row.sub_code}</td>
              <td>{row.sub_name}</td>
              <td>{row.teacher}</td>
              <td>{row.room}</td>
              <td>{row.duration}</td>
              <td>{row.building_name}</td>
              <td>{row.room_number}</td>
              <td>{row.floor}</td>
              <td>{row.period_no}</td>
              <td>{row.problematic}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableData;
