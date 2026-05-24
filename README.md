# AI Engineering

A practical, project-driven curriculum for QA engineers learning to use LLMs as a real testing tool, not a toy.
Each section pairs concept material with reusable prompt assets for testing workflows.

---

## Repository Layout

```text
.
├── LLMBasics/                          LLM and attention fundamentals
│   ├── attention_interactive.html
│   ├── attention_is_all_you_need.html
│   └── Notes.md
│
└── PromptEngineering/                  Prompt engineering for QA work
    └── Templates/
        ├── AntiHallucinationRules.md
        ├── ApiTestGeneration.md
        ├── BlankTemplateRicePot.md
        ├── NegativeTestCases.md
        ├── RegressionSuite.md
        ├── RestfulBookerApiTestCases.md
        ├── RicePot.md
        ├── RicePotTestCasePrompt.md
        ├── SecurityTest.md
        ├── Skill.md
        ├── TestCaseGenerationPrompt.md
        └── TestCasesFromProductRequirements.md
```

---

## LLMBasics

Foundational material on how Large Language Models read text and decide what to output.

- `attention_is_all_you_need.html` explains core Transformer concepts.
- `attention_interactive.html` visualizes self-attention behavior.
- `Notes.md` contains short recap notes.

Open the HTML files locally in any browser. No build step is required.

---

## PromptEngineering

This section turns prompt engineering into a repeatable QA skill.

### Main Templates

- `AntiHallucinationRules.md` gives guardrails so the model uses only provided input.
- `RicePot.md` explains the RICE-POT framework.
- `RicePotTestCasePrompt.md` shows a full structured prompt for test case generation.
- `BlankTemplateRicePot.md` gives a fill-in template for your own use cases.
- `Skill.md` contains prompt-builder guidance for structured QA prompting.

### QA Prompt Files

- `TestCaseGenerationPrompt.md` for basic test case generation.
- `TestCasesFromProductRequirements.md` for PRD-based test coverage.
- `ApiTestGeneration.md` for API-focused test case generation.
- `NegativeTestCases.md` for negative scenario coverage.
- `SecurityTest.md` for security-oriented test ideas.
- `RegressionSuite.md` for regression planning.
- `RestfulBookerApiTestCases.md` as a sample generated output.

---

## How to Use This Repo

- Start with `LLMBasics/` if you want to understand how LLM behavior works.
- Use `PromptEngineering/Templates/TestCaseGenerationPrompt.md` for quick test case generation.
- Use `PromptEngineering/Templates/TestCasesFromProductRequirements.md` when working from a PRD.
- Use `PromptEngineering/Templates/ApiTestGeneration.md` for API testing prompts.
- Use `PromptEngineering/Templates/RicePotTestCasePrompt.md` when you want a more structured prompt.
- Use `PromptEngineering/Templates/AntiHallucinationRules.md` to reduce hallucinations in model output.

## Requirements

- Any modern LLM such as GPT, Claude, Gemini, or DeepSeek.

## Previous Chapters

`a2eb280` - chapter 01 LLM basics with interactive attention visualizations.
`dfe2653` - chapter 02 prompt engineering with RICE-POT framework and Selenium project.

---
