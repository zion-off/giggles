export class GigglesError extends Error {
  constructor(message: string) {
    super(`[giggles] ${message}`);
    this.name = 'GigglesError';
  }
}
