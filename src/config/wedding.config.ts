/**
 * ============================================================================
 *  WEDDING CONFIGURATION — the single source of truth
 * ============================================================================
 *
 *  EVERYTHING the guest sees is derived from this file. Nothing about the
 *  wedding is hard-coded in a component.
 *
 *  Editing this file is the ONLY thing the family needs to do to update the
 *  invitation. See `README.md` for a plain-language guide.
 *
 *  ── RULES ──────────────────────────────────────────────────────────────────
 *  1. Do NOT invent information. If a detail has not been confirmed, leave the
 *     field `null` and the interface will render a discreet, elegant
 *     "to be announced" state instead of a guess.
 *  2. Add ceremony functions to `events` below as they are confirmed — the
 *     Celebration scene is already architected for Engagement, Haldi,
 *     Mehendi, Sangeet, Wedding, Reception and any custom function.
 *  3. Drop photography into `/public/photos` and reference it in `gallery`
 *     and `story`. Until then, the site renders art-directed placeholder
 *     compositions rather than grey boxes.
 */

/** A single gallery frame. Add `src` to swap the artwork for real photography. */
export interface GalleryFrame {
  /** Path from `/public`, e.g. `/photos/pre-wedding-01.jpg`. Null → generated artwork. */
  src: string | null;
  /** Accessible description. Describe the real photograph once it exists. */
  alt: string;
  /** Small editorial caption, printed beneath the frame. */
  caption: string | null;
  /**
   * Which procedural composition to draw while `src` is null.
   * One of: jharokha | toran | marble | silk | diya | lotus | mehndi | sangeet
   */
  art: ProceduralArt;
  /** Crop bias for horizontal-scroll framing. */
  align?: 'top' | 'center' | 'bottom';
}

/** Procedural placeholder compositions — no stock photography, no clipart. */
export type ProceduralArt =
  | 'jharokha'
  | 'toran'
  | 'marble'
  | 'silk'
  | 'diya'
  | 'lotus'
  | 'mehndi'
  | 'sangeet'
  | 'couple';

/** A ceremony or function. Only confirmed details should be filled in. */
export interface WeddingEvent {
  /** Stable identifier, used for anchors, calendar UIDs and analytics-free deep links. */
  id: string;
  /** Display name, e.g. "The Wedding". */
  name: string;
  /** Roman-numeral-ish overline shown above the name. */
  numeral: string;
  /** Date as it should be printed, e.g. "17 October". Null → to be announced. */
  dateLabel: string | null;
  /** ISO start datetime including offset, e.g. "2026-10-17T18:30:00+05:30". */
  startsAt: string | null;
  /** End datetime, used for calendar duration. */
  endsAt: string | null;
  /** Printed time window, e.g. "6:30 PM onwards". */
  timeLabel: string | null;
  /** Printed venue. Null → the generic Kanakapura line is used. */
  venue: string | null;
  /** Optional venue address line. */
  address: string | null;
  /** Maps URL. Falls back to the location-level map when null. */
  mapUrl: string | null;
  /** Dress code. Null → hidden entirely, never faked. */
  dressCode: string | null;
  /** Short editorial description. */
  description: string | null;
  /** Which palette the card is rendered in. */
  tone: 'ivory' | 'emerald' | 'burgundy';
}

export interface WeddingConfig {
  meta: {
    bride: string;
    groom: string;
    /** Two-letter monogram used as the visual identity throughout the site. */
    monogram: string;
    /** Monogram separator — a middot-multiply, as engraved on a seal. */
    monogramGlyph: string;
  };

  date: {
    day: number;
    month: string;
    /**
     * Year of the wedding.
     *
     * Left `null` because it has not been confirmed. The site does NOT guess a
     * year for printing — instead `resolveWeddingYear()` computes the next
     * occurrence of the 17th of October purely so that the live countdown and
     * the calendar downloads remain functional. Set this to the real year
     * (e.g. 2026) the moment it is confirmed and every derived value follows.
     */
    year: number | null;
    /** Allow the countdown to target the next occurrence when `year` is null. */
    assumeNextOccurrence: boolean;
    /** Timezone label shown on the date card. */
    timezoneLabel: string;
  };

  location: {
    city: string;
    state: string;
    country: string;
    /** Full printed location line, e.g. "Kanakapura, Karnataka, India". */
    label: string;
    /** Google Maps search URL for the city. Replace with an exact venue map. */
    mapUrl: string;
    /** Coordinates used by the stylised map card. Null → derived from mapUrl. */
    coordinates: { lat: number; lng: number } | null;
    /** Short editorial paragraph about the destination. */
    note: string;
  };

