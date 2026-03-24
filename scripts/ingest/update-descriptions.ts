import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

const updates: Record<string, string> = {
  'shakespeare-attacked-by-greene-london-1592':
    `In 1592, the dying playwright Robert Greene published a pamphlet containing a venomous attack on a rising theatrical figure he called an 'upstart Crow' and 'Johannes Factotum' — who dared compete with university-educated writers. The pun 'Shake-scene' and a parody of Henry VI, Part 3 make the target unmistakably William Shakespeare. Greene's fury is the earliest surviving documentary evidence of Shakespeare's presence in London theatre — an attack meant to diminish him that instead became the first record confirming his existence as a playwright.`,

  'einstein-dies-princeton-1955':
    `Albert Einstein died on 18 April 1955 at Princeton Hospital, New Jersey, of an abdominal aortic aneurysm. He was 76. He had refused surgery, telling his doctors: 'I want to go when I want. It is tasteless to prolong life artificially.' A notebook of unified field theory calculations was found unfinished on his bedside table. His brain was removed without family permission by pathologist Thomas Harvey, who kept it in a jar for decades. Einstein had spent his final 30 years attempting to unify gravity and electromagnetism, increasingly isolated from mainstream quantum physics.`,

  'einstein-flees-germany-princeton-1933':
    `In January 1933, while Einstein was visiting Caltech in Pasadena, Adolf Hitler was appointed Chancellor of Germany. Einstein, a prominent Jewish intellectual, immediately understood the danger — Nazi paramilitaries had already raided his Berlin apartment. He resigned from the Prussian Academy by letter and never returned to Europe to live. Later that year he accepted a position at the Institute for Advanced Study in Princeton, where he would remain for life. The Nazi persecution of Jewish scientists drove dozens of Europe's finest physicists to the United States, shifting the center of world physics from Berlin to the American East Coast.`,

  'globe-theatre-opens-southwark-1599':
    `In 1599, a partnership of actors including William Shakespeare constructed the Globe Theatre on the south bank of the Thames in Southwark, financing it partly by dismantling an older playhouse in Shoreditch and hauling the timbers across the frozen river. Shakespeare held a ten-percent share. The open-air amphitheatre seated up to 3,000 spectators and became the venue where Hamlet, Othello, King Lear, and Macbeth were first performed — making Shakespeare not merely a writer but a businessman-artist with direct financial stake in his audience's experience. The original burned down on 29 June 1613 when a cannon misfired during Henry VIII.`,

  'shakespeare-dies-stratford-1616':
    `William Shakespeare died on 23 April 1616 in Stratford-upon-Avon — the same date, by tradition, as his birth 52 years earlier. No contemporary source records the cause of death, though a later vicar wrote that Shakespeare, Michael Drayton, and Ben Jonson 'had a merry meeting and, it seems, drank too hard.' He had signed his will one month before, describing himself as in 'perfect health.' He was buried in Holy Trinity Church, where he remains beneath a stone bearing a curse against anyone who moves his bones. Seven years later, the First Folio preserved 36 of his plays for posterity.`,

  'einstein-signs-roosevelt-letter-1939':
    `On 2 August 1939, Albert Einstein signed a letter drafted by physicist Leó Szilárd and addressed to President Roosevelt, warning that Germany might be developing nuclear weapons and urging the United States to begin its own atomic program. Einstein had been persuaded that his name alone could compel presidential attention. Roosevelt received the letter in October 1939 and convened an advisory committee that grew into the Manhattan Project — the $2 billion effort that produced the atomic bombs dropped on Hiroshima and Nagasaki. Einstein, denied security clearance, later called signing the letter 'the one great mistake in my life.'`,

  'shakespeare-retires-new-place-stratford-1613':
    `Around 1613, William Shakespeare retired from the London stage and returned permanently to Stratford-upon-Avon, settling at New Place, the second-largest house in town, purchased in 1597 for £60. He had spent roughly two decades dividing time between London and Stratford, accumulating wealth through his share of the King's Men and property investments. His retirement coincided with the destruction of the Globe Theatre on 29 June 1613. Shakespeare wrote no plays after this date; his last three works were collaborations with John Fletcher. New Place was demolished in 1759 by an owner irritated by tourist visitors.`,

  'first-folio-published-london-1623':
    `In November 1623, seven years after Shakespeare's death, his fellow actors John Heminges and Henry Condell published Mr. William Shakespeares Comedies, Histories, & Tragedies — the First Folio. Of 36 plays included, 18 had never been printed before; without this volume, Macbeth, Twelfth Night, Julius Caesar, and The Tempest would almost certainly have been lost. Ben Jonson's prefatory poem declared Shakespeare 'not of an age, but for all time.' Approximately 750 copies were printed; around 235 survive today, with copies selling at auction for over $10 million.`,

  'einstein-born-ulm-1879':
    `Albert Einstein was born on 14 March 1879 in Ulm, in the Kingdom of Württemberg, to Hermann Einstein, a salesman and engineer, and Pauline Koch, both secular Ashkenazi Jews. His early development alarmed his parents — he was unusually slow to speak, leading them to worry about a learning disability. The family moved to Munich the following year. At age five, a compass his father gave him during an illness sparked a lifelong obsession with invisible forces; Einstein later said it convinced him that 'something deeply hidden had to be behind things.'`,

  'leonardo-paints-mona-lisa-florence-1503':
    `Around 1503, Leonardo da Vinci began the portrait now known as the Mona Lisa, believed to depict Lisa Gherardini, wife of Florentine merchant Francesco del Giocondo. Leonardo worked on it intermittently for years and never delivered it — he kept it until his death. The painting introduced sfumato, a technique of imperceptibly blended tonal gradations, to an unprecedented degree, giving the subject's expression its famous ambiguity. Leonardo also pioneered the three-quarter pose that would define European portraiture for centuries. Today the Mona Lisa hangs in the Louvre, drawing approximately 9 million visitors per year.`,

  'einstein-annus-mirabilis-bern-1905':
    `In 1905, Albert Einstein, a 26-year-old patent clerk in Bern, published four papers in Annalen der Physik that each independently warranted a Nobel Prize. They explained Brownian motion, proved the existence of atoms, described the photoelectric effect, introduced special relativity, and derived E = mc². Einstein had no university position, no laboratory, and no academic collaborators — he wrote the papers in his spare time. The photoelectric effect paper won him the 1921 Nobel Prize. The special relativity paper demolished 200 years of Newtonian assumptions about space and time.`,

  'leonardo-dies-amboise-france-1519':
    `On 2 May 1519, Leonardo da Vinci died at the Château du Clos Lucé in Amboise, France, aged 67. He had spent his final three years there at the invitation of King Francis I, who installed him as Premier Painter, Engineer, and Architect of the King. According to Vasari — likely embellished — Francis held Leonardo in his arms as he died. Leonardo left his notebooks and paintings to his pupil Francesco Melzi, who brought them back to Italy. The notebooks, containing thousands of pages of anatomical drawings and engineering designs, were scattered across Europe and took centuries to reassemble.`,

  'einstein-general-relativity-berlin-1915':
    `On 25 November 1915, Albert Einstein presented the field equations of general relativity to the Prussian Academy of Sciences in Berlin, completing a decade-long effort to extend special relativity to include gravity. The theory replaced Newton's concept of gravity as an instantaneous force with a geometric model: mass curves spacetime, and objects follow that curvature. The theory predicted that light bends around massive objects — confirmed spectacularly during the 1919 solar eclipse, when Arthur Eddington measured starlight deflecting around the sun exactly as Einstein calculated. The confirmation made Einstein an overnight global celebrity.`,

  'shakespeare-baptised-stratford-1564':
    `William Shakespeare was baptised on 26 April 1564 at Holy Trinity Church in Stratford-upon-Avon, the third child of John Shakespeare, a glove-maker and alderman, and Mary Arden, daughter of a prosperous Catholic landowning family. His exact birth date is unrecorded; biographers traditionally assign 23 April — St George's Day — partly because Shakespeare also died on that date in 1616. He grew up in a market town of roughly 1,500 people and almost certainly attended the King's New School, receiving a rigorous Latin education that would saturate his later writing.`,

  'leonardo-apprenticed-verrocchio-florence-1466':
    `Around 1466, at approximately age 14, Leonardo da Vinci entered the Florence workshop of Andrea del Verrocchio — the city's leading painter and sculptor — as a garzone, or studio boy. He remained for seven years, absorbing drafting, chemistry, metallurgy, and mechanics. According to Vasari, when Leonardo contributed an angel to Verrocchio's The Baptism of Christ (c. 1472–1475), his technique was so superior that Verrocchio never painted again. The story is likely apocryphal, but Leonardo's angel in the Uffizi painting is visibly, startlingly different from the rest. The workshop also connected Leonardo to Botticelli, Ghirlandaio, and Perugino.`,

  'leonardo-paints-last-supper-milan-1495':
    `Between 1495 and 1498, Leonardo da Vinci painted The Last Supper on the end wall of the refectory of Santa Maria delle Grazie in Milan, commissioned by Ludovico Sforza. Rather than use traditional fresco technique, Leonardo experimented with tempera and oil on dry plaster, allowing him to revise and refine. The result was revolutionary: each of the twelve apostles reacts individually to Christ's announcement that one will betray him. The technique, however, was catastrophic for preservation — the paint began flaking within decades. Today the painting survives in heavily restored form, yet remains the most reproduced religious image in history.`,
};

async function main() {
  let updated = 0;
  let errors = 0;

  for (const [id, description] of Object.entries(updates)) {
    console.log(`Updating ${id} (${description.length} chars)...`);
    const { error } = await sb
      .from('moments')
      .update({ description })
      .eq('id', id);

    if (error) {
      console.error(`  ❌ ${error.message}`);
      errors++;
    } else {
      console.log(`  ✅ done`);
      updated++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${errors} errors`);
}

main();
