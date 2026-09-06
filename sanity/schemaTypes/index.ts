import { type SchemaTypeDefinition } from 'sanity'
import { property } from './property' // 1. Adım: property.ts dosyamızı projeye dahil ediyoruz

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    property, // 2. Adım: İçeri aktardığımız property formunu Sanity sistemine burada tanıtıyoruz
  ],
}