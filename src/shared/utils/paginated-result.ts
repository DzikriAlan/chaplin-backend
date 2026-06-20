export class PaginatedResult<T> {
  constructor(
    readonly data: T[],
    readonly total: number,
    readonly limit: number,
    readonly offset: number,
  ) {}
}
