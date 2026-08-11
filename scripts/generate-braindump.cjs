const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");
const fs = require("fs");
const path = require("path");

const content = `Ayham Huq - Resume Master Brain Dump

Comprehensive detail for resume tailoring. Work in progress; updated as interviews continue. This document is intended to be a compact source of truth for project evidence, keywords, and resume tailoring.



Target Roles

Backend software engineer; cloud engineer; full-stack engineer; AI engineer; consulting / solutions-oriented software engineer.



Certifications

AWS Certified Solutions Architect - Associate. AWS Certified AI Practitioner - Foundational.



Consolidated Skills and Keywords

Languages: Go/Golang, Python, Java, Kotlin, JavaScript, TypeScript, C#, C/C++, SQL, Bash, YAML.

Backend/API: Spring Boot, Flask, Node.js, REST APIs, SOLID, schema design, third-party API integration, Plaid API integration, Firebase, Firebase Authentication, event-driven architecture, serverless architecture, configuration-driven design, idempotency, WebSockets, JWT-secured communication.

Frontend/mobile: React, React Native, Android, Kotlin mobile development, Jetpack Compose, MVVM, LiveData, iframe embedding, static site hosting, WCAG 2.2 accessibility, dashboards, cross-platform app development, design tokens, theming, Tailwind CSS, AG Grid.

AWS/cloud: Lambda, API Gateway, S3, DynamoDB, SQS, SNS, Kinesis, Step Functions, IAM, least-privilege IAM, CloudWatch Logs, CloudWatch Insights, CloudWatch alarms, CloudFormation, CDK, Athena, Glue, OpenSearch, Bedrock, Bedrock Agents, Bedrock Flows, Bedrock Evals.

AI/ML/data: RAG, LangChain, document vector store, OpenAI embeddings, vector search, FAISS, PyTorch, reranking, multi-agent architecture, LLM evaluation, semantic similarity, precision/recall, F1 score, Pandas, NumPy, linear regression, forecasting, recommendation systems, route optimization, regret insertion heuristic, NLP preprocessing, lemmatization, stopword removal.

Game/OOP: MonoGame, game development, object-oriented programming, OOP design patterns, state machine, command pattern, factory pattern, collision detection, player physics, enemy systems, save system, game state, graphics programming.

DevOps/tools: Git, GitHub Actions, Jenkins, Docker, Ansible, Azure DevOps, Vercel, Jira, ServiceNow, CI/CD, infrastructure as code, production deployment, Amplitude.

Testing/quality: JUnit, pytest, Jest, Postman, Playwright, unit testing, API testing, automated tests, accessibility implementation/testing.

Observability/security: logging, tracing, CloudWatch monitoring, CloudWatch Insights queries, cross-account IAM trust policies, production change management.

Consulting/leadership: client engagement, stakeholder communication, cross-functional coordination, formal presentation, account-wide demos, production deployment coordination, technical decision-making, P1 feature ownership.



Professional Experience



CapTech Ventures

Ayham was promoted from Associate Software Consultant (July 2025 - July 2026) to Software Consultant (July 2026 - Present). Large consulting firm. Worked across multiple client engagements operating as a full-stack / backend engineer across distinct client projects plus one internal bootcamp project.



CapTech Ventures - Software Consultant

July 2026 - Present | Chicago, Illinois

Promoted to Software Consultant after one year. Role change brought more client-facing responsibilities: account-wide demos, entrusted with P1 features from conception to full solo development.



Project: National Golf League - Itinerary Recommendation Algorithm + Production Support

Business Context

Client is a national golf league; name confidential. Consumer-facing product: generates personalized travel itineraries for attendees at the PGA Championship. End users: consumers at the tournament using the tool in real time.

Algorithm Design

Hybrid approach: recommendation logic for hard constraints plus route optimization for the spatial/distance problem. Core algorithm: regret insertion heuristic, a constructive approach for routing/scheduling problems, built entirely from scratch in Golang. Reusability was a top-down requirement, and Ayham was solely responsible for translating that into a clean technical design. Reusability achieved through configuration-driven design: constraints and scoring weights are swappable, with no hardcoded dependency on golf-specific context.

Outcome and Impact

Shipped to real tournament attendees at a live national golf event. Over 10,000 itineraries generated. 78% of itineraries required zero modification by users (accepted without regeneration). Only 20% required any form of regeneration. Only 2% were deleted outright, validating algorithm quality. Acceptance rate measured by tracking how many users opened the itineraries page on the day of their itinerary via Amplitude analytics. Detailed Amplitude analytics tracked all button presses within the app via a custom dashboard. Algorithm and platform are planned for reuse across future tournaments, not just the same event next year.

Production Support

Owned production support for the engine and frontend over 9 days of the live tournament, including weekends. Sole responsibility for monitoring, triaging, and resolving issues in real time while the tournament was active. Notable incidents included lack of support for deep link integration on specific devices and sizing/layout issues caused by the app being embedded as an iframe in the client's native app for the first time — an environment Ayham's team could not directly control or modify.

Frontend Architecture

Built entirely from scratch; Ayham was the sole frontend developer and owned all frontend architecture decisions. Tech: React + TypeScript. Delivered as an iframe embedded into the client's existing mobile app. Static frontend hosted on S3. Integrated user analytics with Amplitude.

Cloud, Testing and Serverless Architecture

Ayham co-architected the cloud infrastructure. Serverless pattern: Docker used for local development parity; deployed serverlessly to AWS. Backend: REST API Gateway + Lambda architecture for scalability. CI/CD: GitHub Actions pipeline for automated deployment to S3 and Lambda. Testing included automated unit tests and Playwright tests.

Tech Stack

Golang recommendation and route optimization algorithm. React + TypeScript frontend. AWS: S3, API Gateway, Lambda. Docker, GitHub Actions, Amplitude, Playwright, unit testing.



Project: Leading Beverage Company - React Theming Layer

Business Context

Client is a leading beverage company; name confidential. Large enterprise React application needed a theming overhaul. Ayham is still on this client engagement as of August 2026.

Consultant Responsibilities

As a promoted Software Consultant, Ayham is more client-facing: performing account-wide demos to show what the team has been working on. Entrusted with P1 features from the ground up — from conception to full solo development, such as the light mode theming effort.

Technical Work

Retrofitted a theming layer across a large enterprise React application, converting hardcoded styles to design tokens to enable theme switching. Scale: over 70 files touched and over 1,000 lines of theming code. Primary technical challenges: migrating hardcoded Tailwind tokens to semantic design tokens, handling dynamic styles that resisted token-based abstraction, and working around the AG Grid library which does not natively support semantic tokens. Shipped light mode solo within one sprint. Sole developer on the theming effort.

Tech Stack

React, TypeScript, CSS, Tailwind CSS, AG Grid, design tokens, theming, responsive user interfaces.



CapTech Ventures - Associate Software Consultant

July 2025 - July 2026 | Chicago, Illinois



Project 1: Fortune 100 Financial Company - Direct Messaging Migration

Business Context

Client is a Fortune 100 financial services company with millions of customers. The feature: real-time email notifications sent to customers when they made a redemption, such as rewards redemption. Before: notifications were triggered directly and tightly coupled within the Java codebase, likely via a Java mail or messaging library. After: migrated to Maestro, a third-party centralized messaging platform, to improve scalability and centralize outbound messaging across the organization.

Architecture and Technical Work

The pipeline was an event-driven, multi-stage enrichment flow. Spring APIs were updated upstream to add necessary data fields to responses, making customer and transaction data available for downstream enrichment. AWS Lambda functions handled business logic: assembling configuration values and enriching the message payload with customer and transaction context. DynamoDB served as a metadata store and was updated to accommodate new message fields. SQS provided FIFO ordering and reliable queuing before messages were dispatched through Maestro's API. SQS queuing supported message retry/reprocessing behavior; idempotency was implemented to prevent duplicate processing issues. Kinesis was used for data streaming/storage; exact role unclear, likely event ingestion or replay capability. Updated DynamoDB schemas and API schemas to support new data fields. Integrated with Maestro's API to wire the pipeline end-to-end. Implemented tracing for request/message flow visibility. Wrote and ran tests throughout the integration process, including JUnit and Postman testing.

Team and Role

Overall project team: approximately 14 people. Only 2 engineers, including Ayham, were directly tasked with this migration work. Did not architect the system from scratch; implemented and extended an existing architecture.

Cross-Team Coordination and Deployment

Coordinated a production deployment during a code freeze period on a messaging system serving millions of customers, which created an elevated-risk release environment. Worked across 3 teams: the Maestro team, the Message Ingestion team, and Ayham's own team. Drove a significant portion of the coordination: led cross-functional meetings, managed communication threads, and maintained a high-level understanding of the full pipeline to ensure alignment. Used Jenkins for production releases and production deployments.

Outcome and Impact

Migration successfully went live in production. Feature serves millions of customers; exact number unknown but large scale. Improved scalability and centralized outbound messaging infrastructure for the client.

Tech Stack

AWS: Lambda, DynamoDB, SQS, Kinesis. Java / Spring Boot. Maestro third-party messaging platform. Jenkins, JUnit, Postman, tracing, idempotency.



Project 2: National Sports League - AWS Bedrock AI Analysis Tool

Business Context

Client is a national sports league; name confidential. The tool: an AI-powered decision support and content generation tool for internal domain experts to streamline daily workflows.

Architecture and Technical Work

Built on AWS Bedrock Agents and Flows using Retrieval-Augmented Generation (RAG). Knowledge base: proprietary league data stored and retrieved via AWS OpenSearch as the vector database. Implemented reranking to improve retrieved chunk quality before model generation, increasing grounded response relevance. Redesigned agent architecture by replacing a single generalized agent with a multi-agent setup: supervisor agent plus specialized subagents for focused domain-specific tasks. This multi-agent decomposition directly improved output quality for specific expert workflows. Used JWT with WebSockets for authenticated real-time communication in the Bedrock tool.

Evaluation Framework

Used AWS Bedrock Evals with a separate evaluator model to measure output quality. Evaluation dataset was human-labeled ground truth. Evaluator model scored semantic similarity between generated responses and correct answers. Result: precision and recall improved by over 30% compared to model baselines.

Team and Role

2-person development team. Ayham was at the forefront of almost all technical decisions: architecture, reranking strategy, agent design, and evaluation methodology.

Tech Stack

AWS Bedrock Agents, Flows, and Evals. AWS OpenSearch vector database for RAG. RAG pipeline with reranking. Multi-agent architecture: supervisor plus specialized subagents. JWT, WebSockets.



Serverless Architecture Pattern (used across Associate projects)

Ayham architected a serverless pattern: Docker running for local development parity, deployed serverlessly to AWS. Backend: REST API Gateway + Lambda architecture for scalability. CI/CD: GitHub Actions pipeline for automated deployment to S3 and Lambda. Testing included automated unit tests and Playwright tests.



CapTech Internal - Coffee Shop Analytics Dashboard

Business Context

Internal CapTech bootcamp project built around a fictional cafe client. Target user persona: a store manager who needs immediate visibility into operational KPIs. Goal: surface actionable insights to help a manager make fast, data-driven decisions about inventory, sales, and costs.

Core Features

KPI Dashboard: displayed daily revenue, profit margins, inventory turnover, cost, low stock alerts, and sales at aggregate and item-level views. Inventory Tracking: real-time visibility into stock levels with low stock alerts. Sales Tracking: granular sales data per item and rolled up across the whole store. Forecasting: sales projections and inventory reorder predictions using a statistical linear regression model. WCAG 2.2 Accessibility: full compliance implemented across the entire application.

Architecture and Tech Stack

Frontend: React static website. Backend: Python, deployed via AWS Lambda + API Gateway. Infrastructure: AWS CDK written in Python for provisioning cloud resources. Database: SQLite. Static website pattern: S3 + API Gateway + Lambda. Project managed using Jira and Agile methodology.

Tech Stack

React, Python, AWS Lambda, API Gateway, S3, CDK, SQLite, linear regression, WCAG 2.2, Jira / Agile.



Publicis Sapient - Software Engineer Intern

June 2024 - August 2024 | Chicago, Illinois

6-week client engagement at a global consulting firm. 8-person intern team building a consumer-facing healthcare app for a Fortune 25 company, delivered via a Publicis Sapient consultant.

Business Context

Mock client project for a Fortune 25 healthcare company. Consumer-facing app: provided personalized healthcare plan recommendations to maximize savings based on user historical spending data and biometric factors. End users: individual consumers choosing between healthcare plans. Project concluded with a 1-hour presentation to the client representative.

Backend and AI Work

Ayham was primary backend engineer on the team. Built a Python Flask API with an Azure SQL backend and a LangChain RAG chatbot over OpenAI embeddings. Implemented a 2-step RAG pipeline: embedded user plan/spending data into a document vector store, retrieved relevant context at query time, and passed context to the OpenAI model for generation. Chatbot use cases: answering personalized questions about the user's plan, finding care, understanding costs, and surfacing relevant plan information. Served as primary backend engineer, building a Python Flask API with an Azure SQL backend and a LangChain RAG chatbot over OpenAI embeddings, delivered in 6 weeks.

Frontend and Testing

Contributed to the React Native frontend in a supporting role alongside primary backend focus. Hosted React Native app on an emulator for development/testing. Wrote Jest unit tests for React Native components. Used pytest in the project.

Process and Delivery

Agile methodology throughout. Delivered and presented to client in a formal 1-hour presentation at end of 6-week engagement.

Tech Stack

Python Flask backend. LangChain + OpenAI embeddings for RAG / AI chatbot. Document vector store. React Native frontend. Azure SQL database. Jest and pytest. Jira / Agile.



Sallie Mae - Cloud Engineer Intern

May 2023 - August 2023 | Indianapolis, Indiana

Cloud engineering internship at a major financial services company. Worked independently on a real production problem under the guidance of a senior cloud engineer.

Project: AWS Config SNS Centralization System

Business Context and Problem

Cloud engineers were receiving thousands of daily config SNS messages across hundreds of AWS accounts with no filtering, no queryability, and no way to trace which account a violation originated from. Goal: eliminate email clutter, centralize the logs, and make them queryable for analysis.

Architecture and Solution

Hub-and-spoke pattern: Lambda functions deployed in each AWS account intercepted SNS messages from AWS Config, parsed them, and forwarded the data to a single centralized logging account. Centralized account aggregated all logs into S3 for durable storage and CloudWatch Logs for queryability. Set up cross-account IAM trust policies and least-privilege IAM permissions so each spoke account's Lambda could write to the centralized S3 bucket and CloudWatch Logs group. Added Athena + Glue as an alternate query layer: Glue crawled the S3 bucket to infer schema, and Athena SQL queries enabled ad-hoc analysis of config violation logs. Used CloudWatch Insights queries for log analysis. Lambda functions written in Python using the AWS SDK / boto3.

Infrastructure as Code

Wrote an Ansible script and CloudFormation template in YAML to automate code deployment in production as well as deploy resources such as Athena SQL queries with Glue and S3.

Delivery and Impact

Went through formal production deployment via ServiceNow change management process. Successfully deployed to production and actively adopted by the cloud engineering team. Covered hundreds of AWS accounts.

Team and Role

Worked independently and was solely responsible for design, implementation, and deployment. Reported to and was guided by a senior cloud engineer as needed. Used Azure DevOps and Git within a scaled Agile framework across 7 sprints.

Tech Stack

AWS: Lambda, SNS, S3, CloudWatch Logs, CloudWatch Insights, Athena, Glue, IAM, CloudFormation. Python / boto3. Ansible. CloudFormation / YAML. Azure DevOps + Git. ServiceNow. Scaled Agile / 7 sprints.



Additional Projects



AEP Hackathon - AI Safety Classification Tool

Context: 24-hour AEP challenge hackathon in October 2024; 4-person team; placed 2nd out of 17 teams in an event with 800+ participants.

Problem: use AI to classify energy-sector safety incidents into severity categories such as high energy, low energy, and potentially fatal incidents.

Role: primary AI engineer; owned the FAISS backend and PyTorch classification work.

Technical work: built a React Native cross-platform app with a Flask backend and SQLite database; trained a PyTorch safety classification model using 20,000 provided incident records; used FAISS for similarity search / retrieval support; preprocessing included lemmatization and stopword removal.

Evaluation: measured F1, precision, and accuracy.

Outcome: won 2nd place based on strong model performance, strong demo execution, and a practical AI approach that did not rely on LLMs.

Resume keywords: hackathon, AI safety classification, PyTorch, FAISS, React Native, Flask, SQLite, NLP preprocessing, lemmatization, stopword removal, precision, accuracy, F1 score, cross-platform app, energy sector, incident classification.



Mario Game Design Project - MonoGame / C#

Context: class project built by a 4-person team; delivered and demoed a finished game in class. September - December 2024.

Project: recreated Super Mario Bros. levels 1-1 and 1-2 using MonoGame and C#.

Role: owned collision handling and player physics as primary contributions; also implemented enemies, save system, and game state behavior.

Technical work: built collision detection from scratch using bounding boxes; implemented player movement and physics interactions; contributed gameplay systems for enemies, persistent save behavior, and state transitions.

Architecture: used state machine, command pattern, and factory pattern to organize game behavior and object creation.

Challenge: collision detection was the hardest technical piece because behavior had to be built from bounding boxes rather than a ready-made physics engine.

Resume keywords: C#, MonoGame, game development, object-oriented programming, OOP design patterns, state machine, command pattern, factory pattern, collision detection, bounding boxes, player physics, enemy systems, save system, game state, graphics programming, class project, team project.



Travel Budgeting App - Kotlin / Plaid API

Context: Android class project built from October 2024 to December 2024.

Project: travel budgeting app that let users connect bank accounts, categorize spending, set trip budgets, and track expenses and receipts.

Technical work: built with Kotlin, Jetpack Compose, Model-View-ViewModel (MVVM), LiveData, and Firebase; integrated the Plaid API for bank-account connectivity and financial data access.

Role: personally owned backend functionality.

Auth and Data: used strict Firebase authentication for user access and user information.

Resume keywords: Kotlin, Android, Jetpack Compose, MVVM, Model-View-ViewModel, LiveData, Firebase, Firebase Authentication, Plaid API, financial API integration, bank-account linking, expense tracking, receipt tracking, travel budgeting, mobile app architecture, personal finance app.`;

