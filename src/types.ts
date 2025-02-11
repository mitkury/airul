export interface AirulConfig {
  sources: string[];
  output: {
    windsurf: boolean;
    cursor: boolean;
    customPath?: string;
  };
  template?: {
    header?: string;
    fileHeader?: string;
    separator?: string;
  };
  ignore?: string[];
}

export interface GenerateOptions extends AirulConfig {}
