import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../logger.ts';

/**
 * Builds a response for a tool call.
 *
 * When `content` is anything other than a string, it will be stringified.
 *
 * @param props - properties for building the response
 * @param props.content - the content of the response
 * @param props.isError - whether the response indicates an error
 */
const buildResponse = (props: {
  content: unknown;
  isError?: boolean;
}): CallToolResult => {
  const { content, isError } = props;

  if (isError) {
    logger.error('Tool response indicates an error', { content });
  } else {
    logger.debug('Tool response', { content });
  }

  return {
    content: [
      {
        type: 'text',
        text: typeof content === 'string' ? content : JSON.stringify(content),
      },
    ],
    ...(!isError ? {} : { isError: true }),
  };
};
export { buildResponse };
