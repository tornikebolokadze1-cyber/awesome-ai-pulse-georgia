<p align="center">
  <img src="assets/banner.svg" alt="Awesome AI Pulse Georgia" width="100%"/>
</p>

<h1 align="center">Awesome AI Pulse Georgia</h1>

<p align="center">
  <b>AI აგენტების, დეველოპერ ინსტრუმენტებისა და ავტომატიზაციის კურირებული კოლექცია</b><br/>
  შერჩეული <a href="https://aipulsegeorgia.ge">AI Pulse Georgia</a>-ს მიერ
</p>

<p align="center">
  <a href="https://awesome.re"><img src="https://awesome.re/badge.svg" alt="Awesome"/></a>
  <img src="https://img.shields.io/badge/repos-70-00D0FF?style=flat-square&labelColor=111827" alt="Repos"/>
  <img src="https://img.shields.io/badge/categories-9-A949DA?style=flat-square&labelColor=111827" alt="Categories"/>
  <img src="https://img.shields.io/badge/made_in-Georgia_%F0%9F%87%AC%F0%9F%87%AA-00D0FF?style=flat-square&labelColor=111827" alt="Made in Georgia"/>
  <a href="https://aipulsegeorgia.ge"><img src="https://img.shields.io/badge/aipulsegeorgia.ge-website-A949DA?style=flat-square&labelColor=111827" alt="Website"/></a>
</p>

<p align="center"><i>A curated collection of AI agent frameworks, developer tools, and automation resources — by AI Pulse Georgia</i></p>

---

## სარჩევი

