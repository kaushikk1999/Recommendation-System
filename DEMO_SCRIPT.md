# Recruiter Demo Script

1. Start on the landing page and explain that this is not a generic chatbot. It is a market-intelligence product for NALCO with source transparency.
2. Open `/dashboard` and show latest ingested items, sentiment, materiality and high-impact events.
3. Open `/entities` and explain the custom schema: companies, commodities, geographies, policymakers, regulators, event types and risk factors.
4. Open the chatbot widget and ask: `What aluminium-related news could impact NALCO?`
5. Point out confidence, evidence date range and citations under the answer.
6. Open a source detail page and show the original URL, summary, entities and cleaned evidence text.
7. Open `/demo` and walk through the architecture: adapters, pipeline, NLP extraction, RAG API and UI.
8. Close by highlighting production choices: typed APIs, Prisma schema, environment validation, fallback states, no hardcoded keys and refusal behavior when evidence is missing.
