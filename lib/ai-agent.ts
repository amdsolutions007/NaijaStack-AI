/**
 * AI Customer Support Agent
 * 
 * This module provides an AI-powered chatbot for customer support using OpenAI GPT-4.
 * 
 * Features:
 * - Natural language understanding
 * - Context-aware responses
 * - Nigerian English support
 * - Integration with knowledge base
 * 
 * @see https://platform.openai.com/docs/api-reference
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  context?: {
    userId?: string;
    userPlan?: string;
    previousMessages?: ChatMessage[];
  };
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  requiresHumanSupport?: boolean;
}

/**
 * AIAgent class for handling customer support conversations
 * 
 * @example
 * ```typescript
 * const agent = new AIAgent();
 * 
 * const response = await agent.chat({
 *   message: 'How do I upgrade my plan?',
 *   context: {
 *     userId: '123',
 *     userPlan: 'basic'
 *   }
 * });
 * 
 * console.log(response.message);
 * // "To upgrade your plan, visit your Dashboard..."
 * ```
 */
export class AIAgent {
  private systemPrompt: string;

  constructor() {
    this.systemPrompt = `You are a helpful customer support agent for NaijaStack-AI, a Nigerian SaaS platform.

Your role:
- Help users with technical questions about the platform
- Guide them through payment issues (Paystack)
- Explain features and pricing
- Use Nigerian English when appropriate
- Be friendly, professional, and concise

Context about NaijaStack-AI:
- Next.js 14 based SaaS starter kit
- Integrated with Paystack for Naira payments
- AI-powered features using OpenAI
- Plans: Basic (₦5,000/mo), Pro (₦15,000/mo), Enterprise (₦50,000/mo)

If you cannot answer a question or it requires account-specific actions, suggest contacting human support at support@amdsolutions007.com.`;
  }

  /**
   * Process a chat message and generate AI response
   * 
   * @param request - Chat request with user message and context
   * @returns AI-generated response
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      ...(request.context?.previousMessages || []),
      { role: 'user', content: request.message },
    ];

    // Add user context to enhance responses
    if (request.context?.userPlan) {
      messages[0].content += `\n\nUser's current plan: ${request.context.userPlan}`;
    }

    try {
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0].message.content;

      // Detect if human support is needed
      const requiresHumanSupport = this.detectHumanSupportNeeded(aiMessage);

      // Generate contextual suggestions
      const suggestions = this.generateSuggestions(request.message);

      return {
        message: aiMessage,
        suggestions,
        requiresHumanSupport,
      };
    } catch (error) {
      console.error('AI Agent error:', error);
      
      // Fallback response
      return {
        message: 'I apologize, but I encountered an error. Please contact our support team at support@amdsolutions007.com for assistance.',
        requiresHumanSupport: true,
      };
    }
  }

  /**
   * Detect if the conversation requires human intervention
   */
  private detectHumanSupportNeeded(message: string): boolean {
    const humanSupportKeywords = [
      'contact support',
      'speak to human',
      'talk to agent',
      'refund',
      'account locked',
      'payment failed',
    ];

    const messageLower = message.toLowerCase();
    return humanSupportKeywords.some(keyword => messageLower.includes(keyword));
  }

  /**
   * Generate contextual follow-up suggestions
   */
  private generateSuggestions(userMessage: string): string[] {
    const messageLower = userMessage.toLowerCase();

    if (messageLower.includes('payment') || messageLower.includes('paystack')) {
      return [
        'How do I verify a payment?',
        'What payment methods do you accept?',
        'How long do payments take to process?',
      ];
    }

    if (messageLower.includes('plan') || messageLower.includes('upgrade')) {
      return [
        'What are the differences between plans?',
        'Can I downgrade my plan?',
        'How do I cancel my subscription?',
      ];
    }

    if (messageLower.includes('api') || messageLower.includes('integration')) {
      return [
        'How do I get my API key?',
        'What are the API rate limits?',
        'Where is the API documentation?',
      ];
    }

    // Default suggestions
    return [
      'How do I get started?',
      'What features are included?',
      'How much does it cost?',
    ];
  }

  /**
   * Analyze user sentiment from message
   * Useful for prioritizing urgent support tickets
   */
  async analyzeSentiment(message: string): Promise<'positive' | 'neutral' | 'negative'> {
    // Simple keyword-based sentiment analysis
    const negativeKeywords = ['angry', 'frustrated', 'terrible', 'broken', 'useless'];
    const positiveKeywords = ['great', 'excellent', 'love', 'amazing', 'perfect'];

    const messageLower = message.toLowerCase();

    const negativeCount = negativeKeywords.filter(k => messageLower.includes(k)).length;
    const positiveCount = positiveKeywords.filter(k => messageLower.includes(k)).length;

    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  /**
   * Generate automated email response
   * Useful for support ticket systems
   */
  async generateEmailResponse(
    ticketSubject: string,
    ticketBody: string
  ): Promise<string> {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are drafting professional email responses for customer support. Be helpful, concise, and professional.',
          },
          {
            role: 'user',
            content: `Generate an email response for this support ticket:\n\nSubject: ${ticketSubject}\n\nBody: ${ticketBody}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

/**
 * Quick helper function for one-off chat queries
 */
export async function quickChat(message: string): Promise<string> {
  const agent = new AIAgent();
  const response = await agent.chat({ message });
  return response.message;
}
