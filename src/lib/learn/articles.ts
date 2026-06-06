export type LearnArticle = {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  relatedLinks: Array<{ label: string; href: string }>;
  sections: Array<{ heading: string; body: string[] }>;
  checklist?: string[];
};

export const learnArticles: LearnArticle[] = [
  {
    slug: "read-economic-calendar-before-trading-news",
    title: "How to Read an Economic Calendar Before Trading News",
    description: "A practical framework for checking event timing, expected impact, consensus, and risk before trading macro releases.",
    category: "Economic Calendar",
    publishedAt: "2026-06-06",
    updatedAt: "2026-06-06",
    readingMinutes: 7,
    relatedLinks: [
      { label: "Open live calendar", href: "/calendar" },
      { label: "Practice macro basics", href: "/academy" },
    ],
    sections: [
      {
        heading: "Start with timing and session context",
        body: [
          "An economic calendar is most useful when it is read before the market has already reacted. Check the release time in your local timezone, then compare it with the active trading session. A US inflation release during the New York open usually behaves differently from the same headline dropping into a thin late-session market.",
          "Financial Vibe separates high and medium impact events because not every calendar row deserves the same attention. Focus first on central bank decisions, inflation, employment, growth, retail sales, and PMI releases. Lower-impact items can still matter, but usually only when liquidity is thin or the market is already sensitive to that theme.",
        ],
      },
      {
        heading: "Read forecast, previous, and market expectation together",
        body: [
          "The number itself is only one part of the reaction. Traders compare the actual release against consensus expectations, the prior reading, and the trend over several months. A headline that looks strong in isolation can still disappoint if positioning was already built for an even stronger result.",
          "Before the release, write down the market's likely question. For CPI it may be whether inflation pressure keeps rates higher. For nonfarm payrolls it may be whether labor strength supports the dollar or raises recession concerns. This keeps you from chasing the first candle without context.",
        ],
      },
      {
        heading: "Plan risk before the headline",
        body: [
          "News events can widen spreads, skip stop orders, and create false first moves. A useful calendar routine includes deciding whether to avoid the release, trade only after confirmation, or reduce position size. The goal is not to predict every print; it is to avoid being surprised by known volatility windows.",
          "Use the calendar as a preparation tool, not a signal machine. The best traders often make fewer decisions around news, but those decisions are more deliberate.",
        ],
      },
    ],
    checklist: [
      "Confirm release time and active session.",
      "Compare forecast, previous reading, and current market theme.",
      "Mark the pairs or assets most exposed to the event.",
      "Decide whether to stand aside, reduce size, or wait for post-release structure.",
    ],
  },
  {
    slug: "forex-session-overlap-london-new-york",
    title: "Forex Session Overlap: What Changes During London and New York",
    description: "Why liquidity, spreads, and volatility often change when London and New York trade at the same time.",
    category: "Forex Basics",
    publishedAt: "2026-06-06",
    updatedAt: "2026-06-06",
    readingMinutes: 6,
    relatedLinks: [
      { label: "View forex charts", href: "/charts" },
      { label: "Check live sessions", href: "/" },
    ],
    sections: [
      {
        heading: "The overlap concentrates participation",
        body: [
          "The London and New York overlap is one of the busiest windows in spot FX because European banks, US desks, macro funds, corporates, and short-term traders are active at the same time. More participation usually means tighter spreads on major pairs, deeper liquidity, and faster reactions to new information.",
          "This does not automatically make the overlap easier. Faster markets can reward preparation, but they also punish late entries and oversized positions. The main advantage is that price discovery is usually more meaningful than during quiet handoff periods.",
        ],
      },
      {
        heading: "Different pairs respond to different drivers",
        body: [
          "EUR/USD and GBP/USD often respond strongly during the overlap because both European and US narratives are in play. USD/JPY can react to US yields and risk sentiment. Commodity-linked currencies such as AUD, NZD, and CAD may need additional context from commodities, equities, or China-related headlines.",
          "When the overlap begins, avoid treating all pairs as interchangeable. Ask which currency has a fresh catalyst and which side of the pair is carrying the cleaner story.",
        ],
      },
      {
        heading: "Structure matters more than speed",
        body: [
          "Many new traders see a fast candle and assume the move is obvious. A better routine is to map the prior range, note liquidity above and below it, then watch whether the overlap accepts price outside that range. Acceptance and rejection are more useful than speed alone.",
        ],
      },
    ],
  },
  {
    slug: "cpi-nfp-central-bank-rates-currency-traders",
    title: "What CPI, NFP, and Central Bank Rates Mean for Currency Traders",
    description: "A simple guide to the macro releases that often drive FX repricing and volatility.",
    category: "Macro Drivers",
    publishedAt: "2026-06-06",
    updatedAt: "2026-06-06",
    readingMinutes: 8,
    relatedLinks: [
      { label: "Open calendar", href: "/calendar" },
      { label: "Read market analysis", href: "/analysis" },
    ],
    sections: [
      {
        heading: "CPI influences rate expectations",
        body: [
          "Consumer price inflation matters because central banks usually care about price stability. If inflation is stronger than expected, traders may price a higher chance of rate hikes or a slower path toward cuts. That can support the currency tied to the central bank, especially when bond yields move in the same direction.",
          "The market often separates headline CPI from core CPI. Core readings remove volatile components and can carry more signal for policy expectations. Always check which measure the market is focused on before the release.",
        ],
      },
      {
        heading: "NFP is about labor strength and the policy path",
        body: [
          "US nonfarm payrolls can move the dollar, gold, indices, and crypto because it shapes expectations for Federal Reserve policy and growth. A strong jobs report can support the dollar when the market thinks it keeps policy restrictive. In a different environment, strong jobs can lift risk appetite and produce a more mixed FX reaction.",
          "Average hourly earnings and unemployment can matter as much as job creation. A large payroll number with weaker wage pressure may create a different response than a smaller payroll gain with sticky wage inflation.",
        ],
      },
      {
        heading: "Central banks move markets through guidance",
        body: [
          "Rate decisions are important, but the statement, press conference, and voting details often matter more when the decision was already expected. Traders watch for changes in confidence, inflation language, growth concerns, and any hint that policymakers are uncomfortable with market pricing.",
        ],
      },
    ],
  },
  {
    slug: "risk-management-around-high-impact-news",
    title: "Beginner Guide to Risk Management Around High-Impact News",
    description: "How to reduce avoidable mistakes before, during, and after volatile economic releases.",
    category: "Risk Management",
    publishedAt: "2026-06-06",
    updatedAt: "2026-06-06",
    readingMinutes: 6,
    relatedLinks: [
      { label: "Check events", href: "/calendar" },
      { label: "Use charts", href: "/charts" },
    ],
    sections: [
      {
        heading: "Volatility is not the same as opportunity",
        body: [
          "High-impact news can create large moves, but that does not make it automatically tradable. Slippage, spread widening, and rapid reversals can turn a normal setup into a poor execution environment. Beginners should treat news risk as a special condition rather than a normal chart pattern.",
          "A common improvement is to define a no-trade window around major releases. Some traders avoid the minutes before and after the headline, then wait for the market to build a new range.",
        ],
      },
      {
        heading: "Size down when uncertainty goes up",
        body: [
          "If you choose to participate, position size should reflect the chance of abnormal execution. Smaller size gives you room to be wrong without turning one event into a major account problem. It also helps you evaluate the market more calmly after the first reaction.",
        ],
      },
      {
        heading: "Journal the process, not only the result",
        body: [
          "After the release, note whether you followed the plan, where spreads widened, whether your entry was late, and how price behaved after the first move. Over time, this shows which events suit your temperament and which ones should be avoided.",
        ],
      },
    ],
  },
  {
    slug: "use-market-heatmaps-without-chasing-moves",
    title: "How to Use Market Heatmaps Without Chasing Moves",
    description: "A heatmap reading process that turns broad market color into context instead of impulsive entries.",
    category: "Market Analysis",
    publishedAt: "2026-06-06",
    updatedAt: "2026-06-06",
    readingMinutes: 5,
    relatedLinks: [
      { label: "Open analysis desk", href: "/analysis" },
      { label: "View charts", href: "/charts" },
    ],
    sections: [
      {
        heading: "Use heatmaps to ask better questions",
        body: [
          "A heatmap shows where money is moving, but it does not explain why by itself. The first question is whether the move is broad or isolated. Broad strength across a sector, currency group, or risk asset basket can signal a macro theme. One bright block may simply reflect a stock-specific headline or short-term imbalance.",
          "Treat the heatmap as a context layer. It should help you decide where to investigate, not replace your trade plan.",
        ],
      },
      {
        heading: "Compare strength with location",
        body: [
          "A strong asset near major resistance may carry different risk from a strong asset breaking out of a multi-day range. Before entering, check whether price has already moved too far from a clean invalidation level. A heatmap can reveal momentum, but the chart still defines risk.",
        ],
      },
      {
        heading: "Look for confirmation across markets",
        body: [
          "For macro products, confirmation matters. If the dollar is strong, check yields and gold. If indices are weak, check volatility and sector breadth. The more pieces line up, the less likely you are reacting to a single noisy print.",
        ],
      },
    ],
  },
  {
    slug: "gold-trading-basics-drivers-sessions-risk-events",
    title: "Gold Trading Basics: Drivers, Sessions, and Risk Events",
    description: "What new XAU/USD traders should know about dollar strength, yields, risk sentiment, and session timing.",
    category: "Gold",
    publishedAt: "2026-06-06",
    updatedAt: "2026-06-06",
    readingMinutes: 6,
    relatedLinks: [
      { label: "Open gold chart", href: "/charts" },
      { label: "Check order flow", href: "/tools" },
    ],
    sections: [
      {
        heading: "Gold is sensitive to the dollar and yields",
        body: [
          "Gold often reacts to the US dollar and real yield expectations. When the dollar strengthens sharply, gold can come under pressure because it becomes more expensive for non-dollar buyers. When yields rise, the opportunity cost of holding a non-yielding asset can increase.",
          "These relationships are not perfect every day. During stress periods, safe-haven demand can support gold even if normal correlations are messy.",
        ],
      },
      {
        heading: "Session timing changes behavior",
        body: [
          "XAU/USD can move during Asia, London, and New York, but the strongest directional moves often appear around major macro releases, US yield moves, and the London-New York overlap. Thin liquidity can exaggerate wicks, so entries need clear invalidation.",
        ],
      },
      {
        heading: "Respect event risk",
        body: [
          "Gold can react violently to CPI, NFP, FOMC decisions, geopolitical headlines, and sudden changes in risk sentiment. Around those windows, smaller size and wider planning assumptions are usually more sensible than assuming normal intraday behavior.",
        ],
      },
    ],
  },
  {
    slug: "trading-psychology-discipline-risk-awareness",
    title: "Trading Psychology: Discipline, Patience, and Risk Awareness",
    description: "An extensive educational guide to behavioral bias, emotional discipline, decision fatigue, overconfidence, loss aversion, and process control.",
    category: "Trading Psychology",
    publishedAt: "2026-06-06",
    updatedAt: "2026-06-06",
    readingMinutes: 14,
    relatedLinks: [
      { label: "Practice academy", href: "/academy" },
      { label: "Read risk guide", href: "/learn/risk-management-around-high-impact-news" },
    ],
    sections: [
      {
        heading: "Why trading psychology matters",
        body: [
          "Trading psychology is the study of how attention, emotion, habit, and bias influence market decisions. It matters because financial markets place people under unusual pressure: prices move quickly, information is incomplete, outcomes are uncertain, and every decision can feel personal. In that environment, a person can understand a concept intellectually and still behave poorly when stress rises.",
          "Behavioral finance research helps explain why this happens. Investor.gov and CFA Institute materials describe common patterns such as overconfidence, loss aversion, regret aversion, herding, self-control problems, and confirmation bias. These are normal human tendencies, not signs that a person is unintelligent. They simply become more costly when money, speed, and uncertainty are combined.",
          "For Financial Vibe, the goal of psychology education is not to teach a secret method or promise better results. The goal is to help users recognize moments when emotion may be taking control, slow down, and protect decision quality. In a risky market environment, avoiding one impulsive mistake can matter as much as finding one good opportunity.",
        ],
      },
      {
        heading: "Psychology starts before any market action",
        body: [
          "Many people think psychology begins after a position is open, when price starts moving against them. In reality, the psychological pattern often begins earlier. It starts when someone sits down without a plan, watches several markets at once, sees a sharp move, and feels pressure to do something before the opportunity disappears.",
          "A prepared routine reduces emotional pressure because it defines what matters before the screen becomes noisy. Before any market action, a trader should know which events are scheduled, which instruments are exposed to those events, what conditions would make the market too risky, and what maximum loss is acceptable. This is not a strategy; it is a safety framework for decision-making.",
          "Preparation also reduces the need for instant judgment. When the calendar, risk limits, and review process are already written down, the trader is less dependent on mood. The market can still be uncertain, but the process becomes more stable.",
        ],
      },
      {
        heading: "Fear of missing out creates low-quality decisions",
        body: [
          "Fear of missing out appears when a trader believes the current move is the only opportunity available. This feeling is strongest during news events, breakouts, social media excitement, and fast candles. It can lead to late entries, larger size than planned, and ignoring the difference between observing a move and having a prepared reason to participate.",
          "FOMO is dangerous because it compresses thinking. Instead of asking whether the risk is acceptable, a person asks whether they can still get in. Instead of reviewing the event, the spread, or the reason for the move, the mind focuses on the discomfort of being left behind. That discomfort can feel urgent, but urgency is not evidence.",
          "A healthier mindset is to treat missed moves as information. If the market moved without you, the lesson is not automatically to chase. It may be to prepare earlier, review the economic calendar, improve alert habits, or accept that some conditions do not fit your process. Markets will continue to create new information, but capital and emotional stability are limited resources.",
        ],
      },
      {
        heading: "Overconfidence can appear after wins, losses, or research",
        body: [
          "Overconfidence is one of the most discussed behavioral-finance biases. In trading, it can appear after a winning streak, after reading a persuasive market view, or after correctly anticipating one event. The mind starts to treat confidence as proof. Risk feels smaller, size can grow, and contradictory information becomes easier to ignore.",
          "Overconfidence can also appear after losses. A frustrated trader may believe they can force the account back to neutral with one larger decision. This is not calm confidence; it is emotional repair-seeking. The trader is no longer evaluating the market on its own terms and is instead trying to erase the discomfort of being wrong.",
          "A practical defense is to separate confidence from permission. Feeling confident should not automatically permit more risk. The risk limit, review process, and decision checklist should remain stable whether the previous outcome was good or bad.",
        ],
      },
      {
        heading: "Loss aversion and the pain of being wrong",
        body: [
          "Loss aversion describes the tendency for losses to feel more painful than equivalent gains feel rewarding. In markets, this can cause people to hold on to poor decisions too long, avoid closing a losing position because doing so makes the loss feel real, or move risk limits after the original reason for the decision has failed.",
          "The emotional pain is understandable, but it can distort judgment. A person may start searching for new reasons to justify the old decision. They may focus only on information that supports a recovery. They may avoid looking at the account or journal because the evidence is uncomfortable.",
          "The healthier process is to define acceptable loss before the decision is made. When the risk boundary is set in advance, closing a poor decision becomes following the plan rather than admitting personal failure. This framing matters. The goal is not to avoid ever being wrong; it is to avoid letting one wrong decision become a larger behavioral problem.",
        ],
      },
      {
        heading: "Regret, revenge, and the urge to repair",
        body: [
          "Regret is powerful because markets make alternative outcomes visible. A trader can see the move they missed, the better exit they could have taken, or the loss that might have been avoided. This can create revenge behavior: taking another decision quickly to repair the emotional discomfort of the last one.",
          "Revenge behavior is not always loud or obvious. Sometimes it looks like taking a lower-quality idea, checking too many instruments, increasing size slightly, or refusing to stop for the day. The common feature is that the next decision is being driven by the previous emotional wound.",
          "A useful rule is to create a pause after any strong emotional response. The pause can be a walk, a written review, or a rule that no new action is allowed immediately after a large win, a loss, or a missed move. The purpose is to make sure the next decision belongs to the current market, not the previous emotion.",
        ],
      },
      {
        heading: "Confirmation bias and selective attention",
        body: [
          "Confirmation bias is the tendency to look for information that supports what we already believe. In a market environment, this can happen quickly. A person forms a view, then gives more weight to headlines, chart readings, or comments that agree with that view while dismissing warning signs.",
          "This bias is especially risky on information-heavy platforms because there is always another piece of data to find. More information does not automatically create better judgment if the trader is only collecting evidence for one side. The better habit is to ask what information would make the view weaker.",
          "A clean review process should include disconfirming evidence. Before any market action, write one reason the view may be wrong, one scheduled event that could change conditions, and one market signal that would require reassessment. This keeps research from becoming emotional defense.",
        ],
      },
      {
        heading: "Herding, social pressure, and borrowed conviction",
        body: [
          "Herding occurs when people follow the crowd because the crowd itself feels like evidence. In trading, this can happen through social media, chat rooms, analyst clips, headline momentum, or seeing many people discuss the same asset. The danger is borrowed conviction: feeling confident because others sound confident.",
          "Community and analyst commentary can be useful for learning, but it should not replace independent risk thinking. A user still needs to know why the information matters, what could make it wrong, and what risk is acceptable. If the only reason for interest is that many people are talking about it, the decision may be socially driven rather than process-driven.",
          "A good community habit is to treat other views as prompts for research, not as instructions. Ask what data supports the view, what event could challenge it, and whether the risk fits your own situation. That keeps discussion educational rather than promotional.",
        ],
      },
      {
        heading: "Recency bias and the danger of the last thing seen",
        body: [
          "Recency bias is the tendency to give too much weight to the most recent event. After a strong trend day, a trader may expect trend conditions to continue. After a choppy session, they may assume every move will fail. After one news release creates a large move, they may expect the next release to behave the same way.",
          "Recent information matters, but it should not erase broader context. The calendar, liquidity conditions, higher-timeframe market structure, and current macro theme all help prevent the last candle from becoming the entire story.",
          "One practical habit is to review multiple time horizons before making conclusions: the current session, the previous session, the week, and the scheduled events ahead. This does not create certainty, but it reduces the chance that the most recent emotion becomes the whole analysis.",
        ],
      },
      {
        heading: "Decision fatigue changes behavior",
        body: [
          "Decision fatigue happens when attention becomes worn down by repeated choices. Long screen time, constant scanning, multiple open tabs, alerts, social media, and fast price movement all consume mental energy. After enough exposure, weak ideas can begin to look acceptable simply because the mind wants closure.",
          "Fatigue can show up as impatience, lower standards, repeated checking, difficulty stopping, or taking action just to end uncertainty. Many traders do not notice fatigue until after the poor decision has already happened.",
          "Build breaks into the routine. Step away after major news, after a loss, after a strong emotional reaction, or after a fixed review period. Rest is not laziness in a risk environment; it is part of maintaining judgment.",
        ],
      },
      {
        heading: "Process beats prediction",
        body: [
          "A psychology-first routine does not try to predict every market move. It focuses on the quality of decisions under uncertainty. That means asking whether the action was planned, whether risk was defined, whether information was verified, and whether emotion pushed the person outside normal limits.",
          "This distinction is important because outcomes can be misleading. A poor decision can make money, and a careful decision can lose money. If a trader judges only the result, they may reward impulsive behavior after a lucky win or abandon good risk habits after a normal loss.",
          "Process review protects against that confusion. It asks: did I prepare, did I follow my limits, did I respect event risk, did I pause when emotional, and did I record the decision honestly?",
        ],
      },
      {
        heading: "A journal turns emotion into evidence",
        body: [
          "The point of a trading journal is not only to record profit and loss. It should capture emotional state, preparation quality, rule-following, and whether the decision matched the plan. Over time, these notes reveal repeated patterns: trading too close to news, entering after missed moves, oversizing after losses, or ignoring fatigue.",
          "Psychology improves when vague feelings become visible evidence. Once a pattern is visible, it can be managed with practical rules: shorter sessions, smaller size, a no-action window after emotional events, or a checklist before any market decision.",
          "A clean journal entry should be short enough to complete consistently. Record the date, market, scheduled events, reason for attention, emotional state, risk boundary, action taken or avoided, and one lesson. The goal is not perfection; it is honest feedback.",
        ],
      },
      {
        heading: "A simple self-control checklist",
        body: [
          "Before taking any market action, ask five questions. Am I acting from preparation or from urgency? Is there a scheduled event that changes risk? Have I defined the maximum acceptable loss? What information would prove this view weak? Am I tired, angry, excited, or trying to repair a previous decision?",
          "If any answer is unclear, the safest educational response is to pause and review. This is not because pausing predicts a better market outcome. It is because unclear thinking and financial risk are a poor combination.",
        ],
      },
      {
        heading: "Final thought: discipline is protective, not restrictive",
        body: [
          "Discipline is sometimes misunderstood as forcing yourself to act with no emotion. A better definition is protecting your future choices. Discipline helps a trader avoid decisions made from panic, excitement, regret, or social pressure. It keeps one moment from controlling the entire account.",
          "The most valuable psychological skill is not confidence. It is self-awareness under uncertainty. When a person can notice their emotional state, respect risk, and pause before acting, they give themselves a better chance to learn from markets without being ruled by them.",
        ],
      },
    ],
    checklist: [
      "Write the reason for attention before considering action.",
      "Define acceptable risk before the market moves quickly.",
      "Pause after strong emotions, wins, losses, or missed moves.",
      "Record whether the decision followed the plan, not only whether it made money.",
      "Review emotional patterns weekly and adjust routines conservatively.",
    ],
  },
  {
    slug: "trading-journal-checklist-new-macro-traders",
    title: "Trading Journal Checklist for New Macro Traders",
    description: "A repeatable journal structure for improving decisions across calendar events, charts, and risk management.",
    category: "Trading Process",
    publishedAt: "2026-06-06",
    updatedAt: "2026-06-06",
    readingMinutes: 5,
    relatedLinks: [
      { label: "Practice academy", href: "/academy" },
      { label: "Open calendar", href: "/calendar" },
    ],
    sections: [
      {
        heading: "Journal the setup before the trade",
        body: [
          "A useful journal starts before entry. Write down the market theme, the event risk, the level you are trading around, and the reason the trade is worth taking. This turns the trade from a reaction into a documented decision.",
          "If you cannot describe the setup in a few sentences, the idea may not be ready. Clarity before the trade makes review after the trade much easier.",
        ],
      },
      {
        heading: "Record execution quality",
        body: [
          "After the trade, record whether you followed the plan, entered late, moved a stop, oversized, or ignored a scheduled event. These notes often reveal more than the profit or loss. A losing trade can be good process, and a winning trade can still be poor behavior.",
        ],
      },
      {
        heading: "Review patterns weekly",
        body: [
          "At the end of the week, look for repeated mistakes and repeated strengths. You may discover that certain sessions, assets, or news events suit you better. The goal is to trade the conditions where your process is most reliable.",
        ],
      },
    ],
    checklist: [
      "Market theme and active session.",
      "Upcoming high-impact events.",
      "Entry reason, invalidation, and target logic.",
      "Execution notes and emotional state.",
      "One process improvement for next week.",
    ],
  },
];

export const getLearnArticle = (slug: string) => learnArticles.find((article) => article.slug === slug);
