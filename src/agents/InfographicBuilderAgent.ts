export interface InfographicBuilderInput {
  images: string[];
  textBlocks: string[];
}

export interface InfographicPanel {
  image: string;
  text: string;
}

export interface InfographicBuilderOutput {
  panels: InfographicPanel[];
}

export class InfographicBuilderAgent {
  async build(input: InfographicBuilderInput): Promise<InfographicBuilderOutput> {
    const panels: InfographicPanel[] = [];

    const maxLen = Math.min(input.images.length, input.textBlocks.length);
    for (let i = 0; i < maxLen; i++) {
      panels.push({
        image: input.images[i],
        text: input.textBlocks[i]
      });
    }

    return { panels };
  }
}
