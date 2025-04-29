"use client";

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadFile, labelTicket, downloadUrl } from "../Services/api";
import "./UploadPage.css";
import * as XLSX from "xlsx";

export default function UploadPage() {
  const [file, setFile]                         = useState(null);
  const [jobId, setJobId]                       = useState(null);
  const [uncertainTickets, setUncertainTickets] = useState([]);
  const [currentUncertainIndex, setCurrentUncertainIndex] = useState(0);
  const [manualLabels, setManualLabels]         = useState([]);
  const [isLoading, setIsLoading]               = useState(false);
  const [dragActive, setDragActive]             = useState(false);
  const [isFinished, setIsFinished]             = useState(false);
  const fileInputRef = useRef(null);
  const navigate     = useNavigate();

  const handleFileChange = e => {
    if (e.target.files?.length) {
      const f = e.target.files[0];
      setFile(f);
      // keep input ref in sync for drag/drop
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(f);
        fileInputRef.current.files = dt.files;
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) return;
    setIsLoading(true);

    try {
      // 1) parse XLSX → CSV blob
      const buffer = await file.arrayBuffer();
      const wb     = XLSX.read(buffer, { type: "array" });
      const csv    = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
      const blob   = new Blob([csv], { type: "text/csv" });
      const form   = new FormData();
      form.append("file", blob, "data.csv");

      // 2) call /predict
      const { id, uncertainTickets: u } = await uploadFile(form);
      setJobId(id);

      // 3) branch based on uncertain count
      if (u && u.length) {
        setUncertainTickets(u);
      } else {
        // no uncertain → download directly
        window.location.href = downloadUrl(id);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLabel = async label => {
    const current = uncertainTickets[currentUncertainIndex];
    // 1) send to /label
    await labelTicket(jobId, current.id, label);

    // 2) record locally (optional)
    setManualLabels([...manualLabels, { ...current, label }]);

    // 3) advance or finish
    if (currentUncertainIndex + 1 < uncertainTickets.length) {
      setCurrentUncertainIndex(i => i + 1);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <>
      {/* background blobs */}
      <div className="background-blob blob1" />
      <div className="background-blob blob2" />
      <div className="background-blob blob3" />
      <div className="background-blob blob4" />
      <div className="background-blob blob5" />

      {/* loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* — Upload Form — */}
      {!jobId && !isFinished && (
        <div className="upload-container">
          <div
            className={`upload-box ${dragActive ? "drag-active" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
            onDrop={e => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.length) {
                const f = e.dataTransfer.files[0];
                setFile(f);
                if (fileInputRef.current) {
                  const dt = new DataTransfer();
                  dt.items.add(f);
                  fileInputRef.current.files = dt.files;
                }
              }
            }}
          >
            <h2 className="upload-title">Upload Excel File Here</h2>
            <form onSubmit={handleSubmit} className="upload-form">
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                disabled={isLoading}
                required
                className="upload-input"
              />
              <div className="upload-plus">
                {file ? (
                  <div className="file-badge">{file.name}</div>
                ) : (
                  "+"
                )}
              </div>
              <div className="upload-buttons">
                <label htmlFor="file-upload" className="upload-button">
                  {file ? "Change File" : "Choose File"}
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

      {/* — Human Validation — */}
      {jobId && !isFinished && (
        <div className="validation-container">
          <div className="validation-box">
            <h2>Human Validation</h2>
            <div className="ticket-box">
              <p>{uncertainTickets[currentUncertainIndex].text}</p>
            </div>
            <div className="button-group">
              <button
                onClick={() => handleManualLabel("Spam")}
                className="spam-button"
              >
                Spam
              </button>
              <button
                onClick={() => handleManualLabel("Not Spam")}
                className="valid-button"
              >
                Valid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* — Finished — */}
      {isFinished && (
        <div className="validation-container">
          <div className="validation-box">
            <h2>Labeled Dataset Is Ready!</h2>
            <button
              onClick={() => window.location.href = downloadUrl(jobId)}
              className="upload-button"
            >
              View Final Results
            </button>
          </div>
        </div>
      )}
    </>
  );
}
