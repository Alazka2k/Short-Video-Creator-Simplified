# For each configuration of script parameter such as character perspective, pacing structure, script and vocubalary we need a dedicated example with at least 3 scenes
Options possibilities are already created in chatgpt. We need to create the examples for each option.
We need to import them then into the llm initial prompt request before sending.

## Possible options:
- 1. We can either add entries to a new database table and give each example a unique id (the id comes then from the frontend depending on the selected options)
- 2. We create corresponding json files in the data/input/llm_examples folder for each option with property definition such as title, description, scene 1, scene 2, scene 3, etc.

## "Character Perspective": [
    {
      "id": "documentary",
      "name": "Documentary Videos",
      "options": [
        {
          "id": "documentary-expert",
          "name": "Expert",
          "description": "Provides authoritative insights and analysis",
          "examples": "Scientists, historians, industry leaders",
          "tags": ["Authoritative", "Analytical", "Professional"],
          "prompt": "Expert: Provides authoritative insights and analysis. For example a Scientists, historians, industry leaders."
        },
        {
          "id": "documentary-eyewitness",
          "name": "Eyewitness",
          "description": "Offers first-hand accounts of events",
          "examples": "Participants in historical events, local residents",
          "tags": ["First-hand", "Personal", "Authentic"],
          "prompt": "Eyewitness: Offers first-hand accounts of events. For example a participant in a historical event, a local resident."
        },
        {
          "id": "documentary-affected",
          "name": "Affected Individual",
          "description": "Shares personal experiences related to the topic",
          "examples": "Patients in medical documentaries, environmental impact victims",
          "tags": ["Personal", "Emotional", "Impacted"],
          "prompt": "Affected Individual: Shares personal experiences related to the topic. For example a patient in a medical documentary, an environmental impact victim."
        }
      ]
    },
    {
      "id": "educational",
      "name": "Educational/Instructional Videos",
      "options": [
        {
          "id": "educational-instructor",
          "name": "Instructor",
          "description": "Guides learners through concepts and skills",
          "examples": "Teachers, trainers, coaches",
          "tags": ["Educational", "Guiding", "Clear"],
          "prompt": "Instructor: Guides learners through concepts and skills. For example a teacher, a trainer, a coach."
        },
        {
          "id": "educational-student",
          "name": "Student/Learner",
          "description": "Demonstrates the learning process, asks questions",
          "examples": "On-screen learner, relatable character",
          "tags": ["Learning", "Relatable", "Curious"],
          "prompt": "Student/Learner: Demonstrates the learning process, asks questions. For example an on-screen learner, a relatable character."
        },
        {
          "id": "educational-practitioner",
          "name": "Practitioner",
          "description": "Shows real-world application of knowledge",
          "examples": "Professionals in their field, experienced craftspeople",
          "tags": ["Practical", "Experienced", "Applied"],
          "prompt": "Practitioner: Shows real-world application of knowledge. For example a professional in their field, an experienced craftsperson."
        }
      ]
    },
    {
      "id": "corporate",
      "name": "Corporate/Business Videos",
      "options": [
        {
          "id": "corporate-executive",
          "name": "CEO/Executive",
          "description": "Provides vision and leadership perspective",
          "examples": "Company founders, top management",
          "tags": ["Leadership", "Strategic", "Visionary"],
          "prompt": "CEO/Executive: Provides vision and leadership perspective. For example a company founder, top management."
        },
        {
          "id": "corporate-employee",
          "name": "Employee",
          "description": "Offers insights into company culture and operations",
          "examples": "Team members, department heads",
          "tags": ["Internal", "Operational", "Cultural"],
          "prompt": "Employee: Offers insights into company culture and operations. For example a team member, a department head."
        },
        {
          "id": "corporate-client",
          "name": "Client/Partner",
          "description": "Shares experiences of working with the company",
          "examples": "Business partners, long-term clients",
          "tags": ["External", "Collaborative", "Testimonial"],
          "prompt": "Client/Partner: Shares experiences of working with the company. For example a business partner, a long-term client."
        }
      ]
    },
    {
      "id": "personal",
      "name": "Vlogs/Personal Videos",
      "options": [
        {
          "id": "personal-creator",
          "name": "Content Creator",
          "description": "Shares personal experiences and opinions",
          "examples": "Vlogger, influencer",
          "tags": ["Personal", "Authentic", "Engaging"],
          "prompt": "Content Creator: Shares personal experiences and opinions. For example a vlogger, an influencer."
        },
        {
          "id": "personal-guest",
          "name": "Guest",
          "description": "Provides additional perspectives or expertise",
          "examples": "Friends, collaborators, interviewees",
          "tags": ["Collaborative", "Fresh", "Diverse"],
          "prompt": "Guest: Provides additional perspectives or expertise. For example a friend, a collaborator, an interviewee."
        },
        {
          "id": "personal-audience",
          "name": "Audience Stand-in",
          "description": "Represents the viewer's perspective",
          "examples": "Character asking questions viewers might have",
          "tags": ["Relatable", "Inquisitive", "Representative"],
          "prompt": "Audience Stand-in: Represents the viewer's perspective. For example a character asking questions viewers might have."
        }
      ]
    }
  ]

