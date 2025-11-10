
<div align="center">

  <a href="https://livestorm.co/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://cdn.prod.website-files.com/60ad0f9314e628baa6971a76/60ec0b74c8d325bd92ed8e72_Logo-Livestorm-Secondary.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://cdn.prod.website-files.com/60ad0f9314e628baa6971a76/60ec0b72995cde84f69dbd43_Logo-Livestorm-Primary.svg">
      <img alt="Shows a black logo in light color mode and a white one in dark color mode." src="https://user-images.githubusercontent.com/25423296/163456779-a8556205-d0a5-45e2-ac17-42d089e3c3f8.png">
    </picture>
  </a>
  <br />
  <h3>
    <a href="https://livestorm.co">Visit our website</a>
  </h3>
  <p>
    Join/follow us on <a href="https://www.linkedin.com/company/livestorm" target="_blank">Linkedin</a> | <a href="https://life.livestorm.co/" target="_blank">Medium</a> | <a href="https://x.com/livestormapp?lang=en" target="_blank">X (Twitter)</a> |  <a href="https://www.youtube.com/@Livestormapp" target="_blank">YouTube</a>
    |  <a href="https://www.welcometothejungle.com/en/companies/livestorm" target="_blank">Welcome To The Jungle</a>
  </p>
</div>
  <br />
  <h1 align="center">Senior Frontend Engineer Technical Test</h1>

<br />

### Engineering Principles @ Livestorm

>[!NOTE]
> As a reminder, we've outlined our engineering principles below. Use them as a guide for technical decisions throughout this assessment.

We value:

- **Own the Outcome** - Production-ready code that delivers real user value
- **Ship Relentlessly** - Small batches, fast iterations, continuous delivery
- **Make It Simple** - Solve root problems with minimal complexity
- **Leave It Better** - Always improve the codebase you touch
- **Act Like an Owner** - Think long-term, optimize for business success
- **People over Process** - Autonomy and accountability over rigid procedures
- **Automate Everything** - Eliminate repetitive work through smart automation
- **Collaboration ≠ Consensus** - Debate ideas, commit to decisions
- **Build Trust Through Transparency** - Work in the open, share learnings
- **Be Uncomfortably Excited** - Embrace challenges that drive growth

**What We're Looking For:**
- Senior-level thinking: Architecture decisions, performance optimizations, edge case handling
- Production mindset: Error handling, testing, maintainability, observability
- Communication: Clear documentation of decisions and trade-offs
- Pragmatism: Right tool for the job, not over-engineering

---

## Overview

Build a high-performance real-time chat interface that connects to our existing backend. 
> ⏰ Time limit: 3-4 hours.

### Core Features

Build a chat interface that connects to the existing chat microservice. The implementation must include:

- **Send/receive messages** in real-time
- **Add and remove emoji reactions** on messages

### Design & Layout

- Follow the provided design mockup [you can have access here](https://www.figma.com/design/qpWAc7kiRqGuyX3N2SqCpS/Livestorm---Senior-Frontend-Engineer---Chat-Component?node-id=0-1&t=GYdpDc6lpbQIuK27-1)
- Mobile-first approach
- Responsive design with max-width constraints for desktop

### Non-Functional Requirements

**Performance & Scalability** are critical. Your implementation should:
- Efficiently handle 100+ messages without performance degradation
- Support future feature additions (typing indicators, message editing, etc.)
- Use optimized rendering patterns
- Minimize unnecessary re-renders and DOM operations

The code should be written with production-grade quality in mind.

## Evaluation Criteria

### Primary (Required)

- **Architecture**: Component structure, separation of concerns, code organization, scalability
- **Code Quality**: Readability, maintainability, consistent style, SOLID principles, no code smells
- **Correctness**: Application works as specified, edge cases handled, no obvious bugs
- **Performance**: Efficient rendering (no unnecessary re-renders), no memory leaks, smooth UX at 50 msg/sec throughput
- **Testing**: Meaningful test coverage with unit and integration tests (full coverage not expected)

### Secondary (Nice to Have)

- **Error Handling**: Graceful degradation on network failures, user feedback, error boundaries
- **Polish**: Animations, loading states, optimistic updates, micro-interactions
- **Accessibility**: Keyboard navigation, ARIA labels, semantic HTML

## Technical Constraints

- **Frontend only** — Backend is complete and must not be modified
- **Vue.js** with Composition API and **TypeScript** (strict mode required)
- Choose your own: state management, styling solution, and build tooling
- Must run in latest Chrome and Firefox
- No external UI component libraries (build from scratch or use headless libraries only like [RekaUI](https://reka-ui.com/))

### Getting started

### Prerequisites

- Docker installed and running
- Node.js 20+ (for frontend development)

### Backend Setup

The backend is containerized and ready to use. Start it with:
```bash
make start
```

Verify the backend is healthy:
```bash
curl http://localhost:8080/health
```

**Backend documentation**: See [this documentation](https://livestorm.github.io/frontend-engineer-hiring-test/) or the AsyncAPI schema inside the backend folder (in case of documentation downtime).

## WebSocket Connection
Connect to the backend WebSocket at `ws://localhost:8080/chat`. Refer to the chat service [generated documentation](https://livestorm.github.io/frontend-engineer-hiring-test/) for message schemas and API details.

### Submission Process

1. **Fork this repository** to your personal GitHub account
2. **Complete the technical test** following all requirements above
3. **Create a Pull Request** back to this repository with:
   - A clear title: `[Your Name] - Senior Frontend Technical Test`
   - Include a description covering:
     - Time spent on the project
     - Key technical decisions and trade-offs
     - Any assumptions made
     - Instructions to run your solution locally

#### What to include in your PR

- **Complete source code** with clear project structure
- **README.md** in your fork with:
  - Setup and installation instructions
  - How to run the application
  - How to run tests
  - Brief explanation of your architecture choices
- **Tests** demonstrating your testing approach
- **Any additional documentation** you think is relevant

#### ⚠️ Important Notes

- **Individual work only** - This test must be completed independently
- **No Vibe Coding** - While we embrace AI tools at Livestorm, this test should demonstrate your personal coding skills. We'll discuss implementation choices during the debrief, so you should be able to explain every line of code
- **Production-ready code** - Write code as if it's going to production tomorrow
- **Ask questions** if something is unclear (create an issue on this repository)

#### Review Process

Once you share your Pull Request link with us:
- **Review time**: Approximately **48 hours** for our team to evaluate your submission
- **Review team**: At least **3 engineers** will review your code to ensure fair and thorough evaluation
- **Next steps**: We'll communicate the next stage of the process once the review is complete

We appreciate your time and effort in completing this technical test! 🙏
