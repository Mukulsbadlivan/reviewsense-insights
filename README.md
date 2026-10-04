# ReviewSense Insights

Build a polished full-stack web app called "ReviewSense — Universal Sentiment Intelligence".

Goal: User uploads a PDF or Word (.docx) document containing customer/user reviews. The app extracts reviews, classifies each as Positive, Negative, or Neutral, and generates an interactive dashboard. It must be generic for product reviews, YouTube comments, movie reviews, company reviews, app reviews, etc.

Build a real working MVP, not a static mockup.

Core UX:
- Modern professional analytics dashboard, responsive desktop/mobile.
- Landing/upload area with drag-and-drop PDF/DOCX upload and clear supported-format messaging.
- Optional context/category selector: Auto Detect, Product, YouTube, Movie, Company, App, Other.
- After upload show processing state and then dashboard.
- Include a demo dataset/button so the dashboard can be explored without uploading a file.
- Dashboard title should adapt to selected/context detected subject when possible.

Sentiment engine:
- Extract text from PDF and DOCX.
- Detect individual reviews/comments from common formats: one review per line, paragraphs, numbered/bulleted reviews, CSV-like text where possible.
- Classify Positive/Negative/Neutral using a robust approach available in the app; explain that sentiment is an automated estimate.
- Store review text, sentiment, confidence, date/source if available, and useful keywords/topics.
- Handle empty/unparseable documents gracefully.
- Do not expose or require API keys in frontend.
- If an external LLM/API is needed, create a clean server-side integration boundary and environment-variable configuration, but provide a working local/demo fallback so the app still runs.

Dashboard:
- KPI cards: Total Reviews, Positive %, Negative %, Neutral %, Average Confidence.
- Sentiment distribution donut/pie chart.
- Sentiment trend over time when dates exist; otherwise display distribution and explain dates were not available.
- Bar chart for top positive/negative keywords or topics.
- Review volume by sentiment.
- Recent reviews table with search, sentiment filter, confidence, and source/date when available.
- Highlight representative positive and negative reviews.
- "Key Insights" panel with plain-English findings such as dominant sentiment, major complaints, strengths, and recommendations.
- Filters for sentiment, confidence range, source/category, and date if available.
- Export analyzed results to CSV.
- Reset/new analysis action.

UI quality:
- Clean SaaS/BI aesthetic suitable for an MBA/AI portfolio project.
- Strong typography, cards, charts, subtle animations, accessible contrast.
- Use shadcn/ui-style components and a coherent design system.
- Include a small methodology/info section explaining Positive/Negative/Neutral and limitations.
- Avoid claiming 100% accuracy.

Technical expectations:
- Use TypeScript/React with a production-quality component structure.
- Use a suitable chart library.
- Use client-side parsing where safe and server-side routes for processing where needed.
- Keep file-size/type validation and clear errors.
- If persistence is practical, save analyses/results to the app database; otherwise make the current session fully functional.
- Include sample data for YouTube, Product, Movie, and Company scenarios selectable from the demo.
- Make the app easy to deploy.

Important: implement the complete interface and functionality now, including upload, parsing, analysis, dashboard, filtering, insights, and CSV export. Do not just describe what to build.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b719d0c7-a3ed-4a2d-8025-a5c9bbc2b3cd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
