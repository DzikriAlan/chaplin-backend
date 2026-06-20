import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

@Injectable()
export class AiService {
  private readonly deepseekClient: OpenAI

  constructor(private readonly configService: ConfigService) {
    this.deepseekClient = new OpenAI({
      apiKey: this.configService.get<string>('DEEPSEEK_API_KEY') ?? '',
      baseURL: 'https://api.deepseek.com',
    })
  }

  get deepseek(): OpenAI {
    return this.deepseekClient
  }

  async getEmbedding(text: string): Promise<number[]> {
    const jinaApiKey = this.configService.get<string>('JINA_API_KEY')
    const res = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jinaApiKey}`,
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v3',
        input: [text.slice(0, 8192)],
      }),
    })
    if (!res.ok) throw new Error(`Jina API error: ${res.statusText}`)
    const json = await res.json() as { data: Array<{ embedding: number[] }> }
    return json.data[0].embedding
  }

  chunkText(text: string, size = 1000, overlap = 200): string[] {
    const chunks: string[] = []
    let start = 0
    while (start < text.length) {
      chunks.push(text.slice(start, start + size))
      start += size - overlap
    }
    return chunks
  }
}
