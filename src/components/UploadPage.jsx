"use client";

import { useState } from "react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadFile } from "../Services/api";
import "./UploadPage.css";
import * as XLSX from "xlsx";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [uncertainTickets, setUncertainTickets] = useState([]);
  const [currentUncertainIndex, setCurrentUncertainIndex] = useState(0);
  const [manualLabels, setManualLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  //for testing the human validation box
  const [isFinished, setIsFinished] = useState(false);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      // <-- ✅ Set immediate reference
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
      const csvBlob = new Blob([csv], { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", csvBlob, "data.csv");
      // uncomment the line below to use the actual API
      //const response = await uploadFile(formData);

       // Simulate a short wait time
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // 🔥 MOCKING FAKE BACKEND RESPONSE 🔥
        const response = {
          id: "mocked123",
          uncertainTickets: [
            { id: 1, text: "Customer requesting refund, could be spam." },
            { id: 2, text: "User asking for free coupons, might be spam." },
            { id: 3, text: "Issue with order delivery, seems valid." }
          ]
        };
      // 🔥 END OF MOCKING 🔥
      // 🚀 If there are uncertain tickets, show validation inside same page
      if (response.uncertainTickets && response.uncertainTickets.length > 0) {
        setUncertainTickets(response.uncertainTickets);
      } else {
        navigate(`/results/${response.id}`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLabel = (label) => {
    // actual code to handle manual labeling
    // const currentTicket = uncertainTickets[currentUncertainIndex];
    // setManualLabels([...manualLabels, { ...currentTicket, label }]);
    
    // if (currentUncertainIndex + 1 < uncertainTickets.length) {
    //   setCurrentUncertainIndex(currentUncertainIndex + 1);
    // } else {
    //   console.log("Finished manual labeling:", manualLabels);
    //   // 🚀 After all labeling done, navigate to results page
    //   navigate(`/results/final`);
    // }
    // for testing purposes
    const currentTicket = uncertainTickets[currentUncertainIndex];
      setManualLabels([...manualLabels, { ...currentTicket, label }]);
      
      if (currentUncertainIndex + 1 < uncertainTickets.length) {
        setCurrentUncertainIndex(currentUncertainIndex + 1);
      } else {
        console.log("Finished manual labeling:", manualLabels);
        setIsFinished(true); // 🛑 Instead of navigating immediately
      }
  };

  return (
    <>
      <div className="background-blob blob1"></div>
      <div className="background-blob blob2"></div>
      <div className="background-blob blob3"></div>
      <div className="background-blob blob4"></div>
      <div className="background-blob blob5"></div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      {/* Upload Form: visible only when not in human validation phase */}
      {uncertainTickets.length === 0 && !isFinished && (
        <div className="upload-container">
          <div
            className={`upload-box ${dragActive ? "drag-active" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const droppedFile = e.dataTransfer.files[0];
                setFile(droppedFile);

                if (fileInputRef.current) {
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(droppedFile);
                  fileInputRef.current.files = dataTransfer.files;
                }
              }
            }}
          >
            <h2 className="upload-title">Upload Excel File Here</h2>

            <form onSubmit={handleSubmit} className="upload-form">
              <input
                id="file-upload"
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                required
                className="upload-input"
                disabled={isLoading}
                ref={fileInputRef}
              />

              <div className="upload-plus">
                {file ? (
                  <div className="file-badge">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="file-icon"
                      style={{
                        width: "24px",
                        height: "24px",
                        marginRight: "8px",
                      }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                      />
                    </svg>

                    {file.name.length > 30
                      ? `${file.name.substring(0, 27)}...`
                      : file.name}
                  </div>
                ) : (
                  "+"
                )}
              </div>

              <div className="upload-buttons">
                <label htmlFor="file-upload" className="upload-button">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    className="upload-icon"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>

                  {file ? "Upload New File" : " Upload"}
                </label>

                {file && (
                  <button type="submit" className="upload-button">
                    Submit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Human Validation: takes over full screen, upload form hidden */}
      {uncertainTickets.length > 0 && !isFinished && (
        <div className="validation-container">
          <div className="validation-box">
            <h2>Human Validation</h2>
            <div className="ticket-box">
              <p>{uncertainTickets[currentUncertainIndex].text}</p>
            </div>
            <div className="button-group">
              <button
                onClick={() => handleManualLabel("spam")}
                className="spam-button"
              >
                Spam
              </button>
              <button
                onClick={() => handleManualLabel("valid")}
                className="valid-button"
              >
                Valid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finished: show final message in full screen */}
      {isFinished && (
        <div className="validation-container">
          <div className="validation-box">
            <h2> Labeled Dataset Is Ready!</h2>
            <button
              onClick={() => navigate(`/results/final`)}
              className="upload-button"
              style={{ marginTop: "20px" }}
            >
              View Final Results
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadPage;