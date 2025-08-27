import type { ChatMessage } from '@/lib/types';

/**
 * Context window management for chat conversations
 * Prevents "context_length_exceeded" errors by intelligently truncating messages
 */

// Conservative token estimation (1 token ≈ 3 characters for safety, accounting for varied tokenization)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

// Extract text content from a message for token counting
function getMessageText(message: ChatMessage): string {
  return message.parts
    .map((part) => {
      if (part.type === 'text') {
        return part.text;
      }
      // For tool calls, count the tool name and basic params (not full output)
      if (part.type?.startsWith('tool-')) {
        return `[${part.type}]`;
      }
      return '';
    })
    .join(' ');
}

// Estimate tokens in a message
function estimateMessageTokens(message: ChatMessage): number {
  const text = getMessageText(message);
  // Add significant overhead for role, metadata, structure, and tool definitions
  let baseTokens = estimateTokens(text) + 100;

  // Add extra tokens for tool calls and complex message parts
  const toolParts = message.parts.filter((part) =>
    part.type?.startsWith('tool-'),
  );
  if (toolParts.length > 0) {
    baseTokens += toolParts.length * 200; // Tool calls can be token-heavy
  }

  return baseTokens;
}

/**
 * Truncate messages to fit within context window while preserving important context
 *
 * Strategy:
 * 1. Always keep the system message
 * 2. Always keep the last few messages (recent context)
 * 3. Keep tool results from recent queries when possible
 * 4. Remove middle messages if needed
 */
export function truncateMessagesForContext(
  messages: ChatMessage[],
  maxTokens = 80000, // Very conservative limit for GPT-4o (128k context, but leave room for system prompt + tools)
  keepRecentMessages = 6, // Reduce recent messages to be more aggressive
): {
  truncatedMessages: ChatMessage[];
  removedCount: number;
  estimatedTokens: number;
} {
  if (messages.length === 0) {
    return { truncatedMessages: [], removedCount: 0, estimatedTokens: 0 };
  }

  // Always keep system messages and recent messages
  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  // Keep the most recent messages
  const recentMessages = nonSystemMessages.slice(-keepRecentMessages);

  // Calculate tokens for essential messages
  const systemTokens = systemMessages.reduce(
    (sum, msg) => sum + estimateMessageTokens(msg),
    0,
  );
  const recentTokens = recentMessages.reduce(
    (sum, msg) => sum + estimateMessageTokens(msg),
    0,
  );

  const essentialTokens = systemTokens + recentTokens;

  // If essential messages already exceed limit, just keep system + fewer recent
  if (essentialTokens > maxTokens) {
    const minRecentMessages = Math.min(3, recentMessages.length);
    const minimalMessages = [
      ...systemMessages,
      ...recentMessages.slice(-minRecentMessages),
    ];

    const minimalTokens = minimalMessages.reduce(
      (sum, msg) => sum + estimateMessageTokens(msg),
      0,
    );

    return {
      truncatedMessages: minimalMessages,
      removedCount: messages.length - minimalMessages.length,
      estimatedTokens: minimalTokens,
    };
  }

  // Try to include older messages while staying under limit
  const olderMessages = nonSystemMessages.slice(0, -keepRecentMessages);

  const includedOlderMessages: ChatMessage[] = [];
  let currentTokens = essentialTokens;

  // Include older messages from most recent backwards while we have token budget
  for (let i = olderMessages.length - 1; i >= 0; i--) {
    const messageTokens = estimateMessageTokens(olderMessages[i]);

    if (currentTokens + messageTokens <= maxTokens) {
      includedOlderMessages.unshift(olderMessages[i]);
      currentTokens += messageTokens;
    } else {
      break;
    }
  }

  const finalMessages = [
    ...systemMessages,
    ...includedOlderMessages,
    ...recentMessages,
  ];

  return {
    truncatedMessages: finalMessages,
    removedCount: messages.length - finalMessages.length,
    estimatedTokens: currentTokens,
  };
}

/**
 * Check if messages might exceed context window
 */
export function shouldTruncateMessages(messages: ChatMessage[]): boolean {
  const totalTokens = messages.reduce(
    (sum, msg) => sum + estimateMessageTokens(msg),
    0,
  );
  return totalTokens > 60000; // Start truncating much earlier to prevent context issues
}

/**
 * Emergency aggressive truncation for when standard truncation isn't enough
 */
export function emergencyTruncateMessages(
  messages: ChatMessage[],
  maxTokens = 40000, // Very aggressive limit
): {
  truncatedMessages: ChatMessage[];
  removedCount: number;
  estimatedTokens: number;
} {
  if (messages.length === 0) {
    return { truncatedMessages: [], removedCount: 0, estimatedTokens: 0 };
  }

  // Keep only system messages and the last 3 messages (absolute minimum)
  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');
  const recentMessages = nonSystemMessages.slice(-3);

  const minimalMessages = [...systemMessages, ...recentMessages];
  const estimatedTokens = minimalMessages.reduce(
    (sum, msg) => sum + estimateMessageTokens(msg),
    0,
  );

  return {
    truncatedMessages: minimalMessages,
    removedCount: messages.length - minimalMessages.length,
    estimatedTokens,
  };
}
