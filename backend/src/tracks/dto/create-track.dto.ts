export class CreateTrackDto {
  togglId?: number;
  description: string;
  start: Date;
  duration?: number;
  projectName?: string;
}
