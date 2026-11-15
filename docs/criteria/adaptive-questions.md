# Questions that follow the reader's profile

Step 3 of the temperament roadmap (operator, 2026-11-15; steps 1 and 2 in
`temperament-cities.md`). For review before any code.

## The idea

The quick quiz stays as it is: short, playful, a result in a minute. The full questionnaire
(`/approfondir`) now starts where the quick quiz stopped and asks the same bank to everyone. It
should instead ask what sharpens the match **for this reader**: someone who comes on holiday and
goes out late is asked what kind of night they want, not about schools or calm.

Two signals already known after the quick quiz shape the profile:

- the **project** (`project`): s'installer, un pied ici un pied là-bas, tester, investir, vacances;
- the **temperament** (`saturday`, `adventure`, `order`, `together`, `friction`), the five axes
  every city is now rated on, neighbourhood by neighbourhood.

## How a question is chosen (no new mechanism)

Each question below carries a condition (`when`, already supported by the bank). The full
questionnaire asks, among the questions whose condition holds:

1. first the profile questions, the most decisive first (the one that would move the top five
   the most, as today);
2. then the general questions that are left, the same way.

A question is only worth asking if its answer moves cities. So every choice below pulls on data
each city already has: its 16 criteria (nightlife, pace, culture, history, returnees…), its
settings (ocean, island, lake, mountains, forest…) and its neighbourhoods on the five axes. No
question needs new research, except the optional music one at the end.

## The questions

Titles and choices are the reader-facing French; « → » says what the answer pulls.

### On holiday (`project` = vacances)

**1. `nightOut`** · when the reader goes out (`saturday` = 1)
« Vos soirées là-bas, plutôt… »

- Clubs et concerts jusqu'à l'aube → nightlife very high, pace high; neighbourhoods that go out
- Maquis et bars où l'on danse → nightlife high, culture
- Un verre au bord de l'eau, au coucher du soleil → ocean or lake nearby, nightlife middling

**2. `quietStay`** · when the reader prefers calm (`saturday` = 0)
« Des vacances au calme, c'est… »

- La plage, et c'est tout → ocean or island, slow pace
- Marcher, randonner, respirer → mountains or forest, slow pace
- Visiter des villes d'histoire, sans se presser → history high, pace low

**3. `daytime`** · on every holiday (up to two choices)
« Le jour, vous avez envie de… »

- Musées, histoire, architecture → history and culture high
- Marchés, artisans, vie de quartier → walkable, bargaining; neighbourhoods off the expat track
- Plage et baignade → ocean or island
- Excursions dans la nature → mountains, forest or savanna

**4. `offTrack`** · when the reader seeks the unknown (`adventure` = seeking)
« Sortir des sentiers battus, jusqu'où ? »

- Là où peu de visiteurs vont → few returnees; neighbourhoods rated unfamiliar
- Un peu, avec un point de chute confortable → comfort; a mix of neighbourhoods
- Pas trop loin du confort → comfort and returnees high

### Settling, testing, both feet, investing (`project` ≠ vacances)

**5. `afterWork`** · when the reader goes out at least a little (`saturday` ≥ 0.5)
« En semaine, après le travail ? »

- Afterworks et rooftops → nightlife high, pace high
- Sport et plein air → leisure high; ocean, lake or mountains
- Rentrer chez moi au calme → pace low; calm neighbourhoods

**6. `friends`** · when the reader counts on others (`together` = 1)
« Pour vous faire des amis là-bas ? »

- Associations et bénévolat → welcome high
- La diaspora et d'autres repats → returnees high
- Les voisins, la vie de quartier → neighbourhoods rated « community »; welcome

**7. `mustWork`** · when the unexpected wears the reader out (`friction` = 0), up to two choices
« Ce qui doit marcher sans faute ? »

- Le courant et l'eau → utilities high, weighted strongly
- Internet → internet high
- Les démarches → paperwork easy
- Les soins → healthcare high

**8. `ambition`** · « Conquête »: goes out and counts on oneself (`together` = 0), settling or investing
« Là-bas, vous venez surtout pour… »

- Faire grandir une affaire → business very high
- Accélérer ma carrière → jobs very high
- Me construire un réseau → pace and returnees high

**9. `evenings`** · « Refuge »: calm and orderly (`saturday` = 0 and `order` = 1), settling
« Le soir, chez vous, il vous faut… »

- Un quartier résidentiel et calme → calm neighbourhoods, weighted strongly; upscale areas
- De l'espace, un jardin → slow pace
- La mer ou la nature tout près → ocean, lake, mountains or forest

### Optional: needs a short sourcing pass

**10. `music`** · when the reader goes out (`saturday` = 1), any project, up to two choices
« La musique qui vous fait bouger ? »

- Coupé-décalé (Côte d'Ivoire) · Afrobeats (Nigeria, Ghana) · Rumba et ndombolo (les deux Congo)
  · Mbalax (Sénégal) · Amapiano (Afrique du Sud) · Bongo flava (Tanzanie, Kenya)
- → a small pull towards the countries where that music is played in the clubs

Each genre-to-country link needs one dated source before it ships (Data honesty rule).

## What does not change

- The quick quiz, its order and its questions.
- The reception rule: no profile answer can send a reader of sub-Saharan or Caribbean family where
  anti-Black racism is documented.
- Wording: preferences in « vous aimez… », never « vous êtes… »; questions in « vous ».
- The questions already in the full questionnaire stay, after the profile ones.

## Then, step 4

Show the profile at the end (the archetype and its five traits, as preferences), and beside each
city's percentage the reason drawn from its neighbourhoods, e.g. « Calme : 3 quartiers sur 11 ».

## Questions for the operator

1. Keep, cut or reword any of questions 1 to 9?
2. Question 10 (music): worth a sourcing pass, or later?
3. Profile questions first, then the general ones: agreed?