##"Pacing Structure": [
    {
      "id": "narrative",
      "name": "Narrative Films",
      "options": [
        {
          "id": "three-act",
          "name": "Three-Act Structure",
          "description": "Slow build-up in Act 1, increasing tension in Act 2, and rapid climax in Act 3",
          "examples": "Character introduction scenes, rising action sequences, climactic finale",
          "tags": ["Structured", "Dynamic", "Progressive"],
          "prompt": "Three-Act Structure: Slow build-up in Act 1, increasing tension in Act 2, and rapid climax in Act 3. For example a character introduction scene, a rising action sequence, a climactic finale."
        },
        {
          "id": "varying-lengths",
          "name": "Varying Scene Lengths",
          "description": "Quick cuts for energy, longer takes for depth, mixing it up to prevent monotony",
          "examples": "Action montages, emotional dialogue scenes, establishing shots",
          "tags": ["Mixed", "Varied", "Dynamic"],
          "prompt": "Varying Scene Lengths: Quick cuts for energy, longer takes for depth, mixing it up to prevent monotony. For example an action montage, an emotional dialogue scene, an establishing shot."
        }
      ]
    },
    {
      "id": "documentary",
      "name": "Documentaries",
      "options": [
        {
          "id": "measured",
          "name": "Measured Pacing",
          "description": "Slower, more consistent rhythm to allow for information absorption",
          "examples": "Expert interviews, detailed explanations, archival footage",
          "tags": ["Consistent", "Informative", "Deliberate"],
          "prompt": "Measured Pacing: Slower, more consistent rhythm to allow for information absorption. For example an expert interview, a detailed explanation, an archival footage."
        },
        {
          "id": "alternating",
          "name": "Alternating Tempos",
          "description": "Slower rhythms for reflection, quicker tempos for high-energy segments",
          "examples": "Contemplative nature scenes, dramatic reenactments, news footage",
          "tags": ["Dynamic", "Balanced", "Varied"],
          "prompt": "Alternating Tempos: Slower rhythms for reflection, quicker tempos for high-energy segments. For example a contemplative nature scene, a dramatic reenactment, a news footage."
        }
      ]
    },
    {
      "id": "action",
      "name": "Action/Thriller",
      "options": [
        {
          "id": "fast-paced",
          "name": "Fast-Paced Rhythm",
          "description": "Quick cuts, dynamic camera movements, and rapid scene transitions to heighten tension",
          "examples": "Chase sequences, fight scenes, rapid montages",
          "tags": ["Dynamic", "Intense", "Energetic"],
          "prompt": "Fast-Paced Rhythm: Quick cuts, dynamic camera movements, and rapid scene transitions to heighten tension. For example a chase sequence, a fight scene, a rapid montage."
        },
        {
          "id": "contrast",
          "name": "Contrast Pacing",
          "description": "Alternating between fast and slow pacing to create unpredictability and keep viewers engaged",
          "examples": "Quiet character moments, sudden action bursts, suspense building",
          "tags": ["Unpredictable", "Engaging", "Varied"],
          "prompt": "Contrast Pacing: Alternating between fast and slow pacing to create unpredictability and keep viewers engaged. For example a quiet character moment, a sudden action burst, a suspense building."
        }
      ]
    },
    {
      "id": "educational",
      "name": "Educational/Training",
      "options": [
        {
          "id": "balanced",
          "name": "Balanced Pacing",
          "description": "Alternating between fast-paced, high-energy segments and slower, more informative sections",
          "examples": "Quick overview segments, detailed demonstrations, practice sessions",
          "tags": ["Balanced", "Educational", "Structured"],
          "prompt": "Balanced Pacing: Alternating between fast-paced, high-energy segments and slower, more informative sections. For example a quick overview segment, a detailed demonstration, a practice session."
        },
        {
          "id": "deliberate",
          "name": "Deliberate Pacing",
          "description": "Slower pace for complex concepts, allowing viewers to absorb information",
          "examples": "Step-by-step tutorials, concept explanations, review sections",
          "tags": ["Methodical", "Clear", "Thorough"],
          "prompt": "Deliberate Pacing: Slower pace for complex concepts, allowing viewers to absorb information. For example a step-by-step tutorial, a concept explanation, a review section."
        }
      ]
    },
    {
      "id": "promotional",
      "name": "Promotional Videos",
      "options": [
        {
          "id": "energetic",
          "name": "Energetic Pacing",
          "description": "Faster and more dynamic to generate enthusiasm and encourage action",
          "examples": "Product highlights, testimonial montages, call-to-action sequences",
          "tags": ["Dynamic", "Engaging", "Action-oriented"],
          "prompt": "Energetic Pacing: Faster and more dynamic to generate enthusiasm and encourage action. For example a product highlight, a testimonial montage, a call-to-action sequence."
        },
        {
          "id": "music-driven",
          "name": "Music-Driven Rhythm",
          "description": "Using upbeat music combined with quick-paced editing to create momentum",
          "examples": "Brand montages, lifestyle sequences, product demonstrations",
          "tags": ["Rhythmic", "Upbeat", "Flowing"],
          "prompt": "Music-Driven Rhythm: Using upbeat music combined with quick-paced editing to create momentum. For example a brand montage, a lifestyle sequence, a product demonstration."
        }
      ]
    }
  ]

