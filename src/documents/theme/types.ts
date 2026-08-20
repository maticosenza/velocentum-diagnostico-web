export type DocumentTheme = {
  id: string;
  colors: {
    primary: string;
    accent: string;
    ink: string;
    muted: string;
    background: string;
    surface: string;
    surfaceSoft: string;
    border: string;
    success: string;
    warning: string;
    risk: string;
  };
  typography: {
    heading: string;
    body: string;
    weightRegular: number;
    weightMedium: number;
    weightBold: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
  };
};