  invitation: {
    /** Line above the couple's names on the open card. */
    openingLine: string;
    /** Body copy inside the card. */
    body: string;
    /** Closing line inside the card. */
    closingLine: string;
    /** Blessing line that appears in the hero and the blessings scene. */
    blessingsLine: string;
  };

  events: WeddingEvent[];

  story: Array<{
    chapter: string;
    title: string;
    body: string;
    src: string | null;
    alt: string;
    art: ProceduralArt;
    /** Optional two-digit index printed in the margin. */
    index: string;
  }>;

  gallery: {
    heading: string;
    subheading: string;
    frames: GalleryFrame[];
  };

  details: {
    heading: string;
    /** Each detail becomes one macro frame in the jewellery-style scene. */
    items: Array<{
      label: string;
      src: string | null;
      alt: string;
      art: ProceduralArt;
    }>;
  };

  family: {
    /** Empty until confirmed. The scene renders a neutral, dignified state. */
    brideFamily: string[];
    groomFamily: string[];
    /** Optional one-line note shown under the family names. */
    note: string | null;
  };

  music: {
    /** Path to an audio file in `/public`. Empty → the player offers a tone. */
    source: string;
    /** Inline data-URI used only when `source` is empty (a soft, single chime). */
    fallback: string;
    /** Display name in the player. */
    title: string;
    subtitle: string;
    /** Loop the track. */
    loop: boolean;
    /** Initial volume, 0–1. Kept low: this is ambience, not a soundtrack. */
    volume: number;
  };

  sounds: {
    door: string;
    seal: string;
    paper: string;
    chime: string;
  };

  countdown: {
    heading: string;
    /** Optional ceremony start used for the countdown target. */
    targetIso: string | null;
  };

  rsvp: {
    enabled: boolean;
    heading: string;
    subheading: string;
    /** Deadline for responses, printed as-is. Null → omitted entirely. */
    deadlineLabel: string | null;
    acceptLabel: string;
    declineLabel: string;
    /** Maximum guests selectable. */
    maxGuests: number;
    /** Optional note about what to do if plans change. */
    note: string;
  };

  share: {
    heading: string;
    /** WhatsApp message. `{names}`, `{date}`, `{location}` and `{url}` are filled in. */
    whatsappMessage:
      'With great joy, we invite you to celebrate the wedding of {names} on {date} in {location}. {url}';
    /** Used for the native share sheet, the OG tags and the Copy Link button. */
    shareText: string;
  };

  nav: Array<{ label: string; target: string }>;

  /** Personalised invite slugs. Empty by default; see /invite/[slug]. */
  invites: Array<{ slug: string; salutation: string }>;

  /** Shown in the opening and the final scene. */
  tagline: string;
}

