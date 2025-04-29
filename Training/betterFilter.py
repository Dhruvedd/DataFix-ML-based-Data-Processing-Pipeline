import pandas as pd

# --- Spam filtering lists ---
spam_keywords = [
    "win", "winner", "prize", "cash",
    "offer",  "discount", "cheap", "lowest price", "buy now", "order now",
    "promotion", "promo", "bonus", "money back",
    "guarantee", "risk‑free", "lottery", 
    "free gift", "claim now", 
    "cash prize", "win cash", "invitation", 
    "limited offer", "no cost", "this isn’t spam", 
    "Daisy",
    "Daisy Disposal"
]


spam_domains = [
    "noreply", "no-reply", "mailer-daemon", "postmaster",
    "promo", "marketing", "offers", "newsletter", "bulkemail",
    "advertising", "sales", "do-not-reply", "automated",
    "notifications", "info", "updates", "unsubscribe", 
    "campaign", "click", "shop.tiktok.com", "facebookmail.com",
    "linkedin.com", "mailchimp.com", "sendgrid.net", 
    "constantcontact.com", "mailgun.org", "campaign-archive.com", 
    "easymail.co", "getsocial.io", "noreply.amazon.com", 
    "noreply.netflix.com", "natpay.com", "nelnet.com", 
    "nelnet.net", "justworks.com", 
    "experiencetanookilabs.com", "typeform.com"
]

# --- Helper functions ---
def contains_spam_keyword(text, keywords):
    if not isinstance(text, str):
        return False
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in keywords)

def contains_spam_domain(emails, domains):
    if not isinstance(emails, str):
        return False
    for email in emails.split(","):
        email = email.strip().lower()
        domain_part = email.split("@")[-1]
        if any(d in domain_part for d in domains):
            return True
    return False

def label_spam(row):
    """
    Returns 'Spam' if the row contains a spam keyword or spam domain; 
    otherwise returns 'Not Spam'.
    """
    combined_text = f"{row['Ticket name']} {row['Ticket description']}"
    if contains_spam_keyword(combined_text, spam_keywords):
        return "Spam"
    if contains_spam_domain(row['All associated contact emails'], spam_domains):
        return "Spam"
    return "Not Spam"

# --- 1) Load original CSV ---
df = pd.read_csv("data2.csv")  # Replace with your actual CSV path

# --- 2) Clean and label ---
df.drop_duplicates(
    subset=["Ticket name","Ticket description","All associated contact emails"], 
    keep="first", 
    inplace=True
)
df.fillna("", inplace=True)

df["Spam Label"] = df.apply(label_spam, axis=1)

# --- 3) Save new CSV with Spam Label ---
df.to_csv("labeled_data.csv", index=False)

print("New CSV created: labeled_data.csv")
