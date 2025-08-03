interface ReadJSONToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: any;
}

export const ReadJSONTool = ({
  toolCallId,
  state,
  input,
  output,
}: ReadJSONToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="skeleton">
        <div className="flex items-center gap-2 p-4 bg-orange-50 rounded-lg">
          <div className="size-4 rounded-full bg-orange-200 animate-pulse" />
          <div className="text-orange-600 text-sm">
            Reading JSON from &quot;{input?.url}&quot;...
            {input?.extractFields && input.extractFields.length > 0 && (
              <span> Extracting fields: {input.extractFields.join(', ')}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-available') {
    if ('error' in output) {
      return (
        <div className="text-red-500 p-2 border rounded">
          Error reading JSON: {String(output.error)}
        </div>
      );
    }

    return (
      <div>
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
              <strong>Content Length:</strong> {output.contentLength} characters
            </div>
            <div>
              <strong>Data Type:</strong> {output.dataType}
            </div>
            {output.isArray && (
              <div>
                <strong>Array Length:</strong> {output.arrayLength}
              </div>
            )}
            {output.geojsonType && (
              <div>
                <strong>GeoJSON Type:</strong> {output.geojsonType}
              </div>
            )}
            {output.featureCount && (
              <div>
                <strong>Features:</strong> {output.featureCount}
              </div>
            )}
            {output.featureNames && output.featureNames.length > 0 && (
              <div>
                <strong>Feature Names:</strong> {output.featureNames.join(', ')}
              </div>
            )}
            {output.featureName && (
              <div>
                <strong>Feature Name:</strong> {output.featureName}
              </div>
            )}
            {output.keys && (
              <div>
                <strong>Top Level Keys:</strong> {output.keys.join(', ')}
              </div>
            )}
            {output.extractedFields &&
              Object.keys(output.extractedFields).length > 0 && (
                <div>
                  <strong>Extracted Fields:</strong>
                  <pre className="text-xs mt-1 bg-orange-100 p-2 rounded">
                    {JSON.stringify(output.extractedFields, null, 2)}
                  </pre>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="text-red-500 p-2 border rounded">
        Error reading JSON: {String(output?.error || 'Unknown error')}
      </div>
    );
  }

  return null;
};