## "Script Tone": [
    {
      "id": "documentary",
      "name": "Documentary Videos",
      "options": [
        {
          "id": "authoritative",
          "name": "Authoritative",
          "description": "Convey expertise and credibility",
          "examples": "Confident statements, well-researched facts",
          "tags": ["Expert", "Credible", "Factual"],
          "prompt": "Authoritative: Convey expertise and credibility. For example a confident statement, a well-researched fact."
        },
        {
          "id": "objective",
          "name": "Objective",
          "description": "Present information impartially, avoiding bias",
          "examples": "Balanced perspectives, neutral language",
          "tags": ["Impartial", "Balanced", "Neutral"],
          "prompt": "Objective: Present information impartially, avoiding bias. For example a balanced perspective, a neutral language."
        },
        {
          "id": "inquisitive",
          "name": "Inquisitive",
          "description": "Foster curiosity and critical thinking",
          "examples": "Thought-provoking questions, exploratory language",
          "tags": ["Curious", "Exploratory", "Engaging"],
          "prompt": "Inquisitive: Foster curiosity and critical thinking. For example a thought-provoking question, an exploratory language."
        }
      ]
    },
    {
      "id": "educational",
      "name": "Educational/Instructional",
      "options": [
        {
          "id": "encouraging",
          "name": "Encouraging",
          "description": "Motivate and support learners",
          "examples": "Positive reinforcement, empathetic language",
          "tags": ["Supportive", "Positive", "Motivating"],
          "prompt": "Encouraging: Motivate and support learners. For example a positive reinforcement, an empathetic language."
        },
        {
          "id": "patient",
          "name": "Patient",
          "description": "Explain concepts thoroughly without rushing",
          "examples": "Step-by-step instructions, repeated key points",
          "tags": ["Thorough", "Clear", "Methodical"],
          "prompt": "Patient: Explain concepts thoroughly without rushing. For example a step-by-step instruction, a repeated key point."
        },
        {
          "id": "enthusiastic",
          "name": "Enthusiastic",
          "description": "Show passion for the subject matter",
          "examples": "Energetic delivery, expressing genuine interest",
          "tags": ["Passionate", "Energetic", "Engaging"],
          "prompt": "Enthusiastic: Show passion for the subject matter. For example an energetic delivery, an expressing genuine interest."
        }
      ]
    },
    {
      "id": "promotional",
      "name": "Promotional Videos",
      "options": [
        {
          "id": "exciting",
          "name": "Exciting",
          "description": "Generate enthusiasm and interest",
          "examples": "Upbeat language, dynamic pacing",
          "tags": ["Dynamic", "Enthusiastic", "Engaging"],
          "prompt": "Exciting: Generate enthusiasm and interest. For example an upbeat language, a dynamic pacing."
        },
        {
          "id": "persuasive",
          "name": "Persuasive",
          "description": "Convince the audience to take action",
          "examples": "Emphasizing benefits, creating urgency",
          "tags": ["Convincing", "Action-oriented", "Compelling"],
          "prompt": "Persuasive: Convince the audience to take action. For example emphasizing benefits, creating urgency."
        },
        {
          "id": "confident",
          "name": "Confident",
          "description": "Project assurance in the product or service",
          "examples": "Authoritative statements, positive predictions",
          "tags": ["Assured", "Authoritative", "Positive"],
          "prompt": "Confident: Project assurance in the product or service. For example an authoritative statement, a positive prediction."
        }
      ]
    },
    {
      "id": "narrative",
      "name": "Narrative Films",
      "options": [
        {
          "id": "emotive",
          "name": "Emotive",
          "description": "Convey and evoke emotions",
          "examples": "Dramatic language, expressive dialogue",
          "tags": ["Emotional", "Dramatic", "Expressive"],
          "prompt": "Emotive: Convey and evoke emotions. For example a dramatic language, an expressive dialogue."
        },
        {
          "id": "atmospheric",
          "name": "Atmospheric",
          "description": "Create mood and ambiance",
          "examples": "Descriptive narration, tone-setting dialogue",
          "tags": ["Moody", "Descriptive", "Ambient"],
          "prompt": "Atmospheric: Create mood and ambiance. For example a descriptive narration, a tone-setting dialogue."
        },
        {
          "id": "character-driven",
          "name": "Character-Driven",
          "description": "Reflect individual personalities",
          "examples": "Unique speech patterns, character-specific attitudes",
          "tags": ["Personal", "Unique", "Authentic"],
          "prompt": "Character-Driven: Reflect individual personalities. For example a unique speech pattern, a character-specific attitude."
        }
      ]
    },
    {
      "id": "corporate",
      "name": "Corporate/Business",
      "options": [
        {
          "id": "professional",
          "name": "Professional",
          "description": "Maintain a polished, business-appropriate tone",
          "examples": "Formal language, respectful address",
          "tags": ["Polished", "Formal", "Respectful"],
          "prompt": "Professional: Maintain a polished, business-appropriate tone. For example a formal language, a respectful address."
        },
        {
          "id": "informative",
          "name": "Informative",
          "description": "Focus on clear communication of facts and data",
          "examples": "Concise explanations, relevant statistics",
          "tags": ["Clear", "Factual", "Concise"],
          "prompt": "Informative: Focus on clear communication of facts and data. For example a concise explanation, a relevant statistic."
        },
        {
          "id": "aspirational",
          "name": "Aspirational",
          "description": "Inspire confidence and ambition",
          "examples": "Future-oriented language, success-focused narrative",
          "tags": ["Inspiring", "Ambitious", "Forward-looking"],
          "prompt": "Aspirational: Inspire confidence and ambition. For example a future-oriented language, a success-focused narrative."
        }
      ]
    },
    {
      "id": "personal",
      "name": "Vlogs/Personal",
      "options": [
        {
          "id": "casual",
          "name": "Casual",
          "description": "Create a relaxed, friendly atmosphere",
          "examples": "Conversational language, personal anecdotes",
          "tags": ["Relaxed", "Friendly", "Natural"],
          "prompt": "Casual: Create a relaxed, friendly atmosphere. For example a conversational language, a personal anecdote."
        },
        {
          "id": "authentic",
          "name": "Authentic",
          "description": "Project genuineness and relatability",
          "examples": "Honest reflections, sharing real experiences",
          "tags": ["Genuine", "Relatable", "Honest"],
          "prompt": "Authentic: Project genuineness and relatability. For example an honest reflection, a sharing real experiences."
        },
        {
          "id": "interactive",
          "name": "Interactive",
          "description": "Engage directly with the audience",
          "examples": "Asking for opinions, responding to comments",
          "tags": ["Engaging", "Interactive", "Responsive"],
          "prompt": "Interactive: Engage directly with the audience. For example asking for opinions, responding to comments."
        }
      ]
    }
  ]

