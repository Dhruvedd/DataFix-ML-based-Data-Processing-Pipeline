from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd, io, uuid, torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# — load model + tokenizer —
MODEL_PATH = "Training/my_finetuned_bert_spam"
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model     = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

# in‐memory store per upload
STORE: Dict[str, Dict[str,Any]] = {}

class LabelInput(BaseModel):
    job_id: str
    record_id: int
    label: str  # "Spam" or "Not Spam"

def predict_probs(texts: List[str]) -> List[float]:
    enc = tokenizer(texts, padding=True, truncation=True, max_length=128, return_tensors="pt")
    with torch.no_grad():
        logits = model(**enc).logits
    return torch.softmax(logits, dim=-1)[:,1].tolist()

@app.post("/predict")
async def predict(file: UploadFile = File(...), threshold: float = 0.8): #Threshold can be changed here
    # 1) Read file
    data = await file.read()
    if file.filename.lower().endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(data))
    else:
        df = pd.read_csv(io.BytesIO(data))

    # 2) Build text, predict
    df["text"]       = df["Ticket name"].fillna("") + " " + df["Ticket description"].fillna("") + " " + df["All associated contact emails"].fillna("")
    df["spam_prob"]  = predict_probs(df["text"].tolist())
    df["pred_label"] = ["Spam" if p>0.5 else "Not Spam" for p in df["spam_prob"]]

    # 3) Identify uncertain
    low, high = 1-threshold, threshold
    uncertain_mask = (df.spam_prob > low) & (df.spam_prob < high)
    uncertain_df   = df[uncertain_mask]

    # 4) Prepare payloads
    uncertain_tickets = [
        {"id": int(r["Record ID"]), "text": r["Ticket description"]}
        for _, r in uncertain_df.iterrows()
    ]
    full_records = df.to_dict(orient="records")

    # 5) Store
    job_id = str(uuid.uuid4())
    STORE[job_id] = {
        "full": full_records,
        "manual": {},          # record_id → label
    }

    return {"id": job_id, "uncertainTickets": uncertain_tickets}

@app.post("/label")
async def label(hit: LabelInput):
    job = STORE.get(hit.job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    # record manual override
    job["manual"][str(hit.record_id)] = hit.label
    return {"status": "ok"}

@app.get("/download/{job_id}")
def download(job_id: str):
    job = STORE.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    # Rebuild the DataFrame from the original full records
    df = pd.DataFrame(job["full"])
    manual = job["manual"]

    # 1) Apply any human overrides directly to the 'pred_label' column
    df["pred_label"] = (
        df["Record ID"].astype(str)
          .map(manual)                 # map returns NaN for untouched
          .fillna(df["pred_label"])    # fallback to the model’s guess
    )

    # 2) Drop helper columns (including any leftover final_label if present)
    for col in ["text", "spam_prob", "final_label"]:
        if col in df.columns:
            df = df.drop(columns=[col])

    # 3) Stream back a CSV without the extra column
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=labeled_{job_id}.csv"}
    )
