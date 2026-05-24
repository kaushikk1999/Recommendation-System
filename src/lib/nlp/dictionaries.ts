import type { EntityType } from "@/lib/types";

export const entityDictionary: Record<EntityType, string[]> = {
  COMPANY: [
    "NALCO",
    "National Aluminium Company",
    "National Aluminium Company Limited",
    "NATIONALUM",
    "Hindalco",
    "Vedanta",
    "Coal India",
    "Odisha Mining Corporation"
  ],
  COMMODITY: ["aluminium", "aluminum", "alumina", "bauxite", "coal", "caustic soda", "power", "energy", "metal", "metals"],
  GEOGRAPHY: ["India", "Odisha", "Bhubaneswar", "Angul", "Damanjodi", "Koraput", "China", "Europe", "Middle East", "London"],
  POLICYMAKER: ["Ministry of Mines", "Government of India", "Ministry of Coal", "Ministry of Power"],
  REGULATOR: ["SEBI", "NSE", "BSE", "LME", "London Metal Exchange"],
  GOVERNMENT_BODY: ["Odisha Government", "Government of Odisha", "Department of Investment and Public Asset Management"],
  EVENT_TYPE: ["earnings", "production", "board meeting", "dividend", "capex", "ESG", "commodity price", "regulatory change", "policy announcement"],
  RISK_FACTOR: ["market risk", "operational risk", "energy cost", "input cost", "export duty", "import duty", "supply disruption"]
};

export const eventRules: Record<string, string[]> = {
  earnings: ["result", "financial", "profit", "revenue", "quarter", "ebitda", "net profit"],
  "production update": ["production", "output", "smelter", "refinery", "mine", "capacity"],
  "board meeting": ["board meeting", "meeting of the board"],
  dividend: ["dividend", "record date"],
  capex: ["capex", "expansion", "project", "investment", "capacity addition"],
  ESG: ["sustainability", "esg", "environment", "emission", "renewable"],
  "commodity price movement": ["aluminium price", "lme", "commodity", "metal price", "alumina price"],
  "regulatory change": ["sebi", "regulation", "compliance", "exchange", "filing"],
  "policy announcement": ["policy", "ministry", "government", "duty", "auction"],
  "market risk": ["risk", "cost pressure", "volatile", "shortage", "disruption"]
};

export const positiveWords = ["growth", "higher", "improved", "profit", "record", "award", "approved", "commissioned", "increase"];
export const negativeWords = ["decline", "lower", "loss", "risk", "pressure", "fall", "disruption", "delay", "penalty", "weak"];
