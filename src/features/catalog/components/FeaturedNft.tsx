export default function FeaturedNft() {
  return (
    <section
      aria-labelledby="featured-nft-title"
      className="overflow-hidden bg-linear-to-br from-secondary via-card to-background"
    >
      <div className="px-5 pt-6 pb-2">
        <h3
          id="featured-nft-title"
          className="text-xl font-bold text-highlight uppercase"
        >
          NFT em destaque
        </h3>
        <p className="mt-3 text-center text-lg font-bold uppercase">
          Oferta limitada
        </p>
      </div>

      <img
        src="/assets/images/ape-hoodie.png"
        alt="NFT em destaque: macaco com chapéu verde e moletom roxo"
        width={310}
        height={365}
        loading="lazy"
        className="aspect-[310/365] w-full rounded-3xl object-cover"
      />
    </section>
  )
}