## "Vocabulary": [
    {
      "id": "documentary",
      "name": "Documentary Videos",
      "options": [
        {
          "id": "descriptive",
          "name": "Descriptive Language",
          "description": "Use vivid adjectives and adverbs to paint a picture",
          "examples": "Lush landscapes, gripping stories",
          "tags": ["Vivid", "Descriptive", "Engaging"],
          "prompt": "Descriptive Language: Use vivid adjectives and adverbs to paint a picture. For example a lush landscape, a gripping story."
        },
        {
          "id": "informative",
          "name": "Informative Tone",
          "description": "Focus on clarity and factual information",
          "examples": "According to recent studies...",
          "tags": ["Clear", "Factual", "Precise"],
          "prompt": "Informative Tone: Focus on clarity and factual information. For example according to recent studies."
        },
        {
          "id": "engaging-questions",
          "name": "Engaging Questions",
          "description": "Pose rhetorical questions to provoke thought",
          "examples": "What drives human curiosity?",
          "tags": ["Thought-provoking", "Interactive", "Engaging"],
          "prompt": "Engaging Questions: Pose rhetorical questions to provoke thought. For example what drives human curiosity?"
        }
      ]
    },
    {
      "id": "educational",
      "name": "Educational/Instructional",
      "options": [
        {
          "id": "clear-concise",
          "name": "Clear and Concise",
          "description": "Use straightforward vocabulary",
          "examples": "Let's explore, In this lesson, we will...",
          "tags": ["Simple", "Direct", "Clear"],
          "prompt": "Clear and Concise: Use straightforward vocabulary. For example let's explore, in this lesson, we will..."
        },
        {
          "id": "technical",
          "name": "Technical Terms",
          "description": "Introduce jargon but provide definitions",
          "examples": "Photosynthesis is the process by which...",
          "tags": ["Technical", "Educational", "Defined"],
          "prompt": "Technical Terms: Introduce jargon but provide definitions. For example photosynthesis is the process by which..."
        },
        {
          "id": "encouraging",
          "name": "Encouraging Phrases",
          "description": "Use motivational language",
          "examples": "You can do this!, Let's dive deeper!",
          "tags": ["Motivational", "Supportive", "Positive"],
          "prompt": "Encouraging Phrases: Use motivational language. For example you can do this!, let's dive deeper!"
        }
      ]
    },
    {
      "id": "promotional",
      "name": "Promotional Videos",
      "options": [
        {
          "id": "persuasive",
          "name": "Persuasive Language",
          "description": "Use compelling adjectives and action verbs",
          "examples": "Transform your life with..., Discover the benefits of...",
          "tags": ["Compelling", "Action-oriented", "Persuasive"],
          "prompt": "Persuasive Language: Use compelling adjectives and action verbs. For example transform your life with..., discover the benefits of..."
        },
        {
          "id": "call-to-action",
          "name": "Call to Action",
          "description": "Direct phrases urging immediate response",
          "examples": "Sign up today!, Don't miss out!",
          "tags": ["Urgent", "Direct", "Actionable"],
          "prompt": "Call to Action: Direct phrases urging immediate response. For example sign up today!, don't miss out!"
        },
        {
          "id": "positive",
          "name": "Positive Tone",
          "description": "Emphasize benefits and positive outcomes",
          "examples": "Join our community of satisfied customers!",
          "tags": ["Positive", "Beneficial", "Uplifting"],
          "prompt": "Positive Tone: Emphasize benefits and positive outcomes. For example join our community of satisfied customers!"
        }
      ]
    },
    {
      "id": "narrative",
      "name": "Narrative Films",
      "options": [
        {
          "id": "character-specific",
          "name": "Character-Specific",
          "description": "Tailor language to reflect character backgrounds and personalities",
          "examples": "Formal language for noble characters, slang for streetwise characters",
          "tags": ["Tailored", "Authentic", "Character-driven"],
          "prompt": "Character-Specific: Tailor language to reflect character backgrounds and personalities. For example formal language for noble characters, slang for streetwise characters."
        },
        {
          "id": "emotional",
          "name": "Emotional Expression",
          "description": "Use expressive language to convey feelings",
          "examples": "I can't believe this is happening!",
          "tags": ["Expressive", "Emotional", "Impactful"],
          "prompt": "Emotional Expression: Use expressive language to convey feelings. For example I can't believe this is happening!"
        },
        {
          "id": "imagery",
          "name": "Imagery and Metaphors",
          "description": "Employ figurative language to enhance storytelling",
          "examples": "Her smile was like sunshine on a rainy day",
          "tags": ["Figurative", "Creative", "Descriptive"],
          "prompt": "Imagery and Metaphors: Employ figurative language to enhance storytelling. For example her smile was like sunshine on a rainy day."
        }
      ]
    },
    {
      "id": "corporate",
      "name": "Corporate/Business",
  "options": [
    {
          "id": "professional",
          "name": "Professional Tone",
          "description": "Use formal vocabulary suitable for a corporate audience",
          "examples": "We aim to enhance productivity through...",
          "tags": ["Professional", "Formal", "Business"],
          "prompt": "Professional Tone: Use formal vocabulary suitable for a corporate audience. For example we aim to enhance productivity through..."
        },
        {
          "id": "industry-jargon",
          "name": "Industry Jargon",
          "description": "Incorporate relevant terminology that resonates with the target audience",
          "examples": "Synergy, ROI",
          "tags": ["Technical", "Industry-specific", "Professional"],
          "prompt": "Industry Jargon: Incorporate relevant terminology that resonates with the target audience. For example synergy, ROI."
        },
        {
          "id": "clear-objectives",
          "name": "Clear Objectives",
          "description": "State goals clearly",
          "examples": "Our mission is to..., We strive to achieve...",
          "tags": ["Clear", "Goal-oriented", "Direct"],
          "prompt": "Clear Objectives: State goals clearly. For example our mission is to..., we strive to achieve..."
        }
      ]
    },
    {
      "id": "personal",
      "name": "Vlogs/Personal",
      "options": [
        {
          "id": "conversational",
          "name": "Conversational Language",
          "description": "Use informal, relatable vocabulary",
          "examples": "Hey everyone!, I just wanted to share...",
          "tags": ["Informal", "Relatable", "Natural"],
          "prompt": "Conversational Language: Use informal, relatable vocabulary. For example hey everyone!, i just wanted to share..."
        },
        {
          "id": "personal-anecdotes",
          "name": "Personal Anecdotes",
          "description": "Include personal stories or experiences for relatability",
          "examples": "The other day, I realized...",
          "tags": ["Personal", "Relatable", "Authentic"],
          "prompt": "Personal Anecdotes: Include personal stories or experiences for relatability. For example the other day, i realized..."
        },
        {
          "id": "engagement",
          "name": "Engagement Prompts",
          "description": "Encourage interaction with viewers",
          "examples": "Let me know what you think in the comments!",
          "tags": ["Interactive", "Engaging", "Community"],
          "prompt": "Engagement Prompts: Encourage interaction with viewers. For example let me know what you think in the comments!"
        }
      ]
    }
  ]
