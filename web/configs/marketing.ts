export const hero = {
  title: "Know what you can cut, before you cut it.",
  description:
    "SpendLens helps banks and fintech apps show customers where their money goes. Customers import their transactions, mark the bills they can't cut, and test a savings plan on the rest. All the maths runs in code, and AI only writes the explanation.",
};

export const why = {
  title: "Check every number yourself",
  description:
    "Money advice is only useful if you can see how it was worked out, so every SpendLens screen shows its working.",
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
      "SpendLens flags possible duplicates and uncategorised rows in plain words. You confirm, correct or reject each one.",
  },
  {
    number: "03",
    title: "Protect essentials, test a cut",
    description:
      "Lock rent and groceries so no cut can touch them, then try a percentage cut on everything else and see the result line by line.",
  },
  {
    number: "04",
    title: "Unlock Pro with Kora",
    description:
      "Pay through Kora Checkout to save scenarios and compare months. Pro switches on once our server confirms the payment.",
  },
] as const;

export const faqs = [
  {
    q: "Is SpendLens a bank?",
    a: "No. SpendLens reads the transaction records you import and gives back a review. It never holds money, moves money or cancels anything on your behalf.",
  },
  {
    q: "Do I need to share my banking password?",
    a: "No. You import a CSV export of your transactions. SpendLens can't log in to your bank and will never ask you to.",
  },
  {
    q: "Where do the numbers come from?",
    a: "From code. Totals, cuts and results are calculated in code and checked before they reach you. Plain-language explanations are phrased via Groq and Google Gemini using only aggregate category totals and coverage warnings, never raw transactions.",
  },
  {
    q: "What happens when there isn't enough data?",
    a: "SpendLens tells you, with labels like \"Not enough data\" or \"Possible duplicate\". It won't guess a number to fill the gap, and it doesn't rely on colour alone to warn you.",
  },
  {
    q: "How does a bank or fintech app integrate it?",
    a: "Through a REST API with an OpenAPI file. Your app sends imported transactions, gets back the analysis, protections and scenarios, and renders them in its own design. The demo shows a neutral host app doing this.",
  },
  {
    q: "What's the difference between Free and Pro?",
    a: "Free gives you one summary and a view-only scenario. Pro lasts 30 days and adds saved scenarios, month-to-month comparison and goal progress.",
  },
  {
    q: "How is payment handled?",
    a: "Through Kora Checkout. Pro unlocks after our server confirms the order is paid. A success message in the browser isn't enough on its own.",
  },
  {
    q: "How is demo data stored?",
    a: "Sample mode runs on synthetic data kept locally in your browser, so you can clear it anytime. Server-side storage and account deletion are not live until the backend API is deployed.",
  },
] as const;

export const closing = {
  title: "Try it on sample data, no sign-up needed.",
  description:
    "Walk through import, review and a savings scenario in about three minutes, using synthetic transactions.",
};
