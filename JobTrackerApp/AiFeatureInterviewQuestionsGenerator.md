Feature Specification: AI Interview Question Generator
Goal

Build an AI-powered Interview Question Generator that creates customized interview preparation questions for a saved job application.

The generator should analyze:

Job Title
Job Description
Required Skills
Experience Level

and produce categorized interview questions.

Inputs
Required Inputs
{
jobTitle: string;
companyName: string;
jobDescription: string;
}

Example:

{
jobTitle: "QA Automation Engineer",

companyName: "Microsoft",

jobDescription: `   Looking for QA Automation Engineer
  with Playwright, TypeScript,
  API Testing, CI/CD and Docker experience.
  `
}
Optional Inputs
{
yearsOfExperience: string;
resumeSkills: string[];
}

Example:

{
yearsOfExperience: "3",

resumeSkills: [
"Playwright",
"TypeScript",
"React",
"API Testing"
]
}
AI Processing Requirements

The AI should:

Step 1

Extract:

Skills
Technologies
Responsibilities
Experience Level

Example:

Playwright
TypeScript
Docker
CI/CD
REST APIs
Step 2

Generate questions based on:

Job Title
Skills
Responsibilities
Step 3

Categorize questions.

Output Structure

Store result in this format:

{
generatedAt: string,

technicalQuestions: [],

behavioralQuestions: [],

roleSpecificQuestions: [],

codingQuestions: [],

systemDesignQuestions: []
}
Technical Questions

Generate:

10-20 questions

Example:

How does Playwright handle auto waiting?

What is the difference between
locator() and getByRole()?

How do you mock APIs in Playwright?

Explain fixture architecture.
Behavioral Questions

Generate:

5-10 questions

Example:

Tell me about a difficult bug
you found.

Describe a conflict
with a developer.

Tell me about a failed release.
Role Specific Questions

Example for QA:

How do you decide what should
be automated?

How do you handle flaky tests?

What is your automation strategy
for a new product?
Coding Questions

Example:

Write a TypeScript function
to remove duplicates.

Implement debounce.

Parse an API response.
System Design Questions

For senior roles only.

Example:

Design an automation framework.

Design a CI/CD test pipeline.

Design a scalable test reporting system.
Difficulty Levels

Every question should have:

{
question: string;
difficulty: "Easy" | "Medium" | "Hard";
}

Example:

{
question:
"What are Playwright fixtures?",

difficulty:
"Easy"
}
