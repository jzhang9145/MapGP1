import { DocumentPreview } from '../document-preview';
import { DocumentToolCall, DocumentToolResult } from '../document';

interface DocumentToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: any;
  isReadonly: boolean;
}

export const CreateDocumentTool = ({
  toolCallId,
  state,
  input,
  output,
  isReadonly,
}: DocumentToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div>
        <DocumentPreview isReadonly={isReadonly} args={input} />
      </div>
    );
  }

  if (state === 'output-available') {
    if ('error' in output) {
      return (
        <div className="text-red-500 p-2 border rounded">
          Error: {String(output.error)}
        </div>
      );
    }

    return (
      <div>
        <DocumentPreview isReadonly={isReadonly} result={output} />
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="text-red-500 p-2 border rounded">
        Error: {String(output?.error || 'Unknown error')}
      </div>
    );
  }

  return null;
};

export const UpdateDocumentTool = ({
  toolCallId,
  state,
  input,
  output,
  isReadonly,
}: DocumentToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div>
        <DocumentToolCall type="update" args={input} isReadonly={isReadonly} />
      </div>
    );
  }

  if (state === 'output-available') {
    if ('error' in output) {
      return (
        <div className="text-red-500 p-2 border rounded">
          Error: {String(output.error)}
        </div>
      );
    }

    return (
      <div>
        <DocumentToolResult
          type="update"
          result={output}
          isReadonly={isReadonly}
        />
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="text-red-500 p-2 border rounded">
        Error: {String(output?.error || 'Unknown error')}
      </div>
    );
  }

  return null;
};

export const RequestSuggestionsTool = ({
  toolCallId,
  state,
  input,
  output,
  isReadonly,
}: DocumentToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div>
        <DocumentToolCall
          type="request-suggestions"
          args={input}
          isReadonly={isReadonly}
        />
      </div>
    );
  }

  if (state === 'output-available') {
    if ('error' in output) {
      return (
        <div className="text-red-500 p-2 border rounded">
          Error: {String(output.error)}
        </div>
      );
    }

    return (
      <div>
        <DocumentToolResult
          type="request-suggestions"
          result={output}
          isReadonly={isReadonly}
        />
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="text-red-500 p-2 border rounded">
        Error: {String(output?.error || 'Unknown error')}
      </div>
    );
  }

  return null;
};
