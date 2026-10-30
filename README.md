# BioRegex Studio — Regular Expressions for Bioinformatics

A Theory of Computation assignment website showing how regular expressions find patterns in protein and DNA sequences. Pure HTML, CSS and vanilla JavaScript: no backend, database or frameworks.

## Run it
Unzip the folder and open `index.html` in any modern browser. No installation needed. (Fonts load from Google Fonts when online; a system font is used offline.)

## Features
- Quick Guide to alphabets, strings, union, concatenation, Kleene star, ε, DFA and NFA
- Three applications, each with its own regex, worked example and live tester:
  1. Protein motif mimicry: `[KR].{1,2}[ST].{1,3}[LIV]` (sample `MAKASALPQ` → `KASAL`)
  2. Protein modification sites: `[STY]` (sample `MACKSTYAL` → `S`, `T`, `Y`)
  3. Regulatory DNA motif: `TATA[AT]A[AT]` (sample `GCTATAAAAGC` → `TATAAAA`)
- Input is uppercased and whitespace is removed; the alphabet is validated (20 amino acids, or A/C/G/T)
- Non-overlapping matches with 1-based start and end positions; clear messages for no match or invalid input
- Upload your own DFA/NFA diagram (PNG, JPG, JPEG, WebP) per application. Images are resized, saved in your browser's localStorage and never sent to a server. Clearing browser data removes them.
- Glossary modal (close with the button, by clicking outside, or with Esc) and hover tooltips

## Files
`index.html` structure · `style.css` styling · `script.js` matching, validation, glossary, image handling

## Scientific note
A pattern match is a useful clue, not proof of molecular mimicry, phosphorylation or regulatory function.
