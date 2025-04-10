import pandas as pd
from sklearn.model_selection import train_test_split

import torch
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback,
    TrainerCallback
)
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import numpy as np

class TrainEvalMetricsCallback(TrainerCallback):
    """
    After each epoch (on_evaluate), this callback will:
      1) Evaluate on the training set USING trainer.predict (so no infinite loop).
      2) Print only accuracy, precision, and f1 for both train and eval sets.
    """

    def __init__(self, trainer):
        super().__init__()
        self.trainer = trainer

    def on_evaluate(self, args, state, control, metrics=None, **kwargs):
        # 'metrics' are the latest EVAL metrics from trainer.evaluate() on the test set
        if metrics is None:
            return

        # Filter only accuracy, precision, f1 from EVAL metrics
        eval_metrics_filtered = {
            "accuracy":  metrics.get("eval_accuracy", None),
            "precision": metrics.get("eval_precision", None),
            "f1":        metrics.get("eval_f1", None),
        }

        # Get TRAIN metrics by calling trainer.predict on the training dataset
        # This won't trigger on_evaluate again, so no infinite loop.
        train_preds = self.trainer.predict(self.trainer.train_dataset)
        train_metrics = train_preds.metrics

        train_metrics_filtered = {
            "accuracy":  train_metrics.get("test_accuracy", None) or train_metrics.get("eval_accuracy", None),
            "precision": train_metrics.get("test_precision", None) or train_metrics.get("eval_precision", None),
            "f1":        train_metrics.get("test_f1", None)       or train_metrics.get("eval_f1", None),
        }

        print(f"\nEpoch {int(state.epoch)}:")
        print("  TRAIN:", train_metrics_filtered)
        print("  EVAL: ", eval_metrics_filtered)

def main():
    """
    Fine-tune a BERT model on your labeled spam dataset,
    with Early Stopping and printing only train/eval accuracy, precision, f1.
    """

    # 1) LOAD LABELED DATASET
    df = pd.read_csv("labeled_data.csv")

    # 2) COMBINE TEXT COLUMNS & MAP LABEL
    df["text"] = (
        df["Ticket name"].fillna("") + " "
        + df["Ticket description"].fillna("") + " "
        + df["All associated contact emails"].fillna("")
    )
    df["label"] = df["Spam Label"].map({"Spam": 1, "Not Spam": 0})

    # 3) SPLIT TRAIN/TEST
    train_df, test_df = train_test_split(
        df,
        test_size=0.2,
        random_state=42,
        stratify=df["label"]
    )
    print(f"Training set size: {len(train_df)}")
    print(f"Test set size: {len(test_df)}")

    # 4) HUGGING FACE DATASETS
    train_dataset = Dataset.from_pandas(train_df)
    test_dataset  = Dataset.from_pandas(test_df)

    # 5) TOKENIZER
    tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

    def tokenize_function(examples):
        return tokenizer(
            examples["text"],
            truncation=True,
            padding="max_length",
            max_length=128
        )

    train_dataset = train_dataset.map(tokenize_function, batched=True)
    test_dataset  = test_dataset.map(tokenize_function, batched=True)

    # Remove columns we don’t need
    cols_to_remove = [
        "Ticket name", "Ticket description", "All associated contact emails",
        "Spam Label", "text", "__index_level_0__"
    ]
    for col in cols_to_remove:
        if col in train_dataset.column_names:
            train_dataset = train_dataset.remove_columns([col])
        if col in test_dataset.column_names:
            test_dataset  = test_dataset.remove_columns([col])

    train_dataset = train_dataset.with_format("torch")
    test_dataset  = test_dataset.with_format("torch")

    print("Sample training item:", train_dataset[0])

    # 6) LOAD MODEL
    model = AutoModelForSequenceClassification.from_pretrained(
        "bert-base-uncased",
        num_labels=2
    )

    # 7) METRICS
    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = np.argmax(logits, axis=-1)
        precision, recall, f1, _ = precision_recall_fscore_support(
            labels, preds, average="binary"
        )
        acc = accuracy_score(labels, preds)
        return {
            "eval_accuracy":  acc,
            "eval_precision": precision,
            "eval_recall":    recall, 
            "eval_f1":        f1
        }

    # 8) ARGS
    training_args = TrainingArguments(
        output_dir="bert_spam_filter",
        evaluation_strategy="epoch",
        save_strategy="epoch",
        num_train_epochs=8,
        learning_rate=2e-5,
        weight_decay=0.0,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        logging_steps=50,
        load_best_model_at_end=True,
        metric_for_best_model="eval_f1",
        greater_is_better=True
    )

    # 9) TRAINER
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)]
    )

    # 10) ADD CUSTOM CALLBACK (PASS TRAINER INSTANCE!)
    train_eval_callback = TrainEvalMetricsCallback(trainer)
    trainer.add_callback(train_eval_callback)

    # 11) TRAIN
    trainer.train()

    # 12) FINAL EVAL & SAVE
    final_metrics = trainer.evaluate()
    # Filter out only relevant keys
    final_metrics_filtered = {
        "accuracy":  final_metrics.get("eval_accuracy", None),
        "precision": final_metrics.get("eval_precision", None),
        "f1":        final_metrics.get("eval_f1", None),
    }
    print("\nFinal test metrics:", final_metrics_filtered)
    trainer.save_model("my_finetuned_bert_spam")
    print("Model saved to: my_finetuned_bert_spam")


if __name__ == "__main__":
    main()
