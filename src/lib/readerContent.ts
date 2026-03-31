export type ReaderFigure = {
  alt: string;
  caption: string;
  credit: string;
  sourceUrl: string;
  src: string;
};

export type ReaderScene = {
  id: 'bank' | 'fall' | 'hall';
  chapter: string;
  deck: string;
  quote: string;
  sourceLabel: string;
  text: string;
  title: string;
  figure: ReaderFigure;
};

export const BOOK_SOURCE = {
  label: "Project Gutenberg: Alice's Adventures in Wonderland",
  url: 'https://www.gutenberg.org/ebooks/928',
} as const;

export const READER_SCENES: readonly ReaderScene[] = [
  {
    id: 'bank',
    chapter: 'Chapter I',
    title: 'Down the Rabbit-Hole',
    deck: 'The opening pages stay quiet until the rabbit produces a watch and the whole book tilts into motion.',
    quote: "'and what is the use of a book,' thought Alice 'without pictures or conversation?'",
    sourceLabel: 'Opening paragraphs',
    text:
      "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversation?'\n\n" +
      'So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.\n\n' +
      "There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, 'Oh dear! Oh dear! I shall be late!' but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it.\n\n" +
      'Burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge. In another moment down went Alice after it, never once considering how in the world she was to get out again.',
    figure: {
      alt: 'The White Rabbit consulting his watch, illustrated by John Tenniel.',
      caption: 'The rabbit with the watch.',
      credit: 'John Tenniel, 1865.',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Down_the_Rabbit_Hole.png',
      src: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Down_the_Rabbit_Hole.png',
    },
  },
  {
    id: 'fall',
    chapter: 'Chapter I',
    title: 'The Long Fall',
    deck: 'Pretext lays out the descent as a reading space instead of a static paragraph box, with the illustration becoming part of the text geometry.',
    quote: "'Down, down, down. Would the fall never come to an end!'",
    sourceLabel: 'The descent into the well',
    text:
      'The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.\n\n' +
      'Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs.\n\n' +
      "She took down a jar from one of the shelves as she passed; it was labelled 'ORANGE MARMALADE', but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody, so managed to put it into one of the cupboards as she fell past it.\n\n" +
      "Down, down, down. Would the fall never come to an end! 'I wonder how many miles I've fallen by this time?' she said aloud. 'I must be getting somewhere near the centre of the earth.' Presently she began again, wondering whether she might fall right through the earth and come out among people who walked with their heads downward.",
    figure: {
      alt: 'Alice with the long neck, illustrated by John Tenniel.',
      caption: 'Alice stretched into the impossible.',
      credit: 'John Tenniel, 1865.',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Alice_par_John_Tenniel_05.png',
      src: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Alice_par_John_Tenniel_05.png',
    },
  },
  {
    id: 'hall',
    chapter: 'Chapter I',
    title: 'The Hall and the Bottle',
    deck: 'The room tightens, the image intrudes into the measure, and the prose has to find its way around it line by line.',
    quote: "'Drink me,' was printed beautifully in large letters.",
    sourceLabel: 'The glass table and the little door',
    text:
      "Alice was not a bit hurt, and she jumped up on to her feet in a moment: she looked up, but it was all dark overhead; before her was another long passage, and the White Rabbit was still in sight, hurrying down it.\n\n" +
      "There was not a moment to be lost: away went Alice like the wind, and was just in time to hear it say, as it turned a corner, 'Oh my ears and whiskers, how late it's getting!' She was close behind it when she turned the corner, but the Rabbit was no longer to be seen: she found herself in a long, low hall, which was lit up by a row of lamps hanging from the roof.\n\n" +
      'There were doors all round the hall, but they were all locked; and when Alice had been all the way down one side and up the other, trying every door, she walked sadly down the middle, wondering how she was ever to get out again.\n\n' +
      "On the second time round, she came upon a low curtain she had not noticed before, and behind it was a little door about fifteen inches high: she tried the little golden key in the lock, and to her great delight it fitted. She went back to the table and found a little bottle on it, and round the neck of the bottle was a paper label, with the words 'DRINK ME' beautifully printed on it in large letters.",
    figure: {
      alt: 'Alice looming large while the rabbit escapes, illustrated by John Tenniel.',
      caption: 'Alice fills the room.',
      credit: 'John Tenniel, 1865.',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Alice_par_John_Tenniel_06.png',
      src: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Alice_par_John_Tenniel_06.png',
    },
  },
] as const;
