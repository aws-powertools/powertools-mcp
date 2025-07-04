import { expect, it } from 'vitest';
import { buildResponse } from '../../src/tools/shared/buildResponse.ts';

it('builds a response with text and no error', () => {
  // Prepare
  const content = 'This is a test response';

  // Act
  const response = buildResponse({ content });

  // Assess
  expect(response.content).toEqual([{ type: 'text', text: content }]);
  expect(console.debug).toHaveLogged(
    expect.objectContaining({
      message: 'Tool response',
      content,
    })
  );
});

it('builds a response with text and an error', () => {
  // Prepare
  const content = 'This is an error response';

  // Act
  const response = buildResponse({ content, isError: true });

  // Assess
  expect(response.content).toEqual([{ type: 'text', text: content }]);
  expect(response.isError).toBe(true);
  expect(console.error).toHaveLogged(
    expect.objectContaining({
      message: 'Tool response indicates an error',
      content,
    })
  );
});

it('stringifies the text content', () => {
  // Prepare
  const content = { message: 'This is a stringified response' };

  // Act
  const response = buildResponse({ content });

  // Assess
  expect(response.content).toEqual([
    {
      type: 'text',
      text: JSON.stringify(content),
    },
  ]);
});
