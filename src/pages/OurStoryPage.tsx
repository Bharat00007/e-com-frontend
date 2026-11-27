import React from 'react';
import { Link } from 'react-router-dom';

const QUARRY_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAlkcP87xEEIVm2ThLlNHs7173Waky-QwMBEsdlBxwewhSuaV5uz9fJzhiMH1kTUevqfWawJGEX7X1500nrTdOf216KpfBo4_b56e6HJPVs7hmC1TFYJALU-qEhpZHeU8USLMSJHwsiY2CtNPmcHw7tXMGfcJnzqi_l0XWvjLoEi1KRGPLTcWWPPJrGy6YCqi2HGRwws6g8J615Rh-kLREeZNAxJHoT3fKpv_xGjJc_';

const LIFESTYLE_CAT_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAERyYAR2rPhW2u0ZtjU4e3UE2HF_YyzkDt3uRJfaPmwCMVwEbfA_LiXZ7yU79FamI1y-S5DMwlMqphCLzLI2TlsDeG6-RBXJJf9xlWXyDzb23m4hFV1yrrls3_FUsS7mPTlT_OF0vaJeJGptd4O7-jX-c8E7P9XO9iNxqX58kmB3CWhDEOIQteMRefdAHTtz5d7Xk5G8sGiZ6bcFugEeh6zAJQZ9m-VbrU9RVNVSgH';

const CLAY_HANDS_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBk6VzghlM80CgPImzBoq95-T_olRWv3VTJdDBZoMC_5uPEq-lfCW7Mh-F3YKEhFOiiMejh03div18Nl03JjseSGHfKZjwrwERG6BjAYIyjXbpV4X3O_Y1Q_Qphlmr-ZMGYpcOMgEWHH55jZv8fcVPD7rquL0d31whPXPeGqaiNbs2qTBnasotmJmnHi57kq2zefWWcycVheT9bmmzlTfCd3CeGsg7xhpLdHLoL_scx';

const GOLDEN_BATH_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAdiPVMs0CVbbjDHcrA7Mr43oTgfmfga1WTb88iBhCAZw5h1MXEspTrFWNhb3pT5COdk5k3Umya4iuvljhxtaW25l3CbURg447GkYYYNQ1TpYc6kV61llqpOkH16eEyjU2aEIvKoOioKJ_oZ6Z0MMxIx7-T_ReIGZR4Jj9N8OlUc2dSH51WCRRgBXv4CdjMNgySYP1CllFup_L0epG2kaQdNMzoA_crace3XRfAr2mx';

