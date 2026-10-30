# Add a display text step for focal numerals

The kit's largest text style was 28px, which kept a focal number at 4 to 7 percent of a card's height while the references studied put it at 10 to 25 percent. Agents were working around the limit with calculated sizes that passed the token check but differed per option. We added two sizes (56px and 72px) as `display-md` and `display-lg`, in regular, medium and bold, reusing the existing line height and letter spacing. They are for numerals only, one per card, up to 3 characters at 72px and 5 at 56px; font sizes are never computed.

Considered options: keep 28px and say so in each report (rejected: the number can never become the point of the card); allow `calc()` on font size (rejected: every option invents its own size).
