Ember 

# ember.

**Restoring the human connection.**

Ember is an AI-powered voice accessibility assistant designed for people with speech disabilities such as ALS/MND, stroke-induced aphasia, and dysarthria. It moves beyond traditional AAC devices by using your own voice—cloned and preserved—or a reconstructed version of it, to communicate instantly and naturally.

## 🚀 Mission

To ensure that no one loses their unique identity when they lose their ability to speak. We believe in "Voice Independence"—privacy-first, local-processing, and zero-latency communication.

## ✨ Key Features

*   **Voice Banking:** Record just 5 phrases to create a digital twin of your voice. No 3-hour studio sessions required.
*   **Aphasia Repair:** Our AI contextually reconstructs fragmented speech and stuttered words into fluent, complete sentences in your own voice.
*   **Vision-Voice Context:** Point your camera at an object and speak naturally. Ember sees what you see (e.g., "Open this" while pointing at a door) and executes the command.
*   **SmartThings Integration:** Control your home environment (lights, locks, TV) directly with voice commands, even with impaired speech.
*   **Context-Aware:** Uses location, time, and visual cues to predict and suggest relevant responses.
*   **Emergency Guard:** Detects distress/urgency in your voice or words and can automatically trigger alerts or calls to caregivers.
*   **Local-First Privacy:** Voice processing happens on-device or via secure, ephemeral edge functions. Your voice model is your vault.

## 🛠️ Technology Stack

*   **Frontend:** React, Vite, Tailwind CSS, shadcn/ui
*   **AI/LLM:** Google Gemini 1.5 Flash (Reasoning, Vision, Rephrasing)
*   **Voice:** ElevenLabs (Voice Cloning, TTS, Speech-to-Text)
*   **Backend:** Supabase (Auth, Database, Edge Functions)
*   **Communication:** Twilio (Emergency SMS/Call)
*   **IoT:** Samsung SmartThings API

## 🏁 Getting Started

### Prerequisites

*   Node.js & npm
*   Supabase account
*   ElevenLabs account (for voice features)
*   Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```sh
    git clone https://github.com/Superieur-fuel/ember.git
    cd ember
    ```

2.  **Install dependencies**
    ```sh
    npm install
    # or
    pnpm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory. **DO NOT COMMIT THIS FILE.**
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
    VITE_ELEVENLABS_AGENT_ID=your_agent_id
    ```

4.  **Start the development server**
    ```sh
    npm run dev
    ```

## 🔒 Security Note

This repository enforces strict security practices.
*   **Never commit `.env` files.**
*   API keys (Gemini, ElevenLabs, Twilio) should be stored in **Supabase Edge Secrets**, not in the client-side code.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Architecture
```
Frontend (React + TypeScript)
    ↓
Supabase Edge Functions (Deno)
    ↓
┌─────────────┬──────────────┬───────────────┬──────────┐
│ ElevenLabs  │ Google       │ SmartThings   │ Twilio   │
│ Voice I/O   │ Gemini 2.0   │ Smart Home    │ Emergency│
└─────────────┴──────────────┴───────────────┴──────────┘
```

Key Features:

1.Intelligent Speech Understanding

User says: "wan... coff... hot"  // Unclear, fragmented
Gemini interprets: "I want hot coffee"
Confidence: 87%

Specialized prompts for:
- Dysarthria (slurred speech)
- Aphasia (fragmented sentences)
- Urgent situations
- Standard speech

2.Multimodal AI

Combines multiple inputs:
- Speech (unclear/fragmented)
- Visual context (camera)
- Temporal context (time, history)
- Environmental context (location, devices)

3.Smart Home Integration

User: "too dark"
→ Ember understands
→ Controls SmartThings lights
→ Lights turn ON

No physical interaction needed.

4.Emergency Safety

User: "help... pain... bad"
→ Detects CRITICAL urgency
→ Calls emergency contact
→ Sends SMS to caregivers

Life-saving automation.

---

Project Structure
```
ember/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Route pages
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   └── integrations/   # Third-party integrations
├── supabase/
│   └── functions/      # Edge functions (9 total)
├── public/             # Static assets
└── EMBER_DOCUMENTATION.md  # Full technical docs

```

Future Roadmap

Phase 1: Software validation (Complete)

Phase 2: AR glasses deployment
- Meta Ray-Ban integration
- Eye-tracking for pointing
- Continuous visual context
- Ambient voice control

Phase 3:Clinical deployment
- Nursing home partnerships
- Field testing with 10+ residents
- HIPAA compliance
- Medicare/Medicaid coverage

---

Contact:

Built for: ElevenLabs + Google Cloud AI Partner Catalyst Hackathon 2025

Developer: Manoj Kumar
Email: Manoj07ar@gmail.com
LinkedIn: https://www.linkedin.com/in/manoj07ar/

---
Acknowledgments:

Inspiration: My mom, who works in a nursing home and shows me this problem every day.

Technologies: ElevenLabs, Google Gemini, Supabase, SmartThings, Twilio

For: The 50 million people worldwide with speech disabilities who deserve technology that understands them.

---

Because everyone deserves to be heard, no matter how their voice sounds.


---
MIT License

Copyright (c) 2025  Manoj

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.