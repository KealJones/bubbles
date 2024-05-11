import { expect, test } from "vitest";
import { numberScaleName } from "./numberScaleName";

const expectedResults = {
  0: "",
  1: "thousand",
  2: "million",
  3: "billion",
  4: "trillion",
  5: "quadrillion",
  6: "quintillion",
  7: "sextillion",
  8: "septillion",
  9: "octillion",
  10: "nonillion",
  11: "decillion",
  12: "undecillion",
  13: "duodecillion",
  14: "tredecillion",
  15: "quattuordecillion",
  16: "quindecillion",
  17: "sedecillion",
  18: "septendecillion",
  19: "octodecillion",
  20: "novendecillion",
  21: "vigintillion",
  22: "unvigintillion",
  23: "duovigintillion",
  24: "tresvigintillion",
  25: "quattuorvigintillion",
  26: "quinvigintillion",
  27: "sesvigintillion",
  28: "septemvigintillion",
  29: "octovigintillion",
  30: "novemvigintillion",
  31: "trigintillion",
  32: "untrigintillion",
  33: "duotrigintillion",
  34: "trestrigintillion",
  35: "quattuortrigintillion",
  36: "quintrigintillion",
  37: "sestrigintillion",
  38: "septentrigintillion",
  39: "octotrigintillion",
  40: "noventrigintillion",
  41: "quadragintillion",
  51: "quinquagintillion",
  61: "sexagintillion",
  71: "septuagintillion",
  81: "octogintillion",
  91: "nonagintillion",
  101: "centillion",
  102: "uncentillion",
  111: "decicentillion",
  112: "undecicentillion",
  121: "viginticentillion",
  122: "unviginticentillion",
  131: "trigintacentillion",
  141: "quadragintacentillion",
  151: "quinquagintacentillion",
  161: "sexagintacentillion",
  171: "septuagintacentillion",
  181: "octogintacentillion",
  191: "nonagintacentillion",
  201: "ducentillion",
  251: "quinquagintaducentillion",
  301: "trecentillion",
  351: "quinquagintatrecentillion",
  378: "septenseptuagintatrecentillion",
  401: "quadringentillion",
  451: "quinquagintaquadringentillion",
  454: "tresquinquagintaquadringentillion",
  501: "quingentillion",
  601: "sescentillion",
  701: "septingentillion",
  801: "octingentillion",
  901: "nongentillion",
  999: "octononagintanongentillion",
};

for (const [input, expectedResult] of Object.entries(expectedResults)) {
  test(`${input} outputs "${expectedResult}"`, () => {
    expect(numberScaleName(Number(input))).toBe(expectedResult);
  });
}