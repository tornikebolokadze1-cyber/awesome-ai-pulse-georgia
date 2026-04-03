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
  <img src="https://img.shields.io/badge/repos-33-00D0FF?style=flat-square&labelColor=111827" alt="Repos"/>
  <img src="https://img.shields.io/badge/categories-8-A949DA?style=flat-square&labelColor=111827" alt="Categories"/>
  <img src="https://img.shields.io/badge/made_in-Georgia_%F0%9F%87%AC%F0%9F%87%AA-00D0FF?style=flat-square&labelColor=111827" alt="Made in Georgia"/>
  <a href="https://aipulsegeorgia.ge"><img src="https://img.shields.io/badge/aipulsegeorgia.ge-website-A949DA?style=flat-square&labelColor=111827" alt="Website"/></a>
</p>

<p align="center"><i>A curated collection of AI agent frameworks, developer tools, and automation resources — by AI Pulse Georgia</i></p>

---

## სარჩევი

- [AI აგენტები და ორკესტრაცია](#ai-აგენტები-და-ორკესტრაცია)
- [Claude Code გაფართოებები და უნარები](#claude-code-გაფართოებები-და-უნარები)
- [MCP სერვერები და ინტეგრაციები](#mcp-სერვერები-და-ინტეგრაციები)
- [ბრაუზერის ავტომატიზაცია](#ბრაუზერის-ავტომატიზაცია)
- [AI კვლევა და განვითარება](#ai-კვლევა-და-განვითარება)
- [მეხსიერება და ცოდნის მართვა](#მეხსიერება-და-ცოდნის-მართვა)
- [პროდუქტიულობა და ავტომატიზაცია](#პროდუქტიულობა-და-ავტომატიზაცია)
- [რესურსები და რეფერენსები](#რესურსები-და-რეფერენსები)

---

## AI აგენტები და ორკესტრაცია

| რეპოზიტორია | აღწერა |
|---|---|
| [Paperclip](https://github.com/paperclipai/paperclip) | Node.js სერვერი + React UI, რომელიც ორკესტრირებს AI აგენტების გუნდს ბიზნესის ავტონომიურად წარმართვისთვის (zero-human companies). მომხმარებელი აწვდის საკუთარ აგენტებს (OpenClaw, Claude Code, Codex, Cursor, Bash, HTTP), ასახელებს კომპანიის მიზნებს, ხედავს დაფას — org chart, ბიუჯეტი, governance და audit log. როგორც README ამბობს: „If OpenClaw is an employee, Paperclip is the company." |
| [MiroFish](https://github.com/666ghj/MiroFish) | მულტი-აგენტური swarm intelligence ძრავი, რომელიც ქმნის ციფრულ პარალელურ სამყაროს რეალური მონაცემებიდან (ახალი ამბები, პოლიტიკა, ფინანსური სიგნალები) და ასრულებს ათასობით აგენტის სიმულაციას პროგნოზისთვის. აგენტებს აქვთ ინდივიდუალური პიროვნებები, გრძელვადიანი მეხსიერება და ქცევითი ლოგიკა. მუშაობს მაკრო (პოლიტიკის ტესტირება) და მიკრო (კრეატიული სცენარების სიმულაცია) დონეზე. |
| [Hermes](https://github.com/nousresearch/hermes-agent) | თვითგაუმჯობესებადი AI აგენტი Nous Research-ისგან ჩაშენებული learning loop-ით. ქმნის უნარებს გამოცდილებიდან, აუმჯობესებს მათ, ინახავს მეხსიერებას, ეძებს საკუთარ წარსულ საუბრებს და ქმნის მომხმარებლის პროფილს სესიებს შორის. მხარს უჭერს ნებისმიერ LLM-ს, მრავალ პლატფორმას (Telegram, Discord, Slack, WhatsApp, Signal), cron ავტომატიზაციას და sub-აგენტებს. |
| [OpenClaw](https://github.com/openclaw/openclaw) | პერსონალური AI ასისტენტი, რომელიც მუშაობს ნებისმიერ OS-სა და პლატფორმაზე („the lobster way"). აერთიანებს 20+ მესიჯინგ არხს (WhatsApp, Telegram, Slack, Discord, Signal, iMessage), ხმასა და Canvas-ს macOS/iOS/Android-ზე. მხარს უჭერს მულტი-აგენტ routing-ს, ინსტრუმენტებს (ბრაუზერი, cron, სესიები), voice wake mode-ს და local-first დიზაინს. |
| [OpenSpace](https://github.com/HKUDS/OpenSpace) | თვითგანვითარებადი AI აგენტების ფრეიმვორკი, რომელიც აგენტებს საშუალებას აძლევს ავტომატურად ისწავლონ, გაუმჯობესდნენ და გაუზიარონ უნარები ერთმანეთს (AUTO-FIX, AUTO-IMPROVE, AUTO-LEARN). ამცირებს ტოკენის ხარჯს 46%-ით და ზრდის ამოცანების ხარისხს. მუშაობს Claude Code-ს, OpenClaw-ს, Codex-ს, Cursor-სა და სხვა ავტონომიურ აგენტებთან. |

## Claude Code გაფართოებები და უნარები

| რეპოზიტორია | აღწერა |
|---|---|
| [Oh My ClaudeCode](https://github.com/yeachan-heo/oh-my-claudecode) | მულტი-აგენტური ორკესტრაციის პლაგინი Claude Code-სთვის ავტონომიური რეჟიმებით: autopilot (5-ფაზიანი pipeline), team (პარალელური აგენტები საერთო დავალებების სიაზე), ralph (მუშაობს სანამ ყველაფერი არ იქნება ვერიფიცირებული) და ultrawork (მაქსიმალური პარალელიზმი სწრაფი გასწორებისთვის). |
| [Superpowers](https://github.com/obra/superpowers) | აგენტური უნარებისა და სამუშაო პროცესის ფრეიმვორკი, რომელიც აძლიერებს Claude Code-ს (და Cursor-ს, Codex-ს) სტრუქტურირებული workflow-ებით — debugging, ტესტზე-ორიენტირებული განვითარება, brainstorming, კოდის მიმოხილვა, სპეციფიკაციაზე დაფუძნებული დეველოპმენტი და პარალელური აგენტების დისპეტჩერიზაცია. |
| [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) | AI აგენტის harness-ის პერფორმანსის ოპტიმიზაციის სისტემა — უნარები, ინსტინქტები, მეხსიერების ოპტიმიზაცია, უსაფრთხოების სკანირება და კვლევაზე დაფუძნებული განვითარება. მუშაობს Claude Code-ს, Codex-სა და სხვა AI აგენტების harness-ებთან. |
| [Claude Code Setup](https://github.com/tornikebolokadze1-cyber/claude-code-setup) | მზა Claude Code კონფიგურაცია 17 წესით, 7 hooks-ით, 7 შაბლონით და /setup ბრძანებით — პროფესიონალური სამუშაო გარემო ერთი ნაბიჯით. |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | UI/UX დიზაინის ავტომატიზაციის უნარი Claude Code-სთვის. 67+ დიზაინის სტილი, ფერთა პალიტრები, შრიფტების წყვილები და სტრუქტურირებული დიზაინ-სისტემის გენერაცია AI ასისტენტის დახმარებით. |
| [Codex Plugin for Claude Code](https://github.com/openai/codex-plugin-cc) | OpenAI-ს ოფიციალური პლაგინი, რომელიც საშუალებას გაძლევთ კოდის მიმოხილვა და დეველოპმენტის ამოცანები გადასცეთ OpenAI-ს Codex აგენტს პირდაპირ Claude Code-დან — ორი AI კოდინგ ასისტენტის ერთობლივი მუშაობა. |
| [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done) | Meta-prompting-ისა და სპეციფიკაციაზე დაფუძნებული განვითარების სისტემა Claude Code-სთვის (და Codex, Cursor, Gemini CLI-სთვის), რომელიც გადაჭრის context rot-ის პრობლემას — ხარისხის გაუარესებას, რომელიც ხდება როცა AI აგენტი კონტექსტს ავსებს. |
| [Obsidian Skills](https://github.com/kepano/obsidian-skills) | აგენტის უნარები Obsidian vault-ებთან სამუშაოდ. წაიკითხეთ, ჩაწერეთ, მოძებნეთ და მართეთ Markdown, Bases და JSON Canvas ფაილები პირდაპირ Claude Code-დან, Codex CLI-დან ან ნებისმიერი AgentSkills-თავსებადი აგენტიდან. |
| [n8n Skills](https://github.com/czlonkowski/n8n-skills) | n8n workflow ავტომატიზაციის უნარების კოლექცია Claude Code-სთვის — მზა შაბლონები, პატერნები და საუკეთესო პრაქტიკები n8n workflow-ების აშენებისთვის AI ასისტენტის დახმარებით. თანმხლები პროექტი: [n8n-MCP](https://github.com/czlonkowski/n8n-mcp) ([n8n-skills.com](https://www.n8n-skills.com/)). |
| [Georgian Payments Skills](https://github.com/erekle1/georgian-payments-skills) | AI აგენტის უნარები ქართული ბანკების API-ებისთვის — TBC Bank (Checkout, TPay, XML Billing) და Bank of Georgia (iPay, Installments, Open Banking PSD2). Drop-in skills, რომლებიც AI კოდინგ ასისტენტს (Claude Code, Cursor, Windsurf, Codex) აძლევს ექსპერტ-დონის ცოდნას ქართული საგადახდო ინტეგრაციების შესახებ. Made in Georgia 🇬🇪. |

## MCP სერვერები და ინტეგრაციები

| რეპოზიტორია | აღწერა |
|---|---|
| [n8n-MCP](https://github.com/czlonkowski/n8n-mcp) | MCP სერვერი, რომელიც აკავშირებს AI ასისტენტებს (Claude Code, Cursor, Windsurf) n8n სამუშაო ავტომატიზაციის პლატფორმასთან. აშენებს, ვალიდაციას უკეთებს და მართავს n8n workflow-ებს ბუნებრივი ენით. თანმხლები პროექტი: [n8n-skills](https://github.com/czlonkowski/n8n-skills) ([n8n-mcp.com](https://www.n8n-mcp.com/) / [n8n-skills.com](https://www.n8n-skills.com/)). |
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) | Microsoft-ის ოფიციალური Playwright MCP სერვერი ბრაუზერის ავტომატიზაციისთვის AI აგენტებიდან — ტესტირება, სკრეიპინგი და ვებ ინტერაქცია პირდაპირ Claude Code-დან. |
| [Prism MCP](https://github.com/dcostenco/prism-mcp) | აქტიური კოგნიტური არქიტექტურის MCP სერვერი, რომელიც AI აგენტებს აძლევს მდგრად მეხსიერებას, თვითორგანიზებად ცოდნის გრაფს, მულტი-აგენტურ სინქრონიზაციას და Obsidian vault-ის ექსპორტს სტრუქტურირებული ცოდნის მართვისთვის. |
| [Claude Peers MCP](https://github.com/louislva/claude-peers-mcp) | MCP სერვერი, რომელიც ერთ მანქანაზე გაშვებულ მრავალ Claude Code ინსტანციას საშუალებას აძლევს აღმოაჩინონ ერთმანეთი და რეალურ დროში დაუკავშირდნენ. შექმნილია დეველოპერებისთვის, რომლებიც პარალელურად მუშაობენ რამდენიმე Claude სესიაზე სხვადასხვა პროექტში და სჭირდებათ მათი თანამშრომლობა მყისიერი შეტყობინებებით. |
| [GitHub MCP Server](https://github.com/github/github-mcp-server) | GitHub-ის ოფიციალური MCP სერვერი, რომელიც AI ინსტრუმენტებს პირდაპირ აკავშირებს GitHub-ის პლატფორმასთან. საშუალებას აძლევს AI აგენტებს შეასრულონ GitHub-ის ოპერაციები ბუნებრივი ენით — რეპოზიტორიების მართვა, issue-ების თვალყურის დევნება და workflow ავტომატიზაცია. |
| [Context7](https://github.com/upstash/context7) | MCP სერვერი, რომელიც განახლებულ, ვერსია-სპეციფიკურ დოკუმენტაციას აწვდის პირდაპირ LLM-ის prompt-ებში, რაც აღმოფხვრის ჰალუცინირებულ API-ებსა და მოძველებულ კოდის მაგალითებს. შექმნილია დეველოპერებისთვის, რომლებიც იყენებენ AI კოდინგ ასისტენტებს (Cursor, Claude Code) და სჭირდებათ ზუსტი, აქტუალური ბიბლიოთეკის დოკუმენტაცია. |

## ბრაუზერის ავტომატიზაცია

| რეპოზიტორია | აღწერა |
|---|---|
| [Playwright CLI](https://github.com/microsoft/playwright-cli) | ტოკენ-ეფექტური CLI ინტერფეისი Playwright ბრაუზერის ავტომატიზაციისთვის, შექმნილი როგორც უნარები კოდინგ აგენტებისთვის. მსუბუქი ბრაუზერის კონტროლი MCP-ს overhead-ის გარეშე, ოპტიმიზირებული Claude Code-ს, GitHub Copilot-ისა და სხვა AI კოდინგ ასისტენტებისთვის. მხარს უჭერს ჩაწერას, კოდის გენერაციას და სელექტორების ინსპექტირებას. |
| [Browser Use](https://github.com/browser-use/browser-use) | Python ბიბლიოთეკა, რომელიც ვებსაიტებს ხელმისაწვდომს ხდის AI აგენტებისთვის — ფორმების შევსება, ნავიგაცია და მონაცემთა ამოღება ავტომატურად. შექმნილია ბრაუზერზე დაფუძნებული AI ავტომატიზაციის pipeline-ებისთვის. |

## AI კვლევა და განვითარება

| რეპოზიტორია | აღწერა |
|---|---|
| [AutoResearch](https://github.com/karpathy/autoresearch) | მინიმალური ავტონომიური ML ექსპერიმენტის setup ანდრეი კარპატისგან — იტერაციულად ცვლის და ატრენინგებს მცირე LLM-ს ერთ GPU-ზე, ღამით ასრულებს ექსპერიმენტებს და ინახავს მხოლოდ გაუმჯობესებებს. ავტომატიზირებს ჰიპერპარამეტრებისა და არქიტექტურის ძიებას ML მკვლევარებისთვის. |
| [LightRAG](https://github.com/hkuds/lightrag) | მსუბუქი Retrieval-Augmented Generation ფრეიმვორკი გრაფზე დაფუძნებული ცოდნის ინდექსაციით (EMNLP 2025). უზრუნველყოფს სწრაფ და ზუსტ ძიებას დიდი დოკუმენტების კოლექციებიდან AI აგენტებისთვის. |
| [Pretext](https://github.com/chenglou/pretext) | სუფთა JavaScript/TypeScript ბიბლიოთეკა მრავალხაზოვანი ტექსტის გაზომვისა და განლაგებისთვის DOM reflow-ის გარეშე. მხარს უჭერს Canvas, SVG და DOM რენდერინგს სწრაფი, ზუსტი ტექსტის განლაგებით მრავალ ენაზე. სასარგებლოა ვირტუალიზაციისა და masonry განლაგებისთვის. |

## მეხსიერება და ცოდნის მართვა

| რეპოზიტორია | აღწერა |
|---|---|
| [Hindsight](https://github.com/vectorize-io/hindsight) | აგენტის მეხსიერების სისტემა, რომელიც სცილდება საუბრის recall-ს და ეხმარება AI აგენტებს დროთა განმავლობაში ისწავლონ და გაუმჯობესდნენ, და არა მხოლოდ დაიმახსოვრონ. უზრუნველყოფს state-of-the-art გრძელვადიანი მეხსიერების შესრულებას (LongMemEval benchmark). |
| [Claude Mem](https://github.com/thedotmack/claude-mem) | მეხსიერების კომპრესიის სისტემა Claude Code-სთვის — ავტომატურად იჭერს ყველაფერს, რასაც Claude აკეთებს სესიის დროს, კომპრესირებს AI-ით და შემდეგ სესიებში აბრუნებს რელევანტურ კონტექსტს. |
| [NotebookLM Python](https://github.com/teng-lin/notebooklm-py) | არაოფიციალური Python API და CLI Google NotebookLM-სთვის სრული პროგრამული წვდომით NotebookLM-ის ფუნქციებზე, მათ შორის ისეთებზე, რომლებიც ვებ ინტერფეისში არ არის ხელმისაწვდომი. შექმნილია დეველოპერებისა და AI აგენტებისთვის notebook ოპერაციების ავტომატიზაციისთვის. |

## პროდუქტიულობა და ავტომატიზაცია

| რეპოზიტორია | აღწერა |
|---|---|
| [Google Workspace CLI](https://github.com/googleworkspace/cli) | ერთიანი ბრძანების ხაზის ინსტრუმენტი Google Workspace სერვისების მართვისთვის — Drive, Gmail, Calendar, Sheets, Docs, Chat და Admin. დინამიურად აშენებული Google Discovery Service-იდან, CLI და AI აგენტის წვდომით Google Workspace-ის სრულ ეკოსისტემაზე. |

## რესურსები და რეფერენსები

| რეპოზიტორია | აღწერა |
|---|---|
| [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code) | Claude Code-ის რესურსების, პლაგინების, უნარების, MCP სერვერებისა და საზოგადოების ინსტრუმენტების კურირებული სია — Claude Code ეკოსისტემის დეფინიტური კატალოგი. |
| [Claude How-To](https://github.com/luongnv89/claude-howto) | ვიზუალური, მაგალითებზე დაფუძნებული სახელმძღვანელო Claude Code-სთვის — საბაზისო კონცეფციებიდან მოწინავე აგენტებამდე, copy-paste შაბლონებით სწრაფი დაწყებისთვის. |
| [Free LLM API Resources](https://github.com/cheahjs/free-llm-api-resources) | უფასო LLM inference API-ებისა და რესურსების კურირებული სია დეველოპერებისა და ჰობისტებისთვის, რომლებსაც სურთ ენობრივ მოდელებთან ექსპერიმენტი API-ის საფასურის გარეშე. |
| [Public APIs](https://github.com/public-apis/public-apis) | უფასო API-ების მასიური კოლექტიური სია კატეგორიების მიხედვით — მთავარი რეფერენსი დეველოპერებისთვის, რომლებიც ეძებენ საჯარო მონაცემთა წყაროებსა და სერვისებს ინტეგრაციისთვის. |

---

## ჩვენს შესახებ

<p align="center">
  <a href="https://aipulsegeorgia.ge"><img src="https://img.shields.io/badge/AI_Pulse_Georgia-2025-00D0FF?style=for-the-badge&labelColor=111827" alt="AI Pulse Georgia 2025"/></a>
</p>

ეს სია იმართება **[AI Pulse Georgia](https://aipulsegeorgia.ge)**-ს მიერ — საზოგადოება, რომელიც ფოკუსირებულია AI აგენტებზე, ავტომატიზაციაზე და ავტონომიური სისტემების მომავალზე.

> *„Exploring Georgia's AI Future"*

თუ ეს სია გამოგადგებათ, მიეცით ვარსკვლავი და გაუზიარეთ სხვებს, ვინც AI აგენტებით აშენებს.

## წვლილის შეტანა

იპოვეთ შესანიშნავი რეპოზიტორია, რომელიც ამ სიაში ჯდება? გახსენით issue ან გამოაგზავნეთ pull request.

## ლიცენზია

[![CC0](https://licensebuttons.net/p/zero/1.0/88x31.png)](https://creativecommons.org/publicdomain/zero/1.0/)