- [AI აგენტები და ორკესტრაცია](#ai-აგენტები-და-ორკესტრაცია)
- [Claude Code ეკოსისტემა](#claude-code-ეკოსისტემა)
- [MCP — პლატფორმები და ინტეგრაციები](#mcp--პლატფორმები-და-ინტეგრაციები)
- [ვებ სკრეიპინგი და მონაცემთა მოპოვება](#ვებ-სკრეიპინგი-და-მონაცემთა-მოპოვება)
- [ძიება და კვლევა](#ძიება-და-კვლევა)
- [მეხსიერება და RAG](#მეხსიერება-და-rag)
- [პროდუქტიულობა და ავტომატიზაცია](#პროდუქტიულობა-და-ავტომატიზაცია)
- [AI კვლევა](#ai-კვლევა)
- [რესურსები და რეფერენსები](#რესურსები-და-რეფერენსები)

---

## AI აგენტები და ორკესტრაცია

| რეპოზიტორია | ⭐ | აღწერა |
|---|---|---|
| [OpenClaw](https://github.com/openclaw/openclaw) | 347K | პირადი AI ასისტენტი ნებისმიერ მოწყობილობაზე. 20+ არხზე პასუხობს (WhatsApp, Telegram, Slack, Discord, iMessage), აქვს ხმოვანი ინტერფეისი და ცოცხალი Canvas. Local-first დიზაინი და მულტი-აგენტ routing. |
| [MiroFish](https://github.com/666ghj/MiroFish) | 49K | Swarm Intelligence ძრავი — ათასობით AI აგენტის სიმულაცია რეალური მონაცემებით პროგნოზირებისთვის. აგენტებს აქვთ ინდივიდუალური პიროვნებები და გრძელვადიანი მეხსიერება. Docker-ით განლაგება. |
| [Paperclip](https://github.com/paperclipai/paperclip) | 46K | AI აგენტების პლატფორმა ბიზნესის ავტონომიურად წარმართვისთვის. აგენტების გუნდს ორკესტრირებს — org chart, ბიუჯეტი, governance და audit log ერთიან დაფაზე. |
| [Hermes](https://github.com/nousresearch/hermes-agent) | 24K | Nous Research-ის თვითგანვითარებადი AI აგენტი ჩაშენებული სწავლის ციკლით. ქმნის უნარებს გამოცდილებიდან, ინახავს მეხსიერებას სესიებს შორის. მხარს უჭერს Telegram, Discord, Slack, WhatsApp და cron ავტომატიზაციას. |
| [OpenSpace](https://github.com/HKUDS/OpenSpace) | 3.9K | აგენტების თვითგანვითარების ფრეიმვორკი — AUTO-FIX, AUTO-IMPROVE, AUTO-LEARN. აგენტები ერთმანეთს უზიარებენ ნასწავლ უნარებს. მუშაობს Claude Code-თან, Codex-თან, OpenClaw-თან. |
| [nanobot](https://github.com/HKUDS/nanobot) | 38K | HKUDS-ის ულტრა-მსუბუქი პერსონალური AI აგენტი. მინიმალური resources, მაქსიმალური შესაძლებლობები — 38K ვარსკვლავი ერთ კვარტალში. ერთ-ერთი ყველაზე სწრაფად მზარდი აგენტი 2026 წელს. |
| [Goose](https://github.com/block/goose) | 38K | Block-ის (Square და Cash App-ის შემქმნელი) extensible AI აგენტი. სცდება კოდის შემოთავაზებებს — ინსტალირებს, ასრულებს, არედაქტირებს და ტესტავს. მუშაობს ნებისმიერ LLM-თან. |
| [Mastra](https://github.com/mastra-ai/mastra) | 23K | TypeScript ფრეიმვორკი AI აპლიკაციებისა და აგენტებისთვის (Gatsby-ის გუნდისგან). ჩაშენებული workflows, RAG, evals და agent primitives — სრული toolkit თანამედროვე TypeScript stack-ში. |
| [Agent-Reach](https://github.com/Panniantong/Agent-Reach) | 16K | AI აგენტს „თვალებს" აძლევს ინტერნეტში — Twitter, Reddit, YouTube, GitHub, Bilibili, XiaoHongShu და სხვა პლატფორმების წაკითხვა და ძიება ერთიანი ინტერფეისით. |

## Claude Code ეკოსისტემა

| რეპოზიტორია | ⭐ | აღწერა |
|---|---|---|
| [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) | 136K | Claude Code-ის ყოვლისმომცველი რესურსებისა და ოპტიმიზაციის სისტემა — უნარები, ინსტინქტები, მეხსიერების ოპტიმიზაცია, უსაფრთხოების სკანირება. npm პაკეტები და GitHub აპლიკაცია. |
| [Superpowers](https://github.com/obra/superpowers) | 134K | კომპოზირებადი workflow ფრეიმვორკი AI კოდის აგენტებისთვის. სპეციფიკაციაზე დაფუძნებული დეველოპმენტი, TDD, debugging, brainstorming და პარალელური ქვე-აგენტების დისპეტჩერიზაცია. |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | 58K | UI/UX დიზაინის ინტელექტი AI კოდის აგენტებისთვის — 161 მსჯელობის წესი, 67 UI სტილი და მრავალი ფრეიმვორკის მხარდაჭერა. |
| [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done) | 47K | მეტა-პრომპტინგის და კონტექსტის ინჟინერიის სისტემა. აგვარებს „context rot"-ს — ხარისხის გაუარესებას კონტექსტის ფანჯრის შევსებისას. მუშაობს Claude Code, Codex, Cursor, Gemini CLI-სთან. |
| [Oh My ClaudeCode](https://github.com/yeachan-heo/oh-my-claudecode) | 23K | მრავალაგენტური ორკესტრაციის პლაგინი — autopilot (5-ფაზიანი pipeline), team (პარალელური აგენტები), ralph (ვერიფიკაციამდე მუშაობს) და ultrawork (მაქსიმალური პარალელიზმი) რეჟიმები. |
| [Obsidian Skills](https://github.com/kepano/obsidian-skills) | 19K | Obsidian vault-ებთან სამუშაო უნარები — Markdown, Bases და JSON Canvas ფაილების წაკითხვა, ჩაწერა და ძიება. Claude Code-თან და Codex CLI-თან თავსებადი. |
| [Codex Plugin](https://github.com/openai/codex-plugin-cc) | 11K | OpenAI-ს ოფიციალური პლაგინი Claude Code-ისთვის — Codex აგენტს კოდის მიმოხილვისა და დავალებების დელეგირების საშუალებას აძლევს. /codex:review, /codex:rescue ბრძანებები. |
| [n8n Skills](https://github.com/czlonkowski/n8n-skills) | 4K | 7 ურთიერთშემავსებელი უნარი n8n workflow-ების ასაწყობად. ასწავლის AI ასისტენტებს MCP ინსტრუმენტების სწორ გამოყენებას და workflow პატერნების შერჩევას. თანმხლები: [n8n-MCP](https://github.com/czlonkowski/n8n-mcp). |
| [Claude Code Setup](https://github.com/tornikebolokadze1-cyber/claude-code-setup) | 9 | Claude Code-ის პროდაქშენ-დონის კონფიგურაციის სისტემა — უსაფრთხოების წესები, ავტომატური hooks და /setup ბრძანება ახალი პროექტებისთვის. Made in Georgia 🇬🇪. |
| [Georgian Payments Skills](https://github.com/erekle1/georgian-payments-skills) | 2 | ქართული ბანკების API უნარები — TBC Bank (Checkout, TPay, XML Billing) და Bank of Georgia (iPay, Installments, Open Banking PSD2). AI კოდის ასისტენტებისთვის ექსპერტ-დონის ცოდნა. Made in Georgia 🇬🇪. |
| [Taskmaster](https://github.com/eyaltoledano/claude-task-master) | 26K | AI-ზე დაფუძნებული ამოცანების მართვის სისტემა — პროექტის დაგეგმვა, ამოცანების ავტომატური დაშლა ქვე-ამოცანებად, პრიორიტეტების მართვა და დამოკიდებულებების თვალყურის დევნება. მუშაობს Cursor-ში, Windsurf-ში, Claude Code-ში და სხვა AI ჩატებში. MCP სერვერითაც და CLI-ითაც ხელმისაწვდომია. |
| [GitNexus](https://github.com/abhigyanpatwari/GitNexus) | 23K | კოდის ინტელექტის ძრავა ნულოვანი სერვერით — GitHub რეპო ან ZIP ფაილი ჩააგდე ბრაუზერში და მიიღე ინტერაქტიული ცოდნის გრაფი ყველა დამოკიდებულებით, გამოძახების ჯაჭვითა და ექსეკუციის ნაკადით. ჩაშენებული Graph RAG აგენტი AI ასისტენტებს კოდის სრულ კონტექსტს აწვდის. |
| [opencode](https://github.com/anomalyco/opencode) | 138K | ღია კოდის coding agent — Claude Code-ის და Cursor-ის ალტერნატივა CLI ფორმატში. 15K+ fork, ერთ-ერთი ყველაზე პოპულარული ღია AI კოდინგ ხელსაწყო GitHub-ზე. |
| [OpenClaude](https://github.com/Gitlawb/openclaude) | 18K | ღია კოდის coding-agent CLI — OpenAI, Gemini, DeepSeek, Ollama, Codex, GitHub Models და 200+ მოდელი ერთ ტერმინალში. OpenAI-თავსებადი API-ებით მუშაობს, აქვს slash ბრძანებები, MCP მხარდაჭერა, streaming output და VS Code გაფართოება. (არ აერიოს OpenClaw-ში — სრულიად სხვა პროექტია). |
| [Kilocode](https://github.com/kilo-org/kilocode) | 18K | All-in-one agentic engineering პლატფორმა და VS Code extension. #1 coding agent OpenRouter-ზე, 1.5M+ მომხმარებელი, 25T+ tokens დამუშავებული. ბუნებრივი ენით კოდი, თვით-ვერიფიკაცია, ტერმინალის ბრძანებები, ბრაუზერის ავტომატიზაცია, inline autocomplete და 500+ მოდელის მხარდაჭერა (Gemini, Claude, GPT). |
| [Claw Code](https://github.com/ultraworkers/claw-code) | 174K | 🔥 ღია კოდის Claude Code clone Rust-ში — GitHub-ის ისტორიაში ყველაზე სწრაფად 100K ვარსკვლავის მიმღწევი რეპო (50K-ს 2 საათში მიაღწია). 2026-ის უმთავრესი ვირუსული მომენტი AI კოდინგ ხელსაწყოებში. |
| [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) | 49K | „omo" — საუკეთესო agent harness. Oh My ClaudeCode-ის გაფართოებული, უფრო უნივერსალური ვერსია სხვადასხვა AI კოდინგ აგენტებისთვის. |
| [Claude Plugins Official](https://github.com/anthropics/claude-plugins-official) | 16K | Anthropic-ის ოფიციალური Claude Code პლაგინების დირექტორია. ხარისხიანი, ვერიფიცირებული პლაგინების კატალოგი პირდაპირ Claude-ის შემქმნელებისგან. |
| [opencli](https://github.com/jackwener/opencli) | 14K | უნივერსალური CLI hub — ნებისმიერ ვებსაიტს, Electron აპლიკაციას ან ლოკალურ ხელსაწყოს CLI-ად აქცევს AI აგენტებისთვის. AI-native runtime გრაფიკული აპლიკაციების ავტომატიზაციისთვის. |
| [cmux](https://github.com/manaflow-ai/cmux) | 13K | Ghostty-ზე დაფუძნებული macOS ტერმინალი ვერტიკალური ტაბებითა და ნოტიფიკაციებით — სპეციალურად AI კოდინგ აგენტებისთვის შექმნილი. პარალელური სესიების მართვა გამარტივებულია. |
| [OpenSandbox](https://github.com/alibaba/OpenSandbox) | 10K | Alibaba-ს უსაფრთხო, სწრაფი და გაფართოვებადი sandbox runtime AI აგენტების კოდის ექსეკუციისთვის. იზოლირებული გარემო — აგენტი კოდს ასრულებს თქვენი სისტემის რისკის გარეშე. |
| [toon](https://github.com/toon-format/toon) | 24K | Token-Oriented Object Notation — JSON-ის ალტერნატივა LLM prompt-ებისთვის. Schema-aware, კომპაქტური ფორმატი, რომელიც ტოკენების მოხმარებას მნიშვნელოვნად ამცირებს და LLM-ისთვის უფრო წასაკითხია. |
| [Career-Ops](https://github.com/santifer/career-ops) | 13K | Claude Code-ზე დაფუძნებული AI სამუშაოს ძიების pipeline. შეფასებს ვაკანსიებს A-F სკალით (10 კრიტერიუმი), წერს ATS-ოპტიმიზებულ CV-ებს თითო პოზიციაზე მორგებულად, ავტომატურად სკანირებს Greenhouse, Ashby, Lever-ს და თვალს ადევნებს ყველაფერს. 14 skill mode + Go dashboard. |

## MCP — პლატფორმები და ინტეგრაციები

| რეპოზიტორია | ⭐ | აღწერა |
|---|---|---|
| [MCP Servers](https://github.com/modelcontextprotocol/servers) | 83K | MCP-ის ოფიციალური საცნობარო სერვერების კოლექცია — Filesystem, Git, Memory, Fetch, Sequential Thinking. 10 ენის SDK (TypeScript, Python, Go, Rust, Java, Kotlin, C#, Ruby, Swift, PHP). MCP ეკოსისტემის ფუნდამენტი. |
| [Context7](https://github.com/upstash/context7) | 52K | განახლებული, ვერსია-სპეციფიკური დოკუმენტაცია LLM-ებისთვის. აღმოფხვრის ჰალუცინირებულ API-ებსა და მოძველებულ კოდის მაგალითებს AI კოდინგ ასისტენტებში (Cursor, Claude Code). |
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) | 30K | Microsoft-ის ოფიციალური MCP სერვერი ბრაუზერის ავტომატიზაციისთვის. Accessibility snapshot-ებით მუშაობს — სკრინშოტები არ არის საჭირო. LLM-ისთვის ოპტიმიზებული. |
| [GitHub MCP](https://github.com/github/github-mcp-server) | 29K | GitHub-ის ოფიციალური MCP სერვერი — რეპოზიტორიების მართვა, Issue/PR ავტომატიზაცია, CI/CD მონიტორინგი და კოდის ანალიზი ბუნებრივი ენით. |
| [n8n-MCP](https://github.com/czlonkowski/n8n-mcp) | 17K | AI ასისტენტებს n8n workflow-ების ასაწყობად ღრმა ცოდნას აძლევს — 1,396 node-ის დოკუმენტაცია, 2,646 კონფიგურაცია და 2,709 workflow template. თანმხლები: [n8n-skills](https://github.com/czlonkowski/n8n-skills). |
| [Figma Context MCP](https://github.com/GLips/Figma-Context-MCP) | 14K | Figma-ს დიზაინის მონაცემებს AI კოდინგ ასისტენტებს აწვდის. სკრინშოტებთან შედარებით გაცილებით ზუსტი — დიზაინიდან კოდში ერთი მცდელობით. |
| [Notion MCP](https://github.com/makenotion/notion-mcp-server) | 4.2K | Notion-ის ოფიციალური MCP სერვერი — გვერდებთან, მონაცემთა ბაზებთან და კონტენტთან მუშაობა. OAuth ავტორიზაცია და Markdown რედაქტირება. |
| [Supabase MCP](https://github.com/supabase-community/supabase-mcp) | 2.6K | Supabase პროექტებთან პირდაპირი კავშირი — ცხრილების მართვა, კონფიგურაცია და მონაცემთა შეკითხვები. OAuth ავტორიზაცია, Cursor, Claude და Windsurf მხარდაჭერა. |
| [Draw.io MCP](https://github.com/jgraph/drawio-mcp) | 2.3K | draw.io-ს ოფიციალური სერვერი — დიაგრამების შექმნა და რედაქტორში გახსნა. 4 მეთოდი: App Server, Tool Server, Skill+CLI, Project Instructions. XML, CSV, Mermaid ფორმატები. |
| [Claude Peers MCP](https://github.com/louislva/claude-peers-mcp) | 1.7K | რამდენიმე Claude Code ინსტანცია ერთმანეთს აღმოაჩენს და რეალურ დროში კომუნიკაციას ამყარებს. სხვადასხვა პროექტზე პარალელური მუშაობისთვის. |

## ვებ სკრეიპინგი და მონაცემთა მოპოვება

| რეპოზიტორია | ⭐ | აღწერა |
|---|---|---|
| [Browser Use](https://github.com/browser-use/browser-use) | 86K | Python ბიბლიოთეკა, რომელიც ვებსაიტებს AI აგენტებისთვის ხელმისაწვდომს ხდის — კლიკი, ტექსტის შეყვანა, ნავიგაცია და მონაცემთა ამოღება ავტომატურად. |
| [Agent Browser](https://github.com/vercel-labs/agent-browser) | 28K | Vercel Labs-ის ბრაუზერის ავტომატიზაციის CLI, შექმნილი სპეციალურად AI აგენტებისთვის. ღრმა ინტეგრაცია Vercel ეკოსისტემასთან და ოპტიმიზებული agent workflow-ებისთვის. |
| [Playwright CLI](https://github.com/microsoft/playwright-cli) | 6.9K | Playwright-ის CLI ინტერფეისი — ბრაუზერის ჩაწერა, კოდის გენერაცია და სელექტორების ინსპექტირება. MCP-ს overhead-ის გარეშე მსუბუქი ბრაუზერის კონტროლი. |
| [Firecrawl MCP](https://github.com/firecrawl/firecrawl-mcp-server) | 5.9K | Firecrawl-ის ოფიციალური სერვერი — ვებ სკრეიპინგი, crawling, ძიება, ღრმა კვლევა და Cloud browser სესიები. ავტომატური retry და rate limiting. |
| [Cloudflare MCP](https://github.com/cloudflare/mcp-server-cloudflare) | 3.6K | Cloudflare-ის 13+ MCP სერვერი — Workers, KV, R2, D1, Browser Rendering, DNS ანალიტიკა და დოკუმენტაცია. სრული პლატფორმის მართვა AI-დან. |
| [Bright Data MCP](https://github.com/brightdata/brightdata-mcp) | 2.3K | ვებ სკრეიპინგი anti-bot bypass-ით და proxy ქსელით. სტრუქტურირებული მონაცემების ამოღება ნებისმიერი ვებსაიტიდან ბლოკირების გარეშე. |
| [Crawl4AI RAG](https://github.com/coleam00/mcp-crawl4ai-rag) | 2.1K | ვებ crawling + RAG ერთიან pipeline-ში — სკრეიპი, ვექტორულ ბაზაში შენახვა და ცოდნაზე დაფუძნებული კითხვა-პასუხი. Supabase-ზე დაფუძნებული. |
| [LinkedIn MCP](https://github.com/stickerdaniel/linkedin-mcp-server) | 1.3K | LinkedIn პროფილების, კომპანიების, ვაკანსიების სკრეიპინგი და inbox-ის მართვა AI ასისტენტებიდან. |
| [Apify MCP](https://github.com/apify/apify-mcp-server) | 1K | 1000+ მზა სკრეიპერი — Instagram, TikTok, Amazon, Google Maps და ნებისმიერი ვებსაიტი. Apify Store-ის სრული კატალოგი AI ასისტენტებისთვის. |

## ძიება და კვლევა

| რეპოზიტორია | ⭐ | აღწერა |
|---|---|---|
| [Exa MCP](https://github.com/exa-labs/exa-mcp-server) | 4.1K | Exa-ს ძიების სერვერი — ვებ ძიება, კოდის ძიება და კომპანიების კვლევა. ჰოსტირებული სერვისი ერთი დაწკაპუნებით Cursor-სა და VS Code-ში ინტეგრაციით. |
| [Perplexity MCP](https://github.com/perplexityai/modelcontextprotocol) | 2.1K | Perplexity-ის ოფიციალური სერვერი — რეალურ დროში ვებ ძიება (perplexity_search), საუბრისმაგვარი AI (sonar-pro), ღრმა კვლევა (sonar-deep-research) და მსჯელობა (sonar-reasoning-pro). |
| [Tavily MCP](https://github.com/tavily-ai/tavily-mcp) | 1.6K | რეალურ დროში ვებ ძიება, კონტენტის ამოღება (extract), საიტის რუკის შედგენა (map) და crawling — ოთხივე ინსტრუმენტი ერთ MCP სერვერში. ჰოსტირებული ვერსია (mcp.tavily.com) ლოკალური ინსტალაციის გარეშე მუშაობს. |

## მეხსიერება და RAG

| რეპოზიტორია | ⭐ | აღწერა |
|---|---|---|
| [mem0](https://github.com/mem0ai/mem0) | 52K | უნივერსალური მეხსიერების ფენა AI აგენტებისთვის — აერთიანებს ვექტორულ ძიებას, გრაფ-რელაციებს და key-value საცავს ერთ სისტემაში. ყველაზე ფართოდ გავრცელებული standalone agent memory framework 2026 წელს. |
| [Claude Mem](https://github.com/thedotmack/claude-mem) | 45K | Claude Code-ის მეხსიერების პლაგინი — ავტომატურად იჭერს სესიის კონტექსტს, AI-ით ახდენს კომპრესიას და მომავალ სესიებში რელევანტურ კონტექსტს აბრუნებს. |
| [LightRAG](https://github.com/hkuds/lightrag) | 32K | მარტივი და სწრაფი RAG სისტემა ცოდნის გრაფზე დაფუძნებული ინდექსაციით. EMNLP 2025 აკადემიური პუბლიკაცია. |
| [RAG-Anything](https://github.com/HKUDS/RAG-Anything) | 15K | All-in-One მულტიმოდალური RAG ფრეიმვორკი — ტექსტი, სურათი, ცხრილი, დიაგრამა ერთიან pipeline-ში. LightRAG-ის გუნდისგან (HKUDS). აკადემიური ნაშრომით გამყარებული. |
| [Hindsight](https://github.com/vectorize-io/hindsight) | 7.1K | აგენტის მეხსიერების სისტემა, რომელიც recall-ს სცილდება — აგენტები დროთა განმავლობაში სწავლობენ და უმჯობესდებიან. State-of-the-art შედეგი LongMemEval benchmark-ზე. |
| [Prism MCP](https://github.com/dcostenco/prism-mcp) | 108 | კოგნიტური არქიტექტურის MCP სერვერი — მდგრადი მეხსიერება, თვითორგანიზებადი ცოდნის გრაფი, მულტი-აგენტური სინქრონიზაცია და ვიზუალური dashboard. |

## პროდუქტიულობა და ავტომატიზაცია

| რეპოზიტორია | ⭐ | აღწერა |
|---|---|---|
| [Google Workspace CLI](https://github.com/googleworkspace/cli) | 24K | ერთი CLI მთელი Google Workspace-ისთვის — Drive, Gmail, Calendar, Sheets, Docs, Chat, Admin. Google Discovery Service-იდან დინამიურად აგებს ბრძანებებს. 40+ აგენტის უნარი. |
| [NotebookLM Python](https://github.com/teng-lin/notebooklm-py) | 8.9K | Google NotebookLM-ის არაოფიციალური Python API და CLI. სრული პროგრამული წვდომა ფუნქციებზე, მათ შორის ვებ ინტერფეისში მიუწვდომელ ფუნქციებზე. |
| [Markdownify MCP](https://github.com/zcaceres/markdownify-mcp) | 2.5K | ნებისმიერი ფაილის Markdown-ად გარდაქმნა — PDF, სურათები, აუდიო (ტრანსკრიფციით), DOCX, XLSX, PPTX, YouTube ვიდეოს სუბტიტრები და ვებ გვერდები. AI ასისტენტებისთვის კონტენტის უნივერსალური კონვერტორი. |
| [Metricool MCP](https://github.com/metricool/mcp-metricool) | 33 | Metricool-ის ოფიციალური სერვერი — სოციალური მედიის მეტრიკების ანალიზი და პოსტების დაგეგმვა AI ასისტენტებიდან. Instagram, Facebook, Twitter/X, TikTok, LinkedIn სტატისტიკა. |

## AI კვლევა

| რეპოზიტორია | ⭐ | აღწერა |
|---|---|---|
| [AutoResearch](https://github.com/karpathy/autoresearch) | 65K | Andrej Karpathy-ს ავტონომიური ML კვლევის სისტემა — ავტომატურად ატარებს ექსპერიმენტებს ერთ GPU-ზე, ცვლის ჰიპერპარამეტრებს და ინახავს მხოლოდ გაუმჯობესებებს. |

## რესურსები და რეფერენსები

| რეპოზიტორია | ⭐ | აღწერა |
|---|---|---|
| [Public APIs](https://github.com/public-apis/public-apis) | 419K | საჯარო API-ების ყოვლისმომცველი კატალოგი კატეგორიების მიხედვით. GitHub-ის ერთ-ერთი ყველაზე პოპულარული რეპოზიტორია. |
| [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code) | 36K | Claude Code-ის საუკეთესო რესურსების კურირებული სია — უნარები, hooks, slash-ბრძანებები, აგენტების ორკესტრატორები და პლაგინები. |
| [Free LLM API Resources](https://github.com/cheahjs/free-llm-api-resources) | 18K | უფასო LLM API რესურსების სია — OpenRouter, Google AI Studio, NVIDIA NIM, Mistral, Groq, Cerebras, Cohere, GitHub Models და სხვა პროვაიდერები. |
| [Claude How-To](https://github.com/luongnv89/claude-howto) | 18K | ვიზუალური სახელმძღვანელო Claude Code-სთვის — საწყისი კონცეფციებიდან მოწინავე აგენტებამდე, copy-paste შაბლონებით. |
| [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md) | 17K | DESIGN.md ფაილების კოლექცია პოპულარული ვებსაიტების დიზაინ-სისტემებიდან. ჩააგდე პროექტში, უთხარი AI აგენტს "ააგე ასეთი UI" და მიიღე pixel-perfect კოდი. Google Stitch-ის კონცეფცია — Markdown ფორმატში დიზაინის სისტემა, რომელსაც LLM-ები საუკეთესოდ კითხულობენ. 55+ მზა DESIGN.md. |
| [LLM-Maintained Wiki (Karpathy)](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | Gist | Andrej Karpathy-ის ბრწყინვალე კონცეფცია პერსონალური ცოდნის ბაზის აშენებისთვის LLM-ით. ნაცვლად RAG-ით ყოველ ჯერზე ძიებისა, LLM ინკრემენტულად აშენებს და ანახლებს დაკავშირებულ Markdown wiki-ს — კითხულობს ახალ წყაროებს, ცვლის ძველ გვერდებს, ანახლებს cross-reference-ებს. „LLM არ იღლება" — Karpathy. ცოდნის მართვის ახალი პარადიგმა. |

---

## ჩვენს შესახებ

<p align="center">
  <a href="https://aipulsegeorgia.ge"><img src="https://img.shields.io/badge/AI_Pulse_Georgia-2026-00D0FF?style=for-the-badge&labelColor=111827" alt="AI Pulse Georgia 2026"/></a>
</p>

ეს სია იმართება **[AI Pulse Georgia](https://aipulsegeorgia.ge)**-ს მიერ — საზოგადოება, რომელიც ფოკუსირებულია AI აგენტებზე, ავტომატიზაციაზე და ავტონომიური სისტემების მომავალზე.

> *„Exploring Georgia's AI Future"*

თუ ეს სია გამოგადგებათ, მიეცით ვარსკვლავი და გაუზიარეთ სხვებს, ვინც AI აგენტებით აშენებს.

## წვლილის შეტანა

იპოვეთ შესანიშნავი რეპოზიტორია, რომელიც ამ სიაში ჯდება? გახსენით issue ან გამოაგზავნეთ pull request.

## ლიცენზია

[![CC0](https://licensebuttons.net/p/zero/1.0/88x31.png)](https://creativecommons.org/publicdomain/zero/1.0/)