export const OurStoryPage: React.FC = () => {
  return (
    <div className="w-full bg-surface">
      {/* Top Breadcrumb & Status Ribbon */}
      <section className="w-full bg-surface py-space-sm">
        <div className="max-w-[1280px] mx-auto px-margin flex items-center justify-between text-on-surface-variant text-body-sm">
          <div className="flex items-center gap-space-xs">
            <Link className="hover:text-primary transition-colors" to="/">
              Home
            </Link>
            <span className="text-outline-variant font-mono text-[10px]">/</span>
            <span className="text-on-surface font-semibold text-[13px]">
              Our Story &amp; Standards
            </span>
          </div>
          <div className="hidden md:flex items-center gap-space-sm text-label-md uppercase tracking-wider text-primary">
            <span className="inline-block w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span>Kutch Mineral Basin · Ethically Mined &amp; Refined</span>
          </div>
        </div>
      </section>

      {/* Editorial Hero Section */}
      <section className="w-full bg-primary-container text-on-primary py-space-xl lg:py-24 relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-margin relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-xl">
            <div className="max-w-3xl flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-space-xs bg-primary px-space-md py-1.5 rounded-full w-fit">
                <span className="material-symbols-outlined text-[14px] text-primary-fixed">
                  verified
                </span>
                <span className="text-label-md uppercase tracking-widest text-primary-fixed">
                  The Sniff Co. Manifesto
                </span>
              </div>
              <h1 className="text-display-hero-mobile lg:text-[68px] lg:leading-[76px] tracking-tight text-on-primary font-serif">
                Crafted for the <span className="italic font-normal text-primary-fixed">sensitive nose</span>{' '}
                that knows.
              </h1>
              <p className="text-body-lg text-on-primary-container max-w-2xl pt-space-xs">
                We spent years mining and grading pure sodium bentonite clay in Western India before
                asking ourselves the defining question: why does pet wellness settle for harsh
                chemical perfumes, silica dust, and synthetic fillers?
              </p>
            </div>

            <div className="flex flex-col gap-space-sm min-w-[260px] bg-primary/60 p-space-md rounded-2xl backdrop-blur-sm shadow-sm">
              <div className="flex items-center gap-space-sm pb-space-xs">
                <span className="material-symbols-outlined text-primary-fixed text-headline-sm">
                  eco
                </span>
                <div>
                  <p className="text-title-sm text-on-primary">From Clay to Corner</p>
                  <p className="text-body-sm text-on-primary-container">
                    Single-origin Indian minerals
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-space-xs text-on-primary text-label-md">
                <span>Zero chemical perfumes</span>
                <span className="font-bold text-primary-fixed">100% Honest</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Origin Section */}
      <section className="w-full py-space-xl lg:py-24 bg-surface">
        <div className="max-w-[1280px] mx-auto px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            <div className="lg:col-span-6 relative">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg bg-surface-container-high">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  alt="Kutch Mineral Basin Bentonite Quarry"
                  decoding="async"
                  loading="lazy"
                  src={QUARRY_IMG}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-on-primary">
                  <span className="text-label-md tracking-wider uppercase bg-primary-container/80 backdrop-blur-md px-3 py-1 rounded-full">
                    Kutch Basin, Gujarat
                  </span>
                  <span className="text-body-sm font-light text-primary-fixed">
                    Ethical Mineral Extraction
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-xl max-w-xs -mt-10 ml-6 relative z-20 flex items-center gap-space-md">
                <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[24px]">filter_vintage</span>
                </div>
                <div>
                  <p className="text-title-sm text-on-surface">Triple-Sifted Purity</p>
                  <p className="text-body-sm text-on-surface-variant">Sun-baked, dedusted 3 times</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col gap-space-md lg:pl-space-lg">
              <span className="text-label-md tracking-widest text-primary uppercase font-bold">
                Our Geological Roots
              </span>
              <h2 className="text-headline-lg text-on-surface">
                We don&apos;t buy white-label clay. <br className="hidden sm:inline" />
                <span className="italic font-normal text-on-surface-variant">
                  We understand its molecular soul.
                </span>
              </h2>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Most pet brands are marketing agencies buying bulk clay from unverified overseas
                brokers, masking its quality deficits with heavy lilac, lavender, or artificial
                baby-powder perfumes. Cats despise these chemical masks; their olfactory sensitivity
                is fourteen times sharper than ours.
              </p>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                Because our founder team spent over eight years operating industrial mineral
                processing plants in Gujarat, we knew where India&apos;s richest swelling sodium
                bentonites originate. We harvest natural volcanic ash clay, gently sun-bake it under
                open skies, and pass it through a patented multi-stage cyclonic dedusting process.
              </p>
              <div className="pt-space-xs grid grid-cols-2 gap-space-md">
                <div className="bg-surface-container-low p-space-md rounded-xl">
                  <span className="text-[32px] leading-tight text-primary font-medium block font-serif">
                    48 hrs
                  </span>
                  <span className="text-label-md text-on-surface-variant">
                    Solar cured under direct sun for optimum core hardness
                  </span>
                </div>
                <div className="bg-surface-container-low p-space-md rounded-xl">
                  <span className="text-[32px] leading-tight text-primary font-medium block font-serif">
                    3x Cyclonic
                  </span>
                  <span className="text-label-md text-on-surface-variant">
                    Air dedusting removes fine airborne particulates
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clay Science Breakdown */}
      <section className="w-full bg-surface-container-low py-space-xl">
        <div className="max-w-[1280px] mx-auto px-margin">
          <div className="max-w-2xl mb-space-lg">
            <span className="text-label-md tracking-widest uppercase text-primary font-bold">
              Anatomy of Fresh Air
            </span>
            <h3 className="text-headline-lg text-on-surface pt-space-xs">
              Why activated carbon outperforms artificial fragrance.
            </h3>
            <p className="text-body-md text-on-surface-variant pt-space-xs">
              Chemical scents merely overpower ammonia smell while irritating feline respiratory
              tracts. Our virgin coconut carbon actively captures odor particles at a microscopic
              level.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between gap-space-md">
              <div className="flex items-center justify-between">
                <span className="text-title-sm text-primary font-semibold">
                  The Sniff Co. Natural Standard
                </span>
                <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm uppercase">
                  Purity Certified
                </span>
              </div>
              <div className="space-y-space-sm">
                <div className="flex items-start gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                    check_circle
                  </span>
                  <p className="text-body-md text-on-surface">
                    <strong className="font-semibold">Virgin Activated Carbon:</strong> Millions of
                    microscopic micropores trap airborne volatile sulfur and ammonia instantly.
                  </p>
                </div>
                <div className="flex items-start gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                    check_circle
                  </span>
                  <p className="text-body-md text-on-surface">
                    <strong className="font-semibold">Zero Artificial Odorants:</strong> Cats step
                    into their box without sneezing, eye discharge, or litter box aversion.
                  </p>
                </div>
                <div className="flex items-start gap-space-sm">
                  <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
                    check_circle
                  </span>
                  <p className="text-body-md text-on-surface">
                    <strong className="font-semibold">Dense 15-Second Clumping:</strong> Liquid is
                    locked immediately into firm discs, leaving the surrounding bed dry.
                  </p>
                </div>
              </div>
              <div className="w-full bg-surface-container p-space-md rounded-xl flex items-center justify-between">
                <span className="text-label-md uppercase tracking-wider text-on-surface-variant">
                  Carbon Adsorption Rate
                </span>
                <div className="flex items-center gap-space-xs font-mono font-bold text-primary">
                  <div className="w-28 h-2 bg-[#e2e3e1] rounded-full overflow-hidden">
                    <div className="h-full bg-[#104332] w-[96%]" />
                  </div>
                  <span>96.4%</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-high p-space-lg rounded-2xl flex flex-col justify-between gap-space-md opacity-85">
              <div className="flex items-center justify-between">
                <span className="text-title-sm text-secondary font-semibold">
                  Conventional Market Litters
                </span>
                <span className="px-2.5 py-1 rounded-full bg-surface-dim text-secondary text-label-sm uppercase">
                  Commercial Standard
                </span>
              </div>
              <div className="space-y-space-sm">
                <div className="flex items-start gap-space-sm">
                  <span className="material-symbols-outlined text-error text-[20px] mt-0.5">
                    cancel
                  </span>
                  <p className="text-body-md text-secondary">
                    <strong className="font-semibold text-on-surface">Synthetic Fragrances:</strong>{' '}
                    Strong synthetic scents that irritate cats&apos; sensitive mucous membranes.
                  </p>
                </div>
                <div className="flex items-start gap-space-sm">
                  <span className="material-symbols-outlined text-error text-[20px] mt-0.5">
                    cancel
                  </span>
                  <p className="text-body-md text-secondary">
                    <strong className="font-semibold text-on-surface">Excess Free Silica Dust:</strong>{' '}
                    Unrefined processing clouds the air during pouring, tracking powdery paws.
                  </p>
                </div>
                <div className="flex items-start gap-space-sm">
                  <span className="material-symbols-outlined text-error text-[20px] mt-0.5">
                    cancel
                  </span>
                  <p className="text-body-md text-secondary">
                    <strong className="font-semibold text-on-surface">Loose Crumbling Clumps:</strong>{' '}
                    Saturated clumps break apart while scooping, spoiling the tray within days.
                  </p>
                </div>
              </div>
              <div className="w-full bg-surface-variant p-space-md rounded-xl flex items-center justify-between">
                <span className="text-label-md uppercase tracking-wider text-secondary">
                  Carbon Adsorption Rate
                </span>
                <div className="flex items-center gap-space-xs font-mono font-bold text-secondary">
                  <div className="w-28 h-2 bg-[#cfd3cf] rounded-full overflow-hidden">
                    <div className="h-full bg-[#717974] w-[28%]" />
                  </div>
                  <span>28.1%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Standards Stats Strip */}
      <section className="w-full bg-primary-container text-on-primary py-space-xl lg:py-20">
        <div className="max-w-[1280px] mx-auto px-margin">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter text-center">
            {[
              { val: '99.9%', label: 'Dust Free', sub: 'Protects respiratory tracts' },
              { val: '15 sec', label: 'Clump Reaction', sub: 'Instant moisture isolation' },
              { val: '0', label: 'Synthetic Dyes', sub: 'Raw unbleached earth tone' },
              { val: '100%', label: 'Pet-Safe Tested', sub: 'Safe if accidentally ingested' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center p-space-md">
                <span className="text-display-hero lg:text-[64px] text-primary-fixed font-light font-serif">
                  {s.val}
                </span>
                <span className="text-title-sm text-on-primary font-medium mt-1">{s.label}</span>
                <span className="text-body-sm text-on-primary-container mt-1">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery Showcase */}
      <section className="w-full py-space-xl bg-surface">
        <div className="max-w-[1280px] mx-auto px-margin">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
            <div>
              <span className="text-label-md tracking-widest text-primary uppercase font-bold">
                Behind the Craft
              </span>
              <h2 className="text-headline-lg text-on-surface pt-space-xs">
                Clean living in action.
              </h2>
            </div>
            <p className="text-body-sm text-on-surface-variant max-w-md">
              A glimpse into the homes and companion routines that rely on gentle, unscented mineral
              clarity every day.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {[
              { img: LIFESTYLE_CAT_IMG, caption: 'Breathe easy at home' },
              { img: CLAY_HANDS_IMG, caption: 'Single-origin mineral granules' },
              { img: GOLDEN_BATH_IMG, caption: 'Gentle botanical coat care' },
            ].map((item) => (
              <div
                key={item.caption}
                className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-surface-container-high group shadow-sm"
              >
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={item.caption}
                  decoding="async"
                  loading="lazy"
                  src={item.img}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent flex items-end p-space-md">
                  <p className="text-body-sm text-on-primary font-medium">{item.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder Note */}
      <section className="w-full py-space-xl bg-surface-container-low">
        <div className="max-w-[840px] mx-auto px-margin">
          <div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-2xl shadow-sm">
            <div className="flex items-center gap-space-sm mb-space-md">
              <span className="text-label-md uppercase tracking-wider bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full font-bold">
                Letter from the Founders
              </span>
            </div>
            <h3 className="text-headline-md text-on-surface mb-space-md">
              &ldquo;We made this because our own cats refused to use perfumed supermarket
              litter.&rdquo;
            </h3>
            <div className="space-y-space-md text-body-md text-on-surface-variant leading-relaxed">
              <p>
                When we brought our two rescue kittens home, we discovered what millions of Indian
                pet parents silently put up with: commercial litters that claim to be &ldquo;lavender
                meadow&rdquo; or &ldquo;fresh breeze&rdquo; that turn into a chemical slurry after
                two days.
              </p>
              <p>
                Cats possess upwards of 200 million olfactory receptors. What smells like faint
                fabric softener to a human feels like being trapped in an enclosed perfume booth to
                a cat. We knew our native Indian clay deposits held natural odor-neutralizing power
                when properly cleaned and coupled with active carbon.
              </p>
              <p>
                The Sniff Co. is our love letter to sensitive pets and conscious homes. Clean
                ingredients. Honest sourcing. Zero nonsense.
              </p>
            </div>
            <div className="pt-space-lg flex items-center justify-between border-t border-surface-container mt-space-md">
              <div>
                <p className="text-title-sm text-on-surface font-bold">Rhea &amp; Aman</p>
                <p className="text-body-sm text-on-surface-variant">
                  Founders, The Sniff Co. · Mumbai &amp; Kutch
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-headline-sm font-bold">
                <span className="-mt-0.5">S</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="w-full py-space-xl lg:py-24 bg-surface">
        <div className="max-w-[1280px] mx-auto px-margin">
          <div className="bg-primary rounded-2xl p-space-lg md:p-space-xl text-on-primary flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-xl">
            <div className="flex flex-col gap-space-xs text-center md:text-left">
              <span className="text-label-md uppercase tracking-widest text-primary-fixed font-bold">
                Start Your Clean Routine
              </span>
              <h2 className="text-headline-lg text-on-primary">
                Experience clean living with your pet.
              </h2>
              <p className="text-body-md text-on-primary-container max-w-lg">
                Free shipping across India on orders over ₹499. Try our signature activated carbon
                clump test risk-free.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-space-sm w-full sm:w-auto">
              <Link
                className="w-full sm:w-auto px-space-xl py-3.5 rounded-full bg-on-primary text-primary text-title-sm text-center font-bold hover:bg-surface-variant transition-colors shadow-sm"
                to="/product/clumping-cat-litter"
              >
                Explore Cat Litter
              </Link>
              <Link
                className="w-full sm:w-auto px-space-lg py-3.5 rounded-full bg-transparent border border-on-primary text-on-primary text-title-sm text-center font-medium hover:bg-on-primary/10 transition-colors"
                to="/shop"
              >
                View All Products
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
