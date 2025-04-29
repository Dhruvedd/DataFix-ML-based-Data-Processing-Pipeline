const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function uploadFile(formData) {
  const res = await fetch(`${BASE}/predict`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { id, uncertainTickets }
}

export async function labelTicket(jobId, recordId, label) {
  const res = await fetch(`${BASE}/label`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, record_id: recordId, label })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function downloadUrl(jobId) {
  return `${BASE}/download/${jobId}`;
}
