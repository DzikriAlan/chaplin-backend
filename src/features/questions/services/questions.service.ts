import { HttpException, Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common'
import { QuestionsRepository } from '../repositories/questions.repository'
import { AiService } from '../../../shared/services/ai.service'
import type { CreateQuestionsGenerateDto, QueryQuestionsDto } from '../dto/questions.dto'

interface ParsedQuestion {
  question: string
  options?: string[]
  answer: string
  discussion?: string
}

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name)

  constructor(
    private readonly questionsRepository: QuestionsRepository,
    private readonly aiService: AiService,
  ) {}

  async getQuestionsList(query: QueryQuestionsDto) {
    try {
      return await this.questionsRepository.findQuestionsMany(query.topic)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get questions list', error)
      throw new InternalServerErrorException('Failed to get questions list')
    }
  }

  async storeQuestionsGenerate(dto: CreateQuestionsGenerateDto) {
    try {
      const { topic, count = 10, type = 'multiple_choice', gradeLevel = '' } = dto
      if (!topic) throw new BadRequestException('Topic is required')

      const queryEmbedding = await this.aiService.getEmbedding(topic)
      const vectorStr = `[${queryEmbedding.join(',')}]`
      const rows = await this.questionsRepository.findTopChunksByEmbedding(vectorStr)
      const topChunks = rows.map((r) => r.content)

      if (topChunks.length === 0) throw new BadRequestException('Tidak ada dokumen yang relevan ditemukan')

      const parsed = await this.generateQuestionsFromAI(topic, count, type, gradeLevel, topChunks)
      return this.questionsRepository.createQuestionsMany(
        parsed.map((q) => ({ topic, type, question: q.question, options: q.options, answer: q.answer, discussion: q.discussion })),
      )
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store questions generate', error)
      throw new InternalServerErrorException('Failed to generate questions')
    }
  }

  private async generateQuestionsFromAI(
    topic: string,
    count: number,
    type: string,
    gradeLevel: string,
    topChunks: string[],
  ): Promise<ParsedQuestion[]> {
    const typeLabel = type === 'multiple_choice' ? 'pilihan ganda (A, B, C, D)' : 'esai'
    const gradeInfo = gradeLevel ? `untuk ${gradeLevel}` : ''
    const material = topChunks.join('\n\n')
    const optionsTemplate = type === 'multiple_choice' ? '"options": ["A. Pilihan A", "B. Pilihan B", "C. Pilihan C", "D. Pilihan D"],' : ''
    const answerHint = type === 'multiple_choice' ? 'A' : 'Jawaban lengkap di sini'

    const prompt = `Buat ${count} soal ${typeLabel} ${gradeInfo} berdasarkan materi berikut:\n\n${material}\n\nFormat output HARUS berupa JSON array seperti ini (tanpa teks lain):\n[\n  {\n    "question": "Pertanyaan di sini?",\n    ${optionsTemplate}\n    "answer": "${answerHint}",\n    "discussion": "Pembahasan singkat"\n  }\n]\n\nPastikan soal sesuai dengan materi dan memiliki tingkat kesulitan yang bervariasi.`

    const completion = await this.aiService.deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
    })

    const raw = completion.choices[0].message.content ?? ''
    const jsonMatch = /\[[\s\S]*\]/.exec(raw)
    if (!jsonMatch) throw new BadRequestException('Format soal tidak valid')
    return JSON.parse(jsonMatch[0]) as ParsedQuestion[]
  }
}
