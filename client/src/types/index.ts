export interface ContactFormData {
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
}

export interface NewsItem {
  title: string;
  link: string;
  date: string;
  src: string;
}

export interface TranscriptLine {
  start: number;
  dur: number;
  text: string;
}
