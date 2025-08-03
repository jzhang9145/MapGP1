'use client';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { WebSearch } from './web-search';

// Type narrowing is handled by TypeScript's control flow analysis
// The AI SDK provides proper discriminated unions for tool calls

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === 'file',
  );

  useDataStream();

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {attachmentsFromMessage.length > 0 && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {attachmentsFromMessage.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={{
                      name: attachment.filename ?? 'file',
                      contentType: attachment.mediaType,
                      url: attachment.url,
                    }}
                  />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning' && part.text?.trim().length > 0) {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.text}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                            message.role === 'user',
                        })}
                      >
                        <Markdown>{sanitizeText(part.text)}</Markdown>
                      </div>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        regenerate={regenerate}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-getWeather') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  return (
                    <div key={toolCallId} className="skeleton">
                      <Weather />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;
                  return (
                    <div key={toolCallId}>
                      <Weather weatherAtLocation={output} />
                    </div>
                  );
                }
              }

              if (type === 'tool-createDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentPreview isReadonly={isReadonly} args={input} />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentPreview
                        isReadonly={isReadonly}
                        result={output}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-updateDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;

                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="update"
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="update"
                        result={output}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-requestSuggestions') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="request-suggestions"
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="request-suggestions"
                        result={output}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-webSearch') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId} className="skeleton">
                      <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                        <div className="size-4 rounded-full bg-blue-200 animate-pulse" />
                        <div className="text-blue-600 text-sm">
                          Searching for &quot;{input.query}&quot;...
                        </div>
                      </div>
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <WebSearch webSearchData={output} />
                    </div>
                  );
                }
              }

              if (type === 'tool-readJSON') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId} className="skeleton">
                      <div className="flex items-center gap-2 p-4 bg-orange-50 rounded-lg">
                        <div className="size-4 rounded-full bg-orange-200 animate-pulse" />
                        <div className="text-orange-600 text-sm">
                          Reading JSON from &quot;{input.url}&quot;...
                          {input.extractFields &&
                            input.extractFields.length > 0 && (
                              <span>
                                {' '}
                                Extracting fields:{' '}
                                {input.extractFields.join(', ')}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error reading JSON: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-4 rounded-full bg-orange-500" />
                          <div className="text-orange-700 font-medium">
                            JSON file read successfully
                          </div>
                        </div>
                        <div className="text-orange-600 text-sm mb-2">
                          <strong>URL:</strong> {output.url}
                        </div>
                        <div className="text-sm text-orange-600">
                          <div>
                            <strong>Content Type:</strong> {output.contentType}
                          </div>
                          <div>
                            <strong>Content Length:</strong>{' '}
                            {output.contentLength} characters
                          </div>
                          <div>
                            <strong>Data Type:</strong> {output.dataType}
                          </div>
                          {output.isArray && (
                            <div>
                              <strong>Array Length:</strong>{' '}
                              {output.arrayLength}
                            </div>
                          )}
                          {output.geojsonType && (
                            <div>
                              <strong>GeoJSON Type:</strong>{' '}
                              {output.geojsonType}
                            </div>
                          )}
                          {output.featureCount && (
                            <div>
                              <strong>Features:</strong> {output.featureCount}
                            </div>
                          )}
                          {output.featureNames &&
                            output.featureNames.length > 0 && (
                              <div>
                                <strong>Feature Names:</strong>{' '}
                                {output.featureNames.join(', ')}
                              </div>
                            )}
                          {output.featureName && (
                            <div>
                              <strong>Feature Name:</strong>{' '}
                              {output.featureName}
                            </div>
                          )}
                          {output.keys && (
                            <div>
                              <strong>Top Level Keys:</strong>{' '}
                              {output.keys.join(', ')}
                            </div>
                          )}
                          {output.extractedFields &&
                            Object.keys(output.extractedFields).length > 0 && (
                              <div>
                                <strong>Extracted Fields:</strong>
                                <pre className="text-xs mt-1 bg-orange-100 p-2 rounded">
                                  {JSON.stringify(
                                    output.extractedFields,
                                    null,
                                    2,
                                  )}
                                </pre>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                }
              }

              if (type === 'tool-nycNeighborhoods') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId} className="skeleton">
                      <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                        <div className="size-4 rounded-full bg-blue-200 animate-pulse" />
                        <div className="text-blue-600 text-sm">
                          Fetching NYC neighborhoods...
                          {input.borough !== 'All' && ` for ${input.borough}`}
                          {input.format === 'summary' && ' (summary format)'}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error fetching NYC neighborhoods: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-4 rounded-full bg-blue-500" />
                          <div className="text-blue-700 font-medium">
                            NYC Neighborhoods Data
                          </div>
                        </div>
                        <div className="text-blue-600 text-sm mb-2">
                          <strong>Source:</strong> {output.source} -{' '}
                          {output.dataset}
                        </div>
                        <div className="text-sm text-blue-600">
                          <div>
                            <strong>Borough:</strong> {output.borough}
                          </div>
                          {output.format === 'summary' ? (
                            <>
                              <div>
                                <strong>Total Neighborhoods:</strong>{' '}
                                {(output as any).totalNeighborhoods}
                              </div>
                              {(output as any).boroughCounts && (
                                <div>
                                  <strong>By Borough:</strong>
                                  <ul className="ml-4 mt-1">
                                    {Object.entries(
                                      (output as any).boroughCounts,
                                    ).map(([borough, count]) => (
                                      <li key={borough}>
                                        • {borough}: {String(count)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {(output as any).neighborhoods &&
                                (output as any).neighborhoods.length > 0 && (
                                  <div>
                                    <strong>Sample Neighborhoods:</strong>
                                    <ul className="ml-4 mt-1">
                                      {(output as any).neighborhoods
                                        .slice(0, 5)
                                        .map((neighborhood: any) => (
                                          <li key={neighborhood.name}>
                                            • {neighborhood.name} (
                                            {neighborhood.borough})
                                          </li>
                                        ))}
                                    </ul>
                                  </div>
                                )}
                            </>
                          ) : (
                            <>
                              <div>
                                <strong>Total Features:</strong>{' '}
                                {output.totalFeatures}
                              </div>
                              {output.summary?.boroughs && (
                                <div>
                                  <strong>Boroughs:</strong>{' '}
                                  {output.summary.boroughs.join(', ')}
                                </div>
                              )}
                              {output.summary?.neighborhoods && (
                                <div>
                                  <strong>Neighborhoods:</strong>
                                  <div className="text-xs mt-1 bg-blue-100 p-2 rounded max-h-20 overflow-y-auto">
                                    {output.summary.neighborhoods
                                      .slice(0, 10)
                                      .join(', ')}
                                    {output.summary.neighborhoods.length > 10 &&
                                      '...'}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              }

              if (type === 'tool-updateArea') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId} className="skeleton">
                      <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                        <div className="size-4 rounded-full bg-green-200 animate-pulse" />
                        <div className="text-green-600 text-sm">
                          Updating area...
                          {input.name &&
                            ` Setting name to &quot;${input.name}&quot;`}
                          {input.summary && ` Updating summary`}
                          {input.geojson && ` Updating location`}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error updating area: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-4 rounded-full bg-green-500" />
                          <div className="text-green-700 font-medium">
                            Area{' '}
                            {output.action === 'created'
                              ? 'created'
                              : 'updated'}{' '}
                            successfully
                          </div>
                        </div>
                        <div className="text-green-600 text-sm">
                          {output.message}
                        </div>
                        {output.area && (
                          <div className="mt-2 text-sm text-green-600">
                            <div>
                              <strong>Name:</strong> {output.area.name}
                            </div>
                            <div>
                              <strong>Summary:</strong> {output.area.summary}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return false;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
