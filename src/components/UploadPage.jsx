"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadFile } from "../Services/api";
import "./UploadPage.css";
import * as XLSX from "xlsx";

const UploadPage = () => {
  return (
    <div className="upload-container">
      <div className="upload-box">
        <div className="upload-icon">
          {/* Simple document icon using HTML/CSS instead of an icon library */}
          <div className="document-icon">
            <div className="document-icon-corner"></div>
          </div>
        </div>
        <h1 className="upload-title">CSR Ticket Spam Classifier</h1>
        <p className="upload-description">
          Upload your XLSX file containing CSR tickets to classify them as spam or not spam.
        </p>
        <UploadForm />
      </div>
    </div>
  );
};

// Inline component for the form
const UploadForm = () => {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      // Read the file as an ArrayBuffer
      const data = await file.arrayBuffer();
      // Use SheetJS to parse the XLSX file
      const workbook = XLSX.read(data, { type: "array" });
      // Get the first sheet name
      const firstSheetName = workbook.SheetNames[0];
      // Convert the first sheet to CSV
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
      // Create a CSV Blob
      const csvBlob = new Blob([csv], { type: "text/csv" });
      // Create FormData and append the CSV file with a filename
      const formData = new FormData();
      formData.append("file", csvBlob, "data.csv");

      // Pass the formData to your uploadFile function
      const response = await uploadFile(formData);
      navigate(`/results/${response.id}`);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <div className="form-group">
        <label htmlFor="file-upload" className="upload-label">
          Upload XLSX File
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          required
          className="upload-input"
        />
      </div>
      <button type="submit" disabled={!file} className="upload-button">
        Upload and Process
      </button>
    </form>
  );
};

export default UploadPage;