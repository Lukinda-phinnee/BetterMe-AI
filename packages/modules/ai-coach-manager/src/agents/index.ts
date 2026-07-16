/**
 * AI Agent Layer - Growth Engine
 * 
 * This module contains the AI agents, prompts, and tool definitions
 * for the behavior change coaching system based on the Fogg Behavior Model (B=MAP).
 * 
 * Architecture follows the spec:
 * - Dedicated agents directory for LLM integration
 * - Swappable provider via Vercel AI SDK
 * - Typed tools for safe, auditable operations
 * - Streaming support for interactive coaching
 */

export { goalDecompositionAgent } from './goal-decomposition-agent';
export { cardSummarizationAgent } from './card-summarization-agent';
export { coachingAgent } from './coaching-agent';
export { chatAgent } from './chat-agent';
export { woopAgent } from './woop-agent';
export { habitStackingAgent } from './habit-stacking-agent';
export { tools } from './tools';
export { prompts } from './prompts';
