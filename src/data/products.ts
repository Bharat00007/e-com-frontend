import { FAQItem, Testimonial } from '../types/store';

export const STITCH_LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDv6QO3LiQc8q0-yxZjmw09DffH1s3wjkVo2Fjf4nq1DqUO2aoozqRXLpBix5f10X8MArwtHEnpkO0kviGR5Gx6mjU-gS0YY-7VyKwUNyCigUo8NAexydCd69bO3KBMXdwFgjgsO4SRmSJ7cVuMx6lm4sNzcMrGN1tRx7sPfeHQf6KXLYpoIhio44K7tsi1SHJxyMtbAMTWEKffd-UOoUOSJdHHTMq_fFm6UpAtdfGvG4iVOdzOCmxSfA';

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote: 'Finally, a litter that actually keeps the room fresh.',
    author: 'Aarav',
    city: 'Mumbai',
    petName: 'Milo',
  },
  {
    id: 't2',
    quote: 'The clumps hold together and cleaning takes half the time.',
    author: 'Nisha',
    city: 'Pune',
    petName: 'Miso',
  },
  {
    id: 't3',
    quote: 'Gentle on her coat, and the scent is wonderfully subtle.',
    author: 'Rhea',
    city: 'Bengaluru',
    petName: 'Coco',
  },
];

export const INSTAGRAM_IMAGES: string[] = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBxFhvWiFDO-mCZPfrqk4bGD_5LDk9G5WqRYZ7ZFoCrdrpkH7UvHs3RbmGi18Cw0yNGKwquda_Hh2dk3m3vzZymCscEWFKPJSI_79gTI6VJuc8n7Mock4l2Bu5FgZv5hNboxjkdDXp8HUFKyMH5ZBwpwmZ-w0RCRl92M9v6AFvz3XYyRi8pVk8wXeIv53lVX0j_sQe2WkBiZCwfnGyGGvJFVRMTtnkHvIKedDe3d9x_',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCBJ8hMz_EMc8bKD22cVDwBbWxikSgAG9Kn2QijNM0seHOtBFdBc621wL_WUYln3EqPqfK1V4J1tB2A3TmVFeJPogZTXlDLmCL1qABHpzhpzdLgnEAlqqniFsBZcAejAhX2aAiBtUWBpeu39mcqmE53KgJl9skaEteqcLiBcw3hALVSqh4TIKlyBmoixVKCsV9l6r1r-qVfzOtlSEuiRXIqSPEpIGFmUa9-K4eDGLNo',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuABmUcYsVSMD0dQowV9MEiqNPFMvkSGmPAZAA4dxJMwKwxXdvv_xoxd7E4MGNC0Dyfngzm9w30pOcJYlXF_gm1XDoTGcWq-8sP8ZcRgOSFfkYd0wu_qbCZRFTIQvpY9QdLICT975ENsEvOokH7_6tx41iBVl2Xdn9sUgn3nbJ3VvQ0jFtXcOexySyJBbbwSTchMaOxlDReTj_QBzm7B4GrM52FtLyUUBArK11m5nkKr',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDq7ghZ0WepPZRNcXWsLOmHU_raQo9qFVUpWn_qLeArV7aX6mRJo3ltJeNAS9nRxLLZNRt-xxJRsQNF83tmlYhGbRSKFz6i9gnzS-o-RUlEsYDaP1PMMqXIxXinv53SJ4ArsCLGhAYeFRuuLOJoAhAUuBcZ8EekP4pzssX5BxRyDs-tkXw4r3Cz9GpnbtOKmOv20RAskaTTWq8eRvxfUnWYcmVckQuNCgKj8bo18HlT',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDxVZK6ln4aV8NJaxTAK8p757Ll5OQInhTYwSe24HiK8xHTPNT-jGT5tV4VAMWNGKSUmaiexKNrh3v_uZzMHxVp1143FGGVedN-do3iFkccIO0mVwZtRYO7iwm__HF-12tuqj0FixXQAvBTFByWIPFuy1VlS4N0DM6iGi8rxjXeK5-3QF1SkyXwUOiTNCbfa4mcqbEN9q-bSG_0BMEF4AkUfia4zWbRfoai3m69s9xN',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB3FMV6ms_wvB1Hfsl28T9eBP-I8mCQZcFN210WgEntibVXNTe1g_g3WJ0spqT2tQRKuezm12ngKeJ50J8AN5cmDoZ5dUnVR65KeTqLGc-qV6aYVYBrOn65Pguudwk3W0B4W9XRcGxh6AcQW5G2MssVhjl-GVEhFOqBNViyc0KTofuar_QrlR6lraJy_-hyp5BMfjvwUmrOrzk_WG_PnQLu-WKICAiN2MXjfzdiDEd5',
];

export const HOME_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Is it safe for kittens?',
    answer: 'Yes. Our unscented, low-dust formula is designed with sensitive noses in mind.',
    defaultOpen: true,
  },
  {
    id: 'faq-2',
    question: 'How long does a 5 kg pack last for one cat?',
    answer:
      'For a single average-sized adult cat, a 5 kg pack typically lasts between 3 to 4 weeks with daily regular scooping.',
  },
  {
    id: 'faq-3',
    question: 'Can I flush it?',
    answer:
      'We do not recommend flushing clay-based bentonite litter as it absorbs moisture and expands, which can cause plumbing blockages. Please dispose of clumps in regular dry household waste.',
  },
  {
    id: 'faq-4',
    question: 'Is it scented?',
    answer:
      'No, our litter is 100% free of artificial perfumes or synthetic masking fragrances. We rely entirely on high-grade natural activated carbon to eliminate odours.',
  },
];
