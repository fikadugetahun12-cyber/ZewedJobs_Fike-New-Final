const { OpenAI } = require('openai');
const envConfig = require('./env');

/**
 * AI Configuration for Zewed Jobs
 * Features: Job matching, CV analysis, Chatbot, Content generation
 */

class AIConfig {
  constructor() {
    this.openai = null;
    this.models = {};
    this.initialize();
  }
  
  initialize() {
    if (envConfig.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: envConfig.OPENAI_API_KEY,
        timeout: 30000,
        maxRetries: 3,
      });
      
      this.models = {
        // Chat and general purpose
        GPT4: 'gpt-4',
        GPT4_TURBO: 'gpt-4-1106-preview',
        GPT3_TURBO: 'gpt-3.5-turbo',
        GPT3_TURBO_16K: 'gpt-3.5-turbo-16k',
        
        // Fine-tuned models
        JOB_MATCHER: 'ft:gpt-3.5-turbo-0613:zewed-jobs::8F4W6V7P', // Custom fine-tuned model
        CV_ANALYZER: 'ft:gpt-3.5-turbo-0613:zewed-jobs::9G5X7W8Q',
        INTERVIEW_TRAINER: 'ft:gpt-3.5-turbo-0613:zewed-jobs::1H6Y8X9R',
      };
    }
  }
  
  // Check if AI features are enabled
  isEnabled() {
    return !!this.openai;
  }
  
  // Job matching configuration
  jobMatching = {
    model: envConfig.AI_JOBS_MODEL || this.models.JOB_MATCHER || this.models.GPT3_TURBO,
    temperature: 0.3,
    maxTokens: 500,
    
    // Matching criteria weights
    weights: {
      skills: 0.35,
      experience: 0.25,
      education: 0.15,
      location: 0.10,
      salary: 0.10,
      companyCulture: 0.05,
    },
    
    // Minimum match score (0-100)
    minMatchScore: 60,
    
    // Prompts for job matching
    prompts: {
      analyzeJob: `Analyze this job description and extract:
      1. Required skills (list)
      2. Required experience (years, level)
      3. Education requirements
      4. Location preference
      5. Salary range if mentioned
      6. Company culture indicators
      
      Job Description: {jobDescription}`,
      
      analyzeCandidate: `Analyze this candidate profile and extract:
      1. Skills (list with proficiency levels)
      2. Work experience (years, roles)
      3. Education background
      4. Location preferences
      5. Salary expectations
      6. Career goals
      
      Candidate Profile: {candidateProfile}`,
      
      calculateMatch: `Calculate match score between job requirements and candidate profile.
      Job Requirements: {jobRequirements}
      Candidate Profile: {candidateProfile}
      
      Return JSON format: {
        score: number (0-100),
        strengths: [string],
        weaknesses: [string],
        recommendations: [string]
      }`,
    },
  };
  
  // CV/Resume analysis configuration
  cvAnalysis = {
    model: this.models.CV_ANALYZER || this.models.GPT3_TURBO,
    temperature: 0.2,
    maxTokens: 1000,
    
    analysisTypes: {
      STRUCTURE: 'structure',
      CONTENT: 'content',
      ATS: 'ats', // Applicant Tracking System optimization
      SKILLS: 'skills',
      EXPERIENCE: 'experience',
    },
    
    // ATS keywords for Ethiopian job market
    atsKeywords: {
      technical: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes'],
      business: ['Project Management', 'Marketing', 'Sales', 'Finance', 'HR', 'Operations'],
      softSkills: ['Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Adaptability'],
      languages: ['Amharic', 'English', 'Oromiffa', 'Tigrinya', 'Arabic'],
    },
    
    prompts: {
      analyzeCV: `Analyze this CV/resume and provide detailed feedback:
      1. Structure and formatting (scale 1-10)
      2. Content completeness (scale 1-10)
      3. ATS optimization score (scale 1-10)
      4. Skills presentation
      5. Experience description
      6. Key strengths
      7. Areas for improvement
      8. Specific recommendations for Ethiopian job market
      
      CV Content: {cvContent}`,
      
      extractSkills: `Extract all skills from this CV with proficiency level:
      - Technical skills
      - Soft skills
      - Language skills
      - Certifications
      
      CV Content: {cvContent}
      
      Return JSON format: {
        technical: [{skill: string, level: string}],
        soft: [string],
        languages: [{language: string, proficiency: string}],
        certifications: [string]
      }`,
    },
  };
  
  // Interview preparation configuration
  interviewPrep = {
    model: this.models.INTERVIEW_TRAINER || this.models.GPT3_TURBO,
    temperature: 0.7,
    maxTokens: 800,
    
    questionTypes: {
      TECHNICAL: 'technical',
      BEHAVIORAL: 'behavioral',
      CULTURAL: 'cultural',
      SITUATIONAL: 'situational',
      ETHIOPIAN_CONTEXT: 'ethiopian_context',
    },
    
    // Industry-specific questions
    industries: {
      it: 'Information Technology',
      finance: 'Banking & Finance',
      healthcare: 'Healthcare',
      education: 'Education',
      manufacturing: 'Manufacturing',
      agriculture: 'Agriculture',
      construction: 'Construction',
    },
    
    prompts: {
      generateQuestions: `Generate {count} interview questions for a {position} role in {industry} industry.
      Include:
      - {technicalCount} technical questions
      - {behavioralCount} behavioral questions
      - {culturalCount} company culture questions
      - {situationalCount} situational questions
      - {ethiopianCount} questions specific to Ethiopian context
      
      Also provide model answers for each question.`,
      
      mockInterview: `Conduct a mock interview for {position} role.
      Ask one question at a time and wait for response.
      After each response, provide feedback and score (1-10).
      Focus on: clarity, relevance, depth, and professionalism.`,
    },
  };
  
  // Chatbot configuration
  chatbot = {
    model: envConfig.AI_CHAT_MODEL || this.models.GPT3_TURBO,
    temperature: 0.8,
    maxTokens: 300,
    systemPrompt: `You are Zewe, the AI assistant for Zewed Jobs Ethiopia.
    Your purpose is to help job seekers, employers, and students with:
    1. Job search guidance
    2. CV/resume tips
    3. Interview preparation
    4. Career advice for Ethiopian market
    5. Platform navigation help
    6. Answering FAQs about Zewed Jobs
    
    Always be polite, professional, and culturally aware.
    Provide specific, actionable advice.
    If you don't know something, admit it and suggest contacting support.
    
    Respond in the same language as the user (Amharic, English, etc.).
    
    Current date: ${new Date().toISOString().split('T')[0]}`,
    
    contexts: {
      JOB_SEARCH: 'job_search',
      CV_HELP: 'cv_help',
      INTERVIEW: 'interview',
      CAREER: 'career',
      PLATFORM: 'platform',
      GENERAL: 'general',
    },
    
    // Quick responses for common queries
    quickResponses: {
      greeting: 'Hello! I\'m Zewe, your AI career assistant at Zewed Jobs. How can I help you today?',
      goodbye: 'Thank you for chatting! Wishing you success in your job search. ይስጥልኝ!',
      help: 'I can help you with job search, CV tips, interview prep, and career advice. What do you need help with?',
      contact: 'For specific account or payment issues, please contact our support team at support@zewedjobs.com or call +251 911 234 567.',
    },
  };
  
  // Content generation configuration
  contentGeneration = {
    model: this.models.GPT4_TURBO || this.models.GPT4,
    temperature: 0.7,
    maxTokens: 1500,
    
    contentTypes: {
      JOB_DESCRIPTION: 'job_description',
      COMPANY_PROFILE: 'company_profile',
      BLOG_POST: 'blog_post',
      NEWSLETTER: 'newsletter',
      SOCIAL_MEDIA: 'social_media',
      EMAIL_TEMPLATE: 'email_template',
    },
    
    tones: {
      PROFESSIONAL: 'professional',
      FRIENDLY: 'friendly',
      INSPIRATIONAL: 'inspirational',
      URGENT: 'urgent',
      FORMAL: 'formal',
    },
    
    prompts: {
      generateJobDescription: `Generate a compelling job description for {position} at {company}.
      Industry: {industry}
      Location: {location}
      Key requirements: {requirements}
      Company culture: {culture}
      
      Include:
      1. Attractive job title
      2. Company overview
      3. Job responsibilities
      4. Required qualifications
      5. Preferred skills
      6. Benefits and perks
      7. How to apply
      
      Tone: {tone}
      Target audience: {audience}`,
      
      generateBlogPost: `Write a blog post about {topic} for Ethiopian professionals.
      Target audience: {audience}
      Word count: {wordCount}
      Tone: {tone}
      
      Include:
      1. Engaging headline
      2. Introduction
      3. Key points with examples
      4. Practical tips
      5. Conclusion
      6. Call to action for Zewed Jobs`,
    },
  };
  
  // Analytics and insights configuration
  analytics = {
    model: this.models.GPT4,
    temperature: 0.2,
    maxTokens: 1000,
    
    analysisTypes: {
      MARKET_TRENDS: 'market_trends',
      SALARY_INSIGHTS: 'salary_insights',
      SKILL_DEMAND: 'skill_demand',
      COMPETITOR_ANALYSIS: 'competitor_analysis',
      USER_BEHAVIOR: 'user_behavior',
    },
    
    prompts: {
      analyzeTrends: `Analyze this job market data and identify key trends:
      Data: {data}
      
      Provide insights on:
      1. High-demand job roles
      2. Emerging skills
      3. Salary trends
      4. Geographic hotspots
      5. Industry growth areas
      6. Recommendations for job seekers
      7. Recommendations for employers`,
      
      predictSalary: `Predict salary range for {position} in {location}, Ethiopia.
      Experience level: {experience}
      Industry: {industry}
      Company size: {companySize}
      
      Base prediction on:
      1. Current market data
      2. Industry standards
      3. Location factors
      4. Experience level
      5. Supply and demand`,
    },
  };
  
  // Methods for AI operations
  async generateText(prompt, options = {}) {
    if (!this.isEnabled()) {
      throw new Error('AI features are not enabled');
    }
    
    const defaultOptions = {
      model: this.models.GPT3_TURBO,
      temperature: 0.7,
      maxTokens: 500,
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
      const response = await this.openai.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });
      
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }
  
  async analyzeJobMatch(jobDescription, candidateProfile) {
    const prompt = this.jobMatching.prompts.calculateMatch
      .replace('{jobRequirements}', JSON.stringify(jobDescription))
      .replace('{candidateProfile}', JSON.stringify(candidateProfile));
    
    const response = await this.generateText(prompt, {
      model: this.jobMatching.model,
      temperature: this.jobMatching.temperature,
      maxTokens: this.jobMatching.maxTokens,
    });
    
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        score: 0,
        strengths: [],
        weaknesses: [],
        recommendations: ['AI analysis failed. Please try manual review.'],
      };
    }
  }
  
  async analyzeCV(cvContent, analysisType = 'content') {
    const prompt = this.cvAnalysis.prompts.analyzeCV
      .replace('{cvContent}', cvContent);
    
    const response = await this.generateText(prompt, {
      model: this.cvAnalysis.model,
      temperature: this.cvAnalysis.temperature,
      maxTokens: this.cvAnalysis.maxTokens,
    });
    
    return response;
  }
  
  async chat(message, context = 'general', history = []) {
    const systemPrompt = this.chatbot.systemPrompt;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // Last 10 messages for context
      { role: 'user', content: message },
    ];
    
    const response = await this.openai.chat.completions.create({
      model: this.chatbot.model,
      messages,
      temperature: this.chatbot.temperature,
      max_tokens: this.chatbot.maxTokens,
    });
    
    return {
      response: response.choices[0]?.message?.content || '',
      context,
      timestamp: new Date().toISOString(),
    };
  }
  
  // Rate limiting for AI calls
  rateLimit = {
    maxRequestsPerMinute: 60,
    maxRequestsPerDay: 1000,
    requests: new Map(),
    
    checkLimit(userId) {
      const now = Date.now();
      const userRequests = this.requests.get(userId) || [];
      
      // Clean old requests
      const recentRequests = userRequests.filter(time => 
        now - time < 24 * 60 * 60 * 1000 // Last 24 hours
      );
      
      // Check daily limit
      if (recentRequests.length >= this.maxRequestsPerDay) {
        return { allowed: false, reason: 'Daily limit exceeded' };
      }
      
      // Check minute limit
      const lastMinuteRequests = recentRequests.filter(time => 
        now - time < 60 * 1000
      );
      
      if (lastMinuteRequests.length >= this.maxRequestsPerMinute) {
        return { allowed: false, reason: 'Rate limit exceeded' };
      }
      
      // Add current request
      recentRequests.push(now);
      this.requests.set(userId, recentRequests);
      
      return { allowed: true, remaining: this.maxRequestsPerDay - recentRequests.length };
    },
  };
}

// Singleton instance
const aiConfig = new AIConfig();

module.exports = aiConfig;
