// This file would contain the API calls to your backend service

export const uploadFile = async (file) => {
    const formData = new FormData()
    formData.append("file", file)
  
    const response = await fetch("http://your-backend-api/upload", {
      method: "POST",
      body: formData,
    })
  
    if (!response.ok) {
      throw new Error("Upload failed")
    }
  
    return response.json()
  }
  
  export const getResults = async (id) => {
    const response = await fetch(`http://your-backend-api/results/${id}`)
  
    if (!response.ok) {
      throw new Error("Failed to fetch results")
    }
  
    return response.json()
  }
  
  export const classifyTicket = async (id, index, classification) => {
    const response = await fetch(`http://your-backend-api/classify/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ index, classification }),
    })
  
    if (!response.ok) {
      throw new Error("Failed to update classification")
    }
  
    return response.json()
  }
  
  export const downloadResults = async (id) => {
    const response = await fetch(`http://your-backend-api/download/${id}`)
  
    if (!response.ok) {
      throw new Error("Failed to download file")
    }
  
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = "classified_tickets.xlsx"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
  }
  