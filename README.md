# Awesome AI Pulse Georgia

> A curated collection of cutting-edge AI agent frameworks, developer tools, and automation resources — handpicked by [AI Pulse Georgia](https://aipulsegeorgia2025.app.n8n.cloud).

[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

---

## Contents

- [AI Agents & Orchestration](#ai-agents--orchestration)
- [Claude Code Extensions & Skills](#claude-code-extensions--skills)
- [MCP Servers & Integrations](#mcp-servers--integrations)
- [Browser Automation](#browser-automation)
- [AI Research & Development](#ai-research--development)
- [Memory & Knowledge Management](#memory--knowledge-management)
- [Productivity & Automation](#productivity--automation)
- [Resources & References](#resources--references)

---

## AI Agents & Orchestration

| Repository | Description |
|---|---|
| [Paperclip](https://github.com/paperclipai/paperclip) | Node.js server + React UI that orchestrates a team of AI agents to run a business autonomously (zero-human companies). Users configure their own agents (OpenClaw, Claude Code, Codex, Cursor, Bash, HTTP), define company goals, and monitor everything from a dashboard with org chart, budget, governance, and audit log. As the README says: "If OpenClaw is an employee, Paperclip is the company." |
| [MiroFish](https://github.com/666ghj/MiroFish) | Multi-agent swarm intelligence engine that creates high-fidelity digital twins from real-world data (news, politics, financial signals) and runs thousands of agent simulations for forecasting. Each agent has an individual personality, long-term memory, and behavioral logic. Works at both macro (policy testing) and micro (narrative outcomes) levels. |
| [Hermes](https://github.com/nousresearch/hermes-agent) | Self-improving AI agent from Nous Research with a built-in learning loop. Creates skills from experience, refines them over time, stores persistent memory, searches its own past conversations, and builds user profiles across sessions. Supports any LLM, multiple platforms (Telegram, Discord, Slack, WhatsApp, Signal), cron automation, sub-agents, and migration from OpenClaw. |
| [OpenClaw](https://github.com/openclaw/openclaw) | Personal AI assistant that works across any OS and platform ("the lobster way"). Connects 20+ messaging channels (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, and more), with voice and Canvas support on macOS/iOS/Android. Features multi-agent routing, tools (browser, cron, sessions), voice wake mode, and local-first design. |

## Claude Code Extensions & Skills

| Repository | Description |
|---|---|
| [Oh My ClaudeCode](https://github.com/yeachan-heo/oh-my-claudecode) | Multi-agent orchestration plugin for Claude Code with autonomous pipeline modes: autopilot (5-phase pipeline), team (parallel agents on shared task list), ralph (persistent mode that runs until everything is verified), and ultrawork (maximum parallelism for burst fixes). |
| [Superpowers](https://github.com/obra/superpowers) | Skill collection that supercharges Claude Code with structured workflows for debugging, test-driven development, brainstorming, code review, plan execution, and parallel agent dispatch. Enforces disciplined development practices through reusable skill templates. |
| [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) | All-in-one reference repository covering every aspect of Claude Code — configuration, tips, tricks, advanced usage patterns, and community best practices compiled in a single place. |
| [Claude How-To](https://github.com/luongnv89/claude-howto) | Visual, example-driven guide to Claude Code covering basics through advanced agents, with copy-paste templates for developers who want to get productive with Claude Code quickly. |
| [Claude Code Setup](https://github.com/tornikebolokadze1-cyber/claude-code-setup) | Ready-to-use Claude Code configuration with pre-configured rules, skills, agents, hooks, and MCP server integrations for a professional development environment out of the box. |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | UI/UX design automation skill for Claude Code. Provides 50 design styles, 21 color palettes, 50 font pairings, and structured design system generation for building polished interfaces with AI assistance. |
| [Codex Plugin for Claude Code](https://github.com/openai/codex-plugin-cc) | Official OpenAI plugin that lets you delegate code review and development tasks to OpenAI's Codex agent directly from within Claude Code, enabling both AI coding assistants to work together. |

## MCP Servers & Integrations

| Repository | Description |
|---|---|
| [n8n-MCP](https://github.com/czlonkowski/n8n-mcp) | MCP server that connects Claude Code to n8n workflow automation platform. Build, validate, and manage n8n workflows programmatically using natural language. Companion project: [n8n-skills](https://github.com/czlonkowski/n8n-skills) ([n8n-mcp.com](https://www.n8n-mcp.com/) / [n8n-skills.com](https://www.n8n-skills.com/)). |
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) | Microsoft's official Playwright MCP server for browser automation from AI agents — testing, scraping, and web interaction directly from Claude Code. |
| [Prism MCP](https://github.com/dcostenco/prism-mcp) | Active cognitive architecture MCP server providing AI agents with persistent memory, a self-organizing knowledge graph, multi-agent sync, and Obsidian vault export for structured long-term knowledge management. |
| [LightRAG](https://github.com/hkuds/lightrag) | Lightweight Retrieval-Augmented Generation framework with graph-based knowledge indexing. Integrates as an MCP server for AI agents that need fast, accurate retrieval from large document collections. |

## Browser Automation

| Repository | Description |
|---|---|
| [Playwright CLI](https://github.com/microsoft/playwright-cli) | Token-efficient CLI interface for Playwright browser automation designed as skills for coding agents. Lightweight browser control without the overhead of MCP, optimized for Claude Code, Copilot, and other AI coding assistants. |
| [Browser Use](https://github.com/browser-use/browser-use) | Python library that makes websites accessible to AI agents for automating online tasks like form filling, navigation, and data extraction. Built for developers creating browser-based AI automation pipelines. |

## AI Research & Development

| Repository | Description |
|---|---|
| [AutoResearch](https://github.com/karpathy/autoresearch) | Autonomous AI agent framework by Andrej Karpathy that iteratively modifies and trains a small LLM on a single GPU, running experiments overnight and keeping only improvements. Automates hyperparameter and architecture search for ML researchers. |
| [Pretext](https://github.com/chenglou/pretext) | Pure JavaScript/TypeScript library for multiline text measurement and layout without DOM reflow. Supports Canvas, SVG, and DOM rendering with fast, accurate text layout across multiple languages. |
| [Hindsight](https://github.com/vectorize-io/hindsight) | Agent memory system that goes beyond conversation recall to help AI agents learn and improve over time. Delivers state-of-the-art long-term memory performance for building smarter autonomous agents. |

## Memory & Knowledge Management

| Repository | Description |
|---|---|
| [Claude Mem](https://github.com/thedotmack/claude-mem) | Memory management system for Claude Code that provides persistent, structured memory across sessions. Enables Claude Code to remember context, preferences, and project state between conversations. |
| [Obsidian Skills](https://github.com/kepano/obsidian-skills) | Obsidian integration skills for Claude Code. Read, write, search, and manage Obsidian vault notes directly from Claude Code, bridging AI assistance with personal knowledge management. |
| [NotebookLM Python](https://github.com/teng-lin/notebooklm-py) | Unofficial Python API and CLI for Google NotebookLM with full programmatic access to NotebookLM features, including capabilities the web UI does not expose. Built for developers and AI agents automating notebook operations. |

## Productivity & Automation

| Repository | Description |
|---|---|
| [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done) | Productivity-focused development tool that streamlines task execution and project management. Designed for developers who want less overhead and more shipping. |
| [Google Workspace CLI](https://github.com/googleworkspace/cli) | Unified command-line tool for managing Google Workspace services — Drive, Gmail, Calendar, Sheets, Docs, Chat, and Admin. Dynamically built from Google Discovery Service, with CLI and AI agent access to the full Google Workspace ecosystem. |

## Resources & References

| Repository | Description |
|---|---|
| [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code) | Curated list of Claude Code resources, plugins, skills, MCP servers, and community tools — the definitive directory for the Claude Code ecosystem. |
| [Free LLM API Resources](https://github.com/cheahjs/free-llm-api-resources) | Curated list of free LLM inference APIs and resources for developers and hobbyists who want to experiment with language models without paying for API access. |
| [Public APIs](https://github.com/public-apis/public-apis) | Massive collective list of free APIs organized by category — the go-to reference for developers looking for public data sources and services to integrate into their projects. |

---

## About

This list is maintained by **AI Pulse Georgia** — a community focused on AI agents, automation, and the future of autonomous systems.

If you find this useful, give it a star and share it with others who are building with AI agents.

## Contributing

Found a great repo that fits this list? Open an issue or submit a pull request.

## License

[![CC0](https://licensebuttons.net/p/zero/1.0/88x31.png)](https://creativecommons.org/publicdomain/zero/1.0/)
