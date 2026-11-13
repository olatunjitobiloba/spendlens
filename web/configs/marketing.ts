export const hero = {
  title: "Know what you can cut, before you cut it.",
  description:
    "SpendLens helps banks and fintech apps show customers where their money goes. Import transactions, protect fixed bills, test a savings plan. Code does the maths; AI explains it.",
};

export const why = {
  title: "Built to be checked, not trusted blindly",
  description:
    "Money advice is only useful if you can see where it came from. SpendLens shows its working on every screen.",
};

export const steps = [
  {
    number: "01",
    title: "Import a statement",
    description:
      "Upload a CSV of transactions. SpendLens checks it first and points to the exact lines that need fixing before anything is saved.",
  },
  {
    number: "02",
    title: "Review what it found",
    description:
      "Possible duplicates and uncategorised rows are flagged in plain words. Confirm, correct or reject each one yourself.",
  },
  {
    number: "03",
    title: "Protect essentials, test a cut",
    description:
      "Lock rent and groceries so they are never touched. Try a percentage cut on the rest and see the result, line by line.",
  },
  {
    number: "04",
    title: "Unlock Pro with Kora",
    description:
      "Pay through Kora Checkout to save scenarios and compare months. Pro switches on only after our server confirms the payment.",
  },
] as const;

export const faqs = [
  {
    q: "Is SpendLens a bank?",
    a: "No. SpendLens reads transaction records you import and gives back a review. It never holds money, moves money or cancels anything on your behalf.",
  },
  {
    q: "Do I need to share my banking password?",
    a: "Never. You import a CSV export of your transactions. SpendLens has no way to log in to your bank and will never ask you to.",
  },
  {
    q: "Where do the numbers come from?",
    a: "From code. Totals, cuts and results are calculated in code and checked before they reach you. Plain-language explanations are phrased via Groq and Google Gemini using only aggregate category totals and coverage warnings, never raw transactions.",
  },
  {
    q: "What happens when there isn't enough data?",
    a: "SpendLens says so. You'll see \"Not enough data\" or \"Possible duplicate\" in words, not a guessed number or a colour you have to decode.",
  },
  {
    q: "How does a bank or fintech app integrate it?",
    a: "Through a REST API with an OpenAPI file. Send imported transactions in, get analysis, protections and scenarios back, and render them in your own app. The demo shows a neutral host app doing exactly that.",
  },
  {
    q: "What's the difference between Free and Pro?",
    a: "Free gives you one summary and a view-only scenario. Pro runs for 30 days and adds saved scenarios, month-to-month comparison and goal progress.",
  },
  {
    q: "How is payment handled?",
    a: "Through Kora Checkout. Pro unlocks only after our server confirms the order is paid. A success message in the browser alone never unlocks anything.",
  },
  {
    q: "How is demo data stored?",
    a: "Sample mode runs on synthetic data kept locally in your browser, so you can clear it anytime. Server-side storage and account deletion are not live until the backend API is deployed.",
  },
] as const;

export const closing = {
  title: "Try it on sample data. No sign-up.",
  description:
    "Walk through import, review and a savings scenario in about three minutes, using synthetic transactions.",
};
