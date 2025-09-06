import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from fastapi import FastAPI
from pydantic import BaseModel
from agents import Agent, Runner, function_tool
from dotenv import load_dotenv

# ---------- Data loading ----------
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Load env variables from project root .env so Python gets OPENAI_API_KEY, etc.
load_dotenv(os.path.join(ROOT_DIR, ".env"))
ACCOUNTS_PATH = os.path.join(ROOT_DIR, "public", "mock", "accounts.json")

def load_data() -> Dict[str, Any]:
    with open(ACCOUNTS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

DATA = load_data()
ACCOUNTS = DATA.get("accounts", [])
TX = DATA.get("transactions", [])

# ---------- Banking tools ----------
@function_tool
def list_accounts() -> List[Dict[str, Any]]:
    """Return all bank accounts with id, name, currency, and balance."""
    return ACCOUNTS

@function_tool
def get_balance(account_name: Optional[str] = None) -> Dict[str, Any]:
    """Get balance for an account by name (e.g. 'Everyday', 'Savings'). If not provided, return a summary across accounts."""
    if account_name:
        for a in ACCOUNTS:
            if a["name"].lower() == account_name.lower():
                return {"account": a["name"], "balance": a["balance"], "currency": a.get("currency", "NOK")}
        return {"error": f"Account '{account_name}' not found"}
    total = sum(a.get("balance", 0) for a in ACCOUNTS)
    return {"total_balance": total, "currency": "NOK", "accounts": ACCOUNTS}

@function_tool
def recent_spend(days: int = 30, account_name: Optional[str] = None) -> Dict[str, Any]:
    """Calculate total spend (negative transactions) in the last N days. Optionally filter by account name."""
    cutoff = datetime.now() - timedelta(days=days)
    def acc_id_from_name(name: str) -> Optional[str]:
        for a in ACCOUNTS:
            if a["name"].lower() == name.lower():
                return a["id"]
        return None
    target_id = acc_id_from_name(account_name) if account_name else None

    spend = 0.0
    items: List[Dict[str, Any]] = []
    for t in TX:
        if target_id and t.get("accountId") != target_id:
            continue
        try:
            d = datetime.fromisoformat(t["date"])  # YYYY-MM-DD
        except Exception:
            continue
        if d >= cutoff and t.get("amount", 0) < 0:
            spend += -float(t["amount"])  # make positive
            items.append(t)
    return {"days": days, "spend": round(spend, 2), "currency": "NOK", "transactions": items[:20]}

@function_tool
def money_left(account_name: Optional[str] = None) -> Dict[str, Any]:
    """Alias for current available balance. Optionally filter by account name; otherwise summarize."""
    return get_balance(account_name)

@function_tool
def quick_loan_options(amount: float = 50000.0, term_months: int = 24) -> Dict[str, Any]:
    """Return mock quick loan options for an amount and term. Non-binding informational quotes."""
    aprs = [0.079, 0.099, 0.129]
    offers = []
    for apr in aprs:
        monthly_rate = apr / 12
        # Simple annuity formula
        payment = amount * (monthly_rate * (1 + monthly_rate) ** term_months) / (((1 + monthly_rate) ** term_months) - 1)
        offers.append({
            "provider": f"AI Bank {int(apr*1000)} bps",
            "apr": round(apr * 100, 2),
            "monthly_payment": round(payment, 2),
            "term_months": term_months,
            "total_payment": round(payment * term_months, 2)
        })
    return {"amount": amount, "term_months": term_months, "currency": "NOK", "offers": offers}

# ---------- Agent ----------
AGENT = Agent(
    name="Bank Assistant",
    instructions=(
        "You are a helpful AI Bank assistant for a Norwegian user. "
        "You can: check balances, summarize recent spend, estimate money left, and explain fast loan options. "
        "Always be concise, friendly, and include NOK currency. Use tools when needed."
    ),
    # Use env-provided chat model, default to gpt-5-mini-2025-08-07 to align with Node
    model=os.environ.get("OPENAI_CHAT_MODEL", "gpt-5-mini-2025-08-07"),
    tools=[list_accounts, get_balance, recent_spend, money_left, quick_loan_options],
)

class QueryBody(BaseModel):
    input: str

app = FastAPI(title="Agents Bank Service")

@app.post("/query")
async def query(body: QueryBody):
    # Run the agent with the user's input
    result = await Runner.run(AGENT, input=body.input)
    return {
        "final_output": result.final_output,
        "tokens": getattr(result, "token_usage", None),
    }

@app.get("/health")
async def health():
    return {"ok": True}