const doc = new Document({
  sections: [{
    children: content.split("\n").map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return new Paragraph({ spacing: { after: 0 }, children: [] });
      }

      if (trimmed === "Ayham Huq - Resume Master Brain Dump") {
        return new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: trimmed, bold: true, size: 28 })],
        });
      }

      const isH1 = /^(Professional Experience|Certifications|Target Roles|Consolidated Skills and Keywords|Additional Projects)$/.test(trimmed)
        || /^(CapTech Ventures|Publicis Sapient|Sallie Mae) -/.test(trimmed)
        || trimmed === "CapTech Ventures";
      if (isH1) {
        return new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: trimmed, bold: true })],
        });
      }

      const isH2 = /^(Project|Business Context|Architecture|Technical Work|Cross-Team|Backend|Frontend|Process|Core Features|Algorithm|Outcome|Production Support|Tech Stack|Infrastructure|Delivery|Agentic|Serverless|AI Chatbot|Evaluation|Auth|Team and Role|Cloud, Testing)/.test(trimmed);
      if (isH2) {
        return new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 50 },
          children: [new TextRun({ text: trimmed, bold: true })],
        });
      }

      return new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun({ text: trimmed })],
      });
    }),
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(path.join(__dirname, "..", "data", "documents", "v1", "Resume - Braindump.docx"), buffer);
  console.log("Braindump .docx written to data/documents/v1/Resume - Braindump.docx");
});
