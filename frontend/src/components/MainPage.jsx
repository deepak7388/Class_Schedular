import React, { useState } from "react";
import mammoth from "mammoth/mammoth.browser";
const MainPage = () => {
  const departments = [
    { name: "Computer Engineering", sections: ["CSA", "CSB", "CSC"] },
    { name: "Information Technology", sections: ["ITA", "ITB"] },
    { name: "Civil Engineering", sections: ["CEA", "CEB"] },
    { name: "Mechanical Engineering", sections: ["MEA", "MEB"] },
    { name: "Electrical Engineering", sections: ["EEA", "EEB"] },
    {
      name: "Electronics and Communication Engineering",
      sections: ["ECA", "ECB"],
    },
    { name: "Production Engineering", sections: ["PIA", "PIB"] },
  ];
  const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  const [items, setItems] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setSelectedSection(""); // Reset section when department changes
  };

  const [file, setFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        var options = {
          convertImage: mammoth.images.imgElement(function (image) {
            return image.read("base64").then(function (imageBuffer) {
              return {
                src: "data:" + image.contentType + ";base64," + imageBuffer,
              };
            });
          }),
        };

        const result = await mammoth.convertToHtml(
          { arrayBuffer: reader.result },
          options
        );

        const html = result.value;

        setHtmlContent(html);

        // Create a blob object from the HTML content
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        // Create a link element
        const link = document.createElement("a");
        link.href = url;
        link.download = "output.html";

        // Append the link to the body
        document.body.appendChild(link);

        // Click the link to prompt download
        link.click();

        // Remove the link from the body
        document.body.removeChild(link);

        console.log(html);

        sendToServer(html);
      } catch (error) {
        console.error("Conversion error:", error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const sendToServer = (data) => {
    fetch("http://localhost:8000/insertHtmlToDb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: data,
        year: selectedYear,
        semester: selectedSemester,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        window.location.href = "/table";
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <div className="main-page">
      <div className="selector">
        <label htmlFor="department">Choose Department:</label>
        <select
          id="department"
          value={selectedDepartment}
          onChange={handleDepartmentChange}
        >
          <option value="">Select Department</option>
          {departments.map((dept, index) => (
            <option key={index} value={dept.name}>
              {dept.name}
            </option>
          ))}
        </select>
        <label htmlFor="section">Choose Section:</label>
        <select
          id="section"
          value={selectedSection}
          onChange={(e) => {
            setSelectedSection(e.target.value);
            localStorage.setItem("section", JSON.stringify(e.target.value));
          }}
        >
          <option value="">Select Section</option>
          {selectedDepartment &&
            departments
              .find((dept) => dept.name === selectedDepartment)
              .sections.map((section, index) => (
                <option key={index} value={section}>
                  {section}
                </option>
              ))}
        </select>
        <label htmlFor="year">Choose Year:</label>
        <input
          type="text"
          id="year"
          placeholder="2024"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        />
        <label htmlFor="semester">Choose Semester:</label>
        <select
          id="semester"
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          <option value="">Select Semester</option>
          {semesters.map((semester, index) => (
            <option key={index} value={semester}>
              {semester}
            </option>
          ))}
        </select>
        <label htmlFor="file">Upload Word File:</label>
        <input
          type="file"
          id="file"
          accept=".docx"
          onChange={handleFileChange}
        />
        <button onClick={handleFileUpload}>Submit</button>
      </div>
    </div>
  );
};
export default MainPage;
