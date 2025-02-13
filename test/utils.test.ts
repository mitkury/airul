import { getEditorOptions } from '../src/utils';

describe('getEditorOptions', () => {
  it('should handle empty options', () => {
    const options = getEditorOptions({});
    expect(options).toEqual({
      cursor: undefined,
      windsurf: undefined,
      copilot: undefined,
      cline: undefined
    });
  });

  it('should pass through editor flags', () => {
    const options = getEditorOptions({
      cursor: true,
      windsurf: true,
      copilot: true,
      cline: true
    });
    expect(options).toEqual({
      cursor: true,
      windsurf: true,
      copilot: true,
      cline: true
    });
  });

  it('should handle --code as alias for --copilot', () => {
    // With only code flag
    expect(getEditorOptions({ code: true })).toEqual({
      cursor: undefined,
      windsurf: undefined,
      copilot: true,
      cline: undefined
    });

    // With both flags
    expect(getEditorOptions({ code: true, copilot: true })).toEqual({
      cursor: undefined,
      windsurf: undefined,
      copilot: true,
      cline: undefined
    });

    // With conflicting values
    expect(getEditorOptions({ code: true, copilot: false })).toEqual({
      cursor: undefined,
      windsurf: undefined,
      copilot: true,
      cline: undefined
    });
  });

  it('should handle false values', () => {
    const options = getEditorOptions({
      cursor: false,
      windsurf: false,
      copilot: false,
      code: false,
      cline: false
    });
    expect(options).toEqual({
      cursor: false,
      windsurf: false,
      copilot: false,
      cline: false
    });
  });

  it('should handle mixed values', () => {
    const options = getEditorOptions({
      cursor: true,
      windsurf: false,
      code: true,
      cline: undefined
    });
    expect(options).toEqual({
      cursor: true,
      windsurf: false,
      copilot: true,
      cline: undefined
    });
  });
}); 