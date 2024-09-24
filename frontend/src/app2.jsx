import React, { useState } from "react";
import mammoth from "mammoth/mammoth.browser";

function App() {
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

        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "output.html";

        // Append the link to the body
        document.body.appendChild(link);
        link.click();

        // Remove the link from the body
        document.body.removeChild(link);
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
      body: JSON.stringify({ html: data }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  return (
    <div>
      <h1>Document to HTML Converter</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Convert to HTML</button>
      {htmlContent && (
        <div>
          <h2>Converted HTML:</h2>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      )}
    </div>
  );
}
export default App;
