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
  {
    slug: "interest-rates-central-banks-forex-markets",
    title: "How Interest Rates and Central Banks Move Forex Markets",
    description: "A beginner-practical guide to policy rates, central bank guidance, inflation mandates, and why currencies react to changes in expected rate paths.",
    category: "Macro Drivers",
    publishedAt: "2026-06-08",
    updatedAt: "2026-06-08",
    readingMinutes: 9,
    relatedLinks: [
      { label: "Open economic calendar", href: "/calendar" },
      { label: "Read CPI guide", href: "/learn/cpi-core-inflation-market-reaction" },
      { label: "View market charts", href: "/charts" },
    ],
    sections: [
      {
        heading: "Why rates sit at the center of macro trading",
        body: [
          "Interest rates matter because they shape the return investors can earn for holding money in one currency instead of another. When traders compare currencies, they are often comparing expected policy paths: which central bank may keep rates higher, cut earlier, or signal more caution about inflation and growth.",
          "The Federal Reserve frames its policy around maximum employment and stable prices, while the European Central Bank emphasizes price stability for the euro area. Those mandates are not trading signals by themselves, but they explain why inflation, labor data, growth, and central bank language can quickly change currency pricing.",
          "For a retail trader, the useful lesson is simple: a currency often moves before the policy rate actually changes. Markets reprice when expectations change, not only when the decision is announced.",
        ],
      },
      {
        heading: "Policy rates versus rate expectations",
        body: [
          "A policy rate is the official short-term rate target or facility rate controlled by a central bank. Rate expectations are what markets believe that central bank may do next. Forex reactions usually depend more on the surprise in expectations than on the headline decision alone.",
          "If a rate hike is fully expected, the currency may not rally on the announcement. If the central bank sounds less confident about future hikes, the currency can weaken even after a hike. The opposite can also happen: a central bank may leave rates unchanged, but hawkish language can support the currency if traders expected a softer tone.",
        ],
      },
      {
        heading: "Guidance can move markets as much as the decision",
        body: [
          "Central banks communicate through statements, press conferences, projections, meeting minutes, and speeches. Traders read this guidance for clues about the balance of risks. Words like persistent inflation, restrictive policy, labor-market cooling, or downside growth risk can shift expectations for future meetings.",
          "The market response depends on the gap between the message and the prior consensus. A statement that sounds hawkish in isolation may still disappoint if traders expected an even stronger inflation warning. This is why preparation before the release matters more than reacting to one phrase after the fact.",
        ],
      },
      {
        heading: "Inflation mandates explain why data matters",
        body: [
          "Central banks care about inflation because stable prices support household planning, business investment, and long-term borrowing decisions. When inflation runs above target, policymakers may keep policy restrictive. When inflation cools convincingly, markets may begin to price lower future rates.",
          "Forex traders should connect inflation data to the policy path. A strong CPI print can support the currency if it makes rate cuts less likely. A weak inflation print can pressure the currency if it encourages easier policy. The effect is strongest when the data changes the market's view of what the central bank will do next.",
        ],
      },
      {
        heading: "Relative policy matters more than one country alone",
        body: [
          "Currencies trade in pairs, so the question is rarely only whether one central bank is hawkish. EUR/USD reflects both the euro-area and US policy stories. GBP/JPY reflects the Bank of England story against the Bank of Japan story. A currency can look strong domestically but still weaken if the other side of the pair has the stronger repricing.",
          "A practical macro routine compares both sides of the pair: inflation trend, labor data, growth conditions, central bank tone, and market expectations. This prevents the common mistake of studying only the currency you want to buy or sell.",
        ],
      },
      {
        heading: "How to prepare for a central bank event",
        body: [
          "Before a rate decision, write down the expected decision, the market's focus, the most exposed currency pairs, and the risk window. Decide whether you are observing, standing aside, or waiting for post-event structure. The goal is to avoid making the first volatile move your entire plan.",
          "After the event, separate the decision from the message. Ask whether the statement, projections, vote split, or press conference changed the next-meeting path. Then compare that shift with the chart and with cross-market confirmation from yields, gold, and equity risk sentiment.",
        ],
      },
    ],
    checklist: [
      "Identify the expected central bank decision before the event.",
      "Compare the policy path on both sides of the currency pair.",
      "Read the guidance, projections, and press-conference tone, not only the headline rate.",
      "Watch whether yields confirm the currency reaction.",
      "Treat central bank events as risk windows, not automatic trade signals.",
    ],
  },
  {
    slug: "cpi-core-inflation-market-reaction",
    title: "CPI, Core Inflation, and Why Inflation Surprises Move Markets",
    description: "How headline CPI, core inflation, consensus expectations, yields, the dollar, and gold fit into a practical news-preparation routine.",
    category: "Inflation",
    publishedAt: "2026-06-08",
    updatedAt: "2026-06-08",
    readingMinutes: 9,
    relatedLinks: [
      { label: "Open live calendar", href: "/calendar" },
      { label: "Read central bank guide", href: "/learn/interest-rates-central-banks-forex-markets" },
      { label: "Read news risk guide", href: "/learn/risk-management-around-high-impact-news" },
    ],
    sections: [
      {
        heading: "What CPI measures",
        body: [
          "The Consumer Price Index tracks the average change over time in prices paid by consumers for a representative basket of goods and services. In plain language, it is one of the main ways markets measure consumer inflation pressure.",
          "The headline CPI number includes broad consumer prices, while core CPI removes food and energy because those categories can be volatile. Both can matter. Headline inflation affects households directly, but core inflation is often watched for the underlying trend that may influence central bank policy.",
        ],
      },
      {
        heading: "Why the surprise matters more than the number alone",
        body: [
          "Markets usually react to the difference between the actual release and consensus expectations. A 0.3 percent monthly reading can be bullish, bearish, or neutral depending on what traders expected and what the recent inflation trend looked like before the release.",
          "The prior reading also matters. If inflation has been cooling for several months, one firm print may be treated as noise or as a warning depending on the details. If inflation has already been sticky, the same print may reinforce a higher-for-longer policy narrative.",
        ],
      },
      {
        heading: "How CPI connects to rates and yields",
        body: [
          "Inflation data matters to forex because it can change expected central bank policy. If CPI is stronger than expected, traders may price a lower chance of near-term rate cuts or a higher chance of restrictive policy lasting longer. Bond yields may rise as the market adjusts.",
          "Currency reactions are often cleaner when yields move in the same direction as the inflation surprise. For example, a hotter US CPI print with rising US yields can support the dollar. If yields do not confirm the headline, the currency reaction may be less reliable or more short-lived.",
        ],
      },
      {
        heading: "Dollar and gold reactions are not automatic",
        body: [
          "A stronger CPI print can support the dollar when it pushes US rate expectations higher. Gold can come under pressure if the dollar and real-yield expectations rise. But this is a relationship, not a guarantee. Risk sentiment, positioning, and the details inside the report can change the response.",
          "Gold traders should be especially careful around CPI because the first move can be fast and spreads can widen. A practical approach is to mark nearby levels before the release, then wait to see whether price accepts or rejects the first reaction zone.",
        ],
      },
      {
        heading: "Look inside the inflation report",
        body: [
          "The market may focus on different components at different times. Shelter inflation, services inflation, goods prices, energy, and food can each carry different policy implications. When traders say the details matter, they mean the headline number may hide where inflation pressure is actually coming from.",
          "For beginners, the goal is not to memorize every component. The goal is to know whether the report supports the current market theme. If the market is worried about sticky services inflation, a soft energy number may not be enough to calm rate expectations.",
        ],
      },
      {
        heading: "Build a CPI preparation routine",
        body: [
          "Before CPI, record the release time, consensus, previous reading, active session, and most exposed markets. Write down the question the market is asking: is inflation cooling enough for cuts, or is it staying too firm for comfort?",
          "After CPI, compare actual versus forecast, check whether yields confirm the move, and wait for the chart to form a tradable structure. The release tells you new information. It does not require immediate action.",
        ],
      },
    ],
    checklist: [
      "Check headline CPI, core CPI, forecast, and previous reading.",
      "Identify the inflation theme the market cared about before the release.",
      "Watch yields and the dollar for confirmation.",
      "Treat gold reactions carefully because first moves can reverse.",
      "Wait for post-release structure instead of chasing the first candle.",
    ],
  },
  {
    slug: "nfp-unemployment-wage-growth-labor-data",
    title: "NFP, Unemployment, and Wage Growth: Reading Labor Market Data",
    description: "A practical guide to nonfarm payrolls, unemployment, participation, wage growth, revisions, and why labor data can reshape rate expectations.",
    category: "Labor Market",
    publishedAt: "2026-06-08",
    updatedAt: "2026-06-08",
    readingMinutes: 9,
    relatedLinks: [
      { label: "Open economic calendar", href: "/calendar" },
      { label: "Read central bank guide", href: "/learn/interest-rates-central-banks-forex-markets" },
      { label: "Practice academy", href: "/academy" },
    ],
    sections: [
      {
        heading: "Why the labor market moves macro assets",
        body: [
          "Labor data matters because employment connects directly to income, spending, inflation pressure, and central bank policy. A strong labor market can support growth and household demand. A weakening labor market can raise concerns that the economy is slowing too quickly.",
          "For the Federal Reserve, employment is part of the policy mandate alongside stable prices. That is why payrolls, unemployment, wages, and participation can move the dollar, yields, gold, equities, and risk sentiment in the same release window.",
        ],
      },
      {
        heading: "What NFP actually refers to",
        body: [
          "Nonfarm payrolls estimate the change in paid employees on nonfarm business and government payrolls. It excludes categories such as farm workers and some private household workers. Markets watch it because it gives a broad read on job creation in the US economy.",
          "The headline payroll number is important, but it is not the entire report. The unemployment rate, average hourly earnings, labor force participation, and revisions to prior months can all change the interpretation.",
        ],
      },
      {
        heading: "Unemployment and participation add context",
        body: [
          "The unemployment rate can rise because more people lost jobs, but it can also move when more people enter the labor force and start looking for work. That is why participation matters. A labor report can look weaker or stronger depending on what is happening beneath the headline.",
          "For traders, the question is whether the labor market is tight enough to keep wage pressure and inflation risk alive, or soft enough to make easier policy more likely. The same payroll number can produce different reactions in different policy environments.",
        ],
      },
      {
        heading: "Wage growth can be the hidden driver",
        body: [
          "Average hourly earnings are watched because wage growth can influence inflation pressure, especially when service-sector inflation is a market concern. A strong payroll number with soft wages may be read differently from a moderate payroll number with hot wage growth.",
          "When inflation is the dominant theme, wage data can sometimes matter as much as job creation. If wages suggest persistent pressure, traders may price a more cautious central bank even if other parts of the report are mixed.",
        ],
      },
      {
        heading: "Revisions can change the story",
        body: [
          "Labor reports are revised as more complete data becomes available. A current payroll number may look strong, but large downward revisions to prior months can make the trend look less impressive. Upward revisions can do the opposite.",
          "A practical release review should compare the current number with both the forecast and the revised trend. Markets often respond to whether the labor market is accelerating, cooling gradually, or weakening suddenly.",
        ],
      },
      {
        heading: "How to trade the information without chasing it",
        body: [
          "Before NFP, mark the consensus, prior readings, exposed markets, and active session. Decide whether the event is too volatile for your process. NFP often creates fast first moves, sharp reversals, and temporary spread widening.",
          "After the release, summarize the report in one sentence before looking for action. For example: strong jobs, firm wages, low unemployment, yields rising. That summary keeps you focused on the macro message instead of reacting emotionally to the candle.",
        ],
      },
    ],
    checklist: [
      "Compare payrolls with forecast and prior revisions.",
      "Read unemployment together with labor force participation.",
      "Check average hourly earnings for wage-pressure clues.",
      "Watch yields and USD pairs for confirmation.",
      "Avoid treating the headline payroll number as the whole report.",
    ],
  },
  {
    slug: "gdp-growth-recession-risk-macro-traders",
    title: "GDP, Growth, and Recession Risk for Macro Traders",
    description: "How real GDP, consumption, investment, trade, revisions, and recession narratives help traders understand growth-sensitive markets.",
    category: "Growth",
    publishedAt: "2026-06-08",
    updatedAt: "2026-06-08",
    readingMinutes: 8,
    relatedLinks: [
      { label: "Open market analysis", href: "/analysis" },
      { label: "Open economic calendar", href: "/calendar" },
      { label: "Read journal checklist", href: "/learn/trading-journal-checklist-new-macro-traders" },
    ],
    sections: [
      {
        heading: "What GDP tells traders",
        body: [
          "Gross domestic product measures the value of final goods and services produced in an economy. Real GDP adjusts for inflation, making it a cleaner way to judge whether economic activity is expanding or contracting.",
          "For traders, GDP is not a short-term signal by itself. It is a broad context tool. It helps explain whether markets are pricing resilience, slowdown, recession risk, or a soft landing. That context can shape currencies, yields, equities, commodities, and gold.",
        ],
      },
      {
        heading: "Growth is made of several parts",
        body: [
          "GDP includes components such as consumer spending, business investment, government spending, inventories, exports, and imports. The headline number can hide very different underlying stories. Growth driven by strong consumer demand may be read differently from growth driven by inventories or volatile trade swings.",
          "Personal consumption is especially important in the US because household spending is a major part of economic activity. If consumption weakens, traders may become more sensitive to recession risk, earnings pressure, and future rate cuts.",
        ],
      },
      {
        heading: "Revisions are part of the process",
        body: [
          "GDP is released in estimates that can be revised as more complete data arrives. A first estimate gives an early picture, but later revisions can change the growth narrative. Traders should avoid treating one GDP print as final truth.",
          "The direction of revisions matters. Upward revisions can support a resilience story. Downward revisions can make prior optimism look less secure. The market reaction depends on whether the revision changes expectations for policy, profits, or recession risk.",
        ],
      },
      {
        heading: "Soft landing versus recession narratives",
        body: [
          "A soft landing describes an economy that slows enough to reduce inflation pressure without a severe rise in unemployment or a deep contraction. Markets often like this combination because it can support risk assets while allowing central banks to become less restrictive.",
          "A recession-risk narrative is different. Weak growth, weaker labor data, falling confidence, and tighter credit conditions can push traders toward defensive positioning. In that environment, rate-cut expectations may rise, but risk assets may not automatically benefit if cuts are being priced because growth is deteriorating.",
        ],
      },
      {
        heading: "How currencies react to growth",
        body: [
          "A currency can benefit from strong growth when that growth supports higher yields and a more confident central bank. But if growth is too hot and inflation rises, the reaction may depend on whether the central bank is behind the curve. If growth weakens sharply, the currency may suffer as markets price easier policy or lower confidence.",
          "Always compare growth across both sides of a currency pair. A weak GDP report may not weaken a currency much if the other economy looks worse or if the data was already expected.",
        ],
      },
      {
        heading: "Use GDP as a background map",
        body: [
          "GDP is usually less explosive than CPI or NFP at the moment of release, but it can anchor the bigger macro story. Use it to understand whether market debates are about inflation, growth, recession, or policy timing.",
          "A practical routine is to write one growth sentence each week: growth is resilient, slowing, contracting, or mixed. Then connect that sentence to the calendar events ahead and the assets most likely to respond.",
        ],
      },
    ],
    checklist: [
      "Read real GDP, not only nominal growth.",
      "Check whether consumption, investment, trade, or inventories drove the headline.",
      "Look for revisions that change the trend.",
      "Separate soft-landing optimism from recession-risk pricing.",
      "Compare growth stories across both currencies in a pair.",
    ],
  },
  {
    slug: "bond-yields-risk-sentiment-dollar-gold",
    title: "Bond Yields, Risk Sentiment, and the Dollar-Gold Connection",
    description: "A cross-market guide to Treasury yields, real-yield thinking, risk-on and risk-off behavior, USD, gold, equities, and confirmation across markets.",
    category: "Cross-Market Analysis",
    publishedAt: "2026-06-08",
    updatedAt: "2026-06-08",
    readingMinutes: 10,
    relatedLinks: [
      { label: "Open charts", href: "/charts" },
      { label: "Open analysis desk", href: "/analysis" },
      { label: "Read gold basics", href: "/learn/gold-trading-basics-drivers-sessions-risk-events" },
    ],
    sections: [
      {
        heading: "Why yields matter outside the bond market",
        body: [
          "Bond yields influence the relative appeal of currencies, equities, gold, and other assets. When yields rise because markets expect tighter policy or stronger growth, the dollar can find support and gold can face pressure. When yields fall because growth fear is rising, the reaction can be more defensive and less straightforward.",
          "Yields are not just another chart. They are a macro price that reflects expectations about policy, inflation, growth, and risk. That makes them useful confirmation for traders who want to understand whether a currency or gold move has broader support.",
        ],
      },
      {
        heading: "Nominal yields and real-yield thinking",
        body: [
          "A nominal yield is the stated yield on a bond. Real-yield thinking adjusts that idea for inflation expectations. Gold traders often care about real yields because gold does not pay income. When inflation-adjusted return expectations rise, holding gold can become less attractive.",
          "Retail traders do not need to calculate every real-yield measure intraday. The practical point is to watch whether yields are rising because policy expectations are becoming more restrictive, and whether gold is confirming or rejecting that pressure.",
        ],
      },
      {
        heading: "Risk-on and risk-off are market conditions, not slogans",
        body: [
          "Risk-on describes conditions where traders are more willing to hold growth-sensitive or higher-risk assets. Risk-off describes conditions where capital moves toward perceived safety, liquidity, or defensive exposure. These regimes can affect equities, the dollar, yen, franc, gold, and commodity currencies.",
          "The mistake is assuming every risk-off day looks the same. Sometimes the dollar and gold can both rise during stress. Sometimes gold lags if yields are rising sharply. Sometimes equities fall while the dollar response is muted because the catalyst is not US-centered.",
        ],
      },
      {
        heading: "The dollar-gold relationship",
        body: [
          "Gold is priced globally in dollars, so dollar strength can pressure XAU/USD by making gold more expensive for non-dollar buyers. Higher yields can add pressure when they increase the opportunity cost of holding a non-yielding asset.",
          "That relationship can break down during stress. If investors seek safety, gold may rise even when the dollar is firm. The job of cross-market analysis is not to force one rule onto every session, but to identify which driver is dominant today.",
        ],
      },
      {
        heading: "Use confirmation across markets",
        body: [
          "A macro move is usually more reliable when related markets confirm it. If the dollar is rallying after hot inflation data, check whether yields are rising and gold is under pressure. If equities are selling off on growth fear, check whether yields are falling and defensive currencies are responding.",
          "Confirmation does not remove risk, but it helps separate broad macro repricing from isolated noise. A move that appears in only one market may still matter, but it deserves more caution.",
        ],
      },
      {
        heading: "Know which catalyst is in control",
        body: [
          "The same asset can react differently depending on the catalyst. Rising yields from strong growth may support risk appetite. Rising yields from sticky inflation may pressure equities. Falling yields from friendly inflation can support risk assets, while falling yields from recession fear can hurt them.",
          "Before using cross-market signals, name the driver: inflation, central bank policy, growth, liquidity stress, geopolitical risk, or positioning. That one sentence keeps analysis from becoming a random collection of charts.",
        ],
      },
      {
        heading: "Build a simple cross-market dashboard",
        body: [
          "A practical dashboard can include the dollar index, major USD pairs, gold, Treasury yields, major equity indices, and the economic calendar. The point is not to watch everything all day. The point is to check whether the market is telling one consistent story.",
          "After a major event, write down what confirmed and what did not. If CPI is hot but yields fade and gold recovers, that is different from a hot CPI print with yields rising, USD strength broadening, and gold breaking lower. Context turns color on a screen into a usable market read.",
        ],
      },
    ],
    checklist: [
      "Check whether yields confirm the currency or gold move.",
      "Separate inflation-driven yield moves from growth-driven yield moves.",
      "Watch USD and gold together, but do not assume a fixed inverse relationship.",
      "Compare equities, yields, dollar, and gold after major events.",
      "Name the dominant catalyst before forming a market view.",
    ],
  },
];

export const getLearnArticle = (slug: string) => learnArticles.find((article) => article.slug === slug);
