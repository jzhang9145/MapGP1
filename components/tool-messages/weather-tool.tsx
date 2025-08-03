import { Weather } from './weather';

interface WeatherToolProps {
  toolCallId: string;
  state:
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error';
  input?: any;
  output?: any;
}

export const WeatherTool = ({
  toolCallId,
  state,
  input,
  output,
}: WeatherToolProps) => {
  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="skeleton">
        <Weather />
      </div>
    );
  }

  if (state === 'output-available') {
    return (
      <div>
        <Weather weatherAtLocation={output} />
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
