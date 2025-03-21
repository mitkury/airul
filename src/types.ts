export interface AirulConfig {
  /**
   * Base directory for output files. Defaults to process.cwd()
   */
  baseDir?: string;
  
  /**
   * Source files to generate rules from
   */
  sources: string[];
  
  /**
   * Output configuration
   */
  output: {
    windsurf?: boolean;
    cursor?: boolean;
    copilot?: boolean;
    cline?: boolean;
    claude?: boolean;
    customPath?: string;
  };

  /**
   * Template configuration
   */
  template?: {
    header?: string;
    fileHeader?: string;
    separator?: string;
  };

  /**
   * Files to ignore
   */
  ignore?: string[];
}

export interface EditorOptions {
  cursor?: boolean;
  windsurf?: boolean;
  copilot?: boolean;
  cline?: boolean;
  claude?: boolean;
}

export interface GenerateOptions {
  sources?: string[];
  output?: {
    cursor?: boolean;
    windsurf?: boolean;
    copilot?: boolean;
    cline?: boolean;
    claude?: boolean;
    customPath?: string;
  };
  template?: {
    fileHeader?: string;
    separator?: string;
  };
  baseDir?: string;
}
