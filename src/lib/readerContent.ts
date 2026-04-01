export type ReaderCalloutTone = 'amber' | 'berry' | 'ink' | 'sage';

export type ReaderCallout = {
  id: string;
  label: string;
  text: string;
  tone: ReaderCalloutTone;
};

export type ReaderFigure = {
  alt: string;
  caption: string;
  credit: string;
  displayAspectRatio: number;
  preloadSrc: string;
  sizes: string;
  sourceUrl: string;
  src: string;
  srcSet: string;
};

export type ReaderScene = {
  id: 'bank' | 'fall' | 'hall' | 'tea' | 'queen' | 'trial' | 'waking';
  chapter: string;
  deck: string;
  quote: string;
  sourceLabel: string;
  text: string;
  title: string;
  theme: 'bank' | 'fall' | 'hall' | 'tea' | 'queen' | 'trial' | 'waking';
  callouts: readonly ReaderCallout[];
  figure: ReaderFigure;
};

function buildCommonsFilePage(filename: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`;
}

function buildCommonsFilePath(filename: string, width?: number): string {
  const baseUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
  return width ? `${baseUrl}?width=${width}` : baseUrl;
}

function buildCommonsSrcSet(filename: string, widths: readonly number[]): string {
  return widths.map((width) => `${buildCommonsFilePath(filename, width)} ${width}w`).join(', ');
}

function buildReaderFigure(
  filename: string,
  {
    alt,
    caption,
    credit,
    displayAspectRatio,
    sizes = '(max-width: 719px) 42vw, (max-width: 1100px) 32vw, 260px',
    widths = [240, 360, 480, 640, 800] as const,
  }: {
    alt: string;
    caption: string;
    credit: string;
    displayAspectRatio: number;
    sizes?: string;
    widths?: readonly number[];
  },
): ReaderFigure {
  const defaultWidth = widths[Math.min(3, widths.length - 1)] ?? 640;
  const preloadWidth = widths[Math.min(2, widths.length - 1)] ?? defaultWidth;

  return {
    alt,
    caption,
    credit,
    displayAspectRatio,
    preloadSrc: buildCommonsFilePath(filename, preloadWidth),
    sizes,
    sourceUrl: buildCommonsFilePage(filename),
    src: buildCommonsFilePath(filename, defaultWidth),
    srcSet: buildCommonsSrcSet(filename, widths),
  };
}

export const BOOK_SOURCE = {
  label: "Project Gutenberg: Alice's Adventures in Wonderland",
  url: 'https://www.gutenberg.org/cache/epub/11/pg11-images.html',
} as const;

export const READER_SCENES: readonly ReaderScene[] = [
  {
    id: 'bank',
    chapter: 'Chapter I',
    title: 'Down the Rabbit-Hole',
    theme: 'bank',
    deck:
      'The book opens in warm daylight, then one impossible pocket watch tips the whole page into pursuit.',
    quote: "'and what is the use of a book,' thought Alice 'without pictures or conversation?'",
    sourceLabel: 'Opening paragraphs',
    text:
      'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, \'and what is the use of a book,\' thought Alice \'without pictures or conversations?\'\n\n' +
      'So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.\n\n' +
      'There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, \'Oh dear! Oh dear! I shall be late!\' but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it.\n\n' +
      'Burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge. In another moment down went Alice after it, never once considering how in the world she was to get out again.',
    callouts: [
      {
        id: 'pocket-logic',
        label: 'Pocket Logic',
        text: 'One waistcoat-pocket is enough to unfasten the whole afternoon.',
        tone: 'amber',
      },
      {
        id: 'daisy-chain',
        label: 'Daisy Chain',
        text: 'Boredom lasts exactly until something impossible starts running late.',
        tone: 'sage',
      },
      {
        id: 'bank-weather',
        label: 'Bank Weather',
        text: 'The day begins sleepy, yellow, and entirely unsuspecting.',
        tone: 'berry',
      },
    ],
    figure: buildReaderFigure('Down_the_Rabbit_Hole.png', {
      alt: 'The White Rabbit consulting his watch, illustrated by John Tenniel.',
      caption: 'The rabbit with the watch.',
      credit: 'John Tenniel, 1865.',
      displayAspectRatio: 1.52,
    }),
  },
  {
    id: 'fall',
    chapter: 'Chapter I',
    title: 'The Long Fall',
    theme: 'fall',
    deck:
      'Pretext turns the descent into a navigable reading shaft, with Alice dropping past shelves, maps, and marmalade.',
    quote: "'Down, down, down. Would the fall never come to an end!'",
    sourceLabel: 'The descent into the well',
    text:
      'The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.\n\n' +
      'Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs.\n\n' +
      'She took down a jar from one of the shelves as she passed; it was labelled \'ORANGE MARMALADE\', but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody underneath, so managed to put it into one of the cupboards as she fell past it.\n\n' +
      'Down, down, down. Would the fall never come to an end! \'I wonder how many miles I\'ve fallen by this time?\' she said aloud. \'I must be getting somewhere near the centre of the earth.\' Presently she began again, wondering whether she might fall right through the earth and come out among people who walked with their heads downward.',
    callouts: [
      {
        id: 'falling-thought',
        label: 'Falling Thought',
        text: 'The well keeps turning into furniture before it turns into fear.',
        tone: 'sage',
      },
      {
        id: 'latitude',
        label: 'Latitude',
        text: 'Wonderland lets grand words drift by before it bothers with answers.',
        tone: 'ink',
      },
      {
        id: 'marmalade',
        label: 'Marmalade',
        text: 'Even mid-plunge, Alice is polite enough to shelve the empty jar.',
        tone: 'amber',
      },
    ],
    figure: buildReaderFigure('Alice_par_John_Tenniel_05.png', {
      alt: 'Alice stretched long and impossible as she falls, illustrated by John Tenniel.',
      caption: 'Alice stretched into the impossible.',
      credit: 'John Tenniel, 1865.',
      displayAspectRatio: 2.05,
      sizes: '(max-width: 719px) 30vw, (max-width: 1100px) 22vw, 170px',
    }),
  },
  {
    id: 'hall',
    chapter: 'Chapter I',
    title: 'The Hall and the Bottle',
    theme: 'hall',
    deck:
      'The room tightens into instructions, labels, and thresholds, and the page measure starts behaving like a puzzle-box.',
    quote: "'Drink me,' was printed beautifully in large letters.",
    sourceLabel: 'The glass table and the little door',
    text:
      'Alice was not a bit hurt, and she jumped up on to her feet in a moment: she looked up, but it was all dark overhead; before her was another long passage, and the White Rabbit was still in sight, hurrying down it.\n\n' +
      'There was not a moment to be lost: away went Alice like the wind, and was just in time to hear it say, as it turned a corner, \'Oh my ears and whiskers, how late it\'s getting!\' She was close behind it when she turned the corner, but the Rabbit was no longer to be seen: she found herself in a long, low hall, which was lit up by a row of lamps hanging from the roof.\n\n' +
      'There were doors all round the hall, but they were all locked; and when Alice had been all the way down one side and up the other, trying every door, she walked sadly down the middle, wondering how she was ever to get out again.\n\n' +
      'However, on the second time round, she came upon a low curtain she had not noticed before, and behind it was a little door about fifteen inches high: she tried the little golden key in the lock, and to her great delight it fitted. She went back to the table, and round the neck of the bottle was a paper label, with the words \'DRINK ME,\' beautifully printed on it in large letters.',
    callouts: [
      {
        id: 'bottle-lore',
        label: 'Bottle Lore',
        text: 'Wonderland keeps issuing commands in the prettiest possible typography.',
        tone: 'berry',
      },
      {
        id: 'tiny-door',
        label: 'Tiny Door',
        text: 'A perfect garden can be made entirely unreachable by one wrong proportion.',
        tone: 'amber',
      },
      {
        id: 'label-work',
        label: 'Label Work',
        text: 'DRINK ME, EAT ME, and everything else arrives as a design problem.',
        tone: 'sage',
      },
    ],
    figure: buildReaderFigure('Alice_par_John_Tenniel_06.png', {
      alt: 'Alice looming large while the rabbit escapes, illustrated by John Tenniel.',
      caption: 'Alice fills the room.',
      credit: 'John Tenniel, 1865.',
      displayAspectRatio: 1.14,
    }),
  },
  {
    id: 'tea',
    chapter: 'Chapter VII',
    title: 'A Mad Tea-Party',
    theme: 'tea',
    deck:
      "Conversation becomes another obstacle course: interruptions, riddles, and cups rattling forever at six o'clock.",
    quote: "'No room! No room!' they cried out when they saw Alice coming.",
    sourceLabel: 'The table under the tree',
    text:
      'There was a table set out under a tree in front of the house, and the March Hare and the Hatter were having tea at it: a Dormouse was sitting between them, fast asleep, and the other two were using it as a cushion, resting their elbows on it, and talking over its head. \'Very uncomfortable for the Dormouse,\' thought Alice; \'only, as it\'s asleep, I suppose it doesn\'t mind.\'\n\n' +
      'The table was a large one, but the three were all crowded together at one corner of it: \'No room! No room!\' they cried out when they saw Alice coming. \'There\'s plenty of room!\' said Alice indignantly, and she sat down in a large arm-chair at one end of the table.\n\n' +
      '\'Have some wine,\' the March Hare said in an encouraging tone. Alice looked all round the table, but there was nothing on it but tea. \'I don\'t see any wine,\' she remarked. \'There isn\'t any,\' said the March Hare. \'Then it wasn\'t very civil of you to offer it,\' said Alice angrily.\n\n' +
      '\'It wasn\'t very civil of you to sit down without being invited,\' said the March Hare. \'I didn\'t know it was your table,\' said Alice; \'it\'s laid for a great many more than three.\' \'Your hair wants cutting,\' said the Hatter.',
    callouts: [
      {
        id: 'tea-rule',
        label: 'Tea Rule',
        text: 'If there is no room, sit anyway. If there is no answer, ask a better riddle.',
        tone: 'amber',
      },
      {
        id: 'six-oclock',
        label: "Six O'Clock",
        text: 'Time stopped here and all the cups have been waiting ever since.',
        tone: 'berry',
      },
      {
        id: 'riddle-air',
        label: 'Riddle Air',
        text: 'Every sentence arrives half invitation, half interruption.',
        tone: 'ink',
      },
    ],
    figure: buildReaderFigure('Alice_par_John_Tenniel_27.png', {
      alt: 'Alice with the Mad Hatter, the March Hare, and the Dormouse, illustrated by John Tenniel.',
      caption: 'The tea-table at perpetual six.',
      credit: 'John Tenniel, 1865.',
      displayAspectRatio: 0.88,
      sizes: '(max-width: 719px) 44vw, (max-width: 1100px) 34vw, 280px',
      widths: [280, 420, 560, 720, 920],
    }),
  },
  {
    id: 'queen',
    chapter: 'Chapter VIII',
    title: "The Queen's Croquet-Ground",
    theme: 'queen',
    deck:
      'The garden brightens into painted roses and panic, and the text has to dodge both court etiquette and execution orders.',
    quote: "'Off with their heads!' and the procession moved on.",
    sourceLabel: 'White roses and impossible croquet',
    text:
      'A large rose-tree stood near the entrance of the garden: the roses growing on it were white, but there were three gardeners at it, busily painting them red. Alice thought this a very curious thing, and she went nearer to watch them, and just as she came up to them she heard one of them say, \'Look out now, Five! Don\'t go splashing paint over me like that!\'\n\n' +
      '\'I couldn\'t help it,\' said Five, in a sulky tone; \'Seven jogged my elbow.\' On which Seven looked up and said, \'That\'s right, Five! Always lay the blame on others!\' You\'d better not talk!\' said Five. \'I heard the Queen say only yesterday you deserved to be beheaded!\'\n\n' +
      'Just then, Five, who had been anxiously looking across the garden, called out \'The Queen! The Queen!\' and the three gardeners instantly threw themselves flat upon their faces. There was a sound of many footsteps, and Alice looked round, eager to see the Queen.\n\n' +
      'First came ten soldiers carrying clubs; then the ten courtiers; these were ornamented all over with diamonds, and walked two and two, as the soldiers did. After these came the royal children; then the guests, mostly Kings and Queens, and among them Alice recognised the White Rabbit. Last of all came a grand procession in which the Queen kept shouting, \'Off with their heads!\' and then, turning suddenly to Alice, she said, \'Can you play croquet?\'',
    callouts: [
      {
        id: 'garden-law',
        label: 'Garden Law',
        text: 'Paint the roses, dodge the flamingos, and try not to be sentenced in passing.',
        tone: 'berry',
      },
      {
        id: 'royal-volume',
        label: 'Royal Volume',
        text: 'Everything gets louder the closer the Queen comes to the page.',
        tone: 'amber',
      },
      {
        id: 'card-etiquette',
        label: 'Card Etiquette',
        text: 'The court enters in diamonds and exits in panic.',
        tone: 'sage',
      },
    ],
    figure: buildReaderFigure('Alice-queen-hearts.jpg', {
      alt: "The Queen's croquet-ground, illustrated by John Tenniel.",
      caption: 'Croquet under royal threat.',
      credit: 'John Tenniel, 1865.',
      displayAspectRatio: 1.22,
    }),
  },
  {
    id: 'trial',
    chapter: 'Chapter XII',
    title: 'Sentence First',
    theme: 'trial',
    deck:
      'By the trial, Wonderland stops pretending to be orderly and becomes gloriously unreasonable in public.',
    quote: "'Sentence first-verdict afterwards.'",
    sourceLabel: "Alice's evidence",
    text:
      '"Here!" cried Alice, quite forgetting in the flurry of the moment how large she had grown in the last few minutes, and she jumped up in such a hurry that she tipped over the jury-box with the edge of her skirt, upsetting all the jurymen on to the heads of the crowd below, and there they lay sprawling about, reminding her very much of a globe of goldfish she had accidentally upset the week before.\n\n' +
      '"What do you know about this business?" the King said to Alice. "Nothing," said Alice. "Nothing whatever?" persisted the King. "Nothing whatever," said Alice. "That\'s very important," the King said, turning to the jury. "Unimportant, your Majesty means, of course," said the White Rabbit.\n\n' +
      '"Silence!" cackled the King, reading from his note-book. "Rule Forty-two. All persons more than a mile high to leave the court." Everybody looked at Alice. "I\'m not a mile high," said Alice. "Nearly two miles high," added the Queen.\n\n' +
      '"No, no!" said the Queen. "Sentence first-verdict afterwards." "Stuff and nonsense!" said Alice loudly. "The idea of having the sentence first!" "Hold your tongue!" said the Queen. "I won\'t!" said Alice.',
    callouts: [
      {
        id: 'court-logic',
        label: 'Court Logic',
        text: 'The rules keep arriving after the accusations, which is a very Wonderland way to legislate.',
        tone: 'ink',
      },
      {
        id: 'rule-forty-two',
        label: 'Rule Forty-Two',
        text: 'A law invented mid-argument still counts if the King likes the sound of it.',
        tone: 'berry',
      },
      {
        id: 'verdict-order',
        label: 'Verdict Order',
        text: 'Sentence first. Meaning later. Procedure never.',
        tone: 'amber',
      },
    ],
    figure: buildReaderFigure('Alice_par_John_Tenniel_40.png', {
      alt: 'Alice in court, illustrated by John Tenniel.',
      caption: 'Alice grows bold in the court.',
      credit: 'John Tenniel, 1865.',
      displayAspectRatio: 1.21,
    }),
  },
  {
    id: 'waking',
    chapter: 'Chapter XII',
    title: 'What a Curious Dream',
    theme: 'waking',
    deck:
      'The cards become leaves again, and the story ends by folding its noise back into summer weather and memory.',
    quote: "'what a wonderful dream it had been.'",
    sourceLabel: 'The waking on the bank',
    text:
      '"Who cares for you?" said Alice, for she had grown to her full size by this time. "You\'re nothing but a pack of cards!"\n\n' +
      'At this the whole pack rose up into the air, and came flying down upon her: she gave a little scream, half of fright and half of anger, and tried to beat them off, and found herself lying on the bank, with her head in the lap of her sister, who was gently brushing away some dead leaves that had fluttered down from the trees upon her face.\n\n' +
      '"Wake up, Alice dear!" said her sister; "Why, what a long sleep you\'ve had!" "Oh, I\'ve had such a curious dream!" said Alice, and she told her sister, as well as she could remember them, all these strange Adventures of hers. When she had finished, her sister kissed her, and said, "It was a curious dream, dear, certainly: but now run in to your tea; it\'s getting late."\n\n' +
      'So Alice got up and ran off, thinking while she ran, as well she might, what a wonderful dream it had been. But her sister sat still just as she left her, watching the setting sun, and thinking of little Alice and all her wonderful Adventures, till she too began dreaming after a fashion.\n\n' +
      'The whole place around her became alive with the strange creatures of her little sister\'s dream. The long grass rustled at her feet as the White Rabbit hurried by, the rattling teacups changed to the hush of the evening field, and the Queen\'s shrill commands melted back into ordinary country sounds.\n\n' +
      'Lastly, she pictured to herself how this same little sister would, in the after-time, be herself a grown woman; and how she would keep, through all her riper years, the simple and loving heart of her childhood, remembering her own child-life, and the happy summer days.',
    callouts: [
      {
        id: 'afterimage',
        label: 'Afterimage',
        text: 'The cards were only cards, yet the page keeps a little of their weather.',
        tone: 'sage',
      },
      {
        id: 'summer-fold',
        label: 'Summer Fold',
        text: 'Wonderland shuts gently, like leaves settling back into ordinary grass.',
        tone: 'amber',
      },
      {
        id: 'sister-dream',
        label: 'Sister Dream',
        text: 'The ending lingers in the person who stayed still enough to remember it.',
        tone: 'berry',
      },
    ],
    figure: buildReaderFigure('Alice_par_John_Tenniel_42.png', {
      alt: 'The pack of cards rushing at Alice, illustrated by John Tenniel.',
      caption: 'The dream breaks into leaves and cards.',
      credit: 'John Tenniel, 1865.',
      displayAspectRatio: 1.34,
    }),
  },
] as const;
