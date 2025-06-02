# Page Messaging Framework – Prelaunch vs. Product Landing Page

## Purpose

This framework differentiates the messaging strategy between the prelaunch phase (used to build anticipation and collect emails) and the product landing page (used to convert and inform users post-launch). It also integrates recommendations based on current UI components and SEO best practices.

## 1. Prelaunch Page – Messaging & Structure

**Goal:** Capture attention, create emotion, spark curiosity, and collect email addresses.  
**SEO Focus:** Emotional headlines, curiosity-driven meta description, brand discovery.

### Messaging Tone

- Emotional, visionary, teaser-style
- Less focus on features, more on transformation
- Use short, punchy statements and bold claims

### Page Sections & Copy Suggestions

#### Hero Section

- **Headline:** "Turn Prompts Into Visual Stories."
- **Subline:** "Narravid is your storytelling engine – transform an idea into video scenes with voice, visuals, music, and animation."
- **CTA:** Email input with "Get Early Access"
- **SEO:** Meta title: "AI-Powered Video Creation | Join Narravid Early Access"

#### Problem Section

- **Headline:** "Creating video content takes too long."
- **Body:** "Tools are complicated. Costs are high. Creativity is limited."

#### Teaser Solution

3 Icons (based on platform features):
- "Minutes, not hours."
- "Modular control or full automation."
- "Stylized output in your own aesthetic."

#### Social Proof Preview

- **Text:** "Over 143 creators are already waiting."
- **Mini FAQ:** "When do we launch?" → May. "What happens with my email?" → No spam, only early access.

#### Optional Discovery CTA (Low Friction)

For highly curious users: Include a muted or low-priority text CTA below the fold or in the confirmation email:

"Want to know more? Here's a sneak peek of what's coming." → Link to /features with UTM tracking

> Do not link to /features or /showcase prominently, to avoid distracting from the email signup goal

#### Final CTA

- Repeat the main offer: "Be among the first to create AI-driven stories."
- Email field again

## 2. Product Landing Page – Messaging & Structure

**Goal:** Build trust, show concrete value, drive sign-ups and usage  
**SEO Focus:** Feature-rich, problem-solving content, optimized for "AI video creation", "generate short videos", etc.

### Messaging Tone

- Clear, instructional, confident
- Value-first, feature-supported
- Tailored for comparison and conversion

### Landing Page Sections (with content recommendations)

#### Landing Page - Hero Section (Component in frontend\src\components\marketing\hero)

- **Headline:** "Create Engaging Social Videos with AI"
- **Subhead:** "Transform your ideas into professional short-form videos. Perfect for social media content creators, educators, and businesses."
- **CTA:** "Start Creating" (authenticated flow) and "Learn More" (scroll to features)
- **Tags:** Quick Creation, Multiple Styles, Professional Results, Social-Ready

#### Process Section (Component in frontend\src\components\marketing\hero)

- **Headline:** "Create Professional Videos in Minutes"
- **Step-by-step:**
  1. Share your idea or upload a style reference
  2. AI generates your content
  3. Review or regenerate each scene
  4. Export video or individual assets

#### Testimonials Section (Component in frontend\src\components\marketing\hero)

- **Headline:** "Loved by Content Creators"
- **Subline:** "See what creators and educators say about their AI-powered production experience."
- **SEO:** Use structured data for review snippets if possible

#### CTA Section (Component in frontend\src\components\marketing\hero)

- **Clear benefit + action:** "Generate Your First Video Scene in Minutes"
- **Button:** "Start Creating"

#### Footer (Component in frontend\src\components\marketing\footer.tsx)

- Include links to: /features, /showcase, privacy, terms, FAQ
- Optional: Add newsletter signup again (Beehiiv, etc.)

### Dedicated Page Sections

#### Dedicated Page - Features Section (/features, Components in frontend\src\components\marketing\features)

- **Headline:** "Everything You Need to Create Amazing Videos"
- **SEO paragraph:** "Narravid combines scriptwriting, voiceover, visuals, animation, and editing into a single AI-powered flow. Choose your style, generate scenes, and publish anywhere."
- **Feature grid using icons:**
  - AI-Powered Creation
  - Professional Visuals
  - Quick Assembly
  - Easy Sharing
  - Fast Turnaround
  - 100% Royalty-Free

#### Dedicated Page - Showcase Section (/showcase, Components in frontend\src\components\marketing\showcase)

- **SEO headline:** "See What You Can Create with Narravid"
- **Description:** "Explore examples of AI-generated videos made with Narravid, used in real social media campaigns and creator channels."
- Embed social video carousels with optimized alt text and captions

## Summary of SEO Optimizations

- Use action keywords: "create", "generate", "build", "produce"
- Include long-tail keywords: "AI video storytelling tool", "generate social media videos", "create narrated scenes with AI"
- Use semantic HTML and structured data on testimonials, video showcase, and feature sections
- Add descriptive alt text to all showcase media