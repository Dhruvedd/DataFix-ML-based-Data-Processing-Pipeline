from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io, uuid
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from typing import List, Dict, Any

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # 🔒 lock this down in prod!
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1) Load your fine-tuned BERT model & tokenizer once
MODEL_PATH = "Training/my_finetuned_bert_spam"  # adjust path
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model     = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

# 2) In‐memory store of results by job_id
STORE: Dict[str, Dict[str, Any]] = {}

def predict_probs(texts: List[str]) -> List[float]:
    """Return P(spam) for each text."""
    enc = tokenizer(texts, padding=True, truncation=True, max_length=128, return_tensors="pt")
    with torch.no_grad():
        logits = model(**enc).logits
        probs  = torch.softmax(logits, dim=-1)[:,1]
    return probs.tolist()

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    threshold: float = 0.8
) -> Dict[str, str]:
    """
    1) Accept CSV or XLSX
    2) Run model → spam_prob, pred_label
    3) Split into confident vs uncertain  
    4) Store under a uuid and return {"id": "..."}
    """
    data = await file.read()
    if file.filename.lower().endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(data))
    else:
        df = pd.read_csv(io.BytesIO(data))

    # recreate your `text` column
    df["text"] = (
        df["Ticket name"].fillna("") + " " +
        df["Ticket description"].fillna("") + " " +
        df["All associated contact emails"].fillna("")
    )

    probs = predict_probs(df["text"].tolist())
    df["spam_prob"]  = probs
    df["pred_label"] = ["Spam" if p > 0.5 else "Not Spam" for p in probs]

    high, low = threshold, 1 - threshold
    confident = df[(df.spam_prob >= high) | (df.spam_prob <= low)]
    uncertain  = df[(df.spam_prob > low)  & (df.spam_prob < high)]

    def to_records(sub: pd.DataFrame):
        return sub[[
            "Record ID",
            "Ticket name",
            "Ticket description",
            "spam_prob",
            "pred_label"
        ]].to_dict(orient="records")

    job_id = str(uuid.uuid4())
    STORE[job_id] = {
        "confident": to_records(confident),
        "uncertain":  to_records(uncertain)
    }
    return {"id": job_id}

@app.get("/results/{job_id}")
def results(job_id: str):
    """Retrieve the stored prediction sets by ID."""
    if job_id not in STORE:
        raise HTTPException(status_code=404, detail="Job not found")
    return STORE[job_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