export const weddingConfig: WeddingConfig = {
  meta: {
    bride: 'Yashaswini',
    groom: 'Girisha Sagar',
    monogram: 'GY',
    monogramGlyph: '\u00D7',
  },

  date: {
    day: 17,
    month: 'October',
    year: null,
    assumeNextOccurrence: true,
    timezoneLabel: 'IST',
  },

  location: {
    city: 'Kanakapura',
    state: 'Karnataka',
    country: 'India',
    label: 'Kanakapura, Karnataka, India',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Kanakapura%2C%20Karnataka',
    coordinates: { lat: 12.5196, lng: 77.0215 },
    note: 'Two hours from the city, wrapped in coffee country, mist and quiet. A place chosen for its stillness.',
  },

  invitation: {
    openingLine: 'Together with their families',
    body: 'invite you to celebrate the wedding of',
    closingLine: 'in Kanakapura',
    blessingsLine: 'With the blessings of our families',
  },

  events: [
    {
      id: 'wedding',
      name: 'The Wedding',
      numeral: 'I',
      dateLabel: '17 October',
      startsAt: null,
      endsAt: null,
      timeLabel: null,
      venue: null,
      address: null,
      mapUrl: null,
      dressCode: null,
      description: null,
      tone: 'ivory',
    },
    // ───────────────────────────────────────────────────────────────────────
    //  Add further functions below as each is confirmed. Uncomment, fill in,
    //  and the Celebration scene renders a matching card with its own
    //  calendar entry, dress code and map link.
    //
    // {
    //   id: 'mehendi',
    //   name: 'Mehendi',
    //   numeral: 'II',
    //   dateLabel: '15 October',
    //   startsAt: '2026-10-15T16:00:00+05:30',
    //   endsAt:   '2026-10-15T20:00:00+05:30',
    //   timeLabel: '4:00 PM onwards',
    //   venue: 'To be added',
    //   address: null,
    //   mapUrl: null,
    //   dressCode: null,
    //   description: null,
    //   tone: 'burgundy',
    // },
  ],

  story: [
    {
      index: '01',
      chapter: 'The Beginning',
      title: 'Two houses, one horizon',
      body: 'A first meeting, unhurried and unremarkable to everyone but them. The kind of beginning that only looks ordinary from the outside.',
      src: null,
      alt: 'A quiet first meeting',
      art: 'jharokha',
    },
    {
      index: '02',
      chapter: 'The Journey',
      title: 'Every road led back',
      body: 'Cities, seasons, long drives and shorter distances. Whatever the geography, the direction was the same.',
      src: null,
      alt: 'A journey taken together',
      art: 'silk',
    },
    {
      index: '03',
      chapter: 'The Moment',
      title: 'And then, simply, yes',
      body: 'No grand gesture. A question asked plainly, and answered sooner than either of them expected.',
      src: null,
      alt: 'The proposal',
      art: 'lotus',
    },
    {
      index: '04',
      chapter: 'The Forever',
      title: 'The 17th of October',
      body: 'Everything that came before, gathered into a single day — with the people who made them who they are.',
      src: null,
      alt: 'The couple',
      art: 'marble',
    },
  ],

  gallery: {
    heading: 'Moments Before Forever',
    subheading: 'Frames from a film that has not been shot yet',
    frames: [
      { src: null, alt: 'The bride', caption: 'The bride', art: 'jharokha', align: 'center' },
      { src: null, alt: 'The groom', caption: 'The groom', art: 'toran', align: 'center' },
      { src: null, alt: 'Marble and light', caption: 'Details', art: 'marble' },
      { src: null, alt: 'Silk and gold thread', caption: 'The handiwork', art: 'silk' },
      { src: null, alt: 'Lamps lit at dusk', caption: 'Dusk', art: 'diya' },
      { src: null, alt: 'Henna', caption: 'Henna', art: 'mehndi' },
      { src: null, alt: 'Flowers', caption: 'Asphodel & marigold', art: 'lotus' },
      { src: null, alt: 'A celebration in colour', caption: 'The celebration', art: 'sangeet' },
    ],
  },

  details: {
    heading: 'Every detail matters',
    items: [
      { label: 'The rings', src: null, alt: 'Wedding bands resting on ivory paper', art: 'marble' },
      { label: 'The invitation', src: null, alt: 'Handmade ivory invitation paper with gold edging', art: 'silk' },
      { label: 'The flowers', src: null, alt: 'Marigold and jasmine', art: 'lotus' },
      { label: 'The light', src: null, alt: 'Oil lamps casting warm light', art: 'diya' },
      { label: 'The henna', src: null, alt: 'Intricate henna patterning', art: 'mehndi' },
      { label: 'The embroidery', src: null, alt: 'Zari embroidery in antique gold', art: 'toran' },
    ],
  },

  family: {
    brideFamily: [],
    groomFamily: [],
    note: null,
  },

  music: {
    source: '',
    fallback: '',
    title: 'Ambience',
    subtitle: 'A celebration in Kanakapura',
    loop: true,
    volume: 0.34,
  },

  sounds: {
    door: '',
    seal: '',
    paper: '',
    chime: '',
  },

  countdown: {
    heading: 'The celebration begins in',
    targetIso: null,
  },

  rsvp: {
    enabled: true,
    heading: 'We would be honoured by your presence',
    subheading: 'Kindly respond so we may plan for you.',
    deadlineLabel: null,
    acceptLabel: 'Joyfully accept',
    declineLabel: 'Regretfully decline',
    maxGuests: 10,
    note: 'Should your plans change, please let us know at your earliest convenience.',
  },

  share: {
    heading: 'Share the invitation',
    whatsappMessage:
      'With great joy, we invite you to celebrate the wedding of {names} on {date} in {location}. {url}',
    shareText: 'Girisha Sagar & Yashaswini — 17 October, Kanakapura',
  },

  nav: [
    { label: 'The Invitation', target: 'invitation' },
    { label: 'The Story', target: 'story' },
    { label: 'The Celebration', target: 'celebration' },
    { label: 'The Destination', target: 'destination' },
    { label: 'Gallery', target: 'gallery' },
    { label: 'RSVP', target: 'rsvp' },
  ],

  invites: [],

  tagline: 'A celebration of love. A celebration of legacy.',
};
