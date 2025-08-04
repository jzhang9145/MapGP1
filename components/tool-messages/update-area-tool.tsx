interface UpdateAreaToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: any;
}

export const UpdateAreaTool = ({
  toolCallId,
  state,
  input,
  output,
}: UpdateAreaToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="skeleton">
        <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
          <div className="size-4 rounded-full bg-green-200 animate-pulse" />
          <div className="text-green-600 text-sm">
            Updating area...
            {input?.name && ` Setting name to &quot;${input.name}&quot;`}
            {input?.summary && ` Updating summary`}
            {input?.geojson && ` Updating location`}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-available') {
    if ('error' in output) {
      return (
        <div className="text-red-500 p-2 border rounded">
          Error updating area: {String(output.error)}
        </div>
      );
    }

    return (
      <div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-4 rounded-full bg-green-500" />
            <div className="text-green-700 font-medium">
              Area {output.action === 'created' ? 'created' : 'updated'}{' '}
              successfully
            </div>
          </div>
          <div className="text-green-600 text-sm">{output.message}</div>
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
          <div className="text-green-600 text-sm">
            <strong>GeoJSON Data ID:</strong> {output?.area?.geojsonDataId}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'output-error') {
    return (
      <div className="text-red-500 p-2 border rounded">
        Error updating area: {String(output?.error || 'Unknown error')}
      </div>
    );
  }

  return null;
};
