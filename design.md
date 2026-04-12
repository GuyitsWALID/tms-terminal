# TMS Terminal Design Specification

## 1. Design Philosophy
The goal is **"High Density, Low Friction."** The terminal should feel like a professional tool—efficient, clean, and devoid of unnecessary fluff. It prioritizes data accessibility over aesthetic ornamentation.

## 2. Visual Identity
- **Style**: Modern Enterprise / FinTech.
- **Theme**: 
    - **Dark Mode (Primary)**: Deep grays and blacks with high-contrast accents for data.
    - **Light Mode**: Clean white/off-white background with subtle borders to separate data cells.
- **Accents**: 
    - High Impact: Red (`#EF4444`)
    - Medium Impact: Orange (`#F97316`)
    - Low Impact: Yellow (`#EAB308`)
    - Bullish/Positive: Green (`#22C55E`)
    - Bearish/Negative: Red (`#EF4444`)

## 3. Component Strategy
- **UI Library**: `shadcn/ui` for foundational components (Tables, Dialogs, Tabs, Buttons, Cards).
- **Advanced UI**: `21st MCP` for complex, high-polish financial components (Ticker tapes, advanced data grids, interactive charts).
- **Icons**: Lucide-react for a consistent, minimal look.

## 4. Layout Architecture
- **Global Shell**:
    - **Top Navigation**: Slim bar with the logo, global search, Theme Toggle, and User Profile/XP.
    - **Sidebar (Collapsible)**: Quick links to Calendar, News, Forum, Analysis, Charts, and Academy.
- **Main Content Area**:
    - A flexible grid system that maximizes screen real estate.
    - Use of "Widgets" for the dashboard view, allowing the user to focus on specific data streams.

## 5. UX Priorities
- **Zero-Latency Feel**: Use of optimistic UI updates and skeleton loaders for data-heavy tables.
- **Information Hierarchy**: The most critical data (Actual vs Forecast) must be the most visually prominent element in the calendar.
- **Accessibility**: High contrast ratios for color-coded impact levels to ensure readability for all users.
