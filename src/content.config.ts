import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

// Site-wide chrome shared across every page: header nav, footer, contact
// details. Kept separate from `home` so it isn't duplicated once other
// pages exist.
const settings = defineCollection({
	loader: file('src/content/settings/settings.json'),
	schema: z.object({
		brandInitials: z.string(),
		siteName: z.string(),
		title: z.string(),
		tagline: z.string(),
		nav: z.array(
			z.object({
				label: z.string(),
				href: z.string(),
			}),
		),
		contactCta: z.object({
			label: z.string(),
			href: z.string(),
		}),
		email: z.string().email(),
		instagramHandle: z.string(),
		instagramUrl: z.string().url(),
		location: z.string(),
		credentialLine: z.string(),
		copyrightName: z.string(),
	}),
});

const home = defineCollection({
	loader: file('src/content/home/home.json'),
	schema: z.object({
		hero: z.object({
			name: z.string(),
			title: z.string(),
			badges: z.array(z.string()),
			tagline: z.string(),
			availability: z.object({
				show: z.boolean(),
				text: z.string(),
			}),
			ctaLabel: z.string(),
			ctaHref: z.string(),
			headshotAlt: z.string(),
			headshotImage: z.string(),
			imagePosition: z.string().optional(),
		}),
		about: z.object({
			eyebrow: z.string(),
			heading: z.string(),
			paragraphs: z.array(z.string()),
			ctaLabel: z.string(),
			ctaHref: z.string(),
			imageAlt: z.string(),
			image: z.string(),
			imagePosition: z.string().optional(),
		}),
		expertise: z.object({
			eyebrow: z.string(),
			heading: z.string(),
			ctaLabel: z.string(),
			ctaHref: z.string(),
		}),
		howIWork: z.object({
			eyebrow: z.string(),
			phrases: z.array(z.string()),
			paragraph: z.string(),
			imageAlt: z.string(),
			image: z.string(),
			imagePosition: z.string().optional(),
		}),
		references: z.object({
			eyebrow: z.string(),
			heading: z.string(),
			subheading: z.string(),
			ctaLabel: z.string(),
			ctaHref: z.string(),
		}),
		instagram: z.object({
			eyebrowHandle: z.string(),
			ctaLabel: z.string(),
		}),
	}),
});

const closingCta = z.object({
	heading: z.string(),
	ctaLabel: z.string(),
	ctaHref: z.string(),
});

// About page: hero + experience/education/gallery section copy. The list
// entries themselves live in the `experience`, `education` and
// `galleryItems` collections below.
const about = defineCollection({
	loader: file('src/content/about/about.json'),
	schema: z.object({
		hero: z.object({
			eyebrow: z.string(),
			heading: z.string(),
			intro: z.array(z.string()),
			photoAlt: z.string(),
			photoImage: z.string(),
			imagePosition: z.string().optional(),
		}),
		experience: z.object({
			eyebrow: z.string(),
			heading: z.string(),
		}),
		education: z.object({
			eyebrow: z.string(),
			heading: z.string(),
		}),
		gallery: z.object({
			eyebrow: z.string(),
			heading: z.string(),
			intro: z.string(),
		}),
		closing: closingCta,
	}),
});

const experience = defineCollection({
	loader: glob({ pattern: '**/*.json', base: 'src/content/experience' }),
	schema: z.object({
		dates: z.string(),
		role: z.string(),
		employer: z.string(),
		description: z.string(),
		special: z.boolean().default(false),
		order: z.number(),
	}),
});

const education = defineCollection({
	loader: glob({ pattern: '**/*.json', base: 'src/content/education' }),
	schema: z.object({
		years: z.string(),
		degree: z.string(),
		school: z.string(),
		place: z.string(),
		highlights: z.array(z.string()).optional(),
		order: z.number(),
	}),
});

const galleryItems = defineCollection({
	loader: glob({ pattern: '**/*.json', base: 'src/content/gallery' }),
	schema: z.object({
		caption: z.string(),
		order: z.number(),
		image: z.string(),
		imageAlt: z.string(),
		imagePosition: z.string().optional(),
	}),
});

// Expertise ("Areas of practice") page hero + closing CTA. Item copy lives
// in the `expertise` collection, shared with the homepage preview.
const expertisePage = defineCollection({
	loader: file('src/content/expertise-page/expertise-page.json'),
	schema: z.object({
		hero: z.object({
			eyebrow: z.string(),
			heading: z.string(),
			intro: z.string(),
		}),
		closing: closingCta,
	}),
});

const expertise = defineCollection({
	loader: glob({ pattern: '**/*.json', base: 'src/content/expertise' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		longDescription: z.string().optional(),
		bridge: z.string().optional(),
		special: z.boolean().default(false),
		order: z.number(),
		featuredOnHome: z.boolean().default(false),
		image: z.string(),
		imageAlt: z.string(),
		imagePosition: z.string().optional(),
	}),
});

const certificatesPage = defineCollection({
	loader: file('src/content/certificates-page/certificates-page.json'),
	schema: z.object({
		hero: z.object({
			eyebrow: z.string(),
			heading: z.string(),
			intro: z.string(),
		}),
	}),
});

const certificates = defineCollection({
	loader: glob({ pattern: '**/*.json', base: 'src/content/certificates' }),
	schema: z.object({
		title: z.string(),
		year: z.string(),
		description: z.string(),
		detail: z.string(),
		special: z.boolean().default(false),
		order: z.number(),
		image: z.string(),
		imagePosition: z.string().optional(),
	}),
});

const referencesPage = defineCollection({
	loader: file('src/content/references-page/references-page.json'),
	schema: z.object({
		hero: z.object({
			eyebrow: z.string(),
			heading: z.string(),
			intro: z.string(),
		}),
		referees: z.object({
			eyebrow: z.string(),
			heading: z.string(),
			note: z.string(),
		}),
		closing: closingCta,
	}),
});

const references = defineCollection({
	loader: glob({ pattern: '**/*.json', base: 'src/content/references' }),
	schema: z.object({
		quote: z.string(),
		longQuote: z.string().optional(),
		name: z.string(),
		role: z.string(),
		relation: z.string().optional(),
		initials: z.string(),
		highlighted: z.boolean().default(false),
		order: z.number(),
		pageOrder: z.number(),
		featuredOnHome: z.boolean().default(false),
	}),
});

const referees = defineCollection({
	loader: glob({ pattern: '**/*.json', base: 'src/content/referees' }),
	schema: z.object({
		name: z.string(),
		role: z.string(),
		relation: z.string(),
		initials: z.string(),
		order: z.number(),
	}),
});

const instagram = defineCollection({
	loader: glob({ pattern: '**/*.json', base: 'src/content/instagram' }),
	schema: z.object({
		alt: z.string(),
		href: z.string().url().optional(),
		order: z.number(),
		image: z.string(),
		imagePosition: z.string().optional(),
	}),
});

export const collections = {
	settings,
	home,
	about,
	experience,
	education,
	galleryItems,
	expertisePage,
	expertise,
	certificatesPage,
	certificates,
	referencesPage,
	references,
	referees,
	instagram,
};
