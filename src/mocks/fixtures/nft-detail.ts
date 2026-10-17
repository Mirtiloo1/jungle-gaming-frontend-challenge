import { catalogFixtures } from './catalog'
import { ethToUnits } from '@/features/catalog/search'
import { unitsToEth } from '@/lib/eth'
import type { NftDetail } from '@/features/nft/types'
import { readDatabase } from '../database'

export function getNftDetail(id: string): NftDetail | undefined {
  const nft = catalogFixtures.find((item) => item.id === id)
  if (!nft) return undefined
  const market = readDatabase().nftMarket[id]
  const description =
    'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.'
  return {
    ...nft,
    price: market?.price ?? nft.price,
    tokenId: `#${nft.name.split('#')[1].padStart(4, '0')}`,
    collectionName: 'Kurio Apes',
    networkLabel:
      { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' }[
        nft.network
      ] ?? nft.network,
    description: description.replace(
      'Ethereum',
      nft.network === 'ethereum'
        ? 'Ethereum'
        : nft.network === 'polygon'
          ? 'Polygon'
          : 'Solana',
    ),
    mobileDescription: `Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na ${nft.network === 'ethereum' ? 'Ethereum' : nft.network === 'polygon' ? 'Polygon' : 'Solana'}.`,
    attributes: nft.image.includes('glasses')
      ? ['Óculos', 'Esmeralda', 'Raro']
      : nft.image.includes('hoodie')
        ? ['Chapéu', 'Violeta', 'Raro']
        : nft.image.includes('headset')
          ? ['Fones', 'Dourado', 'Raro']
          : ['Blazer', 'Marfim', 'Raro'],
    rating: 4.8,
    reviewCount: 19,
    gallery: [
      {
        id: 'portrait',
        label: 'Retrato completo',
        src: nft.image,
        scale: 1,
        origin: '50% 50%',
      },
      {
        id: 'face',
        label: 'Detalhe do rosto',
        src: nft.image,
        scale: 1.35,
        origin: '50% 25%',
      },
      {
        id: 'expression',
        label: 'Detalhe da expressão',
        src: nft.image,
        scale: 1.65,
        origin: '50% 20%',
      },
      {
        id: 'outfit',
        label: 'Detalhe da roupa',
        src: nft.image,
        scale: 1.4,
        origin: '50% 85%',
      },
    ],
    defaultEditionId: 'limited-50',
    editions: [
      {
        id: 'unique',
        label: '1/1',
        price: unitsToEth(ethToUnits(nft.price) * 5n),
        available: 0,
        maxPerOrder: 1,
      },
      {
        id: 'limited-10',
        label: '1/10',
        price: unitsToEth(ethToUnits(nft.price) * 2n),
        available: 2,
        maxPerOrder: 2,
      },
      {
        id: 'limited-50',
        label: '1/50',
        price: market?.price ?? nft.price,
        available: market?.available ?? 5,
        maxPerOrder: 5,
      },
      {
        id: 'open',
        label: 'ABERTA',
        price: market?.price ?? nft.price,
        available: 20,
        maxPerOrder: 10,
      },
    ],
    paragraphs: [
      `${nft.name} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na rede de origem. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
    ],
    contract: '0x7A42…19E8',
    creator: 'Nova Sato',
    royalty: '5%',
    reviews: Array.from({ length: 19 }, (_, index) => ({
      id: `review-${index + 1}`,
      author: ['Ana', 'Bruno', 'Clara', 'Diego', 'Elisa'][index % 5],
      rating: index < 15 ? 5 : 4,
      date: new Date(Date.UTC(2026, 8, 20 - index)).toISOString(),
      comment: [
        'Os detalhes da arte e a combinação de cores ficaram incríveis.',
        'Uma ótima peça para a coleção. Gostei muito dos atributos.',
        'A composição e a personalidade do personagem chamaram minha atenção.',
      ][index % 3],
    })),
  }
}
