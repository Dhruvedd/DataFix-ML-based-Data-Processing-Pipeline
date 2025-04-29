import pandas as pd
import matplotlib.pyplot as plt

# Load the dataset
file_path = "D:\\Uni Resources\\Externship\\code\\data.csv"  # Replace with your actual file path
df = pd.read_csv(file_path)

# Data Cleaning: Replace NaN values in "Source" column with "Leadgen"
df["Source"].fillna("Leadgen", inplace=True)

# Convert 'Create date' to datetime format
df["Create date"] = pd.to_datetime(df["Create date"], errors="coerce")

# --- FILTER LEADGEN TICKETS ---
leadgen_df = df[df["Source"] == "Leadgen"]

# Find top 8 most common ticket names
top_8_tickets = leadgen_df["Ticket name"].value_counts().head(8)

# Function to truncate ticket names to the first 6 words
def truncate_ticket_name(name):
    if isinstance(name, str):  # Ensure it's a string
        return " ".join(name.split()[:6])  # Take first 6 words
    return name  # Return as-is if not a string

# Apply truncation function to top 8 tickets
top_8_tickets.index = top_8_tickets.index.map(truncate_ticket_name)

# Print top 8 ticket names
print("\nTop 8 Most Common Leadgen Ticket Names:")
print(top_8_tickets)

# --- VISUALIZATION 1: HORIZONTAL BAR GRAPH FOR TOP 8 TICKET NAMES ---
plt.figure(figsize=(12, 6))
top_8_tickets.sort_values().plot(kind="barh", color="purple")  # Sort for better visualization
plt.title("Top 8 Most Common Leadgen Ticket Names")
plt.xlabel("Count")
plt.ylabel("Ticket Name")
plt.xticks(rotation=0)  # Keep x-axis labels straight
plt.show()

# --- CREATE A NEW DATASET WITHOUT THE TOP 8 TICKET NAMES ---
filtered_leadgen_df = leadgen_df[~leadgen_df["Ticket name"].isin(top_8_tickets.index)]

# --- PRINT DATASET STATISTICS ---
print("\nDataset Statistics:")
print(f"Original Leadgen Dataset - Total Tickets: {len(leadgen_df)}, Unique Tickets: {leadgen_df['Ticket name'].nunique()}")
print(f"Filtered Leadgen Dataset (Excluding Top 8) - Total Tickets: {len(filtered_leadgen_df)}, Unique Tickets: {filtered_leadgen_df['Ticket name'].nunique()}")

# --- VISUALIZATION 2: PRIORITY DISTRIBUTION FOR ORIGINAL LEADGEN DATASET ---
priority_counts_original = leadgen_df["Priority"].fillna("No Priority").value_counts()

plt.figure(figsize=(10, 5))
priority_counts_original.plot(kind="bar", color=["blue", "green", "red", "orange", "gray"])
plt.title("Ticket Count by Priority (Original Leadgen Dataset)")
plt.xlabel("Priority Level")
plt.ylabel("Count")
plt.xticks(rotation=45)
plt.show()

# --- VISUALIZATION 3: PRIORITY DISTRIBUTION FOR FILTERED LEADGEN DATASET ---
priority_counts_filtered = filtered_leadgen_df["Priority"].fillna("No Priority").value_counts()

plt.figure(figsize=(10, 5))
priority_counts_filtered.plot(kind="bar", color=["blue", "green", "red", "orange", "gray"])
plt.title("Ticket Count by Priority (Excluding Top 8 Ticket Names)")
plt.xlabel("Priority Level")
plt.ylabel("Count")
plt.xticks(rotation=45)
plt.show()
