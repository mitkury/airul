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

export interface GenerateOptions extends AirulConfig {}
