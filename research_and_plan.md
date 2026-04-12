# TMS Terminal - Research & Implementation Plan

## Context
TMS Terminal is a community-focused web application designed for traders to access a high-signal environment combining an economic calendar, live financial news, and real-time ticker prices. The goal is to merge the information density of **ForexFactory** with the efficiency and speed of **Financial Juice**, while introducing key differentiators: verified trader opinions before economic events and a gamified fundamental learning experience.

## Research Findings

### 1. Data Sourcing (Live Tickers)
Finding truly free real-time data is challenging. The following options were analyzed:
- **AllTick**: Best for low latency (WebSockets), but strict free limits.
- **FCS API / FXPricing**: Good balance of reliability and stability for retail dashboards.
- **Recommendation**: Use **FXPricing** or **FCS API** for the MVP. Transition to WebSockets (AllTick) if tick-by-tick accuracy becomes a priority.

### 2. News Delivery (Financial Juice Analysis)
Financial Juice's core value is "signal over noise."
- **Key Features**: Curated high-impact feeds, a "Squawk" audio stream, and asset-class categorization.
- **TMS Implementation**: 
    - Implement a curated feed tagged by impact (High/Medium/Low).
    - Explore AI-driven sentiment scoring to add a quantitative layer to news headlines.

### 3. UI/UX (ForexFactory Inspiration)
The UI will mirror the high-density layout of ForexFactory:
- **Economic Calendar**: Color-coded impact (Red/Orange/Yellow) with "Actual vs Forecast vs Previous" columns.
- **Sentiment**: Retail Long/Short percentage breakdowns.
- **Session Tracking**: London/NY/Tokyo overlap indicators.

---

## Implementation Plan

### 1. Core Layout & Navigation
- **Main View**: High-density data dashboard.
- **Tabs**:
    - `Calendar`: The primary landing view (ForexFactory style).
    - `News`: Curated live feed (Financial Juice style).
    - `Forum`: Community communication space.
    - `Analysis`: Exclusive section for verified traders to post daily market insights.
    - `Charts`: Live tickers and integrated TradingView charts.
    - `Academy`: The gamified fundamental learning section.

### 2. Feature Specifics
- **Verified Opinions**: Integration of a comment/prediction system on specific calendar events, accessible only to verified trader accounts.
- **Event Alarms & Notifications**: Ability to "star" high-impact events and receive browser notifications 5 minutes before release, including a summary of verified trader opinions.
- **Quick-Switch Asset Views**: A global toggle to shift the entire terminal (News, Analysis, Charts) to focus on a specific currency pair (e.g., "EURUSD Mode").
- **Gamified Academy**: 
    - AI-generated fundamental multiple-choice questions.
    - XP system for correct answers.
    - Reward mechanism for milestones.
- **Data Integration**: 
    - Webscraping or API integration for financial news.
    - Live Forex API for ticker prices.

### 3. Technical Stack (Proposed)
- **Frontend**: React (due to the need for real-time updates and complex state management).
- **Backend**: Node.js/Python (for news aggregation and AI question generation).
- **Database**: PostgreSQL/MongoDB for user XP, forum posts, and verified analysis.
- **Charts**: TradingView Lightweight Charts library.

## Verification Plan
- **Data Accuracy**: Compare ticker prices against a known benchmark (e.g., Bloomberg/Reuters).
- **UX Flow**: Verify the transition from Calendar $\rightarrow$ News $\rightarrow$ Analysis is seamless.
- **Gamification**: Test the AI question generation loop and XP incrementing logic.